import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { getServiceRoleClient } from '@/lib/marketing-auth'
import { isAdminAccount, isSuperAdminEmail } from '@/lib/auth-roles'
import type { MarketingRoleTier } from '@/lib/marketing-config'

const ALL_DEPARTMENTS = [
  'sales',
  'marketing',
  'finance',
  'operations',
  'engineering',
  'ceo',
] as const

const upsertMemberSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  full_name: z.string().trim().min(1, 'Full name is required').max(150),
  phone_number: z.string().optional().default(''),
  departments: z.array(z.string()).min(1, 'Assign at least one department'),
  platform_access: z.enum(['admin', 'user']).default('user'),
  marketing_role: z
    .enum(['marketing_admin', 'publisher', 'content_creator', 'analyst'])
    .optional(),
  is_active: z.boolean().optional().default(true),
})

async function requireAdminCaller() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user || !user.email) {
    return { caller: null, supabase, error: 'Authentication required', status: 401 }
  }

  const email = user.email.toLowerCase().trim()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!isAdminAccount(email, profile?.role)) {
    return { caller: null, supabase, error: 'Admin privileges required', status: 403 }
  }

  return {
    caller: {
      id: user.id,
      email,
      isSuperAdmin: isSuperAdminEmail(email),
    },
    supabase,
  }
}

function parseDepartments(roleStr?: string | null): string[] {
  const parts = (roleStr || '')
    .toLowerCase()
    .split(/[,|/]/)
    .map((s) => s.trim())
    .filter(Boolean)

  if (parts.length === 0) return ['sales']
  return Array.from(new Set(parts))
}

export async function GET(request: NextRequest) {
  const orgSlug = request.nextUrl.searchParams.get('org') || 'cillah-dev'
  const { caller, supabase, error, status } = await requireAdminCaller()
  if (!caller) {
    return NextResponse.json({ error }, { status: status || 401 })
  }

  const db = getServiceRoleClient() || supabase

  const [staffRes, profilesRes, marketingRolesRes] = await Promise.all([
    db.from('staff_members').select('*').order('created_at', { ascending: true }),
    db
      .from('profiles')
      .select('id, email, full_name, role, status, avatar_url, created_at')
      .order('created_at', { ascending: true }),
    db
      .from('marketing_role_assignments')
      .select('*')
      .eq('organization_slug', orgSlug),
  ])

  const staffRows = staffRes.data || []
  const profileRows = profilesRes.data || []
  const marketingRows = marketingRolesRes.error ? [] : marketingRolesRes.data || []

  const profileByEmail = new Map<string, any>()
  for (const p of profileRows) {
    if (p.email) profileByEmail.set(p.email.toLowerCase().trim(), p)
  }

  const marketingByEmail = new Map<string, any>()
  for (const m of marketingRows) {
    if (m.user_email) marketingByEmail.set(m.user_email.toLowerCase().trim(), m)
  }

  const seenEmails = new Set<string>()
  const members: any[] = []

  // 1. All staff_members rows (primary source of org departments)
  for (const s of staffRows) {
    const email = (s.email || '').toLowerCase().trim()
    if (!email) continue
    seenEmails.add(email)

    const profile = profileByEmail.get(email)
    const mkt = marketingByEmail.get(email)
    const departments = parseDepartments(s.role)
    const isSuper = isSuperAdminEmail(email)
    const platformAccess = isSuper
      ? 'super_admin'
      : (profile?.role || s.status || 'user').toLowerCase() === 'admin'
      ? 'admin'
      : 'user'

    members.push({
      id: s.id,
      crm_id: s.crm_id,
      email,
      full_name: s.full_name || profile?.full_name || email.split('@')[0],
      phone_number: s.phone_number || '',
      departments,
      raw_role: s.role,
      platform_access: platformAccess,
      has_auth_profile: Boolean(profile),
      profile_id: profile?.id || null,
      marketing_role: (mkt?.marketing_role as MarketingRoleTier) || (
        isSuper ? 'marketing_admin' : departments.includes('marketing') ? 'publisher' : null
      ),
      is_active: s.is_active !== false,
      created_at: s.created_at,
      updated_at: s.updated_at,
      source: 'staff_members',
    })
  }

  // 2. Include any registered profiles not yet in staff_members so Super Admin sees everyone
  for (const p of profileRows) {
    const email = (p.email || '').toLowerCase().trim()
    if (!email || seenEmails.has(email)) continue
    seenEmails.add(email)

    const mkt = marketingByEmail.get(email)
    const isSuper = isSuperAdminEmail(email)
    const platformAccess = isSuper
      ? 'super_admin'
      : (p.role || 'user').toLowerCase() === 'admin'
      ? 'admin'
      : 'user'

    members.push({
      id: p.id,
      crm_id: null,
      email,
      full_name: p.full_name || email.split('@')[0],
      phone_number: '',
      departments: mkt ? ['marketing'] : [],
      raw_role: '',
      platform_access: platformAccess,
      has_auth_profile: true,
      profile_id: p.id,
      marketing_role: (mkt?.marketing_role as MarketingRoleTier) || null,
      is_active: (p.status || 'active') === 'active',
      created_at: p.created_at,
      updated_at: p.created_at,
      source: 'profiles_only',
    })
  }

  return NextResponse.json({
    organization_slug: orgSlug,
    members,
    available_departments: ALL_DEPARTMENTS,
  })
}

export async function POST(request: NextRequest) {
  return handleUpsert(request)
}

export async function PATCH(request: NextRequest) {
  return handleUpsert(request)
}

async function handleUpsert(request: NextRequest) {
  try {
    const orgSlug = request.nextUrl.searchParams.get('org') || 'cillah-dev'
    const { caller, supabase, error, status } = await requireAdminCaller()
    if (!caller) {
      return NextResponse.json({ error }, { status: status || 401 })
    }

    const rawBody = await request.json()
    const parsed = upsertMemberSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid team member payload' },
        { status: 400 }
      )
    }

    const input = parsed.data
    const emailClean = input.email.toLowerCase().trim()
    const cleanDepartments = Array.from(
      new Set(input.departments.map((d) => d.toLowerCase().trim()).filter(Boolean))
    )
    const roleCsv = cleanDepartments.join(',')
    const effectivePlatformRole = isSuperAdminEmail(emailClean)
      ? 'admin'
      : input.platform_access

    const db = getServiceRoleClient() || supabase
    const nowIso = new Date().toISOString()

    // 1. Upsert into public.staff_members
    const { data: existingStaff } = await db
      .from('staff_members')
      .select('id, crm_id')
      .ilike('email', emailClean)
      .maybeSingle()

    if (existingStaff) {
      const { error: updateStaffErr } = await db
        .from('staff_members')
        .update({
          full_name: input.full_name,
          phone_number: input.phone_number || null,
          role: roleCsv,
          status: effectivePlatformRole,
          is_active: isSuperAdminEmail(emailClean) ? true : input.is_active,
          updated_at: nowIso,
        })
        .eq('id', existingStaff.id)

      if (updateStaffErr) {
        return NextResponse.json({ error: updateStaffErr.message }, { status: 500 })
      }
    } else {
      const crmId = `CRM-${Date.now().toString().slice(-6)}`
      const { error: insertStaffErr } = await db.from('staff_members').insert({
        crm_id: crmId,
        email: emailClean,
        full_name: input.full_name,
        phone_number: input.phone_number || null,
        role: roleCsv,
        status: effectivePlatformRole,
        is_active: input.is_active,
        updated_at: nowIso,
      })

      if (insertStaffErr) {
        return NextResponse.json({ error: insertStaffErr.message }, { status: 500 })
      }
    }

    // 2. Sync platform role in public.profiles if the user has already signed up
    const { data: existingProfile } = await db
      .from('profiles')
      .select('id')
      .ilike('email', emailClean)
      .maybeSingle()

    if (existingProfile && !isSuperAdminEmail(emailClean)) {
      await db
        .from('profiles')
        .update({
          role: effectivePlatformRole,
          full_name: input.full_name,
          updated_at: nowIso,
        })
        .eq('id', existingProfile.id)
    }

    // 3. Sync Marketing Role Tier in public.marketing_role_assignments
    const hasMarketing =
      cleanDepartments.includes('marketing') || cleanDepartments.includes('ceo')

    if (hasMarketing || input.marketing_role) {
      const marketingTier: MarketingRoleTier = isSuperAdminEmail(emailClean)
        ? 'marketing_admin'
        : input.marketing_role || 'content_creator'

      await db.from('marketing_role_assignments').upsert(
        {
          organization_slug: orgSlug,
          user_email: emailClean,
          full_name: input.full_name,
          marketing_role: marketingTier,
          is_active: input.is_active,
          assigned_by: caller.email,
          updated_at: nowIso,
        },
        { onConflict: 'organization_slug,user_email' }
      )
    }

    return NextResponse.json({
      success: true,
      email: emailClean,
      departments: cleanDepartments,
      platform_access: effectivePlatformRole,
    })
  } catch (err: any) {
    console.error('[Admin Teams Upsert Error]:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to update team member.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const emailParam = (request.nextUrl.searchParams.get('email') || '').toLowerCase().trim()
  const orgSlug = request.nextUrl.searchParams.get('org') || 'cillah-dev'

  if (!emailParam) {
    return NextResponse.json({ error: 'Email parameter is required.' }, { status: 400 })
  }

  if (isSuperAdminEmail(emailParam)) {
    return NextResponse.json(
      { error: 'The Super Admin account cannot be removed.' },
      { status: 403 }
    )
  }

  const { caller, supabase, error, status } = await requireAdminCaller()
  if (!caller) {
    return NextResponse.json({ error }, { status: status || 401 })
  }

  const db = getServiceRoleClient() || supabase
  await Promise.all([
    db.from('staff_members').delete().ilike('email', emailParam),
    db
      .from('marketing_role_assignments')
      .delete()
      .eq('organization_slug', orgSlug)
      .ilike('user_email', emailParam),
  ])

  return NextResponse.json({ deleted: true, email: emailParam })
}
