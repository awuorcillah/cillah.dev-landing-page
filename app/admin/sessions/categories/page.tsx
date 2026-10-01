'use client'

import { useState } from 'react'
import {
  FolderOpen, Plus, Edit2, Trash2, Video, Users, Zap,
  BookOpen, Star, Globe, Phone, Radio, ToggleLeft, ToggleRight,
  GripVertical, Check, X, AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

// ─── Available icons ───────────────────────────────────────────────────────────
const ICONS = [
  { name: 'video',    Icon: Video,    label: 'Video'    },
  { name: 'users',    Icon: Users,    label: 'Users'    },
  { name: 'zap',      Icon: Zap,      label: 'Zap'      },
  { name: 'bookopen', Icon: BookOpen, label: 'Book'     },
  { name: 'star',     Icon: Star,     label: 'Star'     },
  { name: 'globe',    Icon: Globe,    label: 'Globe'    },
  { name: 'phone',    Icon: Phone,    label: 'Phone'    },
  { name: 'radio',    Icon: Radio,    label: 'Radio'    },
]

function getIcon(name: string) {
  return ICONS.find(i => i.name === name)?.Icon || FolderOpen
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// ─── Mock seed data (replace with Supabase fetch after design approval) ───────
const INITIAL_CATEGORIES = [
  { id: '1', name: 'Webinars',      slug: 'webinars',      description: 'Group online sessions on AI automation, tools, and strategies', icon: 'video',    sort_order: 1, is_active: true,  session_count: 3 },
  { id: '2', name: 'Consultations', slug: 'consultations', description: 'One-on-one personalised AI audit and strategy sessions',         icon: 'users',    sort_order: 2, is_active: true,  session_count: 2 },
]

type Category = typeof INITIAL_CATEGORIES[0]

const EMPTY_FORM = { name: '', slug: '', description: '', icon: 'video', sort_order: 0, is_active: true }

export default function SessionCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES)
  const [showForm, setShowForm]     = useState(false)
  const [editId, setEditId]         = useState<string | null>(null)
  const [deleteId, setDeleteId]     = useState<string | null>(null)
  const [form, setForm]             = useState(EMPTY_FORM)

  const isEdit = editId !== null

  // ── Helpers ──
  const openCreate = () => {
    setForm(EMPTY_FORM)
    setEditId(null)
    setShowForm(true)
  }

  const openEdit = (cat: Category) => {
    setForm({ name: cat.name, slug: cat.slug, description: cat.description, icon: cat.icon, sort_order: cat.sort_order, is_active: cat.is_active })
    setEditId(cat.id)
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditId(null) }

  const handleNameChange = (name: string) => {
    setForm(f => ({ ...f, name, ...(!isEdit ? { slug: slugify(name) } : {}) }))
  }

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error('Category name is required'); return }
    if (!form.slug.trim()) { toast.error('Slug is required'); return }

    if (isEdit) {
      setCategories(prev => prev.map(c => c.id === editId ? { ...c, ...form } : c))
      toast.success('Category updated!', { position: 'top-left' })
    } else {
      const newCat: Category = { id: Date.now().toString(), ...form, session_count: 0 }
      setCategories(prev => [...prev, newCat])
      toast.success('Category created!', { position: 'top-left' })
    }
    closeForm()
  }

  const handleDelete = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id))
    setDeleteId(null)
    toast.success('Category deleted', { position: 'top-left' })
  }

  const toggleActive = (id: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c))
    toast.success('Status updated', { position: 'top-left' })
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Session Categories</h1>
          <p className="text-sm text-slate-500 mt-0.5">Organise your session types into groups</p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> New Category
        </Button>
      </div>

      {/* ── Categories Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map(cat => {
          const Icon = getIcon(cat.icon)
          return (
            <Card key={cat.id} className={`bg-slate-900/70 border-slate-800 hover:border-slate-700 transition-colors ${!cat.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-100 truncate">{cat.name}</h3>
                        <Badge className={cat.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]'
                          : 'bg-slate-700/60 text-slate-500 text-[10px]'
                        }>
                          {cat.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">/{cat.slug}</p>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">{cat.description}</p>
                      <p className="text-[11px] text-slate-600 mt-2">{cat.session_count} session type{cat.session_count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => toggleActive(cat.id)}
                    className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {cat.is_active
                      ? <ToggleRight className="w-4 h-4 text-emerald-400" />
                      : <ToggleLeft className="w-4 h-4" />
                    }
                    {cat.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <div className="flex-1" />
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => openEdit(cat)}
                    className="h-7 px-2.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => setDeleteId(cat.id)}
                    className="h-7 px-2.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* Empty state */}
        {categories.length === 0 && (
          <div className="col-span-2 flex flex-col items-center justify-center py-16 text-slate-500">
            <FolderOpen className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No categories yet</p>
            <Button onClick={openCreate} size="sm" variant="outline" className="mt-3 border-slate-700 text-slate-400 hover:text-white">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Create your first category
            </Button>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={closeForm} />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-100">{isEdit ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={closeForm} className="text-slate-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Category Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. Webinars"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Slug *</label>
              <input
                type="text"
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                placeholder="webinars"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono transition-colors"
              />
              <p className="text-[10px] text-slate-600">Auto-generated from name. URL-safe lowercase only.</p>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Short description of this category..."
                rows={2}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none transition-colors"
              />
            </div>

            {/* Icon picker */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Icon</label>
              <div className="grid grid-cols-8 gap-1.5">
                {ICONS.map(({ name, Icon, label }) => (
                  <button
                    key={name}
                    title={label}
                    onClick={() => setForm(f => ({ ...f, icon: name }))}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      form.icon === name
                        ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                        : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Sort order */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Sort Order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                min={0}
                className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-lg">
              <div>
                <p className="text-xs font-medium text-slate-300">Active</p>
                <p className="text-[10px] text-slate-500">Visible to clients on the booking page</p>
              </div>
              <button
                onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                className={`w-10 h-5 rounded-full transition-colors relative ${form.is_active ? 'bg-cyan-500' : 'bg-slate-700'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-1">
              <Button onClick={closeForm} variant="outline" className="flex-1 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800">Cancel</Button>
              <Button onClick={handleSubmit} className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold">
                {isEdit ? 'Save Changes' : 'Create Category'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative w-full max-w-sm bg-slate-900 border border-red-500/30 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 text-sm">Delete Category?</h3>
                <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone. Session types in this category will be unlinked.</p>
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
