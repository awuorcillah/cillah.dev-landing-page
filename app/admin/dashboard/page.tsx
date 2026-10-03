'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Users, BookOpen, DollarSign,
  Calendar, PlusCircle, Clock, Video,
  RefreshCw, Download,
  ChevronRight, Zap, Activity, Loader2, ShieldCheck, Filter
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type DateFilterOption = 'today' | '7days' | '30days' | '90days' | 'custom' | 'all'

const DATE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: '90days', label: 'Last 90 Days' },
  { value: 'custom', label: 'Custom Date Range' },
  { value: 'all', label: 'All Time' },
]

interface BookingItem {
  id: string
  client: string
  email: string
  session: string
  date: string
  status: string
  payment: string
  amount: string
  created_at: string
}

interface SessionItem {
  id: string
  title: string
  type: string
  date: string
  time: string
  attendees: number
  max: number
  status: string
  paid: boolean
  price: string
}

const KNOWN_PROFILES: Record<string, { full_name: string; email: string }> = {
  'f9bd2708-ef30-44a8-bdff-68b9fa05ea54': { full_name: 'awuorc207', email: 'awuorc207@gmail.com' },
  '3e1dd463-b673-4104-8390-16cfcae0506e': { full_name: 'cherrylatulah2000', email: 'cherrylatulah2000@gmail.com' },
  '1fbfb50e-07cd-452e-b542-78bf5355f4f6': { full_name: 'Awuor Cilla', email: 'awuorcillah@gmail.com' }
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    pending:   'bg-amber-500/10 text-amber-400 border-amber-500/30',
    completed: 'bg-slate-700/60 text-slate-400 border-slate-600',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
    scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  }
  return (
    <Badge className={`capitalize text-[11px] px-2 py-0.5 ${map[status] || map.pending}`}>
      {status}
    </Badge>
  )
}

export default function AdminDashboardPage() {
  const supabase = createClient()

  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Live Supabase Raw Data State
  const [rawProfiles, setRawProfiles] = useState<any[]>([])
  const [rawBookings, setRawBookings] = useState<any[]>([])
  const [rawSessions, setRawSessions] = useState<any[]>([])

  // ── Fetch Live Data from Supabase ──
  const fetchDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      // 1. Fetch Profiles (Users & Clients)
      const { data: dbProfiles } = await supabase.from('profiles').select('*')
      if (dbProfiles) {
        setRawProfiles(dbProfiles)
      }

      // 2. Fetch Bookings with Relations
      const { data: dbBookings } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles:user_id (full_name, email),
          session_types:session_type_id (title, price_kes, session_format)
        `)
        .order('created_at', { ascending: false })

      if (dbBookings) {
        setRawBookings(dbBookings)
      }

      // 3. Fetch Active Session Types
      const { data: dbSessions } = await supabase.from('session_types').select('*').eq('is_active', true)
      if (dbSessions) {
        setRawSessions(dbSessions)
      }

      if (isManualRefresh) {
        toast.success('Dashboard data refreshed from Supabase!')
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      toast.error('Failed to load live data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // ── Date Filtering Helper ──
  const isDateInRange = (dateStr: string | null | undefined) => {
    if (!dateStr) return false
    const itemTime = new Date(dateStr).getTime()
    if (isNaN(itemTime)) return false

    const now = new Date()

    if (dateFilter === 'all') return true

    if (dateFilter === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime()
      return itemTime >= startOfDay && itemTime <= endOfDay
    }

    if (dateFilter === '7days') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime()
      return itemTime >= start
    }

    if (dateFilter === '30days') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime()
      return itemTime >= start
    }

    if (dateFilter === '90days') {
      const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).getTime()
      return itemTime >= start
    }

    if (dateFilter === 'custom') {
      let startOk = true
      let endOk = true
      if (customStartDate) {
        const s = new Date(customStartDate + 'T00:00:00').getTime()
        if (!isNaN(s)) startOk = itemTime >= s
      }
      if (customEndDate) {
        const e = new Date(customEndDate + 'T23:59:59').getTime()
        if (!isNaN(e)) endOk = itemTime <= e
      }
      return startOk && endOk
    }

    return true
  }

  // Filter Bookings by Selected Date Filter
  const filteredBookings = rawBookings.filter(b => isDateInRange(b.created_at || b.scheduled_at))

  // Filter Profiles (if date created is tracked)
  const filteredProfiles = rawProfiles.filter(p => p.created_at ? isDateInRange(p.created_at) : true)

  // Derived Metrics
  const totalUsers = dateFilter === 'all' ? rawProfiles.length : filteredProfiles.length
  const activeClients = (dateFilter === 'all' ? rawProfiles : filteredProfiles).filter(
    p => p.role === 'client' || p.client_type === 'retainer' || p.client_type === 'consultation'
  ).length
  const bookingsCount = filteredBookings.length

  let totalRevenue = 0
  const recentBookings: BookingItem[] = filteredBookings.map((b: any) => {
    const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles
    const sessionType = Array.isArray(b.session_types) ? b.session_types[0] : b.session_types
    const dt = b.scheduled_at ? new Date(b.scheduled_at) : (b.created_at ? new Date(b.created_at) : new Date())

    const known = KNOWN_PROFILES[b.user_id]
    const client = profile?.full_name || b.client_name || b.name || known?.full_name || 'Client'
    const email = profile?.email || b.client_email || b.email || known?.email || '—'
    const session = sessionType?.title || b.session_title || b.title || 'Consultation Call'
    const priceKes = sessionType?.price_kes || 0

    if (b.payment_status === 'paid' || priceKes > 0) {
      totalRevenue += priceKes
    }

    return {
      id: b.id,
      client,
      email,
      session,
      date: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' — ' + dt.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }),
      status: b.status || 'confirmed',
      payment: b.payment_status === 'paid' ? 'paid' : (priceKes === 0 ? 'free' : 'unpaid'),
      amount: priceKes > 0 ? `KES ${priceKes.toLocaleString()}` : 'Free',
      created_at: b.created_at
    }
  })

  // Format Upcoming Sessions
  const upcomingSessions: SessionItem[] = rawSessions.map((s: any) => {
    const sessionBookings = rawBookings.filter(b => b.session_type_id === s.id)
    return {
      id: s.id,
      title: s.title,
      type: s.session_format === 'webinar' ? 'Webinar' : s.session_format === 'consultation_free' ? 'Free Consult' : 'Paid Call',
      date: new Date(s.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: '10:00 AM EAT',
      attendees: sessionBookings.length,
      max: s.max_slots || 1,
      status: 'scheduled',
      paid: s.price_kes > 0,
      price: s.price_kes > 0 ? `KES ${s.price_kes.toLocaleString()}` : 'Free'
    }
  })

  // CSV Export
  const handleExportCSV = () => {
    try {
      const headers = ['Booking ID', 'Client Name', 'Client Email', 'Session Title', 'Date', 'Status', 'Payment', 'Amount']
      const rows = recentBookings.map(b => [
        b.id,
        `"${b.client}"`,
        `"${b.email}"`,
        `"${b.session}"`,
        `"${b.date}"`,
        b.status,
        b.payment,
        `"${b.amount}"`
      ])

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', `cillah_dev_dashboard_report_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Dashboard CSV Report downloaded!')
    } catch (err) {
      toast.error('Failed to export CSV report')
    }
  }

  // Selected date filter label
  const activeLabel = DATE_OPTIONS.find(o => o.value === dateFilter)?.label || 'Selected Period'

  // Cards layout configuration
  const CARDS = [
    {
      label: 'Total Users',
      value: totalUsers.toLocaleString(),
      icon: Users,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10 border-cyan-500/20',
      sub: 'registered accounts',
    },
    {
      label: 'Active Clients',
      value: activeClients.toLocaleString(),
      icon: Activity,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      sub: 'client role accounts',
    },
    {
      label: 'Total Bookings',
      value: bookingsCount.toLocaleString(),
      icon: BookOpen,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10 border-purple-500/20',
      sub: `${activeLabel.toLowerCase()} sessions`,
    },
    {
      label: 'Revenue (KES)',
      value: `KES ${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      sub: `${activeLabel.toLowerCase()} total`,
    },
  ]

  const QUICK_ACTIONS = [
    { label: 'New Session',     icon: PlusCircle, href: '/admin/sessions/new',         color: 'text-cyan-400',   bg: 'hover:bg-cyan-500/10 border-cyan-500/20' },
    { label: 'Set Availability', icon: Clock,       href: '/admin/availability',         color: 'text-purple-400', bg: 'hover:bg-purple-500/10 border-purple-500/20' },
    { label: 'Manage Clients',  icon: Users,       href: '/admin/clients',              color: 'text-emerald-400', bg: 'hover:bg-emerald-500/10 border-emerald-500/20' },
    { label: 'View Bookings',   icon: BookOpen,    href: '/admin/bookings',             color: 'text-amber-400',  bg: 'hover:bg-amber-500/10 border-amber-500/20' },
    { label: 'Session Types',   icon: Video,       href: '/admin/sessions/types',       color: 'text-blue-400',   bg: 'hover:bg-blue-500/10 border-blue-500/20' },
    { label: 'Categories',      icon: Zap,         href: '/admin/sessions/categories',  color: 'text-pink-400',   bg: 'hover:bg-pink-500/10 border-pink-500/20' },
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            Dashboard Overview
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] uppercase font-bold">
              Live DB
            </Badge>
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Welcome back — real-time automation agency metrics for cillah.dev</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 gap-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5" /> Export Report
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* ── Date Range Dropdown Filter ── */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-md">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-300">Filter by Date:</span>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilterOption)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer font-medium"
          >
            {DATE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {dateFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 pl-2 border-l border-slate-800">
            <span className="text-xs text-slate-400">From:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
            />
            <span className="text-xs text-slate-400">To:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
            />
          </div>
        )}
      </div>

      {/* ── Metrics Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {CARDS.map(card => (
          <Card key={card.label} className="bg-slate-900/70 border-slate-800 text-slate-100 hover:border-slate-700 transition-colors shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">{card.label}</CardTitle>
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${card.iconBg}`}>
                <card.icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100 leading-none">{card.value}</div>
              <p className="text-[11px] text-slate-500 mt-2">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Quick Actions & Workflows</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map(action => (
            <Link
              key={action.label}
              href={action.href}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-800 bg-slate-900/50 transition-all ${action.bg} group`}
            >
              <div className={`w-9 h-9 rounded-lg bg-slate-800 group-hover:scale-105 flex items-center justify-center transition-transform`}>
                <action.icon className={`w-4.5 h-4.5 ${action.color}`} />
              </div>
              <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-200 text-center leading-tight transition-colors">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Two columns: Recent Bookings + Upcoming Sessions ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* Recent Bookings (wider) */}
        <div className="xl:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Recent Bookings ({recentBookings.length})
            </h2>
            <Link href="/admin/bookings" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
              View all bookings <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-xl min-h-[160px]">
            {loading ? (
              <div className="p-8 flex items-center justify-center text-slate-500 gap-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> Loading live bookings...
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No bookings found for the selected date filter.
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {recentBookings.map(b => (
                  <div key={b.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-800/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-200">{b.client}</span>
                        <span className="text-xs text-slate-400 font-mono">({b.email})</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">{b.session}</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">{b.date}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <StatusBadge status={b.status} />
                      <span className="text-[10px] text-slate-400 font-mono">{b.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="xl:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Session Types ({upcomingSessions.length})
            </h2>
            <Link href="/admin/sessions" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="p-8 flex items-center justify-center text-slate-500 gap-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> Loading sessions...
              </div>
            ) : upcomingSessions.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs bg-slate-900/70 border border-slate-800 rounded-xl">
                No active session types configured.
              </div>
            ) : (
              upcomingSessions.map(s => (
                <div key={s.id} className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors shadow-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200 leading-snug truncate">{s.title}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
                          s.type === 'Webinar' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : s.type === 'Free Consult' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>{s.type}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{s.price}</span>
                      </div>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <Calendar className="w-3 h-3" />
                      <span>{s.date}</span>
                      <span>·</span>
                      <Clock className="w-3 h-3" />
                      <span>{s.time}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {s.attendees}/{s.max} bookings
                    </span>
                  </div>
                </div>
              ))
            )}
            <Link
              href="/admin/sessions/new"
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-700 text-xs text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all bg-slate-900/40"
            >
              <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
              Schedule new session
            </Link>
          </div>
        </div>
      </div>

      {/* ── Live Production Banner ── */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl shadow-md text-xs text-slate-300">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <p className="text-slate-300">
          <strong className="text-emerald-400 font-semibold">Live Production Supabase Mode:</strong> Connected to real-time database cluster <code className="font-mono text-[11px] text-cyan-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">hastygfosgyxrxzrzrur.supabase.co</code> for cillah.dev.
        </p>
      </div>

    </div>
  )
}
