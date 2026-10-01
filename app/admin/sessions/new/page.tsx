'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Video, Clock, Users, DollarSign, Globe, Lock, Save, Send, X, Info, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

type SessionFormat = 'webinar' | 'consultation_free' | 'consultation_paid'

const SESSION_TYPES = [
  { id: '1', slug: 'free-audit',             title: 'Free Automation Audit (30 min)',          session_format: 'consultation_free' as SessionFormat, duration_minutes: 30,  price_kes: 0,    price_usd: 0  },
  { id: '2', slug: 'strategy-call',           title: 'AI Strategy & Architecture Call (60 min)', session_format: 'consultation_paid' as SessionFormat, duration_minutes: 60,  price_kes: 5000, price_usd: 40 },
  { id: '3', slug: 'ai-automation-webinar',   title: 'AI Automation Webinar (90 min)',           session_format: 'webinar'           as SessionFormat, duration_minutes: 90,  price_kes: 2500, price_usd: 20 },
]

const FORMAT_META: Record<SessionFormat, { label: string; color: string }> = {
  webinar:            { label: 'Webinar',       color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  consultation_free:  { label: 'Free Consult',  color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  consultation_paid:  { label: 'Paid Call',     color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
}

export default function NewSessionPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    session_type_id: '',
    title: '',
    description: '',
    date: '',
    start_time: '',
    duration_minutes: 60,
    meet_link: '',
    max_attendees: 1,
    is_public: true,
    is_paid: false,
    price_kes: 0,
    price_usd: 0,
    notes: '',
  })
  const [status, setStatus] = useState<'draft' | 'scheduled'>('draft')
  const [saving, setSaving] = useState(false)

  const selectedType = SESSION_TYPES.find(t => t.id === form.session_type_id)
  const format = selectedType?.session_format

  const handleTypeSelect = (typeId: string) => {
    const t = SESSION_TYPES.find(s => s.id === typeId)
    if (!t) return
    setForm(f => ({
      ...f,
      session_type_id: typeId,
      title: f.title || t.title,
      duration_minutes: t.duration_minutes,
      max_attendees: t.session_format === 'webinar' ? 100 : 1,
      is_paid: t.price_kes > 0,
      price_kes: t.price_kes,
      price_usd: t.price_usd,
      is_public: t.session_format === 'webinar',
    }))
  }

  const validate = () => {
    if (!form.session_type_id) { toast.error('Select a session type'); return false }
    if (!form.title.trim())    { toast.error('Session title is required'); return false }
    if (!form.date)            { toast.error('Date is required'); return false }
    if (!form.start_time)      { toast.error('Start time is required'); return false }
    return true
  }

  const handleSave = async (publish: boolean) => {
    if (!validate()) return
    setSaving(true)
    // Simulate API call — replace with Supabase insert after design approval
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    const newStatus = publish ? 'scheduled' : 'draft'
    setStatus(newStatus)
    toast.success(publish ? '🚀 Session published!' : '💾 Saved as draft', { position: 'top-left' })
    router.push('/admin/sessions')
  }

  const endTime = () => {
    if (!form.start_time) return '—'
    const [h, m] = form.start_time.split(':').map(Number)
    const end = new Date(0, 0, 0, h, m + form.duration_minutes)
    return end.toTimeString().slice(0, 5)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Link href="/admin/sessions">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white gap-1.5 -ml-2">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Schedule New Session</h1>
          <p className="text-sm text-slate-500 mt-0.5">Fill in the details and choose to save as draft or publish</p>
        </div>
      </div>

      {/* ── Session Type Picker ── */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Session Type *</label>
        <div className="grid grid-cols-1 gap-2">
          {SESSION_TYPES.map(t => {
            const meta = FORMAT_META[t.session_format]
            const selected = form.session_type_id === t.id
            return (
              <button key={t.id} onClick={() => handleTypeSelect(t.id)}
                className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                  selected ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selected ? 'bg-cyan-500/20' : 'bg-slate-800'}`}>
                  <Video className={`w-4 h-4 ${selected ? 'text-cyan-400' : 'text-slate-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${selected ? 'text-slate-100' : 'text-slate-300'}`}>{t.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge className={`text-[10px] px-1.5 py-0 ${meta.color}`}>{meta.label}</Badge>
                    <span className="text-[10px] text-slate-500">{t.duration_minutes} min</span>
                    <span className="text-[10px] text-slate-500">{t.price_kes === 0 ? 'Free' : `KES ${t.price_kes.toLocaleString()}`}</span>
                  </div>
                </div>
                {selected && <div className="w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0"><div className="w-1.5 h-1.5 rounded-full bg-white" /></div>}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Title ── */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400">Session Title *</label>
        <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="e.g. AI Automation for Real Estate Agencies"
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors" />
      </div>

      {/* ── Description ── */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400">Description</label>
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={3} placeholder="What will attendees learn or get from this session..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none transition-colors" />
      </div>

      {/* ── Date + Time ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Date *</label>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            min={new Date().toISOString().split('T')[0]}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors [color-scheme:dark]" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Start Time (EAT) *</label>
          <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors [color-scheme:dark]" />
        </div>
      </div>

      {/* Duration + End time preview */}
      <div className="flex items-center gap-3">
        <div className="space-y-1.5 w-40">
          <label className="text-xs font-medium text-slate-400">Duration (minutes)</label>
          <input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 30 }))}
            min={15} step={15}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors" />
        </div>
        {form.start_time && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-5">
            <Clock className="w-3.5 h-3.5" />
            <span>{form.start_time} → {endTime()} EAT</span>
          </div>
        )}
      </div>

      {/* ── Google Meet Link ── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-400">Google Meet Link</label>
          <span className="text-[10px] text-slate-600">Paste your Meet URL here (auto-generate coming in Phase 3)</span>
        </div>
        <div className="relative">
          <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="url" value={form.meet_link} onChange={e => setForm(f => ({ ...f, meet_link: e.target.value }))}
            placeholder="https://meet.google.com/xxx-xxxx-xxx"
            className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors" />
        </div>
      </div>

      {/* ── Max Attendees ── */}
      {format === 'webinar' && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Max Attendees</label>
          <input type="number" value={form.max_attendees} onChange={e => setForm(f => ({ ...f, max_attendees: parseInt(e.target.value) || 1 }))}
            min={1}
            className="w-40 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors" />
        </div>
      )}

      {/* ── Pricing (for paid) ── */}
      {form.is_paid && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Price (KES)</label>
            <input type="number" value={form.price_kes} onChange={e => setForm(f => ({ ...f, price_kes: parseFloat(e.target.value) || 0 }))} min={0}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Price (USD)</label>
            <input type="number" value={form.price_usd} onChange={e => setForm(f => ({ ...f, price_usd: parseFloat(e.target.value) || 0 }))} min={0}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors" />
          </div>
        </div>
      )}

      {/* ── Visibility toggle ── */}
      {format === 'webinar' && (
        <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-start gap-3">
            {form.is_public ? <Globe className="w-4 h-4 text-cyan-400 mt-0.5" /> : <Lock className="w-4 h-4 text-slate-500 mt-0.5" />}
            <div>
              <p className="text-sm font-medium text-slate-200">{form.is_public ? 'Public' : 'Private'}</p>
              <p className="text-xs text-slate-500">{form.is_public ? 'Visible on the booking page — anyone can register' : 'Only accessible via direct link'}</p>
            </div>
          </div>
          <button onClick={() => setForm(f => ({ ...f, is_public: !f.is_public }))}
            className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${form.is_public ? 'bg-cyan-500' : 'bg-slate-700'}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_public ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      )}

      {/* ── Internal notes ── */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400">Internal Notes <span className="text-slate-600">(admin only)</span></label>
        <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          rows={2} placeholder="Private notes, reminders, prep checklist..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none transition-colors" />
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex items-center gap-3 pt-2 pb-8">
        <Button
          onClick={() => handleSave(false)}
          disabled={saving}
          variant="outline"
          className="flex-1 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save as Draft'}
        </Button>
        <Button
          onClick={() => handleSave(true)}
          disabled={saving}
          className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold gap-2"
        >
          <Send className="w-4 h-4" />
          {saving ? 'Publishing...' : 'Publish Session'}
        </Button>
      </div>

      {/* ── Tip ── */}
      <div className="flex items-start gap-2 px-4 py-3 bg-blue-500/5 border border-blue-500/20 rounded-xl -mt-4">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-300/70">
          <span className="font-semibold">Drafts</span> are only visible to you. <span className="font-semibold">Published</span> sessions appear on the booking page immediately. You can unpublish at any time from the sessions list.
        </p>
      </div>
    </div>
  )
}
