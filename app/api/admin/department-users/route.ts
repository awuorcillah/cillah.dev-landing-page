import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { isAdminAccount, isSuperAdminEmail } from '@/lib/auth-roles'

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '')
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/$/, '')
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function getAdminDb() {
  return createAdminClient(supabaseUrl, serviceRoleKey)
}

async function requireAdminCaller(requestedOrgId?: string, requestedDepartment?: string) {
  const authClient = await createServerSupabase()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const email = (user.email || '').toLowerCase().trim()
  const isSuper = isSuperAdminEmail(email)
  const db = getAdminDb()

  const [{ data: profile }, { data: callerStaff }] = await Promise.all([
    db.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    db.from('staff_members').select('org_id, role, status').ilike('email', email).maybeSingle(),
  ])

  const hasAdminRole =
    isSuper ||
    isAdminAccount(email, profile?.role) ||
    String(callerStaff?.status || '').toLowerCase() === 'admin'

  if (!hasAdminRole) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden: Only Admin / CEO can manage department users.' },
        { status: 403 }
      ),
    }
  }

  // STRICT TENANT ISOLATION: Non-Super Admins can ONLY access their own organization & assigned departments
  const callerOrgId = callerStaff?.org_id || null
  const callerRoles = parseRoles(callerStaff?.role)

  if (!isSuper) {
    if (!callerOrgId || (requestedOrgId && callerOrgId !== requestedOrgId)) {
      return {
        error: NextResponse.json(
          { error: 'Forbidden: Organization Admins can only manage users within their own organization.' },
          { status: 403 }
        ),
      }
    }
    if (
      requestedDepartment &&
      !callerRoles.includes('ceo') &&
      !callerRoles.includes(requestedDepartment.toLowerCase())
    ) {
      return {
        error: NextResponse.json(
          { error: `Forbidden: You do not have Admin access to the ${requestedDepartment} department.` },
          { status: 403 }
        ),
      }
    }
  }

  return { user, email, db, isSuper, callerOrgId }
}

function parseRoles(raw?: string | null): string[] {
  return (raw || '')
    .toLowerCase()
    .split(/[,|/]/)
    .map((r) => r.trim())
    .filter(Boolean)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId') || ''
    const department = (searchParams.get('department') || 'sales').toLowerCase().trim()

    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 })
    }

    const auth = await requireAdminCaller(orgId, department)
    if ('error' in auth && auth.error) return auth.error
    const { db } = auth

    const [{ data: staffRows, error: staffErr }, { data: leadsRows }, { data: profileRows }] =
      await Promise.all([
        db
          .from('staff_members')
          .select('id, crm_id, email, full_name, phone_number, role, status, is_active, org_id, created_at')
          .eq('org_id', orgId)
          .eq('is_active', true)
          .order('created_at', { ascending: true }),
        db
          .from('sales_leads')
          .select('id, assigned_agent_email, stage')
          .neq('stage', 'trash'),
        db.from('profiles').select('id, email, role'),
      ])

    if (staffErr) {
      return NextResponse.json({ error: staffErr.message }, { status: 500 })
    }

    const profileMap: Record<string, string> = {}
    ;(profileRows || []).forEach((p: any) => {
      if (p.email) profileMap[p.email.toLowerCase()] = String(p.role || 'user').toLowerCase()
    })

    const leadCounts: Record<string, number> = {}
    ;(leadsRows || []).forEach((l: any) => {
      const e = (l.assigned_agent_email || '').toLowerCase()
      if (!e) return
      leadCounts[e] = (leadCounts[e] || 0) + 1
    })

    const users = (staffRows || [])
      .filter((s: any) => {
        const roles = parseRoles(s.role)
        return (
          roles.includes(department) ||
          roles.includes('ceo') ||
          String(s.status || '').toLowerCase() === 'admin'
        )
      })
      .map((s: any) => {
        const emailLower = (s.email || '').toLowerCase()
        const isSuper = isSuperAdminEmail(emailLower)
        const accessLevel =
          isSuper ||
          String(s.status || '').toLowerCase() === 'admin' ||
          profileMap[emailLower] === 'admin'
            ? 'admin'
            : 'user'

        return {
          id: s.id,
          crm_id: s.crm_id,
          email: emailLower,
          full_name: s.full_name,
          phone_number: s.phone_number || '',
          departments: parseRoles(s.role),
          role_raw: s.role,
          access_level: accessLevel,
          is_super_admin: isSuper,
          lead_count: leadCounts[emailLower] || 0,
          created_at: s.created_at,
        }
      })

    return NextResponse.json({ users })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch department users' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const orgId = (body.orgId || '').trim()
    const department = (body.department || 'sales').toLowerCase().trim()
    const fullName = (body.full_name || '').trim()
    const email = (body.email || '').toLowerCase().trim()
    const phoneNumber = (body.phone_number || '').trim()
    const accessLevel = body.access_level === 'admin' ? 'admin' : 'user'

    if (!orgId || !fullName || !email) {
      return NextResponse.json(
        { error: 'orgId, full_name, and email are required' },
        { status: 400 }
      )
    }

    const auth = await requireAdminCaller(orgId, department)
    if ('error' in auth && auth.error) return auth.error
    const { db } = auth

    // Check if staff member already exists by email
    const { data: existing } = await db
      .from('staff_members')
      .select('*')
      .ilike('email', email)
      .maybeSingle()

    let savedRow: any = null

    if (existing) {
      const roles = new Set(parseRoles(existing.role))
      roles.add(department)
      const { data: updated, error: updErr } = await db
        .from('staff_members')
        .update({
          full_name: fullName,
          phone_number: phoneNumber || existing.phone_number,
          role: Array.from(roles).join(','),
          status: accessLevel,
          is_active: true,
          org_id: orgId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('*')
        .single()

      if (updErr) {
        return NextResponse.json({ error: updErr.message }, { status: 500 })
      }
      savedRow = updated
    } else {
      const prefix = department.slice(0, 3).toUpperCase()
      const crmId = `${prefix}-${Date.now().toString().slice(-5)}`
      const { data: inserted, error: insErr } = await db
        .from('staff_members')
        .insert({
          crm_id: crmId,
          email,
          full_name: fullName,
          phone_number: phoneNumber || null,
          role: department,
          status: accessLevel,
          is_active: true,
          org_id: orgId,
        })
        .select('*')
        .single()

      if (insErr) {
        return NextResponse.json({ error: insErr.message }, { status: 500 })
      }
      savedRow = inserted
    }

    // Sync profiles table if an auth account already exists for this email
    await db
      .from('profiles')
      .update({
        full_name: fullName,
        role: accessLevel,
      })
      .ilike('email', email)

    return NextResponse.json({
      success: true,
      user: savedRow,
      message: `${fullName} added to ${department} — pipeline ready immediately.`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to add user' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdminCaller()
    if ('error' in auth && auth.error) return auth.error
    const { db, isSuper, callerOrgId } = auth

    const body = await request.json()
    const { userId, full_name, phone_number, access_level } = body
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const { data: existing } = await db
      .from('staff_members')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    if (!isSuper && existing.org_id !== callerOrgId) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot edit users outside your own organization.' },
        { status: 403 }
      )
    }

    if (isSuperAdminEmail(existing.email) && access_level === 'user') {
      return NextResponse.json(
        { error: 'Super Admin role cannot be downgraded.' },
        { status: 400 }
      )
    }

    const nextAccess = access_level === 'admin' ? 'admin' : 'user'
    const updatePayload: Record<string, any> = {
      status: nextAccess,
      updated_at: new Date().toISOString(),
    }
    if (full_name) updatePayload.full_name = full_name.trim()
    if (phone_number !== undefined) updatePayload.phone_number = phone_number.trim()

    const { data: updated, error } = await db
      .from('staff_members')
      .update(updatePayload)
      .eq('id', userId)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await db
      .from('profiles')
      .update({ role: nextAccess, ...(full_name ? { full_name: full_name.trim() } : {}) })
      .ilike('email', existing.email)

    return NextResponse.json({ success: true, user: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const {
      userId,
      orgId,
      department = 'sales',
      transferMode = 'unassigned',
      targetAgentEmail = '',
    } = body as {
      userId: string
      orgId: string
      department?: string
      transferMode?: 'single' | 'round_robin' | 'unassigned'
      targetAgentEmail?: string
    }

    if (!userId || !orgId) {
      return NextResponse.json({ error: 'userId and orgId are required' }, { status: 400 })
    }

    const auth = await requireAdminCaller(orgId, department)
    if ('error' in auth && auth.error) return auth.error
    const { db, email: adminEmail, isSuper, callerOrgId } = auth

    const { data: targetUser } = await db
      .from('staff_members')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!isSuper && targetUser.org_id !== callerOrgId) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot remove users outside your own organization.' },
        { status: 403 }
      )
    }

    if (isSuperAdminEmail(targetUser.email)) {
      return NextResponse.json(
        { error: 'The primary CEO / Super Admin account cannot be deleted.' },
        { status: 400 }
      )
    }

    const departingEmail = (targetUser.email || '').toLowerCase()
    let transferredCount = 0

    // 1. If removing from Sales department, transfer existing pipeline leads cleanly
    if (department.toLowerCase() === 'sales') {
      const { data: departingLeads } = await db
        .from('sales_leads')
        .select('id, full_name')
        .ilike('assigned_agent_email', departingEmail)
        .neq('stage', 'trash')

      const leadsToMove = departingLeads || []
      transferredCount = leadsToMove.length

      if (leadsToMove.length > 0) {
        const nowIso = new Date().toISOString()

        if (transferMode === 'single' && targetAgentEmail) {
          const { data: destStaff } = await db
            .from('staff_members')
            .select('id, email, full_name')
            .eq('org_id', orgId)
            .ilike('email', targetAgentEmail)
            .maybeSingle()

          if (!destStaff) {
            return NextResponse.json(
              { error: 'Selected destination agent was not found in this organization.' },
              { status: 400 }
            )
          }

          await db
            .from('sales_leads')
            .update({
              assigned_agent_email: destStaff.email.toLowerCase(),
              assigned_agent_id: destStaff.id,
              updated_at: nowIso,
            })
            .in('id', leadsToMove.map((l: any) => l.id))

          await db.from('lead_notes').insert(
            leadsToMove.map((l: any) => ({
              lead_id: l.id,
              author_email: adminEmail,
              author_name: 'Admin / CEO',
              source: 'lead_transfer',
              note_text: `Pipeline reassigned from ${targetUser.full_name} to ${destStaff.full_name} upon user removal.`,
            }))
          )
        } else if (transferMode === 'round_robin') {
          const { data: remainingAgents } = await db
            .from('staff_members')
            .select('id, email, full_name, role')
            .eq('org_id', orgId)
            .eq('is_active', true)
            .neq('id', userId)

          const eligible = (remainingAgents || []).filter((s: any) => {
            const r = parseRoles(s.role)
            return r.includes('sales') || r.includes('ceo')
          })

          if (eligible.length === 0) {
            return NextResponse.json(
              { error: 'No other active sales agents available for round-robin transfer. Choose Unassigned instead.' },
              { status: 400 }
            )
          }

          for (let i = 0; i < leadsToMove.length; i++) {
            const lead = leadsToMove[i]
            const dest = eligible[i % eligible.length]
            await db
              .from('sales_leads')
              .update({
                assigned_agent_email: dest.email.toLowerCase(),
                assigned_agent_id: dest.id,
                updated_at: nowIso,
              })
              .eq('id', lead.id)

            await db.from('lead_notes').insert({
              lead_id: lead.id,
              author_email: adminEmail,
              author_name: 'Admin / CEO',
              source: 'lead_transfer',
              note_text: `Auto-distributed (Round-Robin) from ${targetUser.full_name} to ${dest.full_name}.`,
            })
          }
        } else {
          // Unassigned
          await db
            .from('sales_leads')
            .update({
              assigned_agent_email: null,
              assigned_agent_id: null,
              updated_at: nowIso,
            })
            .in('id', leadsToMove.map((l: any) => l.id))
        }
      }
    }

    // 2. Remove department from user's roles, or deactivate/remove user if no departments remain
    const currentRoles = parseRoles(targetUser.role).filter(
      (r) => r !== department.toLowerCase()
    )

    if (currentRoles.length > 0) {
      await db
        .from('staff_members')
        .update({
          role: currentRoles.join(','),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
    } else {
      await db.from('staff_members').delete().eq('id', userId)
    }

    return NextResponse.json({
      success: true,
      transferredCount,
      message:
        transferredCount > 0
          ? `Removed ${targetUser.full_name} and transferred ${transferredCount} leads cleanly.`
          : `Removed ${targetUser.full_name} from ${department}.`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete user' }, { status: 500 })
  }
}
