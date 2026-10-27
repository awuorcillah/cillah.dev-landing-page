import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      full_name,
      email,
      phone_number,
      company_name,
      source = 'email_campaign',
      stage = 'new_lead',
      assigned_agent_email,
      initial_note,
      estimated_value = 0,
      is_qualified = false
    } = body;

    if (!full_name) {
      return NextResponse.json(
        { success: false, error: 'full_name is required' },
        { status: 400 }
      );
    }

    // =========================================================================
    // 0. DUPLICATE & REPEAT INQUIRY DETECTION RULE
    // If the lead exists in the database:
    // - Keep their previously assigned agent
    // - Move to 'repeat_lead' (Repeat Inquiries)
    // - Do not reassign unless transferred by agent inside
    // =========================================================================
    let existingLead: any = null;

    if (email && email.trim()) {
      const { data: emailMatches } = await supabase
        .from('sales_leads')
        .select('*')
        .ilike('email', email.trim())
        .order('created_at', { ascending: false })
        .limit(1);
      if (emailMatches && emailMatches.length > 0) {
        existingLead = emailMatches[0];
      }
    }

    if (!existingLead && phone_number && phone_number.trim()) {
      const cleanPhone = phone_number.replace(/[^0-9]/g, '');
      if (cleanPhone.length >= 7) {
        const { data: allPhoneLeads } = await supabase
          .from('sales_leads')
          .select('*')
          .not('phone_number', 'is', null);

        if (allPhoneLeads) {
          existingLead = allPhoneLeads.find((l: any) => {
            if (!l.phone_number) return false;
            const p = l.phone_number.replace(/[^0-9]/g, '');
            return p.endsWith(cleanPhone.slice(-8)) || cleanPhone.endsWith(p.slice(-8));
          });
        }
      }
    }

    if (!existingLead && full_name && full_name.trim()) {
      const { data: nameMatches } = await supabase
        .from('sales_leads')
        .select('*')
        .ilike('full_name', full_name.trim())
        .order('created_at', { ascending: false })
        .limit(1);
      if (nameMatches && nameMatches.length > 0) {
        existingLead = nameMatches[0];
      }
    }

    if (existingLead) {
      // PRESERVE ASSIGNED AGENT
      const assignedEmail = existingLead.assigned_agent_email || 'atulah@cillah.dev';
      const assignedId = existingLead.assigned_agent_id || null;

      const updatePayload: any = {
        stage: 'repeat_lead', // LANDS IN REPEAT INQUIRIES
        assigned_agent_email: assignedEmail,
        assigned_agent_id: assignedId,
        last_interaction_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (phone_number && (!existingLead.phone_number || existingLead.phone_number === 'N/A')) {
        updatePayload.phone_number = phone_number;
      }
      if (company_name && !existingLead.company_name) {
        updatePayload.company_name = company_name;
      }
      if (email && !existingLead.email) {
        updatePayload.email = email;
      }

      const { data: updatedLead, error: updateErr } = await supabase
        .from('sales_leads')
        .update(updatePayload)
        .eq('id', existingLead.id)
        .select('*')
        .single();

      if (updateErr) {
        console.error('Error updating repeat inquiry:', updateErr);
        return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
      }

      // Record interaction note
      const repeatNoteText = `Repeat inquiry received via ${source}. Automatically routed to Repeat Inquiries under assigned agent ${assignedEmail}.${initial_note ? ` Note: ${initial_note}` : ''}`;

      await supabase.from('lead_notes').insert({
        lead_id: existingLead.id,
        author_email: assignedEmail,
        author_name: 'Repeat Inquiry Detector',
        source: source === 'email_campaign' ? 'email_reply' : source,
        note_text: repeatNoteText
      });

      return NextResponse.json({
        success: true,
        is_repeat: true,
        message: `Existing lead recognized. Moved to Repeat Inquiries under assigned agent (${assignedEmail}).`,
        lead: updatedLead,
        assigned_to: {
          email: assignedEmail,
          agent_id: assignedId
        }
      });
    }

    let finalAgentEmail = assigned_agent_email?.trim();
    let finalAgentId: string | null = null;

    // 1. Target specific agent if requested
    if (finalAgentEmail && finalAgentEmail !== 'auto') {
      const { data: staff, error: staffError } = await supabase
        .from('staff_members')
        .select('id, email, full_name, crm_id')
        .eq('email', finalAgentEmail)
        .single();

      if (staffError || !staff) {
        return NextResponse.json(
          {
            success: false,
            error: `Staff member with email '${finalAgentEmail}' not found in CRM.`
          },
          { status: 404 }
        );
      }
      finalAgentId = staff.id;
    } else {
      // 2. Round-Robin Assignment among active Sales agents
      const { data: activeAgents, error: rrError } = await supabase
        .from('staff_members')
        .select('id, email, full_name, crm_id')
        .eq('is_active', true)
        .eq('role', 'sales')
        .order('last_assigned_at', { ascending: true })
        .limit(1);

      if (rrError || !activeAgents || activeAgents.length === 0) {
        // Fallback to Sales Admin if no active agent found
        const { data: defaultAdmin } = await supabase
          .from('staff_members')
          .select('id, email, full_name, crm_id')
          .eq('email', 'atulah@cillah.dev')
          .single();

        if (defaultAdmin) {
          finalAgentEmail = defaultAdmin.email;
          finalAgentId = defaultAdmin.id;
        }
      } else {
        const selectedAgent = activeAgents[0];
        finalAgentEmail = selectedAgent.email;
        finalAgentId = selectedAgent.id;

        // Update last_assigned_at for round robin sequence
        await supabase
          .from('staff_members')
          .update({ last_assigned_at: new Date().toISOString() })
          .eq('id', selectedAgent.id);
      }
    }

    // 3. Insert Lead into Database
    const { data: lead, error: leadError } = await supabase
      .from('sales_leads')
      .insert({
        full_name,
        email: email || null,
        phone_number: phone_number || null,
        company_name: company_name || null,
        source,
        stage,
        assigned_agent_email: finalAgentEmail,
        assigned_agent_id: finalAgentId,
        estimated_value,
        is_qualified
      })
      .select('*')
      .single();

    if (leadError) {
      console.error('Error inserting lead:', leadError);
      return NextResponse.json(
        { success: false, error: leadError.message },
        { status: 500 }
      );
    }

    // 4. Create Initial Interaction Note if provided
    if (initial_note) {
      await supabase.from('lead_notes').insert({
        lead_id: lead.id,
        author_email: finalAgentEmail || 'system@cillah.dev',
        author_name: 'Campaign Webhook Bot',
        source: source === 'email_campaign' ? 'email_reply' : source,
        note_text: initial_note
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Lead ingested successfully',
      lead,
      assigned_to: {
        email: finalAgentEmail,
        agent_id: finalAgentId
      }
    });
  } catch (err: any) {
    console.error('Ingest endpoint error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
