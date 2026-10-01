'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Users, BookOpen, TrendingUp, TrendingDown, DollarSign,
  Calendar, PlusCircle, Clock, Video, ArrowUpRight,
  CheckCircle2, XCircle, AlertCircle, RefreshCw, Download,
  ChevronRight, Zap, Activity,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// ─── Date Range Tabs ──────────────────────────────────────────────────────────
const DATE_RANGES = ['Today', 'Last 7 days', 'Last 30 days', 'Last 90 days'] as const
type DateRange = typeof DATE_RANGES[number]

// ─── Mock Metrics (per date range) ───────────────────────────────────────────
const MOCK_METRICS: Record<DateRange, { users: number; clients: number; bookings: number; revenue: number; trends: { users: number; clients: number; bookings: number; revenue: number } }> = {
  'Today': {
    users: 3, clients: 1, bookings: 4, revenue: 15000,
    trends: { users: 50, clients: 100, bookings: 33, revenue: 25 },
  },
  'Last 7 days': {
    users: 24, clients: 6, bookings: 18, revenue: 87500,
    trends: { users: 14, clients: 20, bookings: 28, revenue: 31 },
  },
  'Last 30 days': {
    users: 247, clients: 38, bookings: 94, revenue: 450000,
    trends: { users: 12, clients: 8, bookings: 23, revenue: 31 },
  },
  'Last 90 days': {
    users: 612, clients: 89, bookings: 241, revenue: 1180000,
    trends: { users: 34, clients: 44, bookings: 61, revenue: 78 },
  },
}

// ─── Mock Recent Bookings ─────────────────────────────────────────────────────
const MOCK_BOOKINGS = [
  { id: 'BK-001', client: 'Sarah K.',   session: 'Paid Strategy Call',  date: 'Oct 1, 2026 — 10:00 AM', status: 'confirmed', payment: 'paid',    amount: 'KES 5,000' },
  { id: 'BK-002', client: 'James M.',   session: 'Free Automation Audit', date: 'Oct 1, 2026 — 2:00 PM', status: 'pending',   payment: 'free',    amount: '—' },
  { id: 'BK-003', client: 'Grace W.',   session: 'Webinar: AI for SMEs', date: 'Oct 2, 2026 — 6:00 PM', status: 'confirmed', payment: 'paid',    amount: 'KES 2,500' },
  { id: 'BK-004', client: 'Peter O.',   session: 'Free Automation Audit', date: 'Oct 3, 2026 — 9:00 AM', status: 'pending',   payment: 'free',    amount: '—' },
  { id: 'BK-005', client: 'Amina T.',   session: 'Paid Strategy Call',  date: 'Sep 30, 2026 — 3:00 PM', status: 'completed', payment: 'paid',    amount: 'KES 5,000' },
]

// ─── Mock Upcoming Sessions ───────────────────────────────────────────────────
const MOCK_SESSIONS = [
  {
    id: 'S-001', title: 'Webinar: AI Agents for Real Estate',
    type: 'Webinar', date: 'Oct 5, 2026', time: '6:00 PM EAT',
    attendees: 34, max: 100, status: 'scheduled', paid: true, price: 'KES 2,500',
  },
  {
    id: 'S-002', title: 'Free Automation Audit — Sarah K.',
    type: 'Free Consult', date: 'Oct 6, 2026', time: '10:00 AM EAT',
    attendees: 1, max: 1, status: 'confirmed', paid: false, price: 'Free',
  },
  {
    id: 'S-003', title: 'VIP AI Strategy Sprint',
    type: 'Paid Call', date: 'Oct 7, 2026', time: '2:00 PM EAT',
    attendees: 1, max: 1, status: 'confirmed', paid: true, price: 'KES 5,000',
  },
]

// ─── Status helpers ───────────────────────────────────────────────────────────
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
  const [range, setRange] = useState<DateRange>('Last 30 days')
  const m = MOCK_METRICS[range]

  const CARDS = [
    {
      label: 'Total Users',
      value: m.users.toLocaleString(),
      trend: m.trends.users,
      icon: Users,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10 border-cyan-500/20',
      sub: 'registered accounts',
    },
    {
      label: 'Active Clients',
      value: m.clients.toLocaleString(),
      trend: m.trends.clients,
      icon: Activity,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      sub: 'upgraded from user',
    },
    {
      label: 'Total Bookings',
      value: m.bookings.toLocaleString(),
      trend: m.trends.bookings,
      icon: BookOpen,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10 border-purple-500/20',
      sub: 'sessions booked',
    },
    {
      label: 'Revenue (KES)',
      value: `KES ${(m.revenue).toLocaleString()}`,
      trend: m.trends.revenue,
      icon: DollarSign,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      sub: 'M-Pesa confirmed',
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
          <h1 className="text-2xl font-bold text-slate-100">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">Welcome back — here's what's happening on cillah.dev</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <Button size="sm" variant="outline" className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
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
          <Card key={card.label} className="bg-slate-900/70 border-slate-800 text-slate-100 hover:border-slate-700 transition-colors">
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
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Quick Actions</h2>
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
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
            <div className="divide-y divide-slate-800">
              {MOCK_BOOKINGS.map(b => (
                <div key={b.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-800/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-500">{b.id}</span>
                      <span className="text-xs font-semibold text-slate-200">{b.client}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{b.session}</p>
                    <p className="text-[10px] text-slate-600">{b.date}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <StatusBadge status={b.status} />
                    <span className="text-[10px] text-slate-500 font-mono">{b.amount}</span>
                  </div>
                </div>
              ))}
            </div>
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
            {MOCK_SESSIONS.map(s => (
              <div key={s.id} className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 leading-snug truncate">{s.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
                        s.type === 'Webinar' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        : s.type === 'Free Consult' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>{s.type}</span>
                      <span className="text-[10px] text-slate-500">{s.price}</span>
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
                  <span className="text-[10px] text-slate-500">
                    {s.attendees}/{s.max} seats
                  </span>
                </div>
              </div>
            ))}
            <Link
              href="/admin/sessions/new"
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-700 text-xs text-slate-500 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Schedule new session
            </Link>
          </div>
        </div>
      </div>

      {/* ── Mock data notice ── */}
      <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
        <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <p className="text-xs text-amber-300/80">
          <span className="font-semibold">Design Review Mode</span> — All data shown is mock data. Real Supabase data will be wired after design approval.
        </p>
      </div>

    </div>
  )
}
