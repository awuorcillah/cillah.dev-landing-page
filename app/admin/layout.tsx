'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Calendar,
  Users,
  UserCheck,
  BookOpen,
  FolderOpen,
  Bell,
  LogOut,
  User,
  Shield,
  Video,
  Clock,
  Menu,
  X,
  Sparkles,
  Layers,
  Tag,
  TrendingUp,
  Building2,
  Megaphone,
  BarChart3,
  DollarSign
} from 'lucide-react'
import { toast } from 'sonner'

const SUPER_ADMIN_EMAILS = [
  'awuorcillah@gmail.com',
]

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

const MOCK_NOTIFICATIONS = [
  { id: '1', type: 'new_booking', title: 'New Lead Ingested', message: 'Daniel Kimani assigned via round-robin', time: '2m ago', read: false, url: '/admin/pipeline' },
  { id: '2', type: 'payment_received', title: 'Follow-up Alert', message: 'Sarah Real Estate follow-up scheduled', time: '15m ago', read: false, url: '/admin/appointments' },
]

const PATH_LABELS: Record<string, string> = {
  admin: 'Admin',
  dashboard: 'Dashboard',
  pipeline: 'Sales CRM Pipeline',
  appointments: 'Upcoming Appointments',
  marketing: 'Marketing Department',
  finance: 'Finance Department',
  sessions: 'Sessions',
  organizations: 'Organizations',
  sales: 'Sales Department',
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
  const base = `flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all duration-150 border-l-2 ${sub ? 'py-2 text-xs' : 'py-2.5'}`
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
  const [cillahSalesExpanded, setCillahSalesExpanded] = useState(true)
  const [stageSalesExpanded, setStageSalesExpanded] = useState(true)
  const [orgsExpanded, setOrgsExpanded] = useState(true)
  const [adminProfile, setAdminProfile] = useState<any>(null)
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length
  const breadcrumbs = getBreadcrumbs(pathname)

  useEffect(() => {
    const saved = localStorage.getItem('admin_sidebar_open')
    if (saved !== null) setSidebarOpen(saved === 'true')
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Check Role & Admin Email Rules
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const email = (user.email || '').toLowerCase().trim()
      const isSuper = isSuperAdminEmail(email)

      // Role check:
      // awuorcillah@gmail.com = Super Admin (sees everything)
      // Sales Admin (sees Dashboard & Sales Department only)
      // cherrylatulah2000@gmail.com = Sales Agent -> Redirect to /user/dashboard
      if (email === 'cherrylatulah2000@gmail.com') {
        router.push('/user/dashboard')
        return
      }

      setAdminProfile({
        id: user.id,
        email: user.email,
        isSuperAdmin: isSuper,
        isSalesAdmin: !isSuper,
        full_name: isSuper ? 'Cillah Awuor (CEO)' : (user.user_metadata?.full_name || email.split('@')[0] || 'Sales Admin')
      })
    }

    load()
  }, [router, supabase])

  // Route Guard: Redirect non-super-admins trying to access Super Admin restricted pages
  useEffect(() => {
    if (adminProfile && !adminProfile.isSuperAdmin) {
      const isAccessingSuperAdminRoute = SUPER_ADMIN_ONLY_PATHS.some((path) => pathname.startsWith(path))
      if (isAccessingSuperAdminRoute) {
        toast.error('Access restricted to Super Admin only')
        router.push('/admin/pipeline')
      }
    }
  }, [pathname, adminProfile, router])

  const toggleSidebar = () => {
    const next = !sidebarOpen
    setSidebarOpen(next)
    localStorage.setItem('admin_sidebar_open', String(next))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Logged out successfully')
    router.push('/login')
  }

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const isSuperAdmin = adminProfile?.isSuperAdmin === true

  function SidebarContent({ mobile = false }: { mobile?: boolean }) {
    const expanded = sidebarOpen || mobile

    return (
      <div className={`flex flex-col h-full bg-slate-900 border-r border-slate-800 transition-all duration-300 ${expanded ? 'w-60' : 'w-14'} overflow-hidden`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-3 py-4 border-b border-slate-800 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#C9A66B]/20 border border-[#C9A66B]/40 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-[#C9A66B]" />
          </div>
          {expanded && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-100 leading-none">cillah.dev</p>
              <p className="text-[10px] text-[#C9A66B] mt-0.5 font-semibold">
                {isSuperAdmin ? 'CEO Control Panel' : 'Sales Admin Panel'}
              </p>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-2 py-3 space-y-2 overflow-y-auto">
          {/* Dashboard (VISIBLE TO ALL ADMINS & SALES AGENTS) */}
          <Link href="/admin/dashboard" className={navCls(isActive('/admin/dashboard'))}>
            <LayoutDashboard className="w-4 h-4 flex-shrink-0 text-[#C9A66B]" />
            {expanded && <span>Dashboard</span>}
          </Link>

          {/* ORGANIZATIONS HEADER */}
          {isSuperAdmin && (
            <div className="pt-2 space-y-3">
              <div className="px-3 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-sky-400" />
                {expanded && <span>Organizations</span>}
              </div>

              {/* ORGANIZATION 1: CILLAH.DEV */}
              <div className="ml-2 pl-2 border-l border-cyan-500/40 space-y-1">
                {expanded && (
                  <p className="text-[11px] font-bold text-cyan-400 px-2 py-1 uppercase tracking-wider">
                    cillah.dev
                  </p>
                )}

                {/* 1. Teams & Roles */}
                <Link href="/admin/organizations/cillah-dev/teams" className={navCls(isActive('/admin/organizations/cillah-dev/teams'), true)}>
                  <Users className="w-3.5 h-3.5 flex-shrink-0 text-cyan-400" />
                  {expanded && <span>Teams & Roles</span>}
                </Link>

                {/* 2. Sales Department Dropdown */}
                <div>
                  <button
                    onClick={() => setCillahSalesExpanded((p) => !p)}
                    className={`w-full ${navCls(false, true)} ${pathname.includes('/pipeline') || pathname.includes('/appointments') ? 'text-slate-200' : ''}`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
                    {expanded && (
                      <>
                        <span className="flex-1 text-left font-semibold text-emerald-400">Sales Department</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${cillahSalesExpanded ? 'rotate-180' : ''}`} />
                      </>
                    )}
                  </button>

                  {cillahSalesExpanded && expanded && (
                    <div className="ml-3 mt-0.5 pl-2.5 border-l border-emerald-500/30 space-y-1">
                      <Link href="/admin/pipeline" className={navCls(isActive('/admin/pipeline'), true)}>
                        <TrendingUp className="w-3 h-3 flex-shrink-0 text-[#C9A66B]" />
                        <span>Sales CRM Pipeline</span>
                      </Link>
                      <Link href="/admin/appointments" className={navCls(isActive('/admin/appointments'), true)}>
                        <Calendar className="w-3 h-3 flex-shrink-0 text-purple-400" />
                        <span>Upcoming Appointments</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* 3. Marketing Department */}
                <Link href="/admin/marketing" className={navCls(isActive('/admin/marketing'), true)}>
                  <Megaphone className="w-3.5 h-3.5 flex-shrink-0 text-purple-400" />
                  {expanded && <span>Marketing Department</span>}
                </Link>

                {/* 4. Finance Department */}
                <Link href="/admin/finance" className={navCls(isActive('/admin/finance'), true)}>
                  <DollarSign className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
                  {expanded && <span>Finance Department</span>}
                </Link>

                {/* 5. Sessions */}
                <Link href="/admin/sessions" className={navCls(isActive('/admin/sessions'), true)}>
                  <Video className="w-3.5 h-3.5 flex-shrink-0 text-sky-400" />
                  {expanded && <span>Sessions</span>}
                </Link>

                {/* 6. Monthly Retainers */}
                <Link href="/admin/clients" className={navCls(isActive('/admin/clients'), true)}>
                  <UserCheck className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                  {expanded && <span>Monthly Retainers</span>}
                </Link>
              </div>

              {/* ORGANIZATION 2: STAGE PROPERTIES BROKERS */}
              <div className="ml-2 pl-2 border-l border-amber-500/40 space-y-1 pt-2">
                {expanded && (
                  <p className="text-[11px] font-bold text-amber-400 px-2 py-1 uppercase tracking-wider">
                    Stage Properties
                  </p>
                )}

                {/* 1. Teams & Roles */}
                <Link href="/admin/organizations/stage-properties/teams" className={navCls(isActive('/admin/organizations/stage-properties/teams'), true)}>
                  <Users className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                  {expanded && <span>Teams & Roles</span>}
                </Link>

                {/* 2. Sales Department Dropdown */}
                <div>
                  <button
                    onClick={() => setStageSalesExpanded((p) => !p)}
                    className={`w-full ${navCls(false, true)} ${pathname.includes('/stage-properties/pipeline') || pathname.includes('/stage-properties/appointments') ? 'text-slate-200' : ''}`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                    {expanded && (
                      <>
                        <span className="flex-1 text-left font-semibold text-amber-400">Sales Department</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${stageSalesExpanded ? 'rotate-180' : ''}`} />
                      </>
                    )}
                  </button>

                  {stageSalesExpanded && expanded && (
                    <div className="ml-3 mt-0.5 pl-2.5 border-l border-amber-500/30 space-y-1">
                      <Link href="/admin/organizations/stage-properties/pipeline" className={navCls(isActive('/admin/organizations/stage-properties/pipeline'), true)}>
                        <TrendingUp className="w-3 h-3 flex-shrink-0 text-[#C9A66B]" />
                        <span>Sales CRM Pipeline</span>
                      </Link>
                      <Link href="/admin/organizations/stage-properties/appointments" className={navCls(isActive('/admin/organizations/stage-properties/appointments'), true)}>
                        <Calendar className="w-3 h-3 flex-shrink-0 text-purple-400" />
                        <span>Upcoming Appointments</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* 3. Property Inventory */}
                <Link href="/admin/organizations/stage-properties/inventory" className={navCls(isActive('/admin/organizations/stage-properties/inventory'), true)}>
                  <Building2 className="w-3.5 h-3.5 flex-shrink-0 text-amber-300" />
                  {expanded && <span>Property Inventory</span>}
                </Link>

                {/* 4. Marketing Department */}
                <Link href="/admin/organizations/stage-properties/marketing" className={navCls(isActive('/admin/organizations/stage-properties/marketing'), true)}>
                  <Megaphone className="w-3.5 h-3.5 flex-shrink-0 text-purple-400" />
                  {expanded && <span>Marketing Campaign</span>}
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
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
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
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
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

          {/* Profile Dropdown */}
          <div className="flex items-center gap-3">
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((p) => !p)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-all"
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
                      Dashboard
                    </Link>
                    <Link
                      href="/admin/pipeline"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs text-[#C9A66B] font-bold hover:bg-slate-800"
                    >
                      Sales Pipeline
                    </Link>
                  </div>
                  <div className="border-t border-slate-800" />
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10"
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
