import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { isSuperAdminEmail, isAdminAccount } from '@/lib/auth-roles'

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

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

    const callerEmail = (user.email || '').toLowerCase().trim()
    const isSuper = isSuperAdminEmail(callerEmail)
    const db = getAdminDb()

    const { searchParams } = new URL(request.url)
    let orgId = searchParams.get('orgId')
    let agentEmail = searchParams.get('agentEmail')
    const excludeParam = searchParams.get('excludeEmails') || ''
    const excludeSet = new Set(
      excludeParam
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    )
    const limit = Math.min(100, Number(searchParams.get('limit') || 40))

    // Enforce strict tenant isolation for non-Super Admins
    if (!isSuper) {
      const [{ data: profile }, { data: staffRow }] = await Promise.all([
        db.from('profiles').select('role').eq('id', user.id).maybeSingle(),
        db.from('staff_members').select('org_id, status').ilike('email', callerEmail).maybeSingle(),
      ])
      const isOrgAdmin =
        isAdminAccount(callerEmail, profile?.role) ||
        String(staffRow?.status || '').toLowerCase() === 'admin'

      if (isOrgAdmin && staffRow?.org_id) {
        orgId = staffRow.org_id
      } else {
        agentEmail = callerEmail
      }
    }

    let query = db
      .from('lead_activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (orgId) {
      query = query.eq('org_id', orgId)
    }
    if (agentEmail) {
      query = query.ilike('agent_email', agentEmail)
    }

    const { data, error } = await query
    if (error) {
      if (error.message.includes('does not exist')) {
        return NextResponse.json({ activities: [], byAgent: {} })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const activities = (data || []).filter(
      (row: any) => !excludeSet.has((row.agent_email || '').toLowerCase())
    )

    // Aggregate per-agent activity counters for Admin Dashboard
    const byAgent: Record<
      string,
      {
        totalActions: number
        calls: number
        messages: number
        aiDrafts: number
        followupsSet: number
        lastActiveAt: string | null
      }
    > = {}

    activities.forEach((a: any) => {
      const key = (a.agent_email || '').toLowerCase()
      if (!key) return
      if (!byAgent[key]) {
        byAgent[key] = {
          totalActions: 0,
          calls: 0,
          messages: 0,
          aiDrafts: 0,
          followupsSet: 0,
          lastActiveAt: a.created_at,
        }
      }
      byAgent[key].totalActions += 1
      if (a.activity_type === 'call_logged' || a.activity_type === 'voip_call') {
        byAgent[key].calls += 1
      } else if (a.activity_type === 'whatsapp_click' || a.activity_type === 'email_click') {
        byAgent[key].messages += 1
      } else if (a.activity_type === 'ai_draft' || a.activity_type === 'ai_pipeline_query') {
        byAgent[key].aiDrafts += 1
      } else if (a.activity_type === 'followup_scheduled') {
        byAgent[key].followupsSet += 1
      }
    })

    return NextResponse.json({ activities, byAgent })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch activities' }, { status: 500 })
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
    const {
      lead_id = null,
      org_id = null,
      agent_email,
      agent_name = null,
      lead_name = null,
      activity_type,
      summary = null,
      duration_seconds = null,
      recording_url = null,
      metadata = {},
    } = body

    if (!activity_type) {
      return NextResponse.json({ error: 'activity_type is required' }, { status: 400 })
    }

    const resolvedEmail = (agent_email || user.email || '').toLowerCase().trim()
    const db = getAdminDb()

    // Resolve org_id and agent_name from staff_members if omitted
    let finalOrgId = org_id
    let finalAgentName = agent_name
    if (!finalOrgId || !finalAgentName) {
      const { data: staff } = await db
        .from('staff_members')
        .select('org_id, full_name')
        .ilike('email', resolvedEmail)
        .maybeSingle()
      if (!finalOrgId && staff?.org_id) finalOrgId = staff.org_id
      if (!finalAgentName && staff?.full_name) finalAgentName = staff.full_name
    }

    const nowIso = new Date().toISOString()

    // Update lead's last_interaction_at so SLA & recency stay accurate
    if (lead_id) {
      await db
        .from('sales_leads')
        .update({ last_interaction_at: nowIso, updated_at: nowIso })
        .eq('id', lead_id)
    }

    const { data, error } = await db
      .from('lead_activities')
      .insert({
        lead_id,
        org_id: finalOrgId,
        agent_email: resolvedEmail,
        agent_name: finalAgentName || resolvedEmail.split('@')[0],
        lead_name,
        activity_type,
        summary,
        duration_seconds,
        recording_url,
        metadata,
        created_at: nowIso,
      })
      .select('*')
      .single()

    if (error) {
      if (error.message.includes('does not exist')) {
        return NextResponse.json({ success: true, skipped: true })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, activity: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to log activity' }, { status: 500 })
  }
}
