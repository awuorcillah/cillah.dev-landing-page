import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { isSuperAdminEmail, parseAssignedWorkspaces } from '@/lib/auth-roles'

const CILLAH_ORG_ID = 'a1b2c3d4-e5f6-7890-abcd-222222222222'

function getAdminDb() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '')
    .replace(/\/rest\/v1\/?$/, '')
    .replace(/\/$/, '')
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createAdminClient(supabaseUrl, serviceKey)
}

async function authorizeOrgAdmin(orgSlug: string) {
  const authClient = await createServerSupabase()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user || !user.email) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const email = user.email.toLowerCase().trim()
  const isSuper = isSuperAdminEmail(email)
  const db = getAdminDb()

  const { data: org, error: orgErr } = await db
    .from('organizations')
    .select('id, name, slug, website, created_at')
    .eq('slug', orgSlug)
    .maybeSingle()

  if (orgErr || !org) {
    return { error: NextResponse.json({ error: 'Organization not found.' }, { status: 404 }) }
  }

  const { data: staffRow } = await db
    .from('staff_members')
    .select('id, email, full_name, role, status, org_id, is_active')
    .ilike('email', email)
    .eq('is_active', true)
    .maybeSingle()

  const isThisOrgAdmin =
    isSuper ||
    (staffRow?.org_id === org.id && String(staffRow?.status || '').toLowerCase() === 'admin')

  if (!isThisOrgAdmin) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden: Only this organization’s Super Admin can manage these settings.' },
        { status: 403 }
      ),
    }
  }

  return { user, email, isSuper, org, staffRow, db }
}

async function safeCount(promise: PromiseLike<{ count: number | null }>): Promise<number> {
  try {
    const res = await promise
    return Number(res.count || 0)
  } catch {
    return 0
  }
}

export async function GET(request: NextRequest) {
  const orgSlug = (request.nextUrl.searchParams.get('org') || '').toLowerCase().trim()
  if (!orgSlug) {
    return NextResponse.json({ error: 'org query parameter is required' }, { status: 400 })
  }

  const auth = await authorizeOrgAdmin(orgSlug)
  if ('error' in auth && auth.error) return auth.error
  const { org, isSuper, staffRow, db } = auth

  // Gather active departments for this org
  const { data: orgStaff } = await db
    .from('staff_members')
    .select('id, email, full_name, role, status')
    .eq('org_id', org.id)
    .eq('is_active', true)

  const deptSet = new Set<'sales' | 'marketing' | 'finance'>()
  if (isSuper && org.id === CILLAH_ORG_ID) {
    deptSet.add('sales')
    deptSet.add('marketing')
    deptSet.add('finance')
  } else {
    const sourceRows = staffRow && staffRow.org_id === org.id ? [staffRow] : orgStaff || []
    for (const s of sourceRows) {
      for (const d of parseAssignedWorkspaces(s.role)) {
        deptSet.add(d)
      }
    }
  }

  // Fetch latest active subscription if table exists
  let subscription: any = null
  try {
    const { data: subRow } = await db
      .from('organization_subscriptions')
      .select(
        'id, departments, billing_cycle, amount_kes, status, payment_provider, payment_receipt, paid_at, current_period_start, current_period_end'
      )
      .eq('organization_id', org.id)
      .eq('status', 'active')
      .order('paid_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    subscription = subRow || null
  } catch {
    subscription = null
  }

  const [connectedSocials, marketingPosts, inboxThreads] = await Promise.all([
    safeCount(
      db
        .from('marketing_social_connections')
        .select('id', { count: 'exact', head: true })
        .eq('organization_slug', org.slug)
    ),
    safeCount(
      db
        .from('marketing_posts')
        .select('id', { count: 'exact', head: true })
        .eq('organization_slug', org.slug)
    ),
    safeCount(
      db
        .from('marketing_inbox_threads')
        .select('id', { count: 'exact', head: true })
        .eq('organization_slug', org.slug)
    ),
  ])

  return NextResponse.json({
    organization: org,
    isSuperAdmin: isSuper,
    isProtectedPrimaryOrg: org.id === CILLAH_ORG_ID || org.slug === 'cillah-dev',
    activeDepartments: Array.from(deptSet),
    subscription,
    stats: {
      teamMembers: (orgStaff || []).length,
      connectedSocials,
      marketingPosts,
      inboxThreads,
    },
  })
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const orgSlug = String(body.orgSlug || '').toLowerCase().trim()
    const name = String(body.name || '').trim()
    const website = String(body.website || '').trim()

    if (!orgSlug || name.length < 2) {
      return NextResponse.json(
        { error: 'Organization slug and a valid name are required.' },
        { status: 400 }
      )
    }

    const auth = await authorizeOrgAdmin(orgSlug)
    if ('error' in auth && auth.error) return auth.error
    const { org, db } = auth

    const { data: updated, error: updateErr } = await db
      .from('organizations')
      .update({
        name,
        website: website || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', org.id)
      .select('id, name, slug, website, created_at')
      .single()

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      organization: updated,
      message: 'Organization profile updated.',
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to update organization settings' },
      { status: 500 }
    )
  }
}

/**
 * Permanently deletes an organization AND wipes all tenant data:
 * - Encrypted OAuth tokens & social connections
 * - Marketing posts, analytics metrics, role assignments, unified inbox threads & messages
 * - Subscriptions, CRM leads/properties, Finance invoices/outflows scoped to this organization
 * - Staff memberships & downgrades non-CEO org profiles back to standard client/user
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const orgSlug = String(body.orgSlug || '').toLowerCase().trim()
    const confirmName = String(body.confirmName || '').trim()

    if (!orgSlug) {
      return NextResponse.json({ error: 'orgSlug is required' }, { status: 400 })
    }

    const auth = await authorizeOrgAdmin(orgSlug)
    if ('error' in auth && auth.error) return auth.error
    const { org, isSuper, db } = auth

    if (org.id === CILLAH_ORG_ID || org.slug === 'cillah-dev') {
      return NextResponse.json(
        { error: 'The primary platform organization (cillah.dev) cannot be deleted.' },
        { status: 400 }
      )
    }

    if (confirmName.toLowerCase() !== org.name.trim().toLowerCase()) {
      return NextResponse.json(
        {
          error: `Confirmation mismatch. Type "${org.name}" exactly to permanently delete this organization and wipe all data.`,
        },
        { status: 400 }
      )
    }

    // Find member emails first so we can downgrade non-super-admin profile roles cleanly
    const { data: memberRows } = await db
      .from('staff_members')
      .select('email')
      .eq('org_id', org.id)

    const memberEmails = (memberRows || [])
      .map((m: any) => String(m.email || '').toLowerCase().trim())
      .filter((e) => Boolean(e) && !isSuperAdminEmail(e))

    // Best-effort purge across all tenant-scoped tables (ignoring optional tables if absent)
    const wipeTasks: Array<PromiseLike<any>> = [
      db.from('marketing_inbox_messages').delete().eq('organization_slug', org.slug),
      db.from('marketing_inbox_threads').delete().eq('organization_slug', org.slug),
      db.from('marketing_social_connections').delete().eq('organization_slug', org.slug),
      db.from('marketing_channel_metrics').delete().eq('organization_slug', org.slug),
      db.from('marketing_posts').delete().eq('organization_slug', org.slug),
      db.from('marketing_role_assignments').delete().eq('organization_slug', org.slug),
      db.from('organization_subscriptions').delete().eq('organization_id', org.id),
      db.from('finance_invoices').delete().eq('organization_slug', org.slug),
      db.from('finance_outflows').delete().eq('organization_slug', org.slug),
      db.from('sales_leads').delete().eq('org_id', org.id),
      db.from('stage_leads').delete().eq('org_id', org.id),
      db.from('properties').delete().eq('org_id', org.id),
      db.from('staff_members').delete().eq('org_id', org.id),
    ]

    await Promise.allSettled(wipeTasks)

    // Reset downgraded member profiles so they no longer hold admin access to a deleted org
    for (const email of memberEmails) {
      await db
        .from('profiles')
        .update({
          role: 'user',
          company_name: null,
          updated_at: new Date().toISOString(),
        })
        .ilike('email', email)
    }

    // Finally delete the organization record itself
    const { error: delOrgErr } = await db.from('organizations').delete().eq('id', org.id)
    if (delOrgErr) {
      return NextResponse.json({ error: delOrgErr.message }, { status: 500 })
    }

    return NextResponse.json({
      deleted: true,
      shouldSignOut: !isSuper,
      message: `${org.name} and all associated organization data, social connections, and tokens have been permanently wiped.`,
    })
  } catch (err: any) {
    console.error('[Org Settings Delete Error]:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to delete organization' },
      { status: 500 }
    )
  }
}
