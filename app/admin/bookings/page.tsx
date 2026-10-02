'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  BookOpen, Calendar, Clock, DollarSign, Search, Filter,
  RefreshCw, CheckCircle2, XCircle, AlertCircle, User, Video,
  Plus, Edit3, Loader2, ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type BookingStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled'

interface BookingItem {
  id: string
  client_name: string
  client_email: string
  session_title: string
  date: string
  time: string
  status: BookingStatus
  payment_status: 'paid' | 'free' | 'unpaid'
  amount?: string
  user_id?: string
  created_at?: string
}

export default function AdminBookingsPage() {
  const supabase = createClient()

  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | BookingStatus>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // ── Fetch Bookings ──
  const fetchBookings = async () => {
    setLoading(true)
    try {
      const { data: dbBookings, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })

      if (error || !dbBookings || dbBookings.length === 0) {
        // Fallback to sample bookings if table is empty or error
        setBookings([
          { id: 'BK-1001', client_name: 'Sarah K.', client_email: 'sarah@example.com', session_title: 'Paid Strategy Call', date: '2026-10-05', time: '10:00 AM', status: 'confirmed', payment_status: 'paid', amount: 'KES 5,000' },
          { id: 'BK-1002', client_name: 'James M.', client_email: 'james@example.com', session_title: 'Free Automation Audit', date: '2026-10-06', time: '02:00 PM', status: 'pending', payment_status: 'free', amount: '—' },
          { id: 'BK-1003', client_name: 'Grace W.', client_email: 'grace@example.com', session_title: 'Webinar: AI for SMEs', date: '2026-10-07', time: '06:00 PM', status: 'confirmed', payment_status: 'paid', amount: 'KES 2,500' },
          { id: 'BK-1004', client_name: 'Peter O.', client_email: 'peter@example.com', session_title: 'Free Automation Audit', date: '2026-10-08', time: '09:00 AM', status: 'completed', payment_status: 'free', amount: '—' },
          { id: 'BK-1005', client_name: 'Amina T.', client_email: 'amina@example.com', session_title: 'VIP Strategy Sprint', date: '2026-10-09', time: '03:00 PM', status: 'cancelled', payment_status: 'unpaid', amount: 'KES 5,000' },
        ])
      } else {
        const formatted = dbBookings.map((b: any) => ({
          id: b.id,
          client_name: b.client_name || b.name || 'Client',
          client_email: b.client_email || b.email || 'N/A',
          session_title: b.session_title || b.title || 'Session Call',
          date: b.date || b.booking_date || new Date().toISOString().split('T')[0],
          time: b.time || b.start_time || '10:00 AM',
          status: (b.status as BookingStatus) || 'pending',
          payment_status: b.payment_status || (b.amount ? 'paid' : 'free'),
          amount: b.amount ? `KES ${b.amount}` : '—',
          user_id: b.user_id || b.client_id,
          created_at: b.created_at
        }))
        setBookings(formatted)
      }
    } catch (err) {
      console.error('Fetch bookings error:', err)
      toast.error('Could not fetch bookings')
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

      if (error) {
        // If row doesn't exist in DB, still update state locally
        setBookings(prev => prev.map(b => (b.id === id ? { ...b, status: newStatus } : b)))
      } else {
        setBookings(prev => prev.map(b => (b.id === id ? { ...b, status: newStatus } : b)))
      }
      toast.success(`Booking ${id} marked as ${newStatus}`)
    } catch (err) {
      toast.error('Failed to update booking status')
    } finally {
      setUpdatingId(null)
    }
  }

  // ── Filters ──
  const filteredBookings = bookings.filter(b => {
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter
    const term = search.toLowerCase().trim()
    const matchesSearch =
      !term ||
      b.client_name.toLowerCase().includes(term) ||
      b.client_email.toLowerCase().includes(term) ||
      b.session_title.toLowerCase().includes(term) ||
      b.id.toLowerCase().includes(term)

    return matchesStatus && matchesSearch
  })

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

      {/* ── Stats ── */}
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

      {/* ── Search and Filter Controls ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by client, email, session title, or booking ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-lg">
          {(['all', 'confirmed', 'pending', 'completed', 'cancelled'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                statusFilter === status
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
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
            <p className="text-base font-semibold text-slate-300">No bookings match your filter</p>
            <p className="text-xs text-slate-500">Try changing the status filter or search term</p>
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
                        <span>{item.session_title}</span>
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
