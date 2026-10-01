'use client'

import { useState } from 'react'
import {
  Plus, Edit2, Trash2, Copy, ToggleLeft, ToggleRight,
  Video, Users, DollarSign, Clock, MapPin, AlertCircle, X,
  Search, Filter, Layers
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────
type SessionFormat = 'webinar' | 'consultation_free' | 'consultation_paid'
type LocationType  = 'online_video' | 'phone' | 'in_person'

interface SessionType {
  id: string
  slug: string
  title: string
  description: string
  session_format: SessionFormat
  category: string
  duration_minutes: number
  price_kes: number
  price_usd: number
  max_slots: number
  location_type: LocationType
  location_details: string
  is_active: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const FORMAT_META: Record<SessionFormat, { label: string; color: string }> = {
  webinar:              { label: 'Webinar',       color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  consultation_free:    { label: 'Free Consult',  color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  consultation_paid:    { label: 'Paid Call',     color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
}

const LOCATION_LABELS: Record<LocationType, string> = {
  online_video: 'Online (Google Meet)',
  phone:        'Phone Call',
  in_person:    'In Person',
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const INITIAL_TYPES: SessionType[] = [
  { id: '1', slug: 'free-audit',           title: 'Free Automation Audit',                  description: 'A 30-min discovery call to identify AI automation opportunities.',    session_format: 'consultation_free', category: 'Consultations', duration_minutes: 30,  price_kes: 0,    price_usd: 0,  max_slots: 1,   location_type: 'online_video', location_details: 'Google Meet link sent on booking', is_active: true },
  { id: '2', slug: 'strategy-call',        title: '1-on-1 Strategy & Architecture Call',    description: 'Deep-dive 60-min session designing custom AI agents and workflows.',  session_format: 'consultation_paid', category: 'Consultations', duration_minutes: 60,  price_kes: 5000, price_usd: 40, max_slots: 1,   location_type: 'online_video', location_details: 'Google Meet link sent on payment', is_active: true },
  { id: '3', slug: 'ai-automation-webinar', title: 'AI Automation Webinar',                 description: 'Group webinar covering AI tools, workflows, and real-world case studies.', session_format: 'webinar',          category: 'Webinars',     duration_minutes: 90,  price_kes: 2500, price_usd: 20, max_slots: 100, location_type: 'online_video', location_details: 'Google Meet link shared upon registration', is_active: true },
  { id: '4', slug: 'free-automation-audit', title: 'Free Automation Audit (30 min)',        description: 'Complimentary discovery call — no strings attached.',                session_format: 'consultation_free', category: 'Consultations', duration_minutes: 30,  price_kes: 0,    price_usd: 0,  max_slots: 1,   location_type: 'online_video', location_details: 'Google Meet link sent on booking', is_active: true },
  { id: '5', slug: 'paid-strategy-call',    title: 'AI Strategy & Architecture Call (60 min)', description: 'In-depth paid consultation with post-session action plan.',          session_format: 'consultation_paid', category: 'Consultations', duration_minutes: 60,  price_kes: 5000, price_usd: 40, max_slots: 1,   location_type: 'online_video', location_details: 'Google Meet link sent on payment', is_active: true },
]

const EMPTY_FORM: Omit<SessionType, 'id' | 'category'> = {
  slug: '', title: '', description: '', session_format: 'consultation_free',
  duration_minutes: 60, price_kes: 0, price_usd: 0, max_slots: 1,
  location_type: 'online_video', location_details: '', is_active: true,
}

const CATEGORIES = ['Webinars', 'Consultations']

export default function SessionTypesPage() {
  const [types, setTypes]       = useState<SessionType[]>(INITIAL_TYPES)
  const [search, setSearch]     = useState('')
  const [filterFmt, setFilter]  = useState<SessionFormat | 'all'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm]         = useState({ ...EMPTY_FORM, category: 'Consultations' })

  const isEdit = editId !== null

  // ── Filtered list ──
  const filtered = types.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.slug.includes(search.toLowerCase())
    const matchFilter = filterFmt === 'all' || t.session_format === filterFmt
    return matchSearch && matchFilter
  })

  // ── Actions ──
  const openCreate = () => {
    setForm({ ...EMPTY_FORM, category: 'Consultations' })
    setEditId(null)
    setShowForm(true)
  }

  const openEdit = (t: SessionType) => {
    setForm({ slug: t.slug, title: t.title, description: t.description, session_format: t.session_format, category: t.category, duration_minutes: t.duration_minutes, price_kes: t.price_kes, price_usd: t.price_usd, max_slots: t.max_slots, location_type: t.location_type, location_details: t.location_details, is_active: t.is_active })
    setEditId(t.id)
    setShowForm(true)
  }

  const handleClone = (t: SessionType) => {
    setForm({ slug: slugify(t.title + '-copy'), title: t.title + ' (Copy)', description: t.description, session_format: t.session_format, category: t.category, duration_minutes: t.duration_minutes, price_kes: t.price_kes, price_usd: t.price_usd, max_slots: t.max_slots, location_type: t.location_type, location_details: t.location_details, is_active: false })
    setEditId(null)
    setShowForm(true)
    toast.info('Pre-filled with cloned data — review and save', { position: 'top-left' })
  }

  const closeForm = () => { setShowForm(false); setEditId(null) }

  const handleTitleChange = (title: string) => {
    setForm(f => ({ ...f, title, ...(!isEdit ? { slug: slugify(title) } : {}) }))
  }

  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.slug.trim())  { toast.error('Slug is required'); return }
    if (form.price_kes < 0 || form.price_usd < 0) { toast.error('Price cannot be negative'); return }

    if (isEdit) {
      setTypes(prev => prev.map(t => t.id === editId ? { ...t, ...form } : t))
      toast.success('Session type updated!', { position: 'top-left' })
    } else {
      const newType: SessionType = { id: Date.now().toString(), ...form }
      setTypes(prev => [...prev, newType])
      toast.success('Session type created!', { position: 'top-left' })
    }
    closeForm()
  }

  const handleDelete = (id: string) => {
    setTypes(prev => prev.filter(t => t.id !== id))
    setDeleteId(null)
    toast.success('Session type deleted', { position: 'top-left' })
  }

  const toggleActive = (id: string) => {
    setTypes(prev => prev.map(t => t.id === id ? { ...t, is_active: !t.is_active } : t))
    toast.success('Status updated', { position: 'top-left' })
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Session Types</h1>
          <p className="text-sm text-slate-500 mt-0.5">{types.length} session type{types.length !== 1 ? 's' : ''} configured</p>
        </div>
        <Button onClick={openCreate} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold gap-2 text-sm">
          <Plus className="w-4 h-4" /> New Session Type
        </Button>
      </div>

      {/* ── Search + Filter ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search session types..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'webinar', 'consultation_free', 'consultation_paid'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterFmt === f
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              {f === 'all' ? 'All' : FORMAT_META[f as SessionFormat].label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Session Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Format</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Duration</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Pricing</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Slots</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map(t => {
                const fmt = FORMAT_META[t.session_format]
                return (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="font-medium text-slate-200 leading-snug">{t.title}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{t.slug}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">{t.category}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge className={`text-[11px] px-2 py-0.5 ${fmt.color}`}>{fmt.label}</Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 text-slate-300 text-xs">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {t.duration_minutes} min
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {t.price_kes === 0 ? (
                        <span className="text-emerald-400 text-xs font-medium">Free</span>
                      ) : (
                        <div className="text-xs">
                          <p className="text-slate-200 font-medium">KES {t.price_kes.toLocaleString()}</p>
                          <p className="text-slate-500">USD {t.price_usd}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-slate-400">
                        {t.max_slots === 1 ? '1:1' : `${t.max_slots} max`}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button onClick={() => toggleActive(t.id)} className="flex items-center gap-1.5">
                        {t.is_active
                          ? <ToggleRight className="w-4 h-4 text-emerald-400" />
                          : <ToggleLeft className="w-4 h-4 text-slate-600" />
                        }
                        <span className={`text-xs ${t.is_active ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {t.is_active ? 'Active' : 'Off'}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleClone(t)}
                          className="h-7 px-2 text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10" title="Clone">
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(t)}
                          className="h-7 px-2 text-slate-400 hover:text-white hover:bg-slate-800" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteId(t.id)}
                          className="h-7 px-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500 text-sm">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No session types found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create / Edit Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={closeForm} />
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-base font-bold text-slate-100">{isEdit ? 'Edit Session Type' : 'New Session Type'}</h2>
              <button onClick={closeForm} className="text-slate-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-6 space-y-5">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Title *</label>
                <input type="text" value={form.title} onChange={e => handleTitleChange(e.target.value)}
                  placeholder="e.g. AI Strategy Call (60 min)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors" />
              </div>

              {/* Slug */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Slug *</label>
                <input type="text" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500 transition-colors" />
              </div>

              {/* Category + Format in row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Format *</label>
                  <select value={form.session_format} onChange={e => {
                    const f = e.target.value as SessionFormat
                    setForm(prev => ({ ...prev, session_format: f, price_kes: f === 'consultation_free' ? 0 : prev.price_kes, price_usd: f === 'consultation_free' ? 0 : prev.price_usd, max_slots: f === 'webinar' ? 100 : 1 }))
                  }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors">
                    <option value="webinar">Webinar (Group)</option>
                    <option value="consultation_free">Free Consultation (1:1)</option>
                    <option value="consultation_paid">Paid Strategy Call (1:1)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} placeholder="What will attendees get from this session..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none transition-colors" />
              </div>

              {/* Duration + Slots */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Duration (minutes)</label>
                  <input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 30 }))} min={15} step={15}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Max Slots</label>
                  <input type="number" value={form.max_slots} onChange={e => setForm(f => ({ ...f, max_slots: parseInt(e.target.value) || 1 }))} min={1}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors" />
                </div>
              </div>

              {/* Pricing (hidden for free) */}
              {form.session_format !== 'consultation_free' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">Price (KES)</label>
                    <input type="number" value={form.price_kes} onChange={e => setForm(f => ({ ...f, price_kes: parseFloat(e.target.value) || 0 }))} min={0}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">Price (USD)</label>
                    <input type="number" value={form.price_usd} onChange={e => setForm(f => ({ ...f, price_usd: parseFloat(e.target.value) || 0 }))} min={0}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors" />
                  </div>
                </div>
              )}

              {/* Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Location Type</label>
                <select value={form.location_type} onChange={e => setForm(f => ({ ...f, location_type: e.target.value as LocationType }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors">
                  <option value="online_video">Online — Google Meet</option>
                  <option value="phone">Phone Call</option>
                  <option value="in_person">In Person</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Location Details</label>
                <input type="text" value={form.location_details} onChange={e => setForm(f => ({ ...f, location_details: e.target.value }))}
                  placeholder="e.g. Google Meet link sent upon booking confirmation"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors" />
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-lg">
                <div>
                  <p className="text-xs font-medium text-slate-300">Active</p>
                  <p className="text-[10px] text-slate-500">Visible to clients for booking</p>
                </div>
                <button onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className={`w-10 h-5 rounded-full transition-colors relative ${form.is_active ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Submit */}
              <div className="flex gap-2 pt-1">
                <Button onClick={closeForm} variant="outline" className="flex-1 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800">Cancel</Button>
                <Button onClick={handleSubmit} className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold">
                  {isEdit ? 'Save Changes' : 'Create Session Type'}
                </Button>
              </div>
            </div>
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
                <h3 className="font-semibold text-slate-100 text-sm">Delete Session Type?</h3>
                <p className="text-xs text-slate-400 mt-0.5">All sessions linked to this type will also be affected.</p>
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
