'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  isAdminAccount,
  isSuperAdminEmail,
  parseAssignedWorkspaces,
  type UserWorkspaceRole,
} from '@/lib/auth-roles'
import {
  Building2,
  Cpu,
  Stethoscope,
  Globe2,
  TrendingUp,
  Megaphone,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Users,
  Layers,
  Video,
  UserCheck,
  Settings,
} from 'lucide-react'

interface OrganizationOption {
  id: string
  slug: string
  name: string
  subtitle: string
  badge: string
  badgeClass: string
  glowClass: string
  borderClass: string
  accentClass: string
  icon: typeof Building2
}

const DEPARTMENT_META: Record<
  UserWorkspaceRole,
  {
    label: string
    headline: string
    subtitle: string
    icon: typeof TrendingUp
    accentClass: string
    glowClass: string
    borderClass: string
  }
> = {
  sales: {
    label: 'Sales',
    headline: 'Sales Pipeline',
    subtitle: 'Leads, follow-ups, deals & client nurturing',
    icon: TrendingUp,
    accentClass: 'text-emerald-400',
    glowClass: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    borderClass: 'hover:border-emerald-400/60',
  },
  marketing: {
    label: 'Marketing',
    headline: 'Marketing Hub',
    subtitle: 'Campaign posts, scheduling, channels & analytics',
    icon: Megaphone,
    accentClass: 'text-[#C9A66B]',
    glowClass: 'from-[#C9A66B]/15 via-[#C9A66B]/5 to-transparent',
    borderClass: 'hover:border-[#C9A66B]/70',
  },
  finance: {
    label: 'Finance',
    headline: 'Finance & Billing',
    subtitle: 'Invoices, contracts, M-Pesa & Paystack settlements',
    icon: DollarSign,
    accentClass: 'text-sky-400',
    glowClass: 'from-sky-500/15 via-sky-500/5 to-transparent',
    borderClass: 'hover:border-sky-400/60',
  },
}

function buildOrgMeta(org: { id: string; slug: string; name: string }): OrganizationOption {
  const slug = String(org.slug || '').toLowerCase()
  if (slug === 'cillah-dev') {
    return {
      id: org.id,
      slug,
      name: org.name || 'cillah.dev',
      subtitle: 'Live Production Organization',
      badge: 'Live',
      badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35',
      glowClass: 'from-cyan-500/15 via-cyan-500/5 to-transparent',
      borderClass: 'hover:border-cyan-400/60',
      accentClass: 'text-cyan-400',
      icon: Cpu,
    }
  }
  if (slug === 'rosy-realtors' || slug === 'stage-properties') {
    return {
      id: org.id,
      slug: 'rosy-realtors',
      name: org.name || 'Rosy Realtors Nairobi',
      subtitle: 'Nairobi Real Estate Organization',
      badge: 'Demo',
      badgeClass: 'bg-[#C9A66B]/15 text-[#E5C687] border-[#C9A66B]/35',
      glowClass: 'from-[#C9A66B]/15 via-[#C9A66B]/5 to-transparent',
      borderClass: 'hover:border-[#C9A66B]/70',
      accentClass: 'text-[#C9A66B]',
      icon: Building2,
    }
  }
  if (slug === 'chetu-healthcare') {
    return {
      id: org.id,
      slug,
      name: org.name || 'Chetu Healthcare Clinic',
      subtitle: 'Healthcare Client Organization',
      badge: 'Client',
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
      glowClass: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
      borderClass: 'hover:border-emerald-400/60',
      accentClass: 'text-emerald-400',
      icon: Stethoscope,
    }
  }
  if (slug === 'dendri-africa') {
    return {
      id: org.id,
      slug,
      name: org.name || 'Dendri Africa',
      subtitle: 'Client Organization Workspace',
      badge: 'Client',
      badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/35',
      glowClass: 'from-purple-500/15 via-purple-500/5 to-transparent',
      borderClass: 'hover:border-purple-400/60',
      accentClass: 'text-purple-400',
      icon: Globe2,
    }
  }
  return {
    id: org.id,
    slug,
    name: org.name || slug,
    subtitle: 'Sales · Marketing · Finance',
    badge: 'Org',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/35',
    glowClass: 'from-sky-500/15 via-sky-500/5 to-transparent',
    borderClass: 'hover:border-sky-400/60',
    accentClass: 'text-sky-400',
    icon: Building2,
  }
}

function getDepartmentHref(orgSlug: string, dept: UserWorkspaceRole): string {
  if (orgSlug === 'cillah-dev') {
    if (dept === 'sales') return '/admin/dashboard'
    if (dept === 'marketing') return '/admin/marketing'
    return '/admin/finance'
  }
  return `/admin/organizations/${orgSlug}/${dept}`
}

function AdminWorkspaceLauncherInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState('Cillah Awuor')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([])
  const [selectedOrgSlug, setSelectedOrgSlug] = useState<string | null>(null)
  const [assignedDepartments, setAssignedDepartments] = useState<UserWorkspaceRole[]>([
    'sales',
    'marketing',
    'finance',
  ])

  useEffect(() => {
    let active = true

    async function loadLauncher() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      let user = session?.user ?? null
      if (!user) {
        const { data } = await supabase.auth.getUser()
        user = data.user
      }

      if (!user) {
        router.replace('/login')
        return
      }

      const email = (user.email || '').toLowerCase().trim()
      const superAdmin = isSuperAdminEmail(email)

      const [{ data: profile }, { data: staffRow }, { data: orgRows }] = await Promise.all([
        supabase.from('profiles').select('role, full_name').eq('id', user.id).maybeSingle(),
        supabase
          .from('staff_members')
          .select('full_name, role, status, org_id')
          .ilike('email', email)
          .maybeSingle(),
        supabase.from('organizations').select('id, slug, name').order('name', { ascending: true }),
      ])

      if (!active) return

      const adminCheck =
        superAdmin ||
        isAdminAccount(email, profile?.role) ||
        String(staffRow?.status || '').toLowerCase() === 'admin'

      if (!adminCheck) {
        router.replace('/user/dashboard')
        return
      }

      const fallbackOrgs = [
        { id: 'a1b2c3d4-e5f6-7890-abcd-222222222222', slug: 'cillah-dev', name: 'cillah.dev' },
        { id: 'a1b2c3d4-e5f6-7890-abcd-555555555555', slug: 'rosy-realtors', name: 'Rosy Realtors Nairobi' },
        { id: 'a1b2c3d4-e5f6-7890-abcd-333333333333', slug: 'chetu-healthcare', name: 'Chetu Healthcare Clinic' },
        { id: 'a1b2c3d4-e5f6-7890-abcd-444444444444', slug: 'dendri-africa', name: 'Dendri Africa' },
      ]

      const rawList = Array.isArray(orgRows) && orgRows.length > 0 ? orgRows : fallbackOrgs
      const mapped = rawList
        .filter((o: any) => String(o.slug || '').toLowerCase() !== 'stage-properties')
        .map(buildOrgMeta)

      // Sort cillah.dev first, Rosy Realtors second, then alphabetically
      const orderWeight = (slug: string) =>
        slug === 'cillah-dev' ? 0 : slug === 'rosy-realtors' ? 1 : 2
      mapped.sort((a, b) => {
        const diff = orderWeight(a.slug) - orderWeight(b.slug)
        return diff !== 0 ? diff : a.name.localeCompare(b.name)
      })

      const depts: UserWorkspaceRole[] = superAdmin
        ? ['sales', 'marketing', 'finance']
        : parseAssignedWorkspaces(staffRow?.role)

      const allowedOrgs = superAdmin
        ? mapped
        : mapped.filter((o) => o.id === staffRow?.org_id || (!staffRow?.org_id && o.slug === 'cillah-dev'))

      const finalOrgs = allowedOrgs.length > 0 ? allowedOrgs : mapped.slice(0, 1)

      setIsSuperAdmin(superAdmin)
      setDisplayName(
        superAdmin
          ? 'Cillah Awuor'
          : staffRow?.full_name || profile?.full_name || email.split('@')[0]
      )
      setOrganizations(finalOrgs)
      setAssignedDepartments(depts)

      const requestedOrg = searchParams.get('org')
      if (requestedOrg && finalOrgs.some((o) => o.slug === requestedOrg)) {
        setSelectedOrgSlug(requestedOrg)
      } else if (!superAdmin && finalOrgs.length === 1) {
        // Org Admins belong to one organization — jump straight to their assigned department blocks
        setSelectedOrgSlug(finalOrgs[0].slug)
      } else {
        setSelectedOrgSlug(null)
      }

      setLoading(false)
    }

    loadLauncher()
    return () => {
      active = false
    }
  }, [supabase, router, searchParams])

  const selectedOrg = organizations.find((o) => o.slug === selectedOrgSlug) || null

  const handleChooseOrg = (slug: string) => {
    setSelectedOrgSlug(slug)
    router.replace(`/admin?org=${encodeURIComponent(slug)}`, { scroll: false })
  }

  const handleBackToOrgs = () => {
    setSelectedOrgSlug(null)
    router.replace('/admin', { scroll: false })
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="flex items-center gap-2.5 text-[#C9A66B] text-sm font-medium">
          <Sparkles className="w-5 h-5 animate-spin" />
          <span>Opening workspace...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-14 relative overflow-hidden min-h-[calc(100vh-3.5rem)]">
      {/* Subtle warm champagne glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-[#C9A66B]/[0.07] blur-[120px] pointer-events-none" />

      <div className="w-full max-w-3xl mx-auto text-center space-y-8 relative z-10">
        {!selectedOrg ? (
          /* STEP 1: CEO / CHIEF DEVELOPER — CHOOSE ORGANIZATION IN CLEAN BLOCKS */
          <>
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C9A66B]">
                CEO &bull; Chief Developer
              </p>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Welcome, {displayName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Choose an organization to access
              </p>
            </div>

            <div
              className={`grid gap-3.5 sm:gap-4 ${
                organizations.length === 1
                  ? 'grid-cols-1 max-w-sm mx-auto'
                  : 'grid-cols-1 sm:grid-cols-2'
              }`}
            >
              {organizations.map((org) => {
                const Icon = org.icon
                return (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => handleChooseOrg(org.slug)}
                    className={`group relative overflow-hidden rounded-2xl bg-gradient-to-b ${org.glowClass} bg-[#0F1422] border border-white/10 ${org.borderClass} p-6 sm:p-7 text-left transition-all duration-150 active:scale-[0.98] hover:-translate-y-0.5 shadow-xl cursor-pointer`}
                  >
                    <div className="flex items-center justify-between mb-5">
                      <div className="h-11 w-11 rounded-xl bg-[#090B12]/90 border border-white/10 flex items-center justify-center shadow-inner">
                        <Icon className={`w-5 h-5 ${org.accentClass}`} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${org.badgeClass}`}
                        >
                          {org.badge}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-[#C9A66B] group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {org.name}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      {org.subtitle}
                    </p>
                  </button>
                )
              })}
            </div>

            {isSuperAdmin && (
              <div className="pt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
                <Link
                  href="/admin/organizations"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-slate-300 hover:text-white transition-colors"
                >
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  <span>Manage Organizations</span>
                </Link>
                <Link
                  href="/admin/sessions"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-slate-300 hover:text-white transition-colors"
                >
                  <Video className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sessions</span>
                </Link>
                <Link
                  href="/admin/clients"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-slate-300 hover:text-white transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#C9A66B]" />
                  <span>Retainers</span>
                </Link>
              </div>
            )}
          </>
        ) : (
          /* STEP 2: CHOOSE DEPARTMENT WITHIN THE SELECTED ORGANIZATION */
          <>
            <div className="space-y-3">
              {isSuperAdmin && organizations.length > 1 && (
                <div>
                  <button
                    type="button"
                    onClick={handleBackToOrgs}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-[#C9A66B]" />
                    <span>All Organizations</span>
                  </button>
                </div>
              )}

              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C9A66B]">
                {selectedOrg.name}
              </p>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Choose a Department
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Enter your focused workspace inside {selectedOrg.name}
              </p>
            </div>

            <div
              className={`grid gap-3.5 sm:gap-4 ${
                assignedDepartments.length === 1
                  ? 'grid-cols-1 max-w-sm mx-auto'
                  : assignedDepartments.length === 2
                  ? 'grid-cols-1 sm:grid-cols-2 max-w-xl mx-auto'
                  : 'grid-cols-1 sm:grid-cols-3'
              }`}
            >
              {assignedDepartments.map((dept) => {
                const meta = DEPARTMENT_META[dept]
                const Icon = meta.icon
                const href = getDepartmentHref(selectedOrg.slug, dept)
                const usersHref = `/admin/organizations/${selectedOrg.slug}/${dept}/users`
                return (
                  <div
                    key={dept}
                    className={`group relative overflow-hidden rounded-2xl bg-gradient-to-b ${meta.glowClass} bg-[#0F1422] border border-white/10 ${meta.borderClass} p-6 sm:p-7 text-left transition-all duration-150 hover:-translate-y-0.5 shadow-xl flex flex-col justify-between gap-5`}
                  >
                    <Link href={href} className="block focus:outline-none">
                      <div className="flex items-center justify-between mb-5">
                        <div className="h-11 w-11 rounded-xl bg-[#090B12]/90 border border-white/10 flex items-center justify-center shadow-inner">
                          <Icon className={`w-5 h-5 ${meta.accentClass}`} />
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-[#C9A66B] group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {meta.label}
                      </h2>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        {meta.subtitle}
                      </p>
                    </Link>

                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                      <Link
                        href={href}
                        className="text-[11px] font-bold text-[#E5C687] hover:underline"
                      >
                        Open {meta.label}
                      </Link>
                      <Link
                        href={usersHref}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-cyan-300 transition-colors"
                      >
                        <Users className="w-3 h-3" /> Users
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="pt-2 flex justify-center">
              <Link
                href={`/admin/organizations/${encodeURIComponent(selectedOrg.slug)}/settings`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-[#C9A66B]/40 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-[#C9A66B]" />
                <span>Organization Settings, Plan &amp; Data Controls</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function AdminWorkspaceLauncherPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="flex items-center gap-2.5 text-[#C9A66B] text-sm font-medium">
            <Sparkles className="w-5 h-5 animate-spin" />
            <span>Opening workspace...</span>
          </div>
        </div>
      }
    >
      <AdminWorkspaceLauncherInner />
    </Suspense>
  )
}
