'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { isAdminAccount, isSuperAdminEmail as checkSuperAdminEmail } from '@/lib/auth-roles'
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

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false
  return SUPER_ADMIN_EMAILS.map((e) => e.toLowerCase().trim()).includes(email.toLowerCase().trim())
}

const SUPER_ADMIN_ONLY_PATHS = [
  '/admin/organizations',
  '/admin/sessions',
  '/admin/clients',
  '/admin/marketing',
  '/admin/finance',
]

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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  // cillah.dev department dropdown states
  const [cillahSalesOpen, setCillahSalesOpen] = useState(true)
  const [cillahMarketingOpen, setCillahMarketingOpen] = useState(false)
  const [cillahFinanceOpen, setCillahFinanceOpen] = useState(false)

  // Rosy Realtors Nairobi department dropdown states
  const [rosySalesOpen, setRosySalesOpen] = useState(true)
  const [rosyMarketingOpen, setRosyMarketingOpen] = useState(false)
  const [rosyFinanceOpen, setRosyFinanceOpen] = useState(false)

  const [orgSwitcherOpen, setOrgSwitcherOpen] = useState(false)
  const [adminProfile, setAdminProfile] = useState<any>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  const profileRef = useRef<HTMLDivElement>(null)
  const orgSwitcherRef = useRef<HTMLDivElement>(null)
  const breadcrumbs = getBreadcrumbs(pathname)

  useEffect(() => {
    const saved = localStorage.getItem('admin_sidebar_open')
    if (saved !== null) setSidebarOpen(saved === 'true')
  }, [])

  // Auto-open relevant dropdown based on active route
  useEffect(() => {
    if (pathname.includes('/cillah-dev/marketing') || pathname.startsWith('/admin/marketing')) {
      setCillahMarketingOpen(true)
    }
    if (pathname.includes('/cillah-dev/finance') || pathname.startsWith('/admin/finance')) {
      setCillahFinanceOpen(true)
    }
    if (pathname.includes('/rosy-realtors/marketing')) {
      setRosyMarketingOpen(true)
    }
    if (pathname.includes('/rosy-realtors/finance')) {
      setRosyFinanceOpen(true)
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

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .maybeSingle()

      if (!isAdminAccount(email, profile?.role)) {
        router.replace('/user/dashboard')
        return
      }

      setAdminProfile({
        id: user.id,
        email: user.email,
        isSuperAdmin: isSuper,
        isSalesAdmin: !isSuper,
        full_name: isSuper
          ? 'Cillah Awuor (CEO)'
          : profile?.full_name || user.user_metadata?.full_name || email.split('@')[0] || 'Admin',
      })
    }

    load()
  }, [router, supabase])

  useEffect(() => {
    if (adminProfile && !adminProfile.isSuperAdmin) {
      const isAccessingSuperAdminRoute = SUPER_ADMIN_ONLY_PATHS.some((path) => pathname.startsWith(path))
      if (isAccessingSuperAdminRoute) {
        toast.error('Access restricted to Super Admin only')
        router.push('/admin/dashboard')
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
              <p className="text-sm font-bold text-slate-100 leading-none">cillah.dev</p>
              <p className="text-[10px] text-[#C9A66B] mt-0.5 font-semibold">
                {isSuperAdmin ? 'CEO / Platform Owner' : 'Organization Admin'}
              </p>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-2 py-3 space-y-3 overflow-y-auto">
          {/* ============================================================== */}
          {/* PRIMARY ORGANIZATION: cillah.dev (100% REAL PRODUCTION DATA)   */}
          {/* ============================================================== */}
          <div className="space-y-2">
            {expanded && (
              <div className="px-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white tracking-wide flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    cillah.dev
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 font-bold uppercase">
                    Live Org
                  </span>
                </div>

                {/* STANDOUT HEADING: DEPARTMENTS, USERS & ACCESS */}
                <div className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#C9A66B]/20 via-[#C9A66B]/10 to-transparent border border-[#C9A66B]/35 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-[#C9A66B] shrink-0" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#C9A66B]">
                    Departments, Users &amp; Access
                  </span>
                </div>
              </div>
            )}

            <div className={expanded ? 'ml-2 pl-2 border-l border-cyan-500/35 space-y-1' : 'space-y-1'}>
              {/* 1. Sales Department (Dashboard + Users) */}
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

              {/* 2. Marketing Department (Dashboard + Users) */}
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
                    <Link
                      href="/admin/marketing"
                      className={navCls(isExact('/admin/marketing'), true)}
                    >
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

              {/* 3. Finance Department (Dashboard + Users) */}
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

              {/* Other cillah.dev internal links */}
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
            </div>
          </div>

          {/* ============================================================== */}
          {/* CLIENT ORGANIZATIONS (SUPER ADMIN ONLY: awuorcillah@gmail.com) */}
          {/* ============================================================== */}
          {isSuperAdmin && (
            <div className="pt-3 space-y-3 border-t border-slate-800/80">
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

              {/* CLIENT 1: ROSY REALTORS NAIROBI (ISOLATED DEMO ORGANIZATION) */}
              <div className="ml-2 pl-2 border-l border-[#C9A66B]/50 space-y-1">
                {expanded && (
                  <div className="flex items-center justify-between px-2 py-1">
                    <p className="text-[11px] font-extrabold text-[#C9A66B] uppercase tracking-wider">
                      Rosy Realtors Nairobi
                    </p>
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#C9A66B]/15 text-[#C9A66B] font-bold uppercase">
                      Demo
                    </span>
                  </div>
                )}

                {/* Sales Department (Executive & Pipeline + Users) */}
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

                {/* Marketing Department (Dashboard + Users) */}
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
                        className={navCls(isActive('/admin/organizations/rosy-realtors/marketing/users'), true)}
                      >
                        <Users className="w-3 h-3 flex-shrink-0 text-cyan-400" />
                        <span>Users</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Finance Department (Dashboard + Users) */}
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
              </div>

              {/* CLIENT 2: CHETU HEALTHCARE */}
              <div className="ml-2 pl-2 border-l border-emerald-500/40 space-y-1 pt-1">
                {expanded && (
                  <p className="text-[11px] font-bold text-emerald-400 px-2 py-1 uppercase tracking-wider">
                    Chetu Healthcare
                  </p>
                )}
                <Link
                  href="/admin/organizations/chetu-healthcare"
                  className={navCls(isActive('/admin/organizations/chetu-healthcare'), true)}
                >
                  <Stethoscope className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
                  {expanded && <span>Clinic &amp; Patients</span>}
                </Link>
                <Link
                  href="/admin/organizations/chetu-healthcare/teams"
                  className={navCls(isActive('/admin/organizations/chetu-healthcare/teams'), true)}
                >
                  <HeartPulse className="w-3.5 h-3.5 flex-shrink-0 text-emerald-300" />
                  {expanded && <span>Medical Staff</span>}
                </Link>
              </div>

              {/* CLIENT 3: DENDRI AFRICA */}
              <div className="ml-2 pl-2 border-l border-purple-500/40 space-y-1 pt-1">
                {expanded && (
                  <p className="text-[11px] font-bold text-purple-400 px-2 py-1 uppercase tracking-wider">
                    Dendri Africa
                  </p>
                )}
                <Link
                  href="/admin/organizations/dendri-africa"
                  className={navCls(isActive('/admin/organizations/dendri-africa'), true)}
                >
                  <Globe2 className="w-3.5 h-3.5 flex-shrink-0 text-purple-400" />
                  {expanded && <span>Operations &amp; Trade</span>}
                </Link>
                <Link
                  href="/admin/organizations/dendri-africa/teams"
                  className={navCls(isActive('/admin/organizations/dendri-africa/teams'), true)}
                >
                  <Briefcase className="w-3.5 h-3.5 flex-shrink-0 text-purple-300" />
                  {expanded && <span>Partnerships Team</span>}
                </Link>
              </div>

              {/* Master Organizations Hub */}
              <div className="pt-1">
                <Link href="/admin/organizations" className={navCls(pathname === '/admin/organizations')}>
                  <Layers className="w-4 h-4 flex-shrink-0 text-sky-400" />
                  {expanded && <span>All Organizations Hub</span>}
                </Link>
              </div>
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

          {/* Org Switcher & Profile */}
          <div className="flex items-center gap-3">
            {isSuperAdmin && (
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
                        href="/admin/organizations/chetu-healthcare"
                        onClick={() => setOrgSwitcherOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-emerald-950/30 text-slate-200 hover:text-emerald-300 transition-colors"
                      >
                        <Stethoscope className="w-4 h-4 text-emerald-400" />
                        <div>
                          <p className="font-semibold text-white">Chetu Healthcare</p>
                          <p className="text-[10px] text-slate-400">Patient Care &amp; Triage</p>
                        </div>
                      </Link>

                      <Link
                        href="/admin/organizations/dendri-africa"
                        onClick={() => setOrgSwitcherOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-purple-950/30 text-slate-200 hover:text-purple-300 transition-colors"
                      >
                        <Globe2 className="w-4 h-4 text-purple-400" />
                        <div>
                          <p className="font-semibold text-white">Dendri Africa</p>
                          <p className="text-[10px] text-slate-400">Agri-Tech &amp; Logistics</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
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
                  </div>
                  <div className="py-1">
                    <Link
                      href="/user/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800"
                    >
                      Profile
                    </Link>
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

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
