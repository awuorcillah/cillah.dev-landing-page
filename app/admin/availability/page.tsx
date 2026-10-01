'use client'

import { useState } from 'react'
import {
  Plus, Trash2, AlertCircle, X, Clock, Calendar,
  CheckCircle2, XCircle, ChevronDown, Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────
interface AvailabilityRule {
  id: string
  session_type: string
  session_type_id: string
  day_of_week: number          // 0=Sun … 6=Sat
  start_time: string           // 'HH:MM'
  end_time: string
  slot_duration_minutes: number
  recurrence_rule: { type: string; interval: number }
}

interface AvailabilityException {
  id: string
  session_type: string
  session_type_id: string
  date: string                 // 'YYYY-MM-DD'
  is_available: boolean
  notes: string
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const SESSION_TYPES = [
  { id: '1', title: 'Free Automation Audit (30 min)',          format: 'consultation_free' },
  { id: '2', title: 'AI Strategy & Architecture Call (60 min)', format: 'consultation_paid' },
  { id: '3', title: 'AI Automation Webinar',                    format: 'webinar'           },
]

const FORMAT_COLORS: Record<string, string> = {
  consultation_free: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  consultation_paid: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  webinar:           'bg-purple-500/10 text-purple-400 border-purple-500/20',
}
const FORMAT_LABELS: Record<string, string> = {
  consultation_free: 'Free Consult',
  consultation_paid: 'Paid Call',
  webinar:           'Webinar',
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const INITIAL_RULES: AvailabilityRule[] = [
  { id: '1', session_type: 'Free Automation Audit (30 min)',           session_type_id: '1', day_of_week: 1, start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30, recurrence_rule: { type: 'weekly', interval: 1 } },
  { id: '2', session_type: 'Free Automation Audit (30 min)',           session_type_id: '1', day_of_week: 3, start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30, recurrence_rule: { type: 'weekly', interval: 1 } },
  { id: '3', session_type: 'AI Strategy & Architecture Call (60 min)', session_type_id: '2', day_of_week: 2, start_time: '10:00', end_time: '16:00', slot_duration_minutes: 60, recurrence_rule: { type: 'weekly', interval: 1 } },
  { id: '4', session_type: 'AI Strategy & Architecture Call (60 min)', session_type_id: '2', day_of_week: 4, start_time: '10:00', end_time: '16:00', slot_duration_minutes: 60, recurrence_rule: { type: 'weekly', interval: 1 } },
]

const INITIAL_EXCEPTIONS: AvailabilityException[] = [
  { id: '1', session_type: 'Free Automation Audit (30 min)', session_type_id: '1', date: '2026-12-25', is_available: false, notes: 'Christmas Day' },
  { id: '2', session_type: 'AI Strategy & Architecture Call (60 min)', session_type_id: '2', date: '2026-12-26', is_available: false, notes: 'Boxing Day' },
]

// ─── Slot count helper ────────────────────────────────────────────────────────
function countSlots(start: string, end: string, slotDuration: number) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const totalMins = (eh * 60 + em) - (sh * 60 + sm)
  return totalMins > 0 ? Math.floor(totalMins / slotDuration) : 0
}

// ─── Weekly grid preview ──────────────────────────────────────────────────────
function WeeklyGrid({ rules }: { rules: AvailabilityRule[] }) {
  // For each day, collect all rules
  const byDay = Array.from({ length: 7 }, (_, i) =>
    rules.filter(r => r.day_of_week === i)
  )

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-cyan-400" />
        <span className="text-sm font-semibold text-slate-200">Weekly Availability Preview</span>
        <span className="text-xs text-slate-500 ml-1">— recurring slots per day</span>
      </div>
      <div className="grid grid-cols-7 divide-x divide-slate-800">
        {DAY_SHORT.map((day, i) => {
          const dayRules = byDay[i]
          const isWeekend = i === 0 || i === 6
          return (
            <div key={day} className={`min-h-[120px] ${isWeekend ? 'bg-slate-950/40' : ''}`}>
              <div className={`py-2 text-center text-xs font-medium border-b border-slate-800 ${isWeekend ? 'text-slate-600' : 'text-slate-400'}`}>
                {day}
              </div>
              <div className="p-1.5 space-y-1">
                {dayRules.length === 0 ? (
                  <div className="text-center py-3">
                    <span className="text-[10px] text-slate-700">—</span>
                  </div>
                ) : (
                  dayRules.map(r => {
                    const st = SESSION_TYPES.find(s => s.id === r.session_type_id)
                    const slots = countSlots(r.start_time, r.end_time, r.slot_duration_minutes)
                    return (
                      <div key={r.id} className={`px-1.5 py-1 rounded text-[10px] leading-tight border ${
                        st?.format === 'consultation_free' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' :
                        st?.format === 'consultation_paid' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' :
                        'bg-purple-500/10 border-purple-500/20 text-purple-300'
                      }`}>
                        <p className="font-semibold">{r.start_time}–{r.end_time}</p>
                        <p className="opacity-70">{slots} slot{slots !== 1 ? 's' : ''}</p>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AvailabilityPage() {
  const [rules,      setRules]      = useState<AvailabilityRule[]>(INITIAL_RULES)
  const [exceptions, setExceptions] = useState<AvailabilityException[]>(INITIAL_EXCEPTIONS)

  // Rule form
  const [showRuleForm, setShowRuleForm] = useState(false)
  const [ruleForm, setRuleForm] = useState({
    session_type_id: '1',
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
    slot_duration_minutes: 30,
    interval: 1,
  })

  // Exception form
  const [showExcForm, setShowExcForm] = useState(false)
  const [excForm, setExcForm] = useState({
    session_type_id: '1',
    date: '',
    is_available: false,
    notes: '',
  })

  // Delete confirms
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null)
  const [deleteExcId,  setDeleteExcId]  = useState<string | null>(null)

  // ── Rule actions ──
  const handleAddRule = () => {
    const st = SESSION_TYPES.find(s => s.id === ruleForm.session_type_id)
    if (!st) return
    if (ruleForm.start_time >= ruleForm.end_time) { toast.error('End time must be after start time'); return }
    const slots = countSlots(ruleForm.start_time, ruleForm.end_time, ruleForm.slot_duration_minutes)
    if (slots < 1) { toast.error('Time range too short for the slot duration'); return }

    const newRule: AvailabilityRule = {
      id: Date.now().toString(),
      session_type: st.title,
      session_type_id: ruleForm.session_type_id,
      day_of_week: ruleForm.day_of_week,
      start_time: ruleForm.start_time,
      end_time: ruleForm.end_time,
      slot_duration_minutes: ruleForm.slot_duration_minutes,
      recurrence_rule: { type: 'weekly', interval: ruleForm.interval },
    }
    setRules(prev => [...prev, newRule])
    setShowRuleForm(false)
    toast.success(`Rule added — ${slots} slot${slots !== 1 ? 's' : ''} every ${DAYS[ruleForm.day_of_week]}`, { position: 'top-left' })
  }

  const handleDeleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id))
    setDeleteRuleId(null)
    toast.success('Rule deleted', { position: 'top-left' })
  }

  // ── Exception actions ──
  const handleAddException = () => {
    if (!excForm.date) { toast.error('Please select a date'); return }
    const st = SESSION_TYPES.find(s => s.id === excForm.session_type_id)
    if (!st) return

    const newExc: AvailabilityException = {
      id: Date.now().toString(),
      session_type: st.title,
      session_type_id: excForm.session_type_id,
      date: excForm.date,
      is_available: excForm.is_available,
      notes: excForm.notes,
    }
    setExceptions(prev => [...prev, newExc])
    setShowExcForm(false)
    toast.success(`Exception added — ${excForm.is_available ? 'Available' : 'Blocked'} on ${excForm.date}`, { position: 'top-left' })
  }

  const handleDeleteException = (id: string) => {
    setExceptions(prev => prev.filter(e => e.id !== id))
    setDeleteExcId(null)
    toast.success('Exception removed', { position: 'top-left' })
  }

  // ── Group rules by session type ──
  const rulesByType = SESSION_TYPES.map(st => ({
    ...st,
    rules: rules.filter(r => r.session_type_id === st.id),
  })).filter(g => g.rules.length > 0)

  return (
    <div className="space-y-8 max-w-5xl mx-auto">

      {/* ── Page Header ── */}
      <div>
        <h1 className="text-xl font-bold text-slate-100">Availability</h1>
        <p className="text-sm text-slate-500 mt-0.5">Set your recurring weekly slots and block specific dates</p>
      </div>

      {/* ── Info Banner ── */}
      <div className="flex items-start gap-3 px-4 py-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-300/80">
          <span className="font-semibold">How it works:</span> Recurring rules define your regular weekly slots.
          Exceptions override rules for specific dates — you can block a holiday or open a special slot.
          Clients see only your open, non-blocked slots when booking.
        </p>
      </div>

      {/* ── Weekly Preview Grid ── */}
      <WeeklyGrid rules={rules} />

      {/* ════════════════════════════════════════════ */}
      {/* ── SECTION 1: Recurring Rules ── */}
      {/* ════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-200">Recurring Weekly Rules</h2>
            <p className="text-xs text-slate-500 mt-0.5">{rules.length} rule{rules.length !== 1 ? 's' : ''} configured</p>
          </div>
          <Button onClick={() => setShowRuleForm(true)}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add Rule
          </Button>
        </div>

        {/* Rules grouped by session type */}
        {rulesByType.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-slate-900/50 border border-dashed border-slate-700 rounded-xl text-slate-500">
            <Clock className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No availability rules yet</p>
            <Button onClick={() => setShowRuleForm(true)} size="sm" variant="outline" className="mt-3 border-slate-700 text-slate-400 hover:text-white">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add your first rule
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {rulesByType.map(group => (
              <div key={group.id} className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
                {/* Group header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-950/30">
                  <Badge className={`text-[11px] px-2 py-0.5 ${FORMAT_COLORS[group.format]}`}>
                    {FORMAT_LABELS[group.format]}
                  </Badge>
                  <span className="text-sm font-medium text-slate-200">{group.title}</span>
                  <span className="text-xs text-slate-600 ml-auto">{group.rules.length} rule{group.rules.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Rules list */}
                <div className="divide-y divide-slate-800">
                  {group.rules.map(rule => {
                    const slots = countSlots(rule.start_time, rule.end_time, rule.slot_duration_minutes)
                    return (
                      <div key={rule.id} className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-800/20 transition-colors">
                        {/* Day badge */}
                        <div className="w-20 flex-shrink-0">
                          <span className="text-xs font-semibold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg">
                            {DAYS[rule.day_of_week]}
                          </span>
                        </div>

                        {/* Time range */}
                        <div className="flex items-center gap-2 text-sm text-slate-200 flex-shrink-0">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span className="font-mono">{rule.start_time}</span>
                          <span className="text-slate-600">→</span>
                          <span className="font-mono">{rule.end_time}</span>
                        </div>

                        {/* Slot info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-xs text-slate-500">{rule.slot_duration_minutes}-min slots</span>
                          <span className="text-xs text-cyan-400 font-medium">{slots} slot{slots !== 1 ? 's' : ''} available</span>
                          <span className="text-xs text-slate-600">
                            Every {rule.recurrence_rule.interval === 1 ? '' : rule.recurrence_rule.interval + ' '}week{rule.recurrence_rule.interval > 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Delete */}
                        <Button size="sm" variant="ghost" onClick={() => setDeleteRuleId(rule.id)}
                          className="h-7 px-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════ */}
      {/* ── SECTION 2: Date Exceptions ── */}
      {/* ════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-200">Date Exceptions</h2>
            <p className="text-xs text-slate-500 mt-0.5">Block holidays or open special one-off dates</p>
          </div>
          <Button onClick={() => setShowExcForm(true)}
            variant="outline"
            className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add Exception
          </Button>
        </div>

        {exceptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 bg-slate-900/50 border border-dashed border-slate-700 rounded-xl text-slate-500">
            <Calendar className="w-7 h-7 mb-2 opacity-30" />
            <p className="text-sm">No date exceptions</p>
          </div>
        ) : (
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
            <div className="divide-y divide-slate-800">
              {exceptions
                .sort((a, b) => a.date.localeCompare(b.date))
                .map(exc => (
                  <div key={exc.id} className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-800/20 transition-colors">
                    {/* Available/Blocked icon */}
                    <div className="flex-shrink-0">
                      {exc.is_available
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        : <XCircle className="w-4 h-4 text-red-400" />
                      }
                    </div>

                    {/* Date */}
                    <div className="w-32 flex-shrink-0">
                      <span className="text-sm font-mono font-medium text-slate-200">
                        {new Date(exc.date + 'T00:00:00').toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Status badge */}
                    <Badge className={exc.is_available
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[11px]'
                      : 'bg-red-500/10 text-red-400 border-red-500/20 text-[11px]'
                    }>
                      {exc.is_available ? 'Available' : 'Blocked'}
                    </Badge>

                    {/* Session type */}
                    <span className="text-xs text-slate-500 truncate flex-1">{exc.session_type}</span>

                    {/* Note */}
                    {exc.notes && (
                      <span className="text-xs text-slate-600 italic truncate max-w-[160px]">"{exc.notes}"</span>
                    )}

                    {/* Delete */}
                    <Button size="sm" variant="ghost" onClick={() => setDeleteExcId(exc.id)}
                      className="h-7 px-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════ */}
      {/* ── ADD RULE MODAL ── */}
      {/* ════════════════════════════════════════════ */}
      {showRuleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowRuleForm(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-100">Add Availability Rule</h2>
              <button onClick={() => setShowRuleForm(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            {/* Session Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Session Type *</label>
              <select value={ruleForm.session_type_id} onChange={e => setRuleForm(f => ({ ...f, session_type_id: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors">
                {SESSION_TYPES.map(st => <option key={st.id} value={st.id}>{st.title}</option>)}
              </select>
            </div>

            {/* Day of week */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Day of Week *</label>
              <div className="grid grid-cols-7 gap-1">
                {DAY_SHORT.map((day, i) => (
                  <button key={day} onClick={() => setRuleForm(f => ({ ...f, day_of_week: i }))}
                    className={`py-2 rounded-lg text-xs font-medium transition-all ${
                      ruleForm.day_of_week === i
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        : 'bg-slate-800 text-slate-500 hover:text-slate-300 border border-slate-700'
                    }`}>
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Start + End time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Start Time</label>
                <input type="time" value={ruleForm.start_time} onChange={e => setRuleForm(f => ({ ...f, start_time: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 [color-scheme:dark] transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">End Time</label>
                <input type="time" value={ruleForm.end_time} onChange={e => setRuleForm(f => ({ ...f, end_time: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 [color-scheme:dark] transition-colors" />
              </div>
            </div>

            {/* Slot duration */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Slot Duration</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[15, 30, 45, 60].map(d => (
                  <button key={d} onClick={() => setRuleForm(f => ({ ...f, slot_duration_minutes: d }))}
                    className={`py-2 rounded-lg text-xs font-medium transition-all ${
                      ruleForm.slot_duration_minutes === d
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        : 'bg-slate-800 text-slate-500 hover:text-slate-300 border border-slate-700'
                    }`}>
                    {d} min
                  </button>
                ))}
              </div>
            </div>

            {/* Repeat interval */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Repeats Every</label>
              <div className="flex items-center gap-2">
                <input type="number" value={ruleForm.interval} onChange={e => setRuleForm(f => ({ ...f, interval: parseInt(e.target.value) || 1 }))}
                  min={1} max={4}
                  className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 text-center transition-colors" />
                <span className="text-sm text-slate-400">week{ruleForm.interval > 1 ? 's' : ''}</span>
                {ruleForm.interval === 1 && <span className="text-xs text-slate-600">(every week)</span>}
                {ruleForm.interval === 2 && <span className="text-xs text-slate-600">(bi-weekly)</span>}
              </div>
            </div>

            {/* Slot preview */}
            {ruleForm.start_time && ruleForm.end_time && (
              <div className="px-3 py-2.5 bg-cyan-500/5 border border-cyan-500/20 rounded-lg">
                <p className="text-xs text-cyan-400">
                  <span className="font-semibold">{countSlots(ruleForm.start_time, ruleForm.end_time, ruleForm.slot_duration_minutes)} slots</span>
                  {' '}of {ruleForm.slot_duration_minutes} min each, every {DAYS[ruleForm.day_of_week]} from {ruleForm.start_time} to {ruleForm.end_time}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button onClick={() => setShowRuleForm(false)} variant="outline" className="flex-1 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800">Cancel</Button>
              <Button onClick={handleAddRule} className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold">Add Rule</Button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* ── ADD EXCEPTION MODAL ── */}
      {/* ════════════════════════════════════════════ */}
      {showExcForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowExcForm(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-100">Add Date Exception</h2>
              <button onClick={() => setShowExcForm(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            {/* Session Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Session Type *</label>
              <select value={excForm.session_type_id} onChange={e => setExcForm(f => ({ ...f, session_type_id: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors">
                {SESSION_TYPES.map(st => <option key={st.id} value={st.id}>{st.title}</option>)}
              </select>
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Date *</label>
              <input type="date" value={excForm.date} onChange={e => setExcForm(f => ({ ...f, date: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 [color-scheme:dark] transition-colors" />
            </div>

            {/* Available / Blocked toggle */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setExcForm(f => ({ ...f, is_available: false }))}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                    !excForm.is_available ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
                  }`}>
                  <XCircle className="w-4 h-4" /> Blocked
                </button>
                <button onClick={() => setExcForm(f => ({ ...f, is_available: true }))}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                    excForm.is_available ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
                  }`}>
                  <CheckCircle2 className="w-4 h-4" /> Available
                </button>
              </div>
              <p className="text-[10px] text-slate-600">
                {excForm.is_available ? 'Opens this date even if no recurring rule covers it' : 'Blocks this date even if a recurring rule covers it'}
              </p>
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Note <span className="text-slate-600">(optional)</span></label>
              <input type="text" value={excForm.notes} onChange={e => setExcForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Public holiday, Out of office..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors" />
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={() => setShowExcForm(false)} variant="outline" className="flex-1 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800">Cancel</Button>
              <Button onClick={handleAddException} className={`flex-1 font-semibold ${excForm.is_available ? 'bg-emerald-500 hover:bg-emerald-400 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
                {excForm.is_available ? 'Add Open Date' : 'Block Date'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Rule Confirm ── */}
      {deleteRuleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setDeleteRuleId(null)} />
          <div className="relative w-full max-w-sm bg-slate-900 border border-red-500/30 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 text-sm">Delete Rule?</h3>
                <p className="text-xs text-slate-400 mt-0.5">Clients will no longer see slots from this rule.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setDeleteRuleId(null)} variant="outline" className="flex-1 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800">Cancel</Button>
              <Button onClick={() => handleDeleteRule(deleteRuleId)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold">Delete</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Exception Confirm ── */}
      {deleteExcId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setDeleteExcId(null)} />
          <div className="relative w-full max-w-sm bg-slate-900 border border-red-500/30 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 text-sm">Remove Exception?</h3>
                <p className="text-xs text-slate-400 mt-0.5">The date will revert to the recurring rule behaviour.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setDeleteExcId(null)} variant="outline" className="flex-1 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800">Cancel</Button>
              <Button onClick={() => handleDeleteException(deleteExcId)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold">Remove</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
