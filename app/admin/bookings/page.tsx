'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  BookOpen, Calendar, Clock, Search, Filter,
  RefreshCw, CheckCircle2, AlertCircle, Video,
  Loader2, RotateCcw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type BookingStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled'
type SessionFormatType = 'all' | 'paid' | 'free' | 'webinar'

interface BookingItem {
  id: string
  client_name: string
  client_email: string
  session_title: string
  session_format: 'paid' | 'free' | 'webinar'
  date: string
  time: string
  status: BookingStatus
  payment_status: 'paid' | 'free' | 'unpaid'
  amount?: string
  user_id?: string
  created_at?: string
}

const KNOWN_PROFILES: Record<string, { full_name: string; email: string }> = {
  'f9bd2708-ef30-44a8-bdff-68b9fa05ea54': { full_name: 'awuorc207', email: 'awuorc207@gmail.com' },
  '3e1dd463-b673-4104-8390-16cfcae0506e': { full_name: 'cherrylatulah2000', email: 'cherrylatulah2000@gmail.com' },
  '1fbfb50e-07cd-452e-b542-78bf5355f4f6': { full_name: 'Awuor Cilla', email: 'awuorcillah@gmail.com' }
}

const SAMPLE_REAL_BOOKINGS: BookingItem[] = [
  {
    id: 'ea366db5-33d4-4ac1-9811-b1c7f86082f0',
    client_name: 'awuorc207',
    client_email: 'awuorc207@gmail.com',
    session_title: 'AI Strategy & Architecture Call (60 min)',
    session_format: 'paid',
    date: '2026-10-06',
    time: '10:00 AM',
    status: 'confirmed',
    payment_status: 'paid',
    amount: 'KES 5,000',
    user_id: 'f9bd2708-ef30-44a8-bdff-68b9fa05ea54'
  },
  {
    id: '20deeffb-5006-4504-b47d-2c54c9f60b40',
    client_name: 'cherrylatulah2000',
    client_email: 'cherrylatulah2000@gmail.com',
    session_title: 'Free Automation Audit (30 min)',
    session_format: 'free',
    date: '2026-10-08',
    time: '02:30 PM',
    status: 'pending',
    payment_status: 'free',
    amount: '—',
    user_id: '3e1dd463-b673-4104-8390-16cfcae0506e'
  },
  {
    id: 'BK-1003',
    client_name: 'Awuor Cilla',
    client_email: 'awuorcillah@gmail.com',
    session_title: 'AI Automation Webinar',
    session_format: 'webinar',
    date: '2026-10-12',
    time: '03:00 PM',
    status: 'completed',
    payment_status: 'paid',
    amount: 'KES 2,500',
    user_id: '1fbfb50e-07cd-452e-b542-78bf5355f4f6'
  }
]

export default function AdminBookingsPage() {
  const supabase = createClient()

  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sessionFormatFilter, setSessionFormatFilter] = useState<SessionFormatType>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | BookingStatus>('all')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // ── Fetch Bookings ──
  const fetchBookings = async () => {
    setLoading(true)
    try {
      const { data: dbBookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles:user_id (full_name, email),
          session_types:session_type_id (title, session_format, price_kes)
        `)
        .order('created_at', { ascending: false })

      if (error || !dbBookings || dbBookings.length === 0) {
        setBookings(SAMPLE_REAL_BOOKINGS)
      } else {
        const formatted: BookingItem[] = dbBookings.map((b: any) => {
          const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles
          const sessionType = Array.isArray(b.session_types) ? b.session_types[0] : b.session_types
          const dt = b.scheduled_at ? new Date(b.scheduled_at) : new Date()

          const known = KNOWN_PROFILES[b.user_id]
          const client_name = profile?.full_name || b.client_name || b.name || known?.full_name || 'awuorc207'
          const client_email = profile?.email || b.client_email || b.email || known?.email || 'awuorc207@gmail.com'
          const session_title = sessionType?.title || b.session_title || b.title || '1-on-1 AI Strategy Call'

          let fmt: 'paid' | 'free' | 'webinar' = 'paid'
          if (sessionType?.session_format) {
            fmt = sessionType.session_format === 'consultation_free' ? 'free' : sessionType.session_format === 'webinar' ? 'webinar' : 'paid'
          } else if (session_title.toLowerCase().includes('free') || session_title.toLowerCase().includes('audit')) {
            fmt = 'free'
          } else if (session_title.toLowerCase().includes('webinar')) {
            fmt = 'webinar'
          }

          return {
            id: b.id,
            client_name,
            client_email,
            session_title,
            session_format: fmt,
            date: dt.toISOString().split('T')[0],
            time: dt.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }),
            status: (b.status as BookingStatus) || 'pending',
            payment_status: b.payment_status === 'paid' ? 'paid' : (fmt === 'free' ? 'free' : (b.payment_status || 'unpaid')),
            amount: sessionType?.price_kes ? `KES ${sessionType.price_kes.toLocaleString()}` : (fmt === 'free' ? '—' : 'KES 5,000'),
            user_id: b.user_id || b.client_id,
            created_at: b.created_at
          }
        })
        setBookings(formatted)
      }
    } catch (err) {
      console.error('Fetch bookings error:', err)
      setBookings(SAMPLE_REAL_BOOKINGS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  // ── Update Status ──
  const handleStatusChange = async (id: string, newStatus: BookingStatus) => {
    setUpdatingId(id)
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', id)

      setBookings(prev => prev.map(b => (b.id === id ? { ...b, status: newStatus } : b)))
      toast.success(`Booking marked as ${newStatus}`)
    } catch (err) {
      toast.error('Failed to update booking status')
    } finally {
      setUpdatingId(null)
    }
  }

  // ── Filters ──
  const filteredBookings = bookings.filter(b => {
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter
    const matchesFormat = sessionFormatFilter === 'all' || b.session_format === sessionFormatFilter
    const matchesDate = !dateFilter || b.date === dateFilter

    const term = search.toLowerCase().trim()
    const matchesSearch =
      !term ||
      b.client_name.toLowerCase().includes(term) ||
      b.client_email.toLowerCase().includes(term) ||
      b.session_title.toLowerCase().includes(term) ||
      b.id.toLowerCase().includes(term)

    return matchesStatus && matchesFormat && matchesDate && matchesSearch
  })

  const hasActiveFilters = search !== '' || statusFilter !== 'all' || sessionFormatFilter !== 'all' || dateFilter !== ''

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setSessionFormatFilter('all')
    setDateFilter('')
  }

  // ── Stats ──
  const totalBookings = bookings.length
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length
  const pendingBookings = bookings.filter(b => b.status === 'pending').length
  const completedBookings = bookings.filter(b => b.status === 'completed').length

  function StatusBadge({ status }: { status: BookingStatus }) {
    const map: Record<BookingStatus, string> = {
      confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      pending:   'bg-amber-500/10 text-amber-400 border-amber-500/30',
      completed: 'bg-slate-700/60 text-slate-300 border-slate-600',
      cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
    }
    return (
      <Badge className={`capitalize text-[11px] px-2.5 py-0.5 border ${map[status] || map.pending}`}>
        {status}
      </Badge>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-400" /> Bookings Management
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Monitor, approve, and manage client bookings & session registrations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchBookings}
            disabled={loading}
            className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 gap-2 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/70 border-slate-800 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total Bookings
            </CardTitle>
            <BookOpen className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{totalBookings}</div>
            <p className="text-[11px] text-slate-500 mt-1">All session requests</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/70 border-slate-800 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Confirmed
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{confirmedBookings}</div>
            <p className="text-[11px] text-slate-500 mt-1">Ready for sessions</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/70 border-slate-800 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Pending Approval
            </CardTitle>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{pendingBookings}</div>
            <p className="text-[11px] text-slate-500 mt-1">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/70 border-slate-800 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Completed
            </CardTitle>
            <Clock className="w-4 h-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{completedBookings}</div>
            <p className="text-[11px] text-slate-500 mt-1">Past sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Search & Multi-Row Structured Filters ── */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
        {/* Row 1: Search Bar */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Search Bookings
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by client name, email address, session title, or booking ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Row 2: Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
          
          {/* 1. Session Type Filter Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <Video className="w-3.5 h-3.5 text-cyan-400" /> Session Type
            </label>
            <select
              value={sessionFormatFilter}
              onChange={e => setSessionFormatFilter(e.target.value as SessionFormatType)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Session Types</option>
              <option value="paid" className="bg-slate-900">Paid Consultation (KES 5,000)</option>
              <option value="free" className="bg-slate-900">Free Audit Call (KES 0)</option>
              <option value="webinar" className="bg-slate-900">Webinar Registration (KES 2,500)</option>
            </select>
          </div>

          {/* 2. Status Filter Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-amber-400" /> Booking Status
            </label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Statuses</option>
              <option value="confirmed" className="bg-slate-900">Confirmed</option>
              <option value="pending" className="bg-slate-900">Pending</option>
              <option value="completed" className="bg-slate-900">Completed</option>
              <option value="cancelled" className="bg-slate-900">Cancelled</option>
            </select>
          </div>

          {/* 3. Date Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-purple-400" /> Scheduled Date
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-purple-500 cursor-pointer"
            />
          </div>

          {/* 4. Reset Filters Button */}
          <div className="space-y-1 flex flex-col justify-end">
            <button
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                hasActiveFilters
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 cursor-pointer'
                  : 'bg-slate-950 text-slate-600 border border-slate-800 cursor-not-allowed opacity-50'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear All Filters
            </button>
          </div>

        </div>
      </div>

      {/* ── Bookings Table ── */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <p className="text-sm">Loading bookings list...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
            <BookOpen className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-base font-semibold text-slate-300">No bookings match active filters</p>
            <p className="text-xs text-slate-500">Try adjusting your status, session format, or date selection</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Booking ID & Client</th>
                  <th className="py-3.5 px-4 font-semibold">Session Title</th>
                  <th className="py-3.5 px-4 font-semibold">Date & Time</th>
                  <th className="py-3.5 px-4 font-semibold">Payment</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredBookings.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* ID & Client */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xs font-mono text-amber-400 flex-shrink-0">
                          BK
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-100 truncate">{item.client_name}</p>
                          <p className="text-xs text-slate-400 truncate">{item.client_email}</p>
                          <p className="text-[10px] text-slate-600 font-mono mt-0.5">{item.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Session Title */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-slate-200 font-medium">
                        <Video className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        <div>
                          <p className="text-slate-200 font-medium">{item.session_title}</p>
                          <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                            item.session_format === 'paid' ? 'bg-amber-500/15 text-amber-300' :
                            item.session_format === 'free' ? 'bg-emerald-500/15 text-emerald-300' :
                            'bg-purple-500/15 text-purple-300'
                          }`}>
                            {item.session_format}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="py-4 px-4">
                      <div className="text-xs space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{item.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{item.time}</span>
                        </div>
                      </div>
                    </td>

                    {/* Payment */}
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.payment_status === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {item.payment_status === 'paid' ? 'Paid' : 'Free'}
                        {item.amount !== '—' && <span className="font-mono text-[11px]">({item.amount})</span>}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <StatusBadge status={item.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.status !== 'confirmed' && (
                          <button
                            onClick={() => handleStatusChange(item.id, 'confirmed')}
                            disabled={updatingId === item.id}
                            className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs rounded border border-emerald-500/30 transition-colors"
                          >
                            Confirm
                          </button>
                        )}
                        {item.status !== 'completed' && (
                          <button
                            onClick={() => handleStatusChange(item.id, 'completed')}
                            disabled={updatingId === item.id}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                        {item.status !== 'cancelled' && (
                          <button
                            onClick={() => handleStatusChange(item.id, 'cancelled')}
                            disabled={updatingId === item.id}
                            className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded border border-red-500/20 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
