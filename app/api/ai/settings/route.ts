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

export async function GET(request: Request) {
  try {
    const authClient = await createServerSupabase()
    const {
      data: { user },
    } = await authClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const agentEmail = (searchParams.get('agentEmail') || user.email || '').toLowerCase().trim()

    const db = getAdminDb()
    const { data, error } = await db
      .from('agent_ai_settings')
      .select('*')
      .ilike('agent_email', agentEmail)
      .maybeSingle()

    if (error && !error.message.includes('does not exist')) {
      console.error('Error loading AI settings:', error)
    }

    return NextResponse.json({
      settings: data || {
        agent_email: agentEmail,
        assistant_name: 'Personal Sales AI',
        system_prompt: DEFAULT_SYSTEM_PROMPT,
        user_prompt_template: DEFAULT_USER_PROMPT_TEMPLATE,
        preferred_tone: 'executive',
        auto_scan_followups: true,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load AI settings' }, { status: 500 })
  }
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
    const agentEmail = (body.agentEmail || user.email || '').toLowerCase().trim()
    const orgId = body.orgId || null
    const assistantName = (body.assistant_name || 'Personal Sales AI').trim()
    const systemPrompt = (body.system_prompt || DEFAULT_SYSTEM_PROMPT).trim()
    const userPromptTemplate = (body.user_prompt_template || DEFAULT_USER_PROMPT_TEMPLATE).trim()
    const preferredTone = (body.preferred_tone || 'executive').trim()
    const autoScanFollowups = body.auto_scan_followups !== false

    const db = getAdminDb()
    const { data, error } = await db
      .from('agent_ai_settings')
      .upsert(
        {
          agent_email: agentEmail,
          org_id: orgId,
          assistant_name: assistantName,
          system_prompt: systemPrompt,
          user_prompt_template: userPromptTemplate,
          preferred_tone: preferredTone,
          auto_scan_followups: autoScanFollowups,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'agent_email' }
      )
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, settings: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save AI settings' }, { status: 500 })
  }
}
