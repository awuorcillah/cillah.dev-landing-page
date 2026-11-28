'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  isAdminAccount,
  isSuperAdminEmail as checkSuperAdminEmail,
  parseAssignedWorkspaces,
  type UserWorkspaceRole,
} from '@/lib/auth-roles'
import {
  ChevronDown,
  Users,
  User,
  UserCheck,
  Layers,
  TrendingUp,
  Building2,
  Megaphone,
  DollarSign,
  Video,
  Home,
  LogOut,
  Check,
  ArrowLeft,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'

const SUPER_ADMIN_EMAILS = ['awuorcillah@gmail.com']
const CILLAH_ORG_ID = 'a1b2c3d4-e5f6-7890-abcd-222222222222'
const ROSY_ORG_ID = 'a1b2c3d4-e5f6-7890-abcd-555555555555'

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false
  return SUPER_ADMIN_EMAILS.map((e) => e.toLowerCase().trim()).includes(email.toLowerCase().trim())
}

const DEPARTMENT_META: Record<
  UserWorkspaceRole,
  {
    label: string
    subtitle: string
    icon: typeof TrendingUp
    accentClass: string
  }
> = {
  sales: {
    label: 'Sales',
    subtitle: 'Pipeline, leads & follow-ups',
    icon: TrendingUp,
    accentClass: 'text-emerald-400',
  },
  marketing: {
    label: 'Marketing',
    subtitle: 'Posts, channels & analytics',
    icon: Megaphone,
    accentClass: 'text-[#C9A66B]',
  },
  finance: {
    label: 'Finance',
    subtitle: 'Invoices, M-Pesa & Paystack',
    icon: DollarSign,
    accentClass: 'text-sky-400',
  },
}

interface AdminProfileState {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  isSuperAdmin: boolean
  orgId: string
  orgSlug: string
  orgName: string
  departments: UserWorkspaceRole[]
}

function resolveRouteContext(
  pathname: string,
  allOrgs: Array<{ slug: string; name: string }>
): { orgSlug: string; orgName: string; department: UserWorkspaceRole | null; isUsersPage: boolean } {
  const isUsersPage = pathname.endsWith('/users')
  const orgMatch = pathname.match(/^\/admin\/organizations\/([^/]+)/)
  let orgSlug = orgMatch ? orgMatch[1] : 'cillah-dev'
  if (orgSlug === 'stage-properties') orgSlug = 'rosy-realtors'

  const matchedOrg = allOrgs.find((o) => o.slug === orgSlug)
  const fallbackName =
    orgSlug === 'cillah-dev'
      ? 'cillah.dev'
      : orgSlug === 'rosy-realtors'
      ? 'Rosy Realtors Nairobi'
      : orgSlug === 'chetu-healthcare'
      ? 'Chetu Healthcare Clinic'
      : orgSlug === 'dendri-africa'
      ? 'Dendri Africa'
      : orgSlug

  let department: UserWorkspaceRole | null = null
  if (
    pathname.startsWith('/admin/dashboard') ||
    pathname.startsWith('/admin/pipeline') ||
    pathname.includes('/sales')
  ) {
    department = 'sales'
  } else if (pathname.startsWith('/admin/marketing') || pathname.includes('/marketing')) {
    department = 'marketing'
  } else if (pathname.startsWith('/admin/finance') || pathname.includes('/finance')) {
    department = 'finance'
  }

  return {
    orgSlug,
    orgName: matchedOrg?.name || fallbackName,
    department,
    isUsersPage,
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [adminProfile, setAdminProfile] = useState<AdminProfileState | null>(null)
  const [allOrgs, setAllOrgs] = useState<Array<{ id: string; name: string; slug: string }>>([])
  const [deptMenuOpen, setDeptMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const deptMenuRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase
      .from('organizations')
      .select('id, name, slug')
      .order('name', { ascending: true })
      .then(({ data }) => {
        if (!data) return
        setAllOrgs(
          data.filter((o: any) => String(o.slug || '').toLowerCase() !== 'stage-properties')
        )
      })
  }, [supabase, pathname])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
      if (deptMenuRef.current && !deptMenuRef.current.contains(e.target as Node)) setDeptMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    setDeptMenuOpen(false)
    setProfileOpen(false)
  }, [pathname])

  // Load authenticated user + strict organization & department scope
  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const email = (user.email || '').toLowerCase().trim()
      const isSuper = checkSuperAdminEmail(email)

      const [{ data: profile }, { data: staffRow }] = await Promise.all([
        supabase.from('profiles').select('role, full_name, avatar_url').eq('id', user.id).maybeSingle(),
        supabase
          .from('staff_members')
          .select('full_name, role, status, org_id')
          .ilike('email', email)
          .maybeSingle(),
      ])

      const isAdmin =
        isSuper ||
        isAdminAccount(email, profile?.role) ||
        String(staffRow?.status || '').toLowerCase() === 'admin'

      if (!isAdmin) {
        router.replace('/user/dashboard')
        return
      }

      let orgId = staffRow?.org_id || CILLAH_ORG_ID
      let orgSlug = orgId === ROSY_ORG_ID ? 'rosy-realtors' : 'cillah-dev'
      let orgName = orgId === ROSY_ORG_ID ? 'Rosy Realtors Nairobi' : 'cillah.dev'

      if (staffRow?.org_id) {
        const { data: orgRow } = await supabase
          .from('organizations')
          .select('id, slug, name')
          .eq('id', staffRow.org_id)
          .maybeSingle()
        if (orgRow?.slug) {
          orgId = orgRow.id
          orgSlug = orgRow.slug
          orgName = orgRow.name || orgRow.slug
        }
      }

      const departments: UserWorkspaceRole[] = isSuper
        ? ['sales', 'marketing', 'finance']
        : parseAssignedWorkspaces(staffRow?.role)

      setAdminProfile({
        id: user.id,
        email,
        full_name: isSuper
          ? 'Cillah Awuor (CEO)'
          : staffRow?.full_name || profile?.full_name || email.split('@')[0] || 'Admin',
        avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || null,
        isSuperAdmin: isSuper,
        orgId,
        orgSlug,
        orgName,
        departments,
      })
    }

    load()
  }, [router, supabase])

  // STRICT MULTI-TENANT ROUTE GUARD:
  // Org Admins can ONLY access their own organization and their assigned departments!
  useEffect(() => {
    if (!adminProfile || adminProfile.isSuperAdmin) return
    if (pathname === '/admin') return

    const { orgSlug, departments } = adminProfile
    const fallbackHome = `/admin?org=${encodeURIComponent(orgSlug)}`

    // 1. Block Super-Admin-only global pages
    if (
      pathname === '/admin/organizations' ||
      pathname.startsWith('/admin/sessions') ||
      pathname.startsWith('/admin/clients')
    ) {
      toast.error('Access restricted to your organization only.')
      router.replace(fallbackHome)
      return
    }

    // 2. If Org Admin belongs to a client org (e.g. rosy-realtors), block cillah.dev & other client orgs
    if (orgSlug !== 'cillah-dev') {
      const allowedPrefix = `/admin/organizations/${orgSlug}`
      if (!pathname.startsWith(allowedPrefix)) {
        toast.error(`Access restricted to ${adminProfile.orgName} only.`)
        router.replace(fallbackHome)
        return
      }
      if (pathname.includes('/sales') && !departments.includes('sales')) {
        toast.error('No Sales Department access assigned.')
        router.replace(fallbackHome)
        return
      }
      if (pathname.includes('/marketing') && !departments.includes('marketing')) {
        toast.error('No Marketing Department access assigned.')
        router.replace(fallbackHome)
        return
      }
      if (pathname.includes('/finance') && !departments.includes('finance')) {
        toast.error('No Finance Department access assigned.')
        router.replace(fallbackHome)
        return
      }
    } else {
      if (
        pathname.startsWith('/admin/organizations/') &&
        !pathname.startsWith('/admin/organizations/cillah-dev')
      ) {
        toast.error('Access restricted to cillah.dev only.')
        router.replace(fallbackHome)
        return
      }
      if (
        (pathname.startsWith('/admin/dashboard') ||
          pathname.startsWith('/admin/pipeline') ||
          pathname.includes('/cillah-dev/sales')) &&
        !departments.includes('sales')
      ) {
        toast.error('No Sales Department access assigned.')
        router.replace(fallbackHome)
        return
      }
      if (
        (pathname.startsWith('/admin/marketing') || pathname.includes('/cillah-dev/marketing')) &&
        !departments.includes('marketing')
      ) {
        toast.error('No Marketing Department access assigned.')
        router.replace(fallbackHome)
        return
      }
      if (
        (pathname.startsWith('/admin/finance') || pathname.includes('/cillah-dev/finance')) &&
        !departments.includes('finance')
      ) {
        toast.error('No Finance Department access assigned.')
        router.replace(fallbackHome)
        return
      }
    }
  }, [pathname, adminProfile, router])

  const handleLogout = async () => {
    setProfileOpen(false)
    try {
      await Promise.race([
        supabase.auth.signOut({ scope: 'local' }),
        new Promise((resolve) => setTimeout(resolve, 1200)),
      ])
    } catch {
      // Proceed even if network signOut fails
    } finally {
      window.location.replace('/')
    }
  }

  const isSuperAdmin = adminProfile?.isSuperAdmin === true
  const isLauncherHome = pathname === '/admin'
  const routeCtx = resolveRouteContext(pathname, allOrgs)
  const activeDeptMeta = routeCtx.department ? DEPARTMENT_META[routeCtx.department] : null
  const ActiveDeptIcon = activeDeptMeta?.icon
  const allowedDepts = adminProfile?.departments || ['sales', 'marketing', 'finance']

  return (
    <div className="min-h-screen bg-[#090B12] text-slate-100 flex flex-col selection:bg-[#C9A66B]/30">
      {/* CLEAN LUXURY TOP BAR (Matches Atulah /user/dashboard — zero cluttered multi-org sidebar!) */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#090B12]/90 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-3.5 sm:px-6 h-14 flex items-center justify-between gap-3">
          {/* Left: Organization & Active Department Switcher */}
          <div className="flex items-center gap-2 min-w-0">
            {isLauncherHome ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-[#C9A66B]/30 text-[11px] font-bold text-[#E5C687] truncate">
                <Building2 className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  {isSuperAdmin ? 'CEO / Chief Developer' : adminProfile?.orgName || 'Workspace'}
                </span>
              </span>
            ) : (
              <>
                {/* Organization Pill (Click to return to Organizations / Departments chooser) */}
                <Link
                  href={isSuperAdmin ? '/admin' : `/admin?org=${encodeURIComponent(routeCtx.orgSlug)}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-[#C9A66B]/30 text-[11px] font-bold text-[#E5C687] transition-colors truncate max-w-[165px] sm:max-w-[220px]"
                  title={isSuperAdmin ? 'Switch Organization' : 'Back to Departments'}
                >
                  <ArrowLeft className="w-3 h-3 shrink-0" />
                  <Building2 className="w-3 h-3 shrink-0 hidden sm:inline" />
                  <span className="truncate">{routeCtx.orgName}</span>
                </Link>

                {/* Active Department Dropdown (Scoped strictly to the chosen organization) */}
                {routeCtx.department && activeDeptMeta ? (
                  <div className="relative" ref={deptMenuRef}>
                    <button
                      type="button"
                      onClick={() => setDeptMenuOpen((o) => !o)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 hover:border-[#C9A66B]/50 text-xs font-bold text-white transition-all cursor-pointer"
                    >
                      {ActiveDeptIcon && (
                        <ActiveDeptIcon className={`w-3.5 h-3.5 ${activeDeptMeta.accentClass}`} />
                      )}
                      <span>
                        {activeDeptMeta.label}
                        {routeCtx.isUsersPage ? ' · Users' : ''}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-[#C9A66B] transition-transform ${
                          deptMenuOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {deptMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40 bg-black/40 sm:hidden"
                          onClick={() => setDeptMenuOpen(false)}
                        />
                        <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:left-0 sm:top-11 sm:w-64 rounded-2xl bg-[#0E131F] border border-[#C9A66B]/35 shadow-2xl overflow-hidden divide-y divide-white/[0.06] z-50">
                          <div className="px-3.5 py-2.5 bg-white/[0.02] flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A66B] truncate">
                              {routeCtx.orgName}
                            </span>
                            <Link
                              href={`/admin?org=${encodeURIComponent(routeCtx.orgSlug)}`}
                              className="text-[11px] font-semibold text-slate-300 hover:text-white inline-flex items-center gap-1 shrink-0"
                            >
                              <Home className="w-3 h-3" /> Departments
                            </Link>
                          </div>

                          <div className="p-1.5 space-y-1">
                            {allowedDepts.map((dept) => {
                              const meta = DEPARTMENT_META[dept]
                              const Icon = meta.icon
                              const isSelected = dept === routeCtx.department && !routeCtx.isUsersPage
                              return (
                                <Link
                                  key={dept}
                                  href={getDepartmentHref(routeCtx.orgSlug, dept)}
                                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                                    isSelected
                                      ? 'bg-[#C9A66B]/15 border border-[#C9A66B]/40'
                                      : 'hover:bg-white/[0.05] border border-transparent'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <Icon className={`w-4 h-4 ${meta.accentClass} shrink-0`} />
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-white">{meta.label}</p>
                                      <p className="text-[10px] text-slate-400 truncate">
                                        {meta.subtitle}
                                      </p>
                                    </div>
                                  </div>
                                  {isSelected && <Check className="w-4 h-4 text-[#C9A66B] shrink-0" />}
                                </Link>
                              )
                            })}
                          </div>

                          <div className="p-1.5 space-y-0.5 text-xs">
                            <Link
                              href={`/admin/organizations/${routeCtx.orgSlug}/${routeCtx.department}/users`}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold text-cyan-300 hover:bg-white/[0.05] transition-colors"
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>Manage {activeDeptMeta.label} Users</span>
                            </Link>
                            {isSuperAdmin && (
                              <Link
                                href="/admin"
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold text-[#E5C687] hover:bg-white/[0.05] transition-colors"
                              >
                                <Building2 className="w-3.5 h-3.5" />
                                <span>Switch Organization</span>
                              </Link>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-bold text-white transition-colors"
                  >
                    <Home className="w-3.5 h-3.5 text-[#C9A66B]" />
                    <span>All Organizations</span>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Far Right: Profile Avatar Dropdown (Identical clean luxury feel to Atulah's dashboard) */}
          <div className="relative shrink-0" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((p) => !p)}
              aria-label="Open profile menu"
              className="flex items-center gap-2 p-0.5 pr-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-[#C9A66B]/40 hover:border-[#C9A66B] transition-all cursor-pointer shadow-sm"
            >
              <div className="h-9 w-9 rounded-full overflow-hidden bg-gradient-to-br from-[#1B1F2E] to-[#0E131F] flex items-center justify-center border border-[#C9A66B]/30 shrink-0">
                {adminProfile?.avatar_url ? (
                  <img
                    src={adminProfile.avatar_url}
                    alt={adminProfile.full_name || 'Profile'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-[#C9A66B]" />
                )}
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  profileOpen ? 'rotate-180 text-[#C9A66B]' : ''
                }`}
              />
            </button>

            {profileOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/35 sm:hidden"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 top-12 w-60 rounded-2xl bg-[#0E131F] border border-white/10 shadow-2xl overflow-hidden divide-y divide-white/[0.06] z-50">
                  <div className="px-4 py-3 bg-white/[0.02]">
                    <p className="text-xs font-bold text-white truncate">
                      {adminProfile?.full_name || 'Admin'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {adminProfile?.email}
                    </p>
                    <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full bg-[#C9A66B]/15 border border-[#C9A66B]/35 text-[10px] font-bold text-[#E5C687]">
                      {isSuperAdmin
                        ? 'Access: CEO / Chief Developer'
                        : routeCtx.department === 'marketing'
                        ? 'Access: Marketing Admin'
                        : routeCtx.department === 'finance'
                        ? 'Access: Finance Admin'
                        : 'Access: Org Admin'}
                    </span>
                  </div>

                  <div className="p-1.5 space-y-0.5 text-xs">
                    <Link
                      href="/admin"
                      onClick={() => setProfileOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold text-slate-200 hover:bg-white/[0.05] transition-colors"
                    >
                      <Building2 className="w-4 h-4 text-[#C9A66B]" />
                      <span>{isSuperAdmin ? 'Switch Organization' : 'All Departments'}</span>
                    </Link>

                    <Link
                      href={`/admin/organizations/${encodeURIComponent(
                        isSuperAdmin ? routeCtx.orgSlug : adminProfile?.orgSlug || 'cillah-dev'
                      )}/settings`}
                      onClick={() => setProfileOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold text-slate-200 hover:bg-white/[0.05] transition-colors"
                    >
                      <Settings className="w-4 h-4 text-[#C9A66B]" />
                      <span>Organization Settings</span>
                    </Link>

                    <Link
                      href="/user/profile"
                      onClick={() => setProfileOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold text-slate-200 hover:bg-white/[0.05] transition-colors"
                    >
                      <User className="w-4 h-4 text-sky-400" />
                      <span>Profile</span>
                    </Link>

                    {isSuperAdmin && (
                      <>
                        <Link
                          href="/admin/organizations"
                          onClick={() => setProfileOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold text-slate-300 hover:bg-white/[0.05] transition-colors"
                        >
                          <Layers className="w-4 h-4 text-sky-400" />
                          <span>Manage Organizations</span>
                        </Link>
                        <Link
                          href="/admin/sessions"
                          onClick={() => setProfileOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold text-slate-300 hover:bg-white/[0.05] transition-colors"
                        >
                          <Video className="w-4 h-4 text-cyan-400" />
                          <span>Sessions</span>
                        </Link>
                        <Link
                          href="/admin/clients"
                          onClick={() => setProfileOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold text-slate-300 hover:bg-white/[0.05] transition-colors"
                        >
                          <UserCheck className="w-4 h-4 text-amber-400" />
                          <span>Monthly Retainers</span>
                        </Link>
                      </>
                    )}
                  </div>

                  <div className="p-1.5 text-xs">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* FULL-WIDTH FOCUSED CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden bg-[#090B12]">
        {children}
      </main>
    </div>
  )
}
