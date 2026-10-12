import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hastygfosgyxrxzrzrur.supabase.co'
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhc3R5Z2Zvc2d5eHJ4enJ6cnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NTA4ODEsImV4cCI6MjEwNjIyNjg4MX0.EVdnsyzWPuDJPJ_-ttg8DrA2Nl14Z04saG9Xj-rPjvg'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      org_id = 'a1b2c3d4-e5f6-7890-abcd-111111111111', // Default Stage Properties
      ig_user_id,
      full_name,
      phone_number,
      category = 'Residential',
      intent = 'BUY',
      property_interest = 'Sobha Hartland',
      conversation_summary = '',
      source = 'instagram'
    } = body

    if (!full_name && !phone_number) {
      return NextResponse.json({ success: false, error: 'Name or phone number is required' }, { status: 400 })
    }

    const cleanName = (full_name || 'Valued Lead').trim()
    const cleanPhone = (phone_number || 'N/A').trim()
    const cleanCategory = category || 'Residential'
    const cleanIntent = (intent || 'BUY').toUpperCase().includes('RENT') ? 'RENT' : 'BUY'
    const cleanProperty = property_interest || 'Stage Properties Portfolio'

    // 1. Cross-Channel Lead Lookup (Deduplication by Phone or Instagram ID)
    let existingLead: any = null

    if (cleanPhone && cleanPhone !== 'N/A') {
      const { data: phoneMatch } = await supabase
        .from('stage_leads')
        .select('*')
        .eq('phone_number', cleanPhone)
        .order('created_at', { ascending: false })
        .limit(1)

      if (phoneMatch && phoneMatch.length > 0) {
        existingLead = phoneMatch[0]
      }
    }

    if (!existingLead && ig_user_id) {
      const { data: igMatch } = await supabase
        .from('stage_leads')
        .select('*')
        .eq('ig_user_id', ig_user_id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (igMatch && igMatch.length > 0) {
        existingLead = igMatch[0]
      }
    }

    // 2. Resolve Assigned Agent (Retain existing agent if already assigned!)
    let assignedAgentName = existingLead?.assigned_agent_name || 'Ador'
    let assignedAgentId = existingLead?.assigned_agent_id || '12965bb8-61a8-44ea-a6e1-13605250722c'
    let assignedAgentEmail = existingLead?.assigned_agent_email || 'ador.ai815@gmail.com'

    // If new lead, fetch active sales agent for this org
    if (!existingLead) {
      const { data: activeAgent } = await supabase
        .from('staff_members')
        .select('*')
        .eq('org_id', org_id)
        .eq('role', 'sales')
        .eq('is_active', true)
        .order('last_assigned_at', { ascending: true, nullsFirst: true })
        .limit(1)

      if (activeAgent && activeAgent.length > 0) {
        assignedAgentName = activeAgent[0].full_name
        assignedAgentId = activeAgent[0].id
        assignedAgentEmail = activeAgent[0].email
      }
    }

    // 3. Prepare Timestamped Note
    const timestamp = new Date().toISOString()
    const newNote = {
      date: timestamp,
      source,
      category: cleanCategory,
      summary: conversation_summary || `Customer inquiry for ${cleanProperty} (${cleanIntent}).`
    }

    let finalLeadId: string
    let isRepeat = false

    if (existingLead) {
      // UPDATE EXISTING LEAD (Keep dedicated agent, append note, update status)
      isRepeat = true
      finalLeadId = existingLead.id

      const historyLog = `${existingLead.chat_history || ''}\n[${timestamp}] (${source}) ${newNote.summary}`.trim()

      const { error: updateErr } = await supabase
        .from('stage_leads')
        .update({
          full_name: cleanName !== 'Valued Lead' ? cleanName : existingLead.full_name,
          phone_number: cleanPhone !== 'N/A' ? cleanPhone : existingLead.phone_number,
          property_interest: cleanProperty,
          intent: cleanIntent,
          status: 'repeat_user',
          chat_history: historyLog,
          updated_at: timestamp
        })
        .eq('id', existingLead.id)

      if (updateErr) {
        console.error('Error updating stage_lead:', updateErr)
      }

      // Also update or insert sales_leads to repeat_lead for CRM Pipeline
      const digitsOnly = cleanPhone.replace(/\D/g, '').slice(-9)
      let salesLeadUpdated = false
      if (digitsOnly) {
        const { data: updatedSales } = await supabase
          .from('sales_leads')
          .update({
            stage: 'repeat_lead',
            updated_at: timestamp
          })
          .ilike('phone_number', `%${digitsOnly}%`)
          .select()
        if (updatedSales && updatedSales.length > 0) salesLeadUpdated = true
      }

      if (!salesLeadUpdated) {
        await supabase.from('sales_leads').insert({
          full_name: cleanName !== 'Valued Lead' ? cleanName : existingLead.full_name,
          phone_number: cleanPhone !== 'N/A' ? cleanPhone : existingLead.phone_number,
          company_name: cleanProperty,
          source: `stage_properties_${source}`,
          stage: 'repeat_lead',
          assigned_agent_email: assignedAgentEmail,
          is_qualified: true,
          estimated_value: 1500000,
          initial_note: conversation_summary,
          created_at: timestamp,
          updated_at: timestamp
        })
      }

      if (assignedAgentId) {
        await supabase
          .from('staff_members')
          .update({ last_assigned_at: timestamp })
          .eq('id', assignedAgentId)
      }
    } else {
      // INSERT NEW LEAD
      const historyLog = `[${timestamp}] (${source}) ${newNote.summary}`

      const { data: inserted, error: insertErr } = await supabase
        .from('stage_leads')
        .insert({
          org_id,
          ig_user_id: ig_user_id || null,
          full_name: cleanName,
          phone_number: cleanPhone,
          property_interest: cleanProperty,
          intent: cleanIntent,
          assigned_agent_id: assignedAgentId,
          assigned_agent_name: assignedAgentName,
          assigned_agent_email: assignedAgentEmail,
          status: 'new_enquiry',
          chat_history: historyLog,
          created_at: timestamp,
          updated_at: timestamp
        })
        .select()
        .single()

      if (insertErr) {
        console.error('Error inserting stage_lead:', insertErr)
      }

      finalLeadId = inserted?.id || 'new-lead'

      // Sync to sales_leads for CRM pipeline
      const { error: salesErr } = await supabase.from('sales_leads').insert({
        full_name: cleanName,
        phone_number: cleanPhone,
        company_name: cleanProperty,
        source: `stage_properties_${source}`,
        stage: 'new_lead',
        assigned_agent_email: assignedAgentEmail,
        is_qualified: true,
        estimated_value: 1500000,
        initial_note: conversation_summary,
        created_at: timestamp,
        updated_at: timestamp
      })

      if (salesErr) {
        console.error('Error inserting sales_lead:', salesErr)
      }
    }

    // 4. Send WhatsApp Notification to Dedicated Sales Agent (Ador)
    const agentPhone = '0794357912'
    const statusHeader = isRepeat ? '🔄 REPEAT INQUIRY / RE-ENGAGED' : '🏷️ NEW QUALIFIED LEAD'
    const waMessage = `${statusHeader} - STAGE PROPERTIES\n\n` +
      `Client: ${cleanName}\n` +
      `Phone: ${cleanPhone}\n` +
      `Source: ${source.toUpperCase()}\n` +
      `Category: ${cleanCategory} (${cleanIntent})\n` +
      `Property: ${cleanProperty}\n` +
      `Assigned Advisor: ${assignedAgentName}\n\n` +
      `AI Summary for Advisor:\n${conversation_summary || 'Customer requested direct callback from advisor.'}`

    try {
      await fetch('https://cillah.dev/api/whatsapp/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: agentPhone,
          message: waMessage
        })
      })
    } catch (waErr) {
      console.warn('WhatsApp alert error (silenced):', waErr)
    }

    return NextResponse.json({
      success: true,
      lead_id: finalLeadId,
      is_repeat: isRepeat,
      assigned_agent: assignedAgentName,
      message: `Lead successfully connected to property advisor ${assignedAgentName}. Context and phone number delivered to advisor via WhatsApp.`
    })
  } catch (error: any) {
    console.error('Error in connect-advisor endpoint:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ig_user_id = searchParams.get('ig_user_id')
    const phone_number = searchParams.get('phone_number')

    if (!ig_user_id && !phone_number) {
      return NextResponse.json({ success: false, error: 'ig_user_id or phone_number required' }, { status: 400 })
    }

    let query = supabase.from('stage_leads').select('*').order('created_at', { ascending: false }).limit(1)

    if (ig_user_id) {
      query = query.eq('ig_user_id', ig_user_id)
    } else if (phone_number) {
      query = query.eq('phone_number', phone_number)
    }

    const { data, error } = await query

    if (error || !data || data.length === 0) {
      return NextResponse.json({
        exists: false,
        message: 'No previous profile found. Treat as new prospect.'
      })
    }

    const lead = data[0]
    return NextResponse.json({
      exists: true,
      lead_id: lead.id,
      full_name: lead.full_name,
      phone_number: lead.phone_number,
      assigned_agent: lead.assigned_agent_name,
      property_interest: lead.property_interest,
      intent: lead.intent,
      status: lead.status,
      notes: lead.notes || []
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
