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
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Mock Notifications ───────────────────────────────────────────────────────
const MOCK_NOTIFICATIONS = [
  { id: '1', type: 'new_booking',       title: 'New Booking',       message: 'Sarah K. booked a Strategy Call',     time: '2m ago',  read: false, url: '/admin/bookings' },
  { id: '2', type: 'payment_received',  title: 'Payment Received',  message: 'KES 5,000 received from James M.',    time: '15m ago', read: false, url: '/admin/bookings' },
  { id: '3', type: 'new_user',          title: 'New User',          message: 'peter@example.com just registered',   time: '1h ago',  read: true,  url: '/admin/clients'  },
  { id: '4', type: 'role_change',       title: 'Role Updated',      message: 'jane@example.com promoted → client',  time: '2h ago',  read: true,  url: '/admin/clients'  },
  { id: '5', type: 'cancellation',      title: 'Booking Cancelled',  message: 'Mark O. cancelled Free Audit slot',   time: '3h ago',  read: true,  url: '/admin/bookings' },
]

const NOTIF_ICONS: Record<string, string> = {
  new_booking: '🟢',
  payment_received: '💰',
  new_user: '👤',
  role_change: '🔄',
  cancellation: '❌',
}

// ─── Breadcrumb helper ────────────────────────────────────────────────────────
const PATH_LABELS: Record<string, string> = {
  admin: 'Admin',
  dashboard: 'Dashboard',
  sessions: 'Sessions',
  categories: 'Categories',
  types: 'Session Types',
  availability: 'Availability',
  clients: 'Clients',
  bookings: 'Bookings',
  notifications: 'Notifications',
  new: 'New',
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

// ─── Sidebar nav-item style ───────────────────────────────────────────────────
function navCls(active: boolean, sub = false) {
  const base = `flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all duration-150 border-l-2 ${sub ? 'py-2 text-xs' : 'py-2.5'}`
  return active
    ? `${base} bg-cyan-500/10 text-cyan-400 border-cyan-400`
    : `${base} text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border-transparent`
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = createClient()

  const [sidebarOpen,      setSidebarOpen]      = useState(true)
  const [mobileOpen,       setMobileOpen]        = useState(false)
  const [sessionsExpanded, setSessionsExpanded]  = useState(false)
  const [adminProfile,     setAdminProfile]      = useState<any>(null)
  const [notifications,    setNotifications]     = useState(MOCK_NOTIFICATIONS)
  const [notifOpen,        setNotifOpen]         = useState(false)
  const [profileOpen,      setProfileOpen]       = useState(false)

  const notifRef   = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.read).length
  const breadcrumbs = getBreadcrumbs(pathname)

  // ── Init ──
  useEffect(() => {
    const saved = localStorage.getItem('admin_sidebar_open')
    if (saved !== null) setSidebarOpen(saved === 'true')
  }, [])

  useEffect(() => {
    if (pathname.includes('/sessions') || pathname.includes('/availability')) {
      setSessionsExpanded(true)
    }
  }, [pathname])

  // ── Close dropdowns on outside click ──
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ── Load admin profile ──
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!profile || profile.role !== 'admin') { router.push('/client/dashboard'); return }
      setAdminProfile(profile)
    }
    load()
  }, [])

  const toggleSidebar = () => {
    const next = !sidebarOpen
    setSidebarOpen(next)
    localStorage.setItem('admin_sidebar_open', String(next))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Logged out successfully', { position: 'top-left' })
    router.push('/login')
  }

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))

  const isActive = (href: string) =>
    href === '/admin/sessions'
      ? pathname === '/admin/sessions'
      : pathname === href || pathname.startsWith(href + '/')

  // ─── Sidebar Component ────────────────────────────────────────────────────
  function SidebarContent({ mobile = false }: { mobile?: boolean }) {
    const expanded = sidebarOpen || mobile
    return (
      <div className={`flex flex-col h-full bg-slate-900 border-r border-slate-800 transition-all duration-300 ${expanded ? 'w-60' : 'w-14'} overflow-hidden`}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-3 py-4 border-b border-slate-800 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          {expanded && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-100 leading-none">cillah.dev</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Admin Portal</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">

          {/* Dashboard */}
          <Link href="/admin/dashboard" className={navCls(isActive('/admin/dashboard'))}>
            <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
            {expanded && <span>Dashboard</span>}
          </Link>

          {/* Sessions group */}
          <div>
            <button
              onClick={() => setSessionsExpanded(p => !p)}
              title={!expanded ? 'Sessions' : undefined}
              className={`w-full ${navCls(false)} ${pathname.includes('/sessions') || pathname.includes('/availability') ? 'text-slate-200' : ''}`}
            >
              <Video className="w-4 h-4 flex-shrink-0" />
              {expanded && (
                <>
                  <span className="flex-1 text-left">Sessions</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${sessionsExpanded ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            {sessionsExpanded && expanded && (
              <div className="ml-3 mt-1 pl-3 border-l border-slate-800 space-y-0.5">
                <Link href="/admin/sessions/categories" className={navCls(isActive('/admin/sessions/categories'), true)}>
                  <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Categories</span>
                </Link>
                <Link href="/admin/sessions/types" className={navCls(isActive('/admin/sessions/types'), true)}>
                  <Layers className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Session Types</span>
                </Link>
                <Link href="/admin/sessions" className={navCls(isActive('/admin/sessions'), true)}>
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>All Sessions</span>
                </Link>
                <Link href="/admin/availability" className={navCls(isActive('/admin/availability'), true)}>
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Availability</span>
                </Link>
              </div>
            )}
          </div>

          {/* Clients */}
          <Link href="/admin/clients" className={navCls(isActive('/admin/clients'))}>
            <Users className="w-4 h-4 flex-shrink-0" />
            {expanded && <span>Clients</span>}
          </Link>

          {/* Bookings */}
          <Link href="/admin/bookings" className={navCls(isActive('/admin/bookings'))}>
            <BookOpen className="w-4 h-4 flex-shrink-0" />
            {expanded && <span>Bookings</span>}
          </Link>
        </nav>

        {/* Collapse toggle (desktop only) */}
        {!mobile && (
          <div className="p-2 border-t border-slate-800 flex-shrink-0">
            <button
              onClick={toggleSidebar}
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
            >
              {sidebarOpen
                ? <><ChevronLeft className="w-3.5 h-3.5" /><span>Collapse</span></>
                : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── Admin initials ──
  const initials = adminProfile?.first_name?.[0]?.toUpperCase()
    || adminProfile?.full_name?.[0]?.toUpperCase()
    || 'A'
  const displayName = adminProfile?.first_name
    || adminProfile?.full_name?.split(' ')[0]
    || 'Admin'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">

      {/* ── Desktop Sidebar ── */}
      <div className="hidden lg:flex flex-col flex-shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </div>

      {/* ── Mobile sidebar overlay ── */}
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

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Header ── */}
        <header className="h-14 border-b border-slate-800 bg-slate-900/70 backdrop-blur-xl flex items-center justify-between px-4 flex-shrink-0 sticky top-0 z-40">

          {/* Left: hamburger + breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>

            <nav className="flex items-center gap-1 text-xs text-slate-500 min-w-0">
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.href} className="flex items-center gap-1 min-w-0">
                  {i > 0 && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
                  {i === breadcrumbs.length - 1
                    ? <span className="text-slate-300 font-medium truncate">{crumb.label}</span>
                    : <Link href={crumb.href} className="hover:text-slate-300 transition-colors truncate">{crumb.label}</Link>
                  }
                </span>
              ))}
            </nav>
          </div>

          {/* Right: notifications + profile */}
          <div className="flex items-center gap-1 flex-shrink-0">

            {/* ── Notification Bell ── */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen(p => !p); setProfileOpen(false) }}
                className="relative w-9 h-9 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-11 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-200">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-full">{unreadCount} new</span>
                      )}
                    </div>
                    <button onClick={markAllRead} className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors">
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                    {notifications.map(n => (
                      <Link
                        key={n.id}
                        href={n.url}
                        onClick={() => setNotifOpen(false)}
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-800/40 transition-colors ${!n.read ? 'bg-cyan-500/5' : ''}`}
                      >
                        <span className="text-sm flex-shrink-0 mt-0.5">{NOTIF_ICONS[n.type]}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium text-slate-200">{n.title}</p>
                            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-slate-400 truncate">{n.message}</p>
                          <p className="text-[10px] text-slate-600 mt-0.5">{n.time}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="px-4 py-2.5 border-t border-slate-800">
                    <Link
                      href="/admin/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      View all notifications →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* ── Profile Dropdown ── */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { setProfileOpen(p => !p); setNotifOpen(false) }}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-cyan-500/40 flex items-center justify-center text-xs font-bold text-cyan-300 flex-shrink-0">
                  {initials}
                </div>
                <span className="text-xs font-medium text-slate-300 hidden sm:block max-w-[6rem] truncate">
                  {displayName}
                </span>
                <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-11 w-52 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-cyan-500/40 flex items-center justify-center text-sm font-bold text-cyan-300 flex-shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-100 truncate">
                          {adminProfile?.first_name && adminProfile?.last_name
                            ? `${adminProfile.first_name} ${adminProfile.last_name}`
                            : adminProfile?.full_name || 'Admin'}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">{adminProfile?.email}</p>
                      </div>
                    </div>
                    <span className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] text-cyan-400 font-semibold">
                      <Shield className="w-2.5 h-2.5" /> ADMIN
                    </span>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <Link
                      href="/user/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                    >
                      <User className="w-3.5 h-3.5" />
                      View Profile
                    </Link>
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      Dashboard
                    </Link>
                  </div>

                  <div className="border-t border-slate-800" />

                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
