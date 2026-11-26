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
  LayoutDashboard,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Users,
  UserCheck,
  Menu,
  X,
  Layers,
  TrendingUp,
  Building2,
  Megaphone,
  BarChart3,
  DollarSign,
  Stethoscope,
  Globe2,
  HeartPulse,
  Briefcase,
  Cpu,
  Video,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'

const SUPER_ADMIN_EMAILS = ['awuorcillah@gmail.com']
const CILLAH_ORG_ID = 'a1b2c3d4-e5f6-7890-abcd-222222222222'
const ROSY_ORG_ID = 'a1b2c3d4-e5f6-7890-abcd-555555555555'

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false
  return SUPER_ADMIN_EMAILS.map((e) => e.toLowerCase().trim()).includes(email.toLowerCase().trim())
}

const PATH_LABELS: Record<string, string> = {
  admin: 'Admin',
  dashboard: 'Sales Dashboard',
  pipeline: 'Sales CRM Pipeline',
  appointments: 'Upcoming Appointments',
  marketing: 'Marketing Department',
  finance: 'Finance Department',
  sessions: 'Sessions',
  organizations: 'Organizations',
  sales: 'Sales Department',
  users: 'Users & Access',
  'cillah-dev': 'cillah.dev',
  'rosy-realtors': 'Rosy Realtors Nairobi',
  'stage-properties': 'Rosy Realtors Nairobi',
}

function getBreadcrumbs(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  const crumbs: { label: string; href: string }[] = []
  let path = ''
  for (const part of parts) {
    path += '/' + part
    if (PATH_LABELS[part]) crumbs.push({ label: PATH_LABELS[part], href: path })
  }
  return crumbs
}

function navCls(active: boolean, sub = false) {
  const base = `flex items-center gap-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-150 border-l-2 ${
    sub ? 'py-1.5 text-xs' : 'py-2 text-xs'
  }`
  return active
    ? `${base} bg-[#C9A66B]/15 text-[#C9A66B] border-[#C9A66B]`
    : `${base} text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border-transparent`
}

interface AdminProfileState {
  id: string
  email: string
  full_name: string
  isSuperAdmin: boolean
  orgId: string
  orgSlug: string
  orgName: string
  departments: UserWorkspaceRole[]
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Collapsible Organization Dropdowns (open/close departments per org)
  const [cillahOrgOpen, setCillahOrgOpen] = useState(true)
  const [rosyOrgOpen, setRosyOrgOpen] = useState(true)
  const [chetuOrgOpen, setChetuOrgOpen] = useState(false)
  const [dendriOrgOpen, setDendriOrgOpen] = useState(false)

  // Department dropdowns inside cillah.dev
  const [cillahSalesOpen, setCillahSalesOpen] = useState(true)
  const [cillahMarketingOpen, setCillahMarketingOpen] = useState(false)
  const [cillahFinanceOpen, setCillahFinanceOpen] = useState(false)

  // Department dropdowns inside Rosy Realtors Nairobi
  const [rosySalesOpen, setRosySalesOpen] = useState(true)
  const [rosyMarketingOpen, setRosyMarketingOpen] = useState(false)
  const [rosyFinanceOpen, setRosyFinanceOpen] = useState(false)

  const [orgSwitcherOpen, setOrgSwitcherOpen] = useState(false)
  const [adminProfile, setAdminProfile] = useState<AdminProfileState | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [extraOrgs, setExtraOrgs] = useState<Array<{ id: string; name: string; slug: string }>>([])
  const [openExtraOrgs, setOpenExtraOrgs] = useState<Record<string, boolean>>({})

  useEffect(() => {
    supabase
      .from('organizations')
      .select('id, name, slug')
      .order('name', { ascending: true })
      .then(({ data }) => {
        if (!data) return
        const builtins = new Set(['cillah-dev', 'rosy-realtors', 'stage-properties', 'chetu-healthcare', 'dendri-africa'])
        setExtraOrgs(data.filter((o: any) => !builtins.has(String(o.slug || '').toLowerCase())))
      })
  }, [supabase, pathname])

  const profileRef = useRef<HTMLDivElement>(null)
  const orgSwitcherRef = useRef<HTMLDivElement>(null)
  const breadcrumbs = getBreadcrumbs(pathname)

  useEffect(() => {
    const saved = localStorage.getItem('admin_sidebar_open')
    if (saved !== null) setSidebarOpen(saved === 'true')
  }, [])

  // Auto-expand active organization & department based on current URL
  useEffect(() => {
    if (pathname.includes('/rosy-realtors')) {
      setRosyOrgOpen(true)
      if (pathname.includes('/rosy-realtors/marketing')) setRosyMarketingOpen(true)
      if (pathname.includes('/rosy-realtors/finance')) setRosyFinanceOpen(true)
      if (pathname.includes('/rosy-realtors/sales')) setRosySalesOpen(true)
    } else if (pathname.includes('/chetu-healthcare')) {
      setChetuOrgOpen(true)
    } else if (pathname.includes('/dendri-africa')) {
      setDendriOrgOpen(true)
    } else {
      setCillahOrgOpen(true)
      if (pathname.includes('/cillah-dev/marketing') || pathname.startsWith('/admin/marketing')) {
        setCillahMarketingOpen(true)
      }
      if (pathname.includes('/cillah-dev/finance') || pathname.startsWith('/admin/finance')) {
        setCillahFinanceOpen(true)
      }
    }
  }, [pathname])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
      if (orgSwitcherRef.current && !orgSwitcherRef.current.contains(e.target as Node)) setOrgSwitcherOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

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
        supabase.from('profiles').select('role, full_name').eq('id', user.id).maybeSingle(),
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

    const { orgSlug, departments } = adminProfile
    const fallbackHome =
      orgSlug === 'cillah-dev'
        ? departments.includes('sales')
          ? '/admin/dashboard'
          : departments.includes('marketing')
          ? '/admin/marketing'
          : '/admin/finance'
        : `/admin/organizations/${orgSlug}/${departments[0] || 'sales'}`

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
      // Enforce department-level access within their own org
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
      // Org Admin belongs to cillah-dev — block other client organizations
      if (
        pathname.startsWith('/admin/organizations/') &&
        !pathname.startsWith('/admin/organizations/cillah-dev')
      ) {
        toast.error('Access restricted to cillah.dev only.')
        router.replace(fallbackHome)
        return
      }
      // Enforce department-level access within cillah.dev
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

  const toggleSidebar = () => {
    const next = !sidebarOpen
    setSidebarOpen(next)
    localStorage.setItem('admin_sidebar_open', String(next))
  }

  const handleLogout = async () => {
    try {
      await Promise.race([
        supabase.auth.signOut({ scope: 'local' }),
        new Promise((resolve) => setTimeout(resolve, 1200)),
      ])
    } catch {
      // Proceed even if network signOut fails
    } finally {
      window.location.replace('/login')
    }
  }

  const isExact = (href: string) => pathname === href
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const isSuperAdmin = adminProfile?.isSuperAdmin === true
  const canSeeCillah = isSuperAdmin || adminProfile?.orgSlug === 'cillah-dev'
  const canSeeRosy = isSuperAdmin || adminProfile?.orgSlug === 'rosy-realtors'
  const canSeeChetu = isSuperAdmin || adminProfile?.orgSlug === 'chetu-healthcare'
  const canSeeDendri = isSuperAdmin || adminProfile?.orgSlug === 'dendri-africa'

  const hasDept = (dept: UserWorkspaceRole) =>
    isSuperAdmin || (adminProfile?.departments || []).includes(dept)

  function SidebarContent({ mobile = false }: { mobile?: boolean }) {
    const expanded = sidebarOpen || mobile

    return (
      <div
        className={`flex flex-col h-full bg-slate-900 border-r border-slate-800 transition-all duration-300 ${
          expanded ? 'w-64' : 'w-14'
        } overflow-hidden`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-4 border-b border-slate-800 flex-shrink-0">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-[#C9A66B]/40 flex-shrink-0">
            <img src="/images/cillah-emblem.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          {expanded && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-100 leading-none truncate">
                {isSuperAdmin ? 'cillah.dev' : adminProfile?.orgName || 'Organization'}
              </p>
              <p className="text-[10px] text-[#C9A66B] mt-0.5 font-semibold truncate">
                {isSuperAdmin ? 'CEO / Platform Owner' : 'Organization Admin'}
              </p>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-2 py-3 space-y-3 overflow-y-auto">
          {/* ============================================================== */}
          {/* ORGANIZATION: cillah.dev (Collapsible Org Dropdown)            */}
          {/* ============================================================== */}
          {canSeeCillah && (
            <div className="space-y-2">
              {expanded ? (
                <div className="px-1 space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setCillahOrgOpen((p) => !p)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800/70 transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-extrabold text-white tracking-wide flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                      cillah.dev
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 font-bold uppercase">
                        Live
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                          cillahOrgOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {cillahOrgOpen && (
                    <div className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#C9A66B]/20 via-[#C9A66B]/10 to-transparent border border-[#C9A66B]/35 flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3 text-[#C9A66B] shrink-0" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#C9A66B]">
                        Departments, Users &amp; Access
                      </span>
                    </div>
                  )}
                </div>
              ) : null}

              {(cillahOrgOpen || !expanded) && (
                <div className={expanded ? 'ml-2 pl-2 border-l border-cyan-500/35 space-y-1' : 'space-y-1'}>
                  {/* 1. Sales Department */}
                  {hasDept('sales') && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setCillahSalesOpen((p) => !p)}
                        className={`w-full ${navCls(false, true)} ${
                          pathname === '/admin/dashboard' || pathname.includes('/cillah-dev/sales')
                            ? 'text-slate-100'
                            : ''
                        } cursor-pointer`}
                      >
                        <BarChart3 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
                        {expanded && (
                          <>
                            <span className="flex-1 text-left font-semibold text-emerald-400">
                              Sales Department
                            </span>
                            <ChevronDown
                              className={`w-3 h-3 transition-transform ${cillahSalesOpen ? 'rotate-180' : ''}`}
                            />
                          </>
                        )}
                      </button>

                      {cillahSalesOpen && expanded && (
                        <div className="ml-3 mt-0.5 pl-2.5 border-l border-emerald-500/30 space-y-0.5">
                          <Link
                            href="/admin/dashboard"
                            className={navCls(isExact('/admin/dashboard') || isExact('/admin/pipeline'), true)}
                          >
                            <LayoutDashboard className="w-3 h-3 flex-shrink-0 text-[#C9A66B]" />
                            <span>Dashboard</span>
                          </Link>
                          <Link
                            href="/admin/organizations/cillah-dev/sales/users"
                            className={navCls(isActive('/admin/organizations/cillah-dev/sales/users'), true)}
                          >
                            <Users className="w-3 h-3 flex-shrink-0 text-cyan-400" />
                            <span>Users</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. Marketing Department */}
                  {hasDept('marketing') && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setCillahMarketingOpen((p) => !p)}
                        className={`w-full ${navCls(false, true)} ${
                          pathname.startsWith('/admin/marketing') || pathname.includes('/cillah-dev/marketing')
                            ? 'text-slate-100'
                            : ''
                        } cursor-pointer`}
                      >
                        <Megaphone className="w-3.5 h-3.5 flex-shrink-0 text-purple-400" />
                        {expanded && (
                          <>
                            <span className="flex-1 text-left font-semibold text-purple-300">
                              Marketing Department
                            </span>
                            <ChevronDown
                              className={`w-3 h-3 transition-transform ${cillahMarketingOpen ? 'rotate-180' : ''}`}
                            />
                          </>
                        )}
                      </button>

                      {cillahMarketingOpen && expanded && (
                        <div className="ml-3 mt-0.5 pl-2.5 border-l border-purple-500/30 space-y-0.5">
                          <Link href="/admin/marketing" className={navCls(isExact('/admin/marketing'), true)}>
                            <LayoutDashboard className="w-3 h-3 flex-shrink-0 text-purple-400" />
                            <span>Dashboard</span>
                          </Link>
                          <Link
                            href="/admin/organizations/cillah-dev/marketing/users"
                            className={navCls(isActive('/admin/organizations/cillah-dev/marketing/users'), true)}
                          >
                            <Users className="w-3 h-3 flex-shrink-0 text-cyan-400" />
                            <span>Users</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. Finance Department */}
                  {hasDept('finance') && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setCillahFinanceOpen((p) => !p)}
                        className={`w-full ${navCls(false, true)} ${
                          pathname.startsWith('/admin/finance') || pathname.includes('/cillah-dev/finance')
                            ? 'text-slate-100'
                            : ''
                        } cursor-pointer`}
                      >
                        <DollarSign className="w-3.5 h-3.5 flex-shrink-0 text-sky-400" />
                        {expanded && (
                          <>
                            <span className="flex-1 text-left font-semibold text-sky-300">
                              Finance Department
                            </span>
                            <ChevronDown
                              className={`w-3 h-3 transition-transform ${cillahFinanceOpen ? 'rotate-180' : ''}`}
                            />
                          </>
                        )}
                      </button>

                      {cillahFinanceOpen && expanded && (
                        <div className="ml-3 mt-0.5 pl-2.5 border-l border-sky-500/30 space-y-0.5">
                          <Link href="/admin/finance" className={navCls(isExact('/admin/finance'), true)}>
                            <LayoutDashboard className="w-3 h-3 flex-shrink-0 text-sky-400" />
                            <span>Dashboard</span>
                          </Link>
                          <Link
                            href="/admin/organizations/cillah-dev/finance/users"
                            className={navCls(isActive('/admin/organizations/cillah-dev/finance/users'), true)}
                          >
                            <Users className="w-3 h-3 flex-shrink-0 text-cyan-400" />
                            <span>Users</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Super Admin internal tools */}
                  {isSuperAdmin && (
                    <>
                      <Link
                        href="/admin/organizations/cillah-dev/teams"
                        className={navCls(isActive('/admin/organizations/cillah-dev/teams'), true)}
                      >
                        <Users className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                        {expanded && <span>All Teams &amp; Roles</span>}
                      </Link>
                      <Link href="/admin/sessions" className={navCls(isActive('/admin/sessions'), true)}>
                        <Video className="w-3.5 h-3.5 flex-shrink-0 text-sky-400" />
                        {expanded && <span>Sessions</span>}
                      </Link>
                      <Link href="/admin/clients" className={navCls(isActive('/admin/clients'), true)}>
                        <UserCheck className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                        {expanded && <span>Monthly Retainers</span>}
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* CLIENT ORGANIZATIONS (Super Admin sees all; Org Admin sees OWN) */}
          {/* ============================================================== */}
          {(isSuperAdmin || canSeeRosy || canSeeChetu || canSeeDendri) && (
            <div className={`space-y-2.5 ${canSeeCillah ? 'pt-3 border-t border-slate-800/80' : ''}`}>
              {isSuperAdmin && (
                <div className="px-2 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#C9A66B]" />
                    {expanded && <span>Client Organizations</span>}
                  </div>
                  {expanded && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300">
                      Multi-Tenant
                    </span>
                  )}
                </div>
              )}

              {/* CLIENT 1: ROSY REALTORS NAIROBI (Collapsible Org Dropdown) */}
              {canSeeRosy && (
                <div className="space-y-1">
                  {expanded && (
                    <button
                      type="button"
                      onClick={() => setRosyOrgOpen((p) => !p)}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800/70 transition-colors cursor-pointer"
                    >
                      <span className="text-[11px] font-extrabold text-[#C9A66B] uppercase tracking-wider truncate">
                        Rosy Realtors Nairobi
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#C9A66B]/15 text-[#C9A66B] font-bold uppercase">
                          Demo
                        </span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-[#C9A66B]/80 transition-transform ${
                            rosyOrgOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </button>
                  )}

                  {!isSuperAdmin && expanded && rosyOrgOpen && (
                    <div className="mx-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#C9A66B]/20 via-[#C9A66B]/10 to-transparent border border-[#C9A66B]/35 flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3 text-[#C9A66B] shrink-0" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#C9A66B]">
                        Departments, Users &amp; Access
                      </span>
                    </div>
                  )}

                  {(rosyOrgOpen || !expanded) && (
                    <div className={expanded ? 'ml-2 pl-2 border-l border-[#C9A66B]/50 space-y-1' : 'space-y-1'}>
                      {hasDept('sales') && (
                        <div>
                          <button
                            type="button"
                            onClick={() => setRosySalesOpen((p) => !p)}
                            className={`w-full ${navCls(false, true)} ${
                              pathname.includes('/rosy-realtors/sales') ? 'text-slate-100' : ''
                            } cursor-pointer`}
                          >
                            <BarChart3 className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                            {expanded && (
                              <>
                                <span className="flex-1 text-left font-semibold text-amber-400">
                                  Sales Department
                                </span>
                                <ChevronDown
                                  className={`w-3 h-3 transition-transform ${rosySalesOpen ? 'rotate-180' : ''}`}
                                />
                              </>
                            )}
                          </button>

                          {rosySalesOpen && expanded && (
                            <div className="ml-3 mt-0.5 pl-2.5 border-l border-amber-500/30 space-y-0.5">
                              <Link
                                href="/admin/organizations/rosy-realtors/sales"
                                className={navCls(isExact('/admin/organizations/rosy-realtors/sales'), true)}
                              >
                                <TrendingUp className="w-3 h-3 flex-shrink-0 text-[#C9A66B]" />
                                <span>Executive &amp; Pipeline</span>
                              </Link>
                              <Link
                                href="/admin/organizations/rosy-realtors/sales/users"
                                className={navCls(isActive('/admin/organizations/rosy-realtors/sales/users'), true)}
                              >
                                <Users className="w-3 h-3 flex-shrink-0 text-cyan-400" />
                                <span>Users</span>
                              </Link>
                            </div>
                          )}
                        </div>
                      )}

                      {hasDept('marketing') && (
                        <div>
                          <button
                            type="button"
                            onClick={() => setRosyMarketingOpen((p) => !p)}
                            className={`w-full ${navCls(false, true)} ${
                              pathname.includes('/rosy-realtors/marketing') ? 'text-slate-100' : ''
                            } cursor-pointer`}
                          >
                            <Megaphone className="w-3.5 h-3.5 flex-shrink-0 text-purple-400" />
                            {expanded && (
                              <>
                                <span className="flex-1 text-left font-semibold text-purple-300">
                                  Marketing Department
                                </span>
                                <ChevronDown
                                  className={`w-3 h-3 transition-transform ${rosyMarketingOpen ? 'rotate-180' : ''}`}
                                />
                              </>
                            )}
                          </button>

                          {rosyMarketingOpen && expanded && (
                            <div className="ml-3 mt-0.5 pl-2.5 border-l border-purple-500/30 space-y-0.5">
                              <Link
                                href="/admin/organizations/rosy-realtors/marketing"
                                className={navCls(isExact('/admin/organizations/rosy-realtors/marketing'), true)}
                              >
                                <LayoutDashboard className="w-3 h-3 flex-shrink-0 text-purple-400" />
                                <span>Dashboard</span>
                              </Link>
                              <Link
                                href="/admin/organizations/rosy-realtors/marketing/users"
                                className={navCls(
                                  isActive('/admin/organizations/rosy-realtors/marketing/users'),
                                  true
                                )}
                              >
                                <Users className="w-3 h-3 flex-shrink-0 text-cyan-400" />
                                <span>Users</span>
                              </Link>
                            </div>
                          )}
                        </div>
                      )}

                      {hasDept('finance') && (
                        <div>
                          <button
                            type="button"
                            onClick={() => setRosyFinanceOpen((p) => !p)}
                            className={`w-full ${navCls(false, true)} ${
                              pathname.includes('/rosy-realtors/finance') ? 'text-slate-100' : ''
                            } cursor-pointer`}
                          >
                            <DollarSign className="w-3.5 h-3.5 flex-shrink-0 text-sky-400" />
                            {expanded && (
                              <>
                                <span className="flex-1 text-left font-semibold text-sky-300">
                                  Finance Department
                                </span>
                                <ChevronDown
                                  className={`w-3 h-3 transition-transform ${rosyFinanceOpen ? 'rotate-180' : ''}`}
                                />
                              </>
                            )}
                          </button>

                          {rosyFinanceOpen && expanded && (
                            <div className="ml-3 mt-0.5 pl-2.5 border-l border-sky-500/30 space-y-0.5">
                              <Link
                                href="/admin/organizations/rosy-realtors/finance"
                                className={navCls(isExact('/admin/organizations/rosy-realtors/finance'), true)}
                              >
                                <LayoutDashboard className="w-3 h-3 flex-shrink-0 text-sky-400" />
                                <span>Dashboard</span>
                              </Link>
                              <Link
                                href="/admin/organizations/rosy-realtors/finance/users"
                                className={navCls(isActive('/admin/organizations/rosy-realtors/finance/users'), true)}
                              >
                                <Users className="w-3 h-3 flex-shrink-0 text-cyan-400" />
                                <span>Users</span>
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* CLIENT 2: CHETU HEALTHCARE (Collapsible Org Dropdown) */}
              {canSeeChetu && (
                <div className="space-y-1">
                  {expanded && (
                    <button
                      type="button"
                      onClick={() => setChetuOrgOpen((p) => !p)}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800/70 transition-colors cursor-pointer"
                    >
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                        Chetu Healthcare
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-emerald-400/80 transition-transform ${
                          chetuOrgOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  )}

                  {(chetuOrgOpen || !expanded) && (
                    <div className={expanded ? 'ml-2 pl-2 border-l border-emerald-500/40 space-y-0.5' : 'space-y-1'}>
                      {hasDept('sales') && (
                        <>
                          <Link
                            href="/admin/organizations/chetu-healthcare/sales"
                            className={navCls(isExact('/admin/organizations/chetu-healthcare/sales'), true)}
                          >
                            <TrendingUp className="w-3.5 h-3.5 flex-shrink-0 text-[#C9A66B]" />
                            {expanded && <span>Sales</span>}
                          </Link>
                          <Link
                            href="/admin/organizations/chetu-healthcare/sales/users"
                            className={navCls(isActive('/admin/organizations/chetu-healthcare/sales/users'), true)}
                          >
                            <Users className="w-3 h-3 flex-shrink-0 text-cyan-400" />
                            {expanded && <span>Sales Users</span>}
                          </Link>
                        </>
                      )}
                      {hasDept('marketing') && (
                        <Link
                          href="/admin/organizations/chetu-healthcare/marketing"
                          className={navCls(isActive('/admin/organizations/chetu-healthcare/marketing'), true)}
                        >
                          <Megaphone className="w-3.5 h-3.5 flex-shrink-0 text-purple-400" />
                          {expanded && <span>Marketing</span>}
                        </Link>
                      )}
                      {hasDept('finance') && (
                        <Link
                          href="/admin/organizations/chetu-healthcare/finance"
                          className={navCls(isActive('/admin/organizations/chetu-healthcare/finance'), true)}
                        >
                          <DollarSign className="w-3.5 h-3.5 flex-shrink-0 text-sky-400" />
                          {expanded && <span>Finance</span>}
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* CLIENT 3: DENDRI AFRICA (Collapsible Org Dropdown) */}
              {canSeeDendri && (
                <div className="space-y-1">
                  {expanded && (
                    <button
                      type="button"
                      onClick={() => setDendriOrgOpen((p) => !p)}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800/70 transition-colors cursor-pointer"
                    >
                      <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                        Dendri Africa
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-purple-400/80 transition-transform ${
                          dendriOrgOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  )}

                  {(dendriOrgOpen || !expanded) && (
                    <div className={expanded ? 'ml-2 pl-2 border-l border-purple-500/40 space-y-0.5' : 'space-y-1'}>
                      {hasDept('sales') && (
                        <>
                          <Link
                            href="/admin/organizations/dendri-africa/sales"
                            className={navCls(isExact('/admin/organizations/dendri-africa/sales'), true)}
                          >
                            <TrendingUp className="w-3.5 h-3.5 flex-shrink-0 text-[#C9A66B]" />
                            {expanded && <span>Sales</span>}
                          </Link>
                          <Link
                            href="/admin/organizations/dendri-africa/sales/users"
                            className={navCls(isActive('/admin/organizations/dendri-africa/sales/users'), true)}
                          >
                            <Users className="w-3 h-3 flex-shrink-0 text-cyan-400" />
                            {expanded && <span>Sales Users</span>}
                          </Link>
                        </>
                      )}
                      {hasDept('marketing') && (
                        <Link
                          href="/admin/organizations/dendri-africa/marketing"
                          className={navCls(isActive('/admin/organizations/dendri-africa/marketing'), true)}
                        >
                          <Megaphone className="w-3.5 h-3.5 flex-shrink-0 text-purple-400" />
                          {expanded && <span>Marketing</span>}
                        </Link>
                      )}
                      {hasDept('finance') && (
                        <Link
                          href="/admin/organizations/dendri-africa/finance"
                          className={navCls(isActive('/admin/organizations/dendri-africa/finance'), true)}
                        >
                          <DollarSign className="w-3.5 h-3.5 flex-shrink-0 text-sky-400" />
                          {expanded && <span>Finance</span>}
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* DYNAMICALLY ADDED CLIENT ORGANIZATIONS (from All Organizations Hub) */}
              {extraOrgs
                .filter((o) => isSuperAdmin || adminProfile?.orgSlug === o.slug)
                .map((org) => {
                  const isOpen = Boolean(openExtraOrgs[org.slug] || pathname.includes(`/organizations/${org.slug}`))
                  return (
                    <div key={org.id} className="space-y-1">
                      {expanded && (
                        <button
                          type="button"
                          onClick={() =>
                            setOpenExtraOrgs((prev) => ({ ...prev, [org.slug]: !isOpen }))
                          }
                          className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800/70 transition-colors cursor-pointer"
                        >
                          <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider truncate">
                            {org.name}
                          </span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-sky-400/80 transition-transform shrink-0 ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      )}

                      {(isOpen || !expanded) && (
                        <div className={expanded ? 'ml-2 pl-2 border-l border-sky-500/40 space-y-0.5' : 'space-y-0.5'}>
                          {hasDept('sales') && (
                            <>
                              <Link
                                href={`/admin/organizations/${org.slug}/sales`}
                                className={navCls(isExact(`/admin/organizations/${org.slug}/sales`), true)}
                              >
                                <TrendingUp className="w-3 h-3 flex-shrink-0 text-[#C9A66B]" />
                                {expanded && <span>Sales Dashboard</span>}
                              </Link>
                              <Link
                                href={`/admin/organizations/${org.slug}/sales/users`}
                                className={navCls(isActive(`/admin/organizations/${org.slug}/sales/users`), true)}
                              >
                                <Users className="w-3 h-3 flex-shrink-0 text-cyan-400" />
                                {expanded && <span>Sales Users</span>}
                              </Link>
                            </>
                          )}
                          {hasDept('marketing') && (
                            <Link
                              href={`/admin/organizations/${org.slug}/marketing`}
                              className={navCls(isExact(`/admin/organizations/${org.slug}/marketing`), true)}
                            >
                              <Megaphone className="w-3 h-3 flex-shrink-0 text-purple-400" />
                              {expanded && <span>Marketing</span>}
                            </Link>
                          )}
                          {hasDept('finance') && (
                            <Link
                              href={`/admin/organizations/${org.slug}/finance`}
                              className={navCls(isExact(`/admin/organizations/${org.slug}/finance`), true)}
                            >
                              <DollarSign className="w-3 h-3 flex-shrink-0 text-sky-400" />
                              {expanded && <span>Finance</span>}
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

              {/* Master Organizations Hub — Super Admin ONLY */}
              {isSuperAdmin && (
                <div className="pt-1">
                  <Link href="/admin/organizations" className={navCls(pathname === '/admin/organizations')}>
                    <Layers className="w-4 h-4 flex-shrink-0 text-sky-400" />
                    {expanded && <span>All Organizations Hub</span>}
                  </Link>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Sidebar Collapse Button */}
        {!mobile && (
          <div className="p-2 border-t border-slate-800 flex-shrink-0">
            <button
              onClick={toggleSidebar}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
            >
              {sidebarOpen ? (
                <>
                  <ChevronLeft className="w-3.5 h-3.5" /> <span>Collapse Sidebar</span>
                </>
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}
      </div>
    )
  }

  const initials = adminProfile?.full_name?.[0]?.toUpperCase() || 'A'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col flex-shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 flex shadow-2xl">
            <SidebarContent mobile />
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-slate-800 bg-slate-900/70 backdrop-blur-xl flex items-center justify-between px-4 flex-shrink-0 sticky top-0 z-40">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>

            <nav className="flex items-center gap-1 text-xs text-slate-500 min-w-0">
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.href} className="flex items-center gap-1 min-w-0">
                  {i > 0 && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
                  {i === breadcrumbs.length - 1 ? (
                    <span className="text-slate-300 font-medium truncate">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="hover:text-slate-300 transition-colors truncate">
                      {crumb.label}
                    </Link>
                  )}
                </span>
              ))}
            </nav>
          </div>

          {/* Org Switcher (Super Admin ONLY) & Profile */}
          <div className="flex items-center gap-3">
            {isSuperAdmin ? (
              <div className="relative" ref={orgSwitcherRef}>
                <button
                  onClick={() => setOrgSwitcherOpen((p) => !p)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 transition-all shadow-sm cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-[#C9A66B]" />
                  <span className="hidden md:inline text-slate-400">Org:</span>
                  <span className="text-[#C9A66B] max-w-[150px] truncate">
                    {pathname.includes('rosy-realtors') || pathname.includes('stage-properties')
                      ? 'Rosy Realtors Nairobi'
                      : pathname.includes('chetu-healthcare')
                      ? 'Chetu Healthcare'
                      : pathname.includes('dendri-africa')
                      ? 'Dendri Africa'
                      : 'cillah.dev'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {orgSwitcherOpen && (
                  <div className="absolute right-0 top-10 w-64 bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800">
                    <div className="px-3 py-2 bg-slate-950/60">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Switch Organization
                      </p>
                    </div>
                    <div className="p-1 space-y-0.5">
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setOrgSwitcherOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-cyan-950/30 text-slate-200 hover:text-cyan-300 transition-colors"
                      >
                        <Cpu className="w-4 h-4 text-cyan-400" />
                        <div>
                          <p className="font-semibold text-white">cillah.dev</p>
                          <p className="text-[10px] text-slate-400">Live Production Organization</p>
                        </div>
                      </Link>

                      <Link
                        href="/admin/organizations/rosy-realtors/sales"
                        onClick={() => setOrgSwitcherOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-[#C9A66B]/15 text-slate-200 hover:text-[#C9A66B] transition-colors"
                      >
                        <Building2 className="w-4 h-4 text-[#C9A66B]" />
                        <div>
                          <p className="font-semibold text-white">Rosy Realtors Nairobi</p>
                          <p className="text-[10px] text-slate-400">Nairobi Real Estate Demo Org</p>
                        </div>
                      </Link>

                      <Link
                        href="/admin/organizations/chetu-healthcare/sales"
                        onClick={() => setOrgSwitcherOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-emerald-950/30 text-slate-200 hover:text-emerald-300 transition-colors"
                      >
                        <Stethoscope className="w-4 h-4 text-emerald-400" />
                        <div>
                          <p className="font-semibold text-white">Chetu Healthcare</p>
                          <p className="text-[10px] text-slate-400">Sales · Marketing · Finance</p>
                        </div>
                      </Link>

                      <Link
                        href="/admin/organizations/dendri-africa/sales"
                        onClick={() => setOrgSwitcherOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-purple-950/30 text-slate-200 hover:text-purple-300 transition-colors"
                      >
                        <Globe2 className="w-4 h-4 text-purple-400" />
                        <div>
                          <p className="font-semibold text-white">Dendri Africa</p>
                          <p className="text-[10px] text-slate-400">Sales · Marketing · Finance</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              adminProfile?.orgName && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-[#C9A66B]">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{adminProfile.orgName}</span>
                </div>
              )
            )}

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((p) => !p)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-[#C9A66B]/20 border border-[#C9A66B]/40 flex items-center justify-center text-xs font-bold text-[#C9A66B]">
                  {initials}
                </div>
                <span className="text-xs font-medium text-slate-300 hidden sm:block">
                  {adminProfile?.full_name || 'Admin'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-11 w-52 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-800">
                    <p className="text-xs font-semibold text-white">{adminProfile?.full_name}</p>
                    <p className="text-[10px] text-slate-400">{adminProfile?.email}</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#C9A66B]/10 border border-[#C9A66B]/30 text-[10px] font-bold uppercase tracking-wider text-[#E5C687]">
                      <span>
                        Access:{' '}
                        {pathname.includes('/marketing')
                          ? 'Marketing Admin'
                          : pathname.includes('/finance')
                          ? 'Finance Admin'
                          : pathname.includes('/sales') ||
                            pathname.startsWith('/admin/dashboard') ||
                            pathname.startsWith('/admin/pipeline')
                          ? 'Sales Admin'
                          : adminProfile?.isSuperAdmin
                          ? 'Super Admin'
                          : 'Admin'}
                      </span>
                    </div>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/user/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800"
                    >
                      Profile
                    </Link>
                    {isSuperAdmin && (
                      <>
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800"
                        >
                          cillah.dev Sales Dashboard
                        </Link>
                        <Link
                          href="/admin/organizations/rosy-realtors/sales"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-xs text-[#C9A66B] font-bold hover:bg-slate-800"
                        >
                          Rosy Realtors Demo
                        </Link>
                      </>
                    )}
                  </div>
                  <div className="border-t border-slate-800" />
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 cursor-pointer"
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 bg-[#090B12] p-2 sm:p-5 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
