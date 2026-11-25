import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const DEFAULT_SYSTEM_PROMPT =
  'You are a concise, high-trust B2B sales and client advisory assistant. Draft polite, clear, human-sounding messages tailored to the client profile and previous notes. Never sound robotic, keep messages brief and action-oriented, and always end with one clear next step.'

const DEFAULT_USER_PROMPT_TEMPLATE =
  'Using the client details and previous notes, draft a personalized {{channel}} message from my point of view based on this instruction: {{instruction}}'

function getAdminDb() {
  return createAdminClient(supabaseUrl, serviceRoleKey)
}

export async function POST(request: Request) {
  try {
    const authClient = await createServerSupabase()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      mode = 'lead_draft',
      agentEmail: requestedAgentEmail,
      orgId,
      leadId,
      channel = 'whatsapp',
      instruction = '',
      messages = [],
      customSystemPrompt,
      customUserPrompt,
      scopeToAgentOnly = true,
      excludeEmails = [],
    } = body as {
      mode?: 'lead_draft' | 'pipeline_chat'
      agentEmail?: string
      orgId?: string | null
      leadId?: string | null
      channel?: 'whatsapp' | 'email'
      instruction?: string
      messages?: Array<{ role: 'user' | 'assistant'; content: string }>
      customSystemPrompt?: string
      customUserPrompt?: string
      scopeToAgentOnly?: boolean
      excludeEmails?: string[]
    }

    const agentEmail = (requestedAgentEmail || user.email || '').toLowerCase().trim()
    const db = getAdminDb()

    // 1. Load saved per-agent AI settings (gracefully ignore if table not created yet)
    let savedSettings: any = null
    try {
      const { data } = await db
        .from('agent_ai_settings')
        .select('*')
        .ilike('agent_email', agentEmail)
        .maybeSingle()
      savedSettings = data
    } catch {
      savedSettings = null
    }

    const systemPrompt = (customSystemPrompt || savedSettings?.system_prompt || DEFAULT_SYSTEM_PROMPT).trim()
    const userTemplate = (customUserPrompt || savedSettings?.user_prompt_template || DEFAULT_USER_PROMPT_TEMPLATE).trim()

    // Resolve agent's display name
    const { data: staffRow } = await db
      .from('staff_members')
      .select('full_name, org_id')
      .ilike('email', agentEmail)
      .maybeSingle()
    const agentName = staffRow?.full_name || agentEmail.split('@')[0]
    const resolvedOrgId = orgId || staffRow?.org_id || null

    let contextBlock = ''
    let activeLeadName: string | null = null

    if (mode === 'lead_draft' && leadId) {
      // Single-Lead Drafting Context
      const [{ data: lead }, { data: notes }] = await Promise.all([
        db.from('sales_leads').select('*').eq('id', leadId).maybeSingle(),
        db
          .from('lead_notes')
          .select('author_name, source, note_text, created_at')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false })
          .limit(15),
      ])

      if (!lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      }

      activeLeadName = lead.full_name
      const notesList = (notes || [])
        .map(
          (n: any) =>
            `- [${new Date(n.created_at).toLocaleString()}] (${n.author_name || n.source || 'Note'}): ${n.note_text}`
        )
        .join('\n')

      contextBlock = [
        `SALES AGENT: ${agentName} (${agentEmail})`,
        `TARGET CHANNEL: ${channel === 'email' ? 'Email (include a crisp Subject: line first, then body)' : 'WhatsApp (concise, warm, no subject line, ready to paste)'}`,
        `CLIENT PROFILE:`,
        `- Full Name: ${lead.full_name}`,
        `- Company: ${lead.company_name || 'N/A'}`,
        `- Phone: ${lead.phone_number || 'N/A'}`,
        `- Email: ${lead.email || 'N/A'}`,
        `- Lead Source: ${lead.source || 'N/A'}`,
        `- Pipeline Stage: ${lead.stage}`,
        `- Estimated Value: KES ${Number(lead.estimated_value || 0).toLocaleString()}`,
        `- Next Follow-up: ${lead.next_followup_at ? new Date(lead.next_followup_at).toLocaleString() : 'Not scheduled'}${lead.followup_title ? ` (${lead.followup_title})` : ''}`,
        `- Initial Inquiry Note: ${lead.initial_note || 'None'}`,
        `PREVIOUS NOTES TIMELINE:`,
        notesList || '- No prior notes yet.',
      ].join('\n')
    } else {
      // Full Individualized Pipeline Data Reader Context
      let leadsQuery = db
        .from('sales_leads')
        .select(
          'id, full_name, company_name, email, phone_number, source, stage, assigned_agent_email, estimated_value, next_followup_at, followup_title, initial_note, created_at, updated_at'
        )
        .neq('stage', 'trash')
        .order('created_at', { ascending: false })
        .limit(120)

      if (scopeToAgentOnly) {
        leadsQuery = leadsQuery.ilike('assigned_agent_email', agentEmail)
      } else if (resolvedOrgId) {
        const { data: orgStaffRows } = await db
          .from('staff_members')
          .select('email')
          .eq('org_id', resolvedOrgId)
        const orgEmails = (orgStaffRows || [])
          .map((s: any) => (s.email || '').toLowerCase())
          .filter((e: string) => e && !excludeEmails.map((x) => x.toLowerCase()).includes(e))
        if (orgEmails.length > 0) {
          leadsQuery = leadsQuery.in('assigned_agent_email', orgEmails)
        }
      }

      const { data: allLeads } = await leadsQuery
      const excludedSet = new Set(excludeEmails.map((e) => e.toLowerCase()))
      const cleanLeads = (allLeads || []).filter(
        (l: any) => !excludedSet.has((l.assigned_agent_email || '').toLowerCase())
      )

      const now = new Date()
      const overdueCount = cleanLeads.filter(
        (l: any) => l.next_followup_at && new Date(l.next_followup_at) < now && l.stage !== 'closed_won'
      ).length
      const totalValue = cleanLeads.reduce((sum: number, l: any) => sum + (Number(l.estimated_value) || 0), 0)

      const compactLedger = cleanLeads
        .map((l: any, idx: number) => {
          const fu = l.next_followup_at
            ? `${new Date(l.next_followup_at).toLocaleDateString()} (${l.followup_title || 'Follow-up'})`
            : 'None'
          return `${idx + 1}. ${l.full_name} | ${l.company_name || '-'} | Phone: ${l.phone_number || '-'} | Channel: ${l.source || '-'} | Stage: ${l.stage} | Agent: ${l.assigned_agent_email || '-'} | Value: KES ${Number(l.estimated_value || 0).toLocaleString()} | Next Follow-up: ${fu} | Note: ${(l.initial_note || '').slice(0, 140)}`
        })
        .join('\n')

      contextBlock = [
        `CURRENT USER: ${agentName} (${agentEmail})`,
        `SCOPE: ${scopeToAgentOnly ? 'Individualized Agent Pipeline ONLY' : 'Organization-Wide Pipeline'}`,
        `TODAY'S DATE/TIME: ${now.toLocaleString()}`,
        `SUMMARY: ${cleanLeads.length} active leads | Total Value: KES ${totalValue.toLocaleString()} | Overdue Follow-ups: ${overdueCount}`,
        `LEAD DATABASE:`,
        compactLedger || 'No active leads in this pipeline yet.',
      ].join('\n')
    }

    const latestUserInstruction =
      instruction.trim() ||
      (messages.length > 0 ? messages[messages.length - 1].content : 'Draft a polite follow-up message.')

    const formattedUserPrompt =
      mode === 'lead_draft'
        ? userTemplate
            .replace(/\{\{channel\}\}/gi, channel === 'email' ? 'Email' : 'WhatsApp')
            .replace(/\{\{instruction\}\}/gi, latestUserInstruction)
        : latestUserInstruction

    const openaiKey = process.env.OPENAI_API_KEY
    const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini'

    let replyText = ''
    let providerUsed: 'openai' | 'fallback' = 'openai'

    if (openaiKey) {
      const chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        {
          role: 'system',
          content: `${systemPrompt}\n\n---\nLIVE CRM CONTEXT (use ONLY verified facts from below, never invent client details):\n${contextBlock}`,
        },
      ]

      // Append prior conversation turns if any
      const priorTurns = messages.slice(-8)
      priorTurns.forEach((m) => {
        if (m.role === 'user' || m.role === 'assistant') {
          chatMessages.push({ role: m.role, content: m.content })
        }
      })

      // Ensure final user turn uses formatted template
      if (
        chatMessages.length === 1 ||
        chatMessages[chatMessages.length - 1].role !== 'user' ||
        instruction.trim()
      ) {
        chatMessages.push({ role: 'user', content: formattedUserPrompt })
      }

      const oaRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: openaiModel,
          temperature: 0.5,
          max_tokens: 700,
          messages: chatMessages,
        }),
      })

      if (!oaRes.ok) {
        const errBody = await oaRes.text()
        console.error('OpenAI API error:', oaRes.status, errBody)
        return NextResponse.json(
          { error: `OpenAI error (${oaRes.status}): Please check OPENAI_API_KEY in Vercel environment variables.` },
          { status: 502 }
        )
      }

      const oaJson = await oaRes.json()
      replyText = oaJson?.choices?.[0]?.message?.content?.trim() || 'No response generated.'
    } else {
      providerUsed = 'fallback'
      replyText =
        mode === 'lead_draft'
          ? `Hi ${activeLeadName?.split(' ')[0] || 'there'},\n\nFollowing up regarding your inquiry (${latestUserInstruction}). Please let me know a convenient time for a brief call so we can finalize the next steps.\n\nBest regards,\n${agentName}\n\n_(Add OPENAI_API_KEY in Vercel to enable live OpenAI generation.)_`
          : `I scanned your pipeline context (${contextBlock.split('\n')[3] || 'active leads'}). Add \`OPENAI_API_KEY\` in your Vercel environment variables to unlock full live OpenAI analysis across your entire lead list.`
    }

    // Non-blocking activity log for Admin Dashboard accountability
    try {
      await db.from('lead_activities').insert({
        lead_id: leadId || null,
        org_id: resolvedOrgId,
        agent_email: agentEmail,
        agent_name: agentName,
        lead_name: activeLeadName,
        activity_type: mode === 'lead_draft' ? 'ai_draft' : 'ai_pipeline_query',
        summary:
          mode === 'lead_draft'
            ? `Drafted ${channel === 'email' ? 'Email' : 'WhatsApp'} message for ${activeLeadName || 'lead'}`
            : `Queried Personal AI on pipeline: "${latestUserInstruction.slice(0, 90)}"`,
      })
    } catch {
      // Table may not be migrated yet; never block assistant response
    }

    return NextResponse.json({
      success: true,
      reply: replyText,
      provider: providerUsed,
      model: openaiKey ? openaiModel : 'fallback',
    })
  } catch (err: any) {
    console.error('Sales AI Assistant error:', err)
    return NextResponse.json({ error: err.message || 'AI Assistant failed' }, { status: 500 })
  }
}
