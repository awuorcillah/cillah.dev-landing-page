import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lead_id, followup_choice, custom_date, followup_title, agent_email } = body;

    if (!lead_id || !followup_choice) {
      return NextResponse.json(
        { success: false, error: 'lead_id and followup_choice are required' },
        { status: 400 }
      );
    }

    let followupStatus = 'active';
    let nextFollowupAt: Date | null = null;
    const now = new Date();

    switch (followup_choice) {
      case '1_month':
        followupStatus = 'closed_1_month';
        nextFollowupAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
      case '3_months':
        followupStatus = 'closed_3_months';
        nextFollowupAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        break;
      case '1_year':
        followupStatus = 'closed_1_year';
        nextFollowupAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        break;
      case 'forever':
        followupStatus = 'closed_forever';
        nextFollowupAt = null;
        break;
      case 'custom':
        if (!custom_date) {
          return NextResponse.json(
            { success: false, error: 'custom_date is required when followup_choice is custom' },
            { status: 400 }
          );
        }
        followupStatus = 'custom_date';
        nextFollowupAt = new Date(custom_date);
        break;
      case 'active':
        followupStatus = 'active';
        nextFollowupAt = now;
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid followup_choice. Must be 1_month, 3_months, 1_year, forever, custom, or active' },
          { status: 400 }
        );
    }

    // 1. Update Lead Followup Columns
    const { data: updatedLead, error: updateError } = await supabase
      .from('sales_leads')
      .update({
        followup_status: followupStatus,
        next_followup_at: nextFollowupAt ? nextFollowupAt.toISOString() : null,
        followup_title: followup_title || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', lead_id)
      .select('*')
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // 2. Also create an appointment entry if it's a scheduled date
    if (nextFollowupAt) {
      await supabase.from('appointments').insert({
        lead_id,
        assigned_agent_email: agent_email || updatedLead.assigned_agent_email || 'atulah@cillah.dev',
        title: followup_title || `Follow-up with ${updatedLead.full_name}`,
        description: `Scheduled follow-up via CRM (${followup_choice})`,
        scheduled_at: nextFollowupAt.toISOString(),
        status: 'upcoming'
      });
    }

    // 3. Log Action in Lead Notes
    const choiceLabelMap: Record<string, string> = {
      '1_month': 'Snoozed follow-up for 1 Month',
      '3_months': 'Snoozed follow-up for 3 Months',
      '1_year': 'Snoozed follow-up for 1 Year',
      'forever': 'Closed follow-up Permanently (Forever)',
      'custom': `Scheduled custom follow-up`,
      'active': 'Re-opened follow-up to Active Queue'
    };

    const titleSuffix = followup_title ? ` - "${followup_title}"` : '';

    await supabase.from('lead_notes').insert({
      lead_id,
      author_email: agent_email || 'system@cillah.dev',
      author_name: agent_email ? agent_email.split('@')[0] : 'Sales Agent',
      source: 'sales_agent',
      note_text: `Follow-up set: ${choiceLabelMap[followup_choice] || followup_choice}${titleSuffix}${nextFollowupAt ? ` (Scheduled for ${nextFollowupAt.toLocaleString()})` : ''}`
    });

    return NextResponse.json({
      success: true,
      message: 'Follow-up status updated successfully',
      lead: updatedLead,
      next_followup_at: nextFollowupAt
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
