'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Calendar, List, Plus, Edit2, Trash2, Video, ExternalLink,
  Clock, Users, AlertCircle, X, Search, Eye, EyeOff,
  ChevronLeft, ChevronRight, Globe, Lock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────
type SessionStatus = 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled'
type SessionFormat = 'webinar' | 'consultation_free' | 'consultation_paid'

interface Session {
  id: string
  title: string
  session_format: SessionFormat
  session_type: string
  scheduled_at: string   // ISO string
  end_at: string
  meet_link: string
  status: SessionStatus
  max_attendees: number
  attendees: number
  waitlist: number
  is_public: boolean
  is_paid: boolean
  price_kes: number
}

// ─── Mock sessions ────────────────────────────────────────────────────────────
const INITIAL_SESSIONS: Session[] = [
  { id: '1', title: 'AI Automation for Real Estate Agencies', session_format: 'webinar', session_type: 'AI Automation Webinar', scheduled_at: '2026-10-05T15:00:00Z', end_at: '2026-10-05T16:30:00Z', meet_link: 'https://meet.google.com/abc-defg-hij', status: 'scheduled', max_attendees: 100, attendees: 34, waitlist: 0, is_public: true, is_paid: true, price_kes: 2500 },
  { id: '2', title: 'Free Audit — Sarah K.', session_format: 'consultation_free', session_type: 'Free Automation Audit', scheduled_at: '2026-10-06T07:00:00Z', end_at: '2026-10-06T07:30:00Z', meet_link: '', status: 'scheduled', max_attendees: 1, attendees: 1, waitlist: 0, is_public: false, is_paid: false, price_kes: 0 },
  { id: '3', title: 'VIP AI Strategy Sprint — James M.', session_format: 'consultation_paid', session_type: 'AI Strategy & Architecture Call', scheduled_at: '2026-10-07T11:00:00Z', end_at: '2026-10-07T12:00:00Z', meet_link: 'https://meet.google.com/xyz-uvwx-yz1', status: 'scheduled', max_attendees: 1, attendees: 1, waitlist: 0, is_public: false, is_paid: true, price_kes: 5000 },
  { id: '4', title: 'WhatsApp CRM Automation Webinar', session_format: 'webinar', session_type: 'AI Automation Webinar', scheduled_at: '2026-10-12T15:00:00Z', end_at: '2026-10-12T16:30:00Z', meet_link: '', status: 'draft', max_attendees: 100, attendees: 0, waitlist: 0, is_public: true, is_paid: true, price_kes: 2500 },
  { id: '5', title: 'AI Agents for Accountants', session_format: 'webinar', session_type: 'AI Automation Webinar', scheduled_at: '2026-09-20T15:00:00Z', end_at: '2026-09-20T16:30:00Z', meet_link: 'https://meet.google.com/past-sess-ion', status: 'completed', max_attendees: 100, attendees: 67, waitlist: 3, is_public: true, is_paid: false, price_kes: 0 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_META: Record<SessionStatus, { label: string; color: string }> = {
  draft:     { label: 'Draft',     color: 'bg-slate-700/60 text-slate-400 border-slate-600' },
  scheduled: { label: 'Scheduled', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  live:      { label: 'Live 🔴',   color: 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse' },
  completed: { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/5 text-red-500 border-red-500/10' },
}

const FORMAT_META: Record<SessionFormat, { label: string; color: string }> = {
  webinar:            { label: 'Webinar',       color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  consultation_free:  { label: 'Free Consult',  color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  consultation_paid:  { label: 'Paid Call',     color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
}

function fmt(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
    + ' — ' + d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Calendar helpers ─────────────────────────────────────────────────────────
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

// ─── Tab filters ──────────────────────────────────────────────────────────────
const TABS = ['All', 'Upcoming', 'Draft', 'Live', 'Past'] as const
type Tab = typeof TABS[number]

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS)
  const [view, setView]         = useState<'table' | 'calendar'>('table')
  const [tab, setTab]           = useState<Tab>('All')
  const [search, setSearch]     = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Calendar state
  const now   = new Date()
  const [calYear,  setCalYear]  = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())

  // ── Filter sessions ──
  const filtered = sessions.filter(s => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase())
    const d = new Date(s.scheduled_at)
    const isPast   = d < now
    const isFuture = d >= now
    if (tab === 'Upcoming') return isFuture && s.status !== 'draft' && s.status !== 'cancelled' && matchSearch
    if (tab === 'Draft')    return s.status === 'draft' && matchSearch
    if (tab === 'Live')     return s.status === 'live' && matchSearch
    if (tab === 'Past')     return (isPast || s.status === 'completed') && matchSearch
    return matchSearch
  })

  // ── Actions ──
  const togglePublish = (id: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== id) return s
      const next = s.status === 'draft' ? 'scheduled' : 'draft'
      toast.success(next === 'scheduled' ? 'Session published!' : 'Moved to draft', { position: 'top-left' })
      return { ...s, status: next }
    }))
  }

  const handleDelete = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id))
    setDeleteId(null)
    toast.success('Session deleted', { position: 'top-left' })
  }

  // ── Calendar: sessions on a given day ──
  const sessionsOnDay = (day: number) => {
    return sessions.filter(s => {
      const d = new Date(s.scheduled_at)
      return d.getFullYear() === calYear && d.getMonth() === calMonth && d.getDate() === day
    })
  }

  const daysInMonth  = getDaysInMonth(calYear, calMonth)
  const firstDay     = getFirstDayOfMonth(calYear, calMonth)
  const prevMonth    = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }
  const nextMonth    = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">All Sessions</h1>
          <p className="text-sm text-slate-500 mt-0.5">{sessions.filter(s => s.status !== 'cancelled').length} active session{sessions.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button onClick={() => setView('table')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'table' ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}>
              <List className="w-3.5 h-3.5" /> Table
            </button>
            <button onClick={() => setView('calendar')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'calendar' ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}>
              <Calendar className="w-3.5 h-3.5" /> Calendar
            </button>
          </div>
          <Link href="/admin/sessions/new">
            <Button className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold gap-2 text-sm">
              <Plus className="w-4 h-4" /> New Session
            </Button>
          </Link>
        </div>
      </div>

      {/* ── TABLE VIEW ── */}
      {view === 'table' && (
        <>
          {/* Tabs + Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-1 bg-slate-900/60 border border-slate-800 rounded-lg p-1 w-fit">
              {TABS.map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${tab === t ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}>
                  {t}
                  {t !== 'All' && (
                    <span className="ml-1.5 text-[10px] opacity-60">
                      {t === 'Upcoming' && sessions.filter(s => new Date(s.scheduled_at) >= now && !['draft','cancelled'].includes(s.status)).length}
                      {t === 'Draft'    && sessions.filter(s => s.status === 'draft').length}
                      {t === 'Live'     && sessions.filter(s => s.status === 'live').length}
                      {t === 'Past'     && sessions.filter(s => new Date(s.scheduled_at) < now || s.status === 'completed').length}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sessions..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors" />
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Session</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Date & Time</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Attendees</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Meet Link</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filtered.map(s => {
                    const status = STATUS_META[s.status]
                    const fmt2   = FORMAT_META[s.session_format]
                    return (
                      <tr key={s.id} className={`hover:bg-slate-800/30 transition-colors ${s.status === 'cancelled' ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3.5 max-w-xs">
                          <div className="flex items-start gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-medium text-slate-200 truncate">{s.title}</p>
                                {!s.is_public && <Lock className="w-3 h-3 text-slate-500 flex-shrink-0" />}
                              </div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Badge className={`text-[10px] px-1.5 py-0 ${fmt2.color}`}>{fmt2.label}</Badge>
                                <span className="text-[10px] text-slate-600">{s.session_type}</span>
                              </div>
                              {s.is_paid && <p className="text-[10px] text-amber-400 mt-0.5 font-mono">KES {s.price_kes.toLocaleString()}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className="text-xs text-slate-300">{fmtDate(s.scheduled_at)}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{new Date(s.scheduled_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })} EAT</p>
                          <p className="text-[10px] text-slate-600">{Math.round((new Date(s.end_at).getTime() - new Date(s.scheduled_at).getTime()) / 60000)} min</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 text-xs text-slate-300">
                            <Users className="w-3.5 h-3.5 text-slate-500" />
                            {s.attendees}/{s.max_attendees}
                          </div>
                          {s.waitlist > 0 && (
                            <p className="text-[10px] text-amber-400 mt-0.5">+{s.waitlist} waitlist</p>
                          )}
                          {s.max_attendees > 1 && (
                            <div className="w-20 h-1 bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                              <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min(100, (s.attendees / s.max_attendees) * 100)}%` }} />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge className={`text-[11px] px-2 py-0.5 ${status.color}`}>{status.label}</Badge>
                        </td>
                        <td className="px-4 py-3.5">
                          {s.meet_link ? (
                            <a href={s.meet_link} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                              <Video className="w-3.5 h-3.5" /> Open Meet <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-slate-600">— Not set</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            {['draft', 'scheduled'].includes(s.status) && (
                              <Button size="sm" variant="ghost" onClick={() => togglePublish(s.id)} title={s.status === 'draft' ? 'Publish' : 'Unpublish'}
                                className={`h-7 px-2 text-xs gap-1 ${s.status === 'draft' ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-400 hover:bg-slate-800'}`}>
                                {s.status === 'draft' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                {s.status === 'draft' ? 'Publish' : 'Unpublish'}
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => setDeleteId(s.id)}
                              className="h-7 px-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-14 text-center text-slate-500 text-sm">
                        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No sessions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── CALENDAR VIEW ── */}
      {view === 'calendar' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
          {/* Calendar header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-base font-semibold text-slate-100">{MONTHS[calMonth]} {calYear}</h2>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-800">
            {DAYS.map(d => (
              <div key={d} className="py-2 text-center text-[11px] font-medium text-slate-500 uppercase tracking-wider">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {/* Empty cells for first day offset */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px] border-r border-b border-slate-800/50 bg-slate-950/20" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const daySessions = sessionsOnDay(day)
              const isToday = now.getFullYear() === calYear && now.getMonth() === calMonth && now.getDate() === day
              const col = (firstDay + i) % 7

              return (
                <div key={day} className={`min-h-[100px] p-2 border-b border-slate-800/50 ${col < 6 ? 'border-r' : ''} border-slate-800/50 hover:bg-slate-800/20 transition-colors`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}>
                      {day}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {daySessions.slice(0, 3).map(s => (
                      <div key={s.id} className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${
                        s.status === 'draft'     ? 'bg-slate-700/80 text-slate-400' :
                        s.session_format === 'webinar' ? 'bg-purple-500/20 text-purple-300' :
                        s.session_format === 'consultation_free' ? 'bg-emerald-500/20 text-emerald-300' :
                        'bg-amber-500/20 text-amber-300'
                      }`}>
                        {s.status === 'draft' && '◌ '}{s.title}
                      </div>
                    ))}
                    {daySessions.length > 3 && (
                      <p className="text-[10px] text-slate-600 pl-1">+{daySessions.length - 3} more</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-5 py-3 border-t border-slate-800">
            <span className="text-[11px] text-slate-500 font-medium">Legend:</span>
            {[
              { color: 'bg-purple-500/20 text-purple-300', label: 'Webinar' },
              { color: 'bg-emerald-500/20 text-emerald-300', label: 'Free Consult' },
              { color: 'bg-amber-500/20 text-amber-300', label: 'Paid Call' },
              { color: 'bg-slate-700/80 text-slate-400', label: 'Draft' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded ${l.color.split(' ')[0]}`} />
                <span className="text-[11px] text-slate-500">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative w-full max-w-sm bg-slate-900 border border-red-500/30 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 text-sm">Delete Session?</h3>
                <p className="text-xs text-slate-400 mt-0.5">Registrations and waitlist entries will also be removed.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setDeleteId(null)} variant="outline" className="flex-1 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800">Cancel</Button>
              <Button onClick={() => handleDelete(deleteId)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold">Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
