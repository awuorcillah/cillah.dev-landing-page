import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { isSuperAdminEmail } from '@/lib/auth-roles'

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '')
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/$/, '')
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const CILLAH_ORG_ID = 'a1b2c3d4-e5f6-7890-abcd-222222222222'

function getAdminDb() {
  return createAdminClient(supabaseUrl, serviceRoleKey)
}

async function requireSuperAdmin() {
  const authClient = await createServerSupabase()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const email = (user.email || '').toLowerCase().trim()
  if (!isSuperAdminEmail(email)) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden: Only Platform Super Admin can manage all organizations.' },
        { status: 403 }
      ),
    }
  }

  return { user, email, db: getAdminDb() }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function parseDepartments(role?: string | null): string[] {
  const raw = (role || '')
    .toLowerCase()
    .split(/[,|/]/)
    .map((r) => r.trim())
    .filter(Boolean)
  if (raw.includes('ceo')) return ['sales', 'marketing', 'finance']
  return raw.filter((r) => ['sales', 'marketing', 'finance'].includes(r))
}

export async function GET() {
  try {
    const auth = await requireSuperAdmin()
    if ('error' in auth && auth.error) return auth.error
    const { db } = auth

    const [{ data: orgs, error: orgErr }, { data: staffRows }, { data: leadRows }] =
      await Promise.all([
        db.from('organizations').select('*').order('created_at', { ascending: true }),
        db
          .from('staff_members')
          .select('id, crm_id, email, full_name, phone_number, role, status, is_active, org_id')
          .eq('is_active', true),
        db.from('sales_leads').select('id, assigned_agent_email, stage').neq('stage', 'trash'),
      ])

    if (orgErr) {
      return NextResponse.json({ error: orgErr.message }, { status: 500 })
    }

    const activeStaff = staffRows || []
    const activeLeads = leadRows || []

    const leadCountsByEmail: Record<string, number> = {}
    activeLeads.forEach((l: any) => {
      const e = (l.assigned_agent_email || '').toLowerCase()
      if (!e) return
      leadCountsByEmail[e] = (leadCountsByEmail[e] || 0) + 1
    })

    const enriched = (orgs || []).map((org: any) => {
      const members = activeStaff
        .filter((s: any) => s.org_id === org.id)
        .map((s: any) => {
          const emailLower = (s.email || '').toLowerCase()
          const depts = parseDepartments(s.role)
          const accessRole =
            isSuperAdminEmail(emailLower) || String(s.status || '').toLowerCase() === 'admin'
              ? 'admin'
              : 'user'
          return {
            id: s.id,
            email: emailLower,
            full_name: s.full_name,
            phone_number: s.phone_number || '',
            departments: depts.length > 0 ? depts : ['sales'],
            access_role: accessRole,
            lead_count: leadCountsByEmail[emailLower] || 0,
          }
        })

      const totalLeads = members.reduce((sum: number, m: any) => sum + m.lead_count, 0)
      const deptSet = new Set<string>()
      members.forEach((m: any) => m.departments.forEach((d: string) => deptSet.add(d)))
      if (deptSet.size === 0) {
        deptSet.add('sales')
        deptSet.add('marketing')
        deptSet.add('finance')
      }

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        website: org.website || '',
        created_at: org.created_at,
        staff_count: members.length,
        lead_count: totalLeads,
        departments: Array.from(deptSet),
        members,
      }
    })

    // Sort: cillah.dev first, Rosy Realtors second, then alphabetical
    enriched.sort((a: any, b: any) => {
      if (a.slug === 'cillah-dev') return -1
      if (b.slug === 'cillah-dev') return 1
      if (a.slug === 'rosy-realtors') return -1
      if (b.slug === 'rosy-realtors') return 1
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({ organizations: enriched })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load organizations' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireSuperAdmin()
    if ('error' in auth && auth.error) return auth.error
    const { db } = auth

    const body = await request.json()
    const name = (body.name || '').trim()
    const website = (body.website || '').trim()
    const departments: string[] =
      Array.isArray(body.departments) && body.departments.length > 0
        ? body.departments.map((d: string) => d.toLowerCase().trim())
        : ['sales', 'marketing', 'finance']

    if (!name) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 })
    }

    let slug = slugify(body.slug || name)
    if (!slug) slug = `org-${Date.now()}`

    // Ensure slug uniqueness
    const { data: existingSlug } = await db
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`
    }

    const { data: newOrg, error: orgErr } = await db
      .from('organizations')
      .insert({
        name,
        slug,
        website: website || null,
      })
      .select('*')
      .single()

    if (orgErr) {
      return NextResponse.json({ error: orgErr.message }, { status: 500 })
    }

    // Optional: assign initial user / org admin right during creation
    const userEmail = (body.initial_user_email || '').toLowerCase().trim()
    const userName = (body.initial_user_name || '').trim()
    const userPhone = (body.initial_user_phone || '').trim()
    const userAccessRole = body.initial_user_role === 'admin' ? 'admin' : 'user'

    if (userEmail && userName) {
      const roleString = departments.join(',')
      await db.from('staff_members').upsert(
        {
          crm_id: `${slug.slice(0, 4).toUpperCase()}-001`,
          email: userEmail,
          full_name: userName,
          phone_number: userPhone || null,
          role: roleString,
          status: userAccessRole,
          is_active: true,
          org_id: newOrg.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )

      await db
        .from('profiles')
        .update({ full_name: userName, role: userAccessRole })
        .ilike('email', userEmail)
    }

    return NextResponse.json({
      success: true,
      organization: newOrg,
      message: `${name} created successfully!`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create organization' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireSuperAdmin()
    if ('error' in auth && auth.error) return auth.error
    const { db } = auth

    const body = await request.json()
    const { action } = body

    // Assign or update a user inside an organization (with multi-department + status role)
    if (action === 'assign_user') {
      const orgId = (body.orgId || '').trim()
      const fullName = (body.full_name || '').trim()
      const email = (body.email || '').toLowerCase().trim()
      const phoneNumber = (body.phone_number || '').trim()
      const accessRole = body.access_role === 'admin' ? 'admin' : 'user'
      const departments: string[] =
        Array.isArray(body.departments) && body.departments.length > 0
          ? body.departments.map((d: string) => d.toLowerCase().trim())
          : ['sales']

      if (!orgId || !fullName || !email) {
        return NextResponse.json(
          { error: 'orgId, full_name, and email are required' },
          { status: 400 }
        )
      }

      const roleString = departments.join(',')
      const { error } = await db.from('staff_members').upsert(
        {
          crm_id: `USR-${Date.now().toString().slice(-5)}`,
          email,
          full_name: fullName,
          phone_number: phoneNumber || null,
          role: roleString,
          status: accessRole,
          is_active: true,
          org_id: orgId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      await db
        .from('profiles')
        .update({ full_name: fullName, role: accessRole })
        .ilike('email', email)

      return NextResponse.json({
        success: true,
        message: `${fullName} assigned as ${accessRole.toUpperCase()} (${departments.join(', ')})`,
      })
    }

    // Otherwise update organization name/website
    const orgId = (body.id || '').trim()
    const name = (body.name || '').trim()
    const website = (body.website || '').trim()
    if (!orgId || !name) {
      return NextResponse.json({ error: 'id and name are required' }, { status: 400 })
    }

    const { error } = await db
      .from('organizations')
      .update({ name, website: website || null, updated_at: new Date().toISOString() })
      .eq('id', orgId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireSuperAdmin()
    if ('error' in auth && auth.error) return auth.error
    const { db } = auth

    const body = await request.json()
    const orgId = (body.orgId || '').trim()
    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 })
    }
    if (orgId === CILLAH_ORG_ID) {
      return NextResponse.json(
        { error: 'Primary organization cillah.dev cannot be deleted.' },
        { status: 400 }
      )
    }

    // Safely detach child FK rows before deleting org record
    await Promise.all([
      db
        .from('staff_members')
        .update({ is_active: false, org_id: null, updated_at: new Date().toISOString() })
        .eq('org_id', orgId),
      db.from('stage_leads').update({ org_id: null }).eq('org_id', orgId),
      db.from('properties').update({ org_id: null }).eq('org_id', orgId),
    ])

    const { error } = await db.from('organizations').delete().eq('id', orgId)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Delete failed' }, { status: 500 })
  }
}
