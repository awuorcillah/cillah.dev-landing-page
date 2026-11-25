import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function getAdminDb() {
  return createAdminClient(supabaseUrl, serviceRoleKey)
}

/**
 * Individualized AI Follow-Up Scanner
 * - Called by an agent's workspace (?agentEmail=...) to scan ONLY their own leads for overdue/upcoming follow-ups.
 * - Also supports scheduled Cron execution (Authorization: Bearer CRON_SECRET) to scan all agents.
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const cronSecret = process.env.CRON_SECRET
    const isCron = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`)

    let callerEmail = ''
    if (!isCron) {
      const authClient = await createServerSupabase()
      const {
        data: { user },
      } = await authClient.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      callerEmail = (user.email || '').toLowerCase()
    }

    const { searchParams } = new URL(request.url)
    const agentEmail = (searchParams.get('agentEmail') || callerEmail).toLowerCase().trim()
    const orgId = searchParams.get('orgId')

    const db = getAdminDb()
    let query = db
      .from('sales_leads')
      .select('id, full_name, company_name, phone_number, email, stage, source, assigned_agent_email, next_followup_at, followup_title, estimated_value')
      .not('next_followup_at', 'is', null)
      .not('stage', 'in', '(trash,spam,closed_won)')
      .order('next_followup_at', { ascending: true })

    if (!isCron && agentEmail) {
      query = query.ilike('assigned_agent_email', agentEmail)
    } else if (orgId) {
      const { data: orgStaff } = await db.from('staff_members').select('email').eq('org_id', orgId)
      const emails = (orgStaff || []).map((s: any) => s.email)
      if (emails.length > 0) query = query.in('assigned_agent_email', emails)
    }

    const { data: leads, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const now = Date.now()
    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)
    const next48h = now + 48 * 60 * 60 * 1000

    const overdue: any[] = []
    const dueToday: any[] = []
    const upcoming48h: any[] = []

    ;(leads || []).forEach((l: any) => {
      const ts = new Date(l.next_followup_at).getTime()
      if (Number.isNaN(ts)) return
      if (ts < now) {
        overdue.push(l)
      } else if (ts <= endOfToday.getTime()) {
        dueToday.push(l)
      } else if (ts <= next48h) {
        upcoming48h.push(l)
      }
    })

    return NextResponse.json({
      success: true,
      scannedAt: new Date().toISOString(),
      agentEmail: agentEmail || 'all',
      counts: {
        overdue: overdue.length,
        dueToday: dueToday.length,
        upcoming48h: upcoming48h.length,
        totalAttention: overdue.length + dueToday.length + upcoming48h.length,
      },
      overdue,
      dueToday,
      upcoming48h,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Follow-up scan failed' }, { status: 500 })
  }
}
