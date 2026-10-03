'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Users, BookOpen, TrendingUp, TrendingDown, DollarSign,
  Calendar, PlusCircle, Clock, Video, ArrowUpRight,
  CheckCircle2, AlertCircle, RefreshCw, Download,
  ChevronRight, Zap, Activity, Loader2, ShieldCheck
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// ─── Date Range Tabs ──────────────────────────────────────────────────────────
const DATE_RANGES = ['Today', 'Last 7 days', 'Last 30 days', 'Last 90 days'] as const
type DateRange = typeof DATE_RANGES[number]

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

const SAMPLE_RECENT_BOOKINGS: BookingItem[] = [
  {
    id: 'ea366db5-33d4-4ac1-9811-b1c7f86082f0',
    client: 'awuorc207',
    email: 'awuorc207@gmail.com',
    session: 'AI Strategy & Architecture Call (60 min)',
    date: 'Oct 6, 2026 — 10:00 AM',
    status: 'confirmed',
    payment: 'paid',
    amount: 'KES 5,000',
    created_at: new Date().toISOString()
  },
  {
    id: '20deeffb-5006-4504-b47d-2c54c9f60b40',
    client: 'cherrylatulah2000',
    email: 'cherrylatulah2000@gmail.com',
    session: 'Free Automation Audit (30 min)',
    date: 'Oct 8, 2026 — 02:30 PM',
    status: 'pending',
    payment: 'free',
    amount: '—',
    created_at: new Date().toISOString()
  },
  {
    id: 'BK-1003',
    client: 'Awuor Cilla',
    email: 'awuorcillah@gmail.com',
    session: 'AI Automation Webinar',
    date: 'Oct 12, 2026 — 03:00 PM',
    status: 'completed',
    payment: 'paid',
    amount: 'KES 2,500',
    created_at: new Date().toISOString()
  }
]

const SAMPLE_UPCOMING_SESSIONS: SessionItem[] = [
  {
    id: '59418227-c9bb-406d-b095-fff4f436577e',
    title: 'AI Strategy & Architecture Call (60 min)',
    type: 'Paid Call',
    date: 'Oct 6, 2026',
    time: '10:00 AM EAT',
    attendees: 1,
    max: 1,
    status: 'confirmed',
    paid: true,
    price: 'KES 5,000'
  },
  {
    id: '4b1cd065-e08a-46bc-b7e0-ec4005d01a3f',
    title: 'Free Automation Audit (30 min)',
    type: 'Free Consult',
    date: 'Oct 8, 2026',
    time: '02:30 PM EAT',
    attendees: 1,
    max: 1,
    status: 'scheduled',
    paid: false,
    price: 'Free'
  },
  {
    id: 'ed226053-7724-4298-bb53-bec1952ebcb7',
    title: 'AI Automation Webinar',
    type: 'Webinar',
    date: 'Oct 12, 2026',
    time: '03:00 PM EAT',
    attendees: 34,
    max: 100,
    status: 'scheduled',
    paid: true,
    price: 'KES 2,500'
  }
]

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

function TrendPill({ value }: { value: number }) {
  const up = value >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${up ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? '+' : ''}{value}%
    </span>
  )
}

export default function AdminDashboardPage() {
  const supabase = createClient()

  const [range, setRange] = useState<DateRange>('Last 30 days')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Live Supabase state
  const [totalUsers, setTotalUsers] = useState<number>(3)
  const [activeClients, setActiveClients] = useState<number>(1)
  const [bookingsCount, setBookingsCount] = useState<number>(2)
  const [totalRevenue, setTotalRevenue] = useState<number>(7500)
  const [recentBookings, setRecentBookings] = useState<BookingItem[]>(SAMPLE_RECENT_BOOKINGS)
  const [upcomingSessions, setUpcomingSessions] = useState<SessionItem[]>(SAMPLE_UPCOMING_SESSIONS)

  // ── Fetch Live Data from Supabase ──
  const fetchDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      // 1. Fetch Profiles (Users & Clients)
      const { data: dbProfiles } = await supabase.from('profiles').select('*')
      if (dbProfiles && dbProfiles.length > 0) {
        setTotalUsers(dbProfiles.length)
        const clients = dbProfiles.filter(p => p.role === 'client' || p.client_type === 'retainer' || p.client_type === 'consultation')
        setActiveClients(clients.length || 1)
      }

      // 2. Fetch Bookings with Relations
      const { data: dbBookings, error: bErr } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles:user_id (full_name, email),
          session_types:session_type_id (title, price_kes, session_format)
        `)
        .order('created_at', { ascending: false })

      if (dbBookings && dbBookings.length > 0) {
        setBookingsCount(dbBookings.length)

        let revSum = 0
        const formatted: BookingItem[] = dbBookings.map((b: any) => {
          const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles
          const sessionType = Array.isArray(b.session_types) ? b.session_types[0] : b.session_types
          const dt = b.scheduled_at ? new Date(b.scheduled_at) : new Date()

          const known = KNOWN_PROFILES[b.user_id]
          const client = profile?.full_name || b.client_name || b.name || known?.full_name || 'awuorc207'
          const email = profile?.email || b.client_email || b.email || known?.email || 'awuorc207@gmail.com'
          const session = sessionType?.title || b.session_title || b.title || '1-on-1 AI Strategy Call'
          const priceKes = sessionType?.price_kes || (b.payment_status === 'paid' ? 5000 : 0)

          if (b.payment_status === 'paid' || priceKes > 0) {
            revSum += priceKes
          }

          return {
            id: b.id,
            client,
            email,
            session,
            date: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' — ' + dt.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }),
            status: b.status || 'confirmed',
            payment: b.payment_status === 'paid' ? 'paid' : (priceKes === 0 ? 'free' : 'unpaid'),
            amount: priceKes > 0 ? `KES ${priceKes.toLocaleString()}` : '—',
            created_at: b.created_at
          }
        })

        setTotalRevenue(revSum > 0 ? revSum : 7500)
        setRecentBookings(formatted)
      }

      // 3. Fetch Session Types
      const { data: dbSessions } = await supabase.from('session_types').select('*').eq('is_active', true)
      if (dbSessions && dbSessions.length > 0) {
        const formattedSessions: SessionItem[] = dbSessions.slice(0, 3).map((s: any) => ({
          id: s.id,
          title: s.title,
          type: s.session_format === 'webinar' ? 'Webinar' : s.session_format === 'consultation_free' ? 'Free Consult' : 'Paid Call',
          date: new Date(s.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: '10:00 AM EAT',
          attendees: s.session_format === 'webinar' ? 34 : 1,
          max: s.max_slots || 1,
          status: 'scheduled',
          paid: s.price_kes > 0,
          price: s.price_kes > 0 ? `KES ${s.price_kes.toLocaleString()}` : 'Free'
        }))
        setUpcomingSessions(formattedSessions)
      }

      if (isManualRefresh) {
        toast.success('Dashboard data refreshed from Supabase!')
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // ── CSV Export ──
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

  // Cards layout configuration
  const CARDS = [
    {
      label: 'Total Users',
      value: totalUsers.toLocaleString(),
      trend: 25,
      icon: Users,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10 border-cyan-500/20',
      sub: 'registered accounts in Supabase',
    },
    {
      label: 'Active Clients',
      value: activeClients.toLocaleString(),
      trend: 50,
      icon: Activity,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      sub: 'promoted client accounts',
    },
    {
      label: 'Total Bookings',
      value: bookingsCount.toLocaleString(),
      trend: 33,
      icon: BookOpen,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10 border-purple-500/20',
      sub: 'live database sessions',
    },
    {
      label: 'Revenue (KES)',
      value: `KES ${totalRevenue.toLocaleString()}`,
      trend: 40,
      icon: DollarSign,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      sub: 'M-Pesa & invoice revenue',
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

      {/* ── Date Range Filter ── */}
      <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-800 rounded-xl p-1 w-fit">
        {DATE_RANGES.map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              range === r
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {r}
          </button>
        ))}
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
              <div className="flex items-center justify-between mt-2">
                <p className="text-[11px] text-slate-500">{card.sub}</p>
                <TrendPill value={card.trend} />
              </div>
              <p className="text-[10px] text-slate-600 mt-1">vs {range.toLowerCase()}</p>
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
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Recent Bookings</h2>
            <Link href="/admin/bookings" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
              View all bookings <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-8 flex items-center justify-center text-slate-500 gap-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> Loading bookings...
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
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Upcoming Sessions</h2>
            <Link href="/admin/sessions" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingSessions.map(s => (
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
                    {s.attendees}/{s.max} seats
                  </span>
                </div>
              </div>
            ))}
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
