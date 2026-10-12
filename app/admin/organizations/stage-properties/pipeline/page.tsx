'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Building2, Users, Flame, Sun, Search, Filter,
  Calendar, Phone, Clock, MessageSquare, Shield,
  RefreshCw, CheckCircle2, UserPlus, Sparkles, Loader2,
  Repeat, AlertOctagon, UserCheck, Send, Tag,
  LayoutGrid, List, SlidersHorizontal, Palette, ArrowLeft,
  ArrowRight, Eye, EyeOff, RotateCcw, ExternalLink,
  ChevronDown, PhoneCall, Check, Star, ShieldAlert
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export type LeadStatus = 'new_enquiry' | 'hot_lead' | 'warm_lead' | 'repeat_user' | 'spam'
export type DateFilter = 'all' | 'today' | '7days' | '30days' | 'custom'
export type ViewMode = 'kanban' | 'table'

export interface LeadNote {
  id: string
  lead_id: string
  agent_name: string
  note_text: string
  created_at: string
}

export interface StageLead {
  id: string
  org_id?: string | null
  ig_username?: string | null
  ig_user_id?: string | null
  full_name: string
  phone_number: string
  property_interest: string
  intent: 'BUY' | 'RENT'
  assigned_agent_id?: string | null
  assigned_agent_name: string
  assigned_agent_email?: string | null
  status: LeadStatus | string
  chat_history?: string | null
  notes?: LeadNote[]
  created_at: string
  updated_at: string
}

export interface StaffMember {
  id: string
  full_name: string
  email: string
  phone_number: string
  role: string
  is_active: boolean
}

// ── Column Configuration Definition ──
export interface ColumnConfig {
  key: LeadStatus
  title: string
  iconName: string
  colorTheme: string // e.g. 'blue', 'rose', 'amber', 'purple', 'emerald', 'cyan', 'slate'
  visible: boolean
}

const COLOR_PRESETS: Record<string, {
  name: string
  badgeCls: string
  borderCls: string
  bgHeaderCls: string
  dotCls: string
  textCls: string
}> = {
  blue: {
    name: 'Ocean Blue',
    badgeCls: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    borderCls: 'border-blue-500/40 hover:border-blue-500/70',
    bgHeaderCls: 'bg-blue-500/10 text-blue-400',
    dotCls: 'bg-blue-400',
    textCls: 'text-blue-400'
  },
  rose: {
    name: 'Fire Rose',
    badgeCls: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    borderCls: 'border-rose-500/40 hover:border-rose-500/70',
    bgHeaderCls: 'bg-rose-500/10 text-rose-400',
    dotCls: 'bg-rose-400',
    textCls: 'text-rose-400'
  },
  amber: {
    name: 'Dubai Gold',
    badgeCls: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    borderCls: 'border-amber-500/40 hover:border-amber-500/70',
    bgHeaderCls: 'bg-amber-500/10 text-amber-400',
    dotCls: 'bg-amber-400',
    textCls: 'text-amber-400'
  },
  purple: {
    name: 'Royal Violet',
    badgeCls: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    borderCls: 'border-purple-500/40 hover:border-purple-500/70',
    bgHeaderCls: 'bg-purple-500/10 text-purple-400',
    dotCls: 'bg-purple-400',
    textCls: 'text-purple-400'
  },
  emerald: {
    name: 'Emerald Jade',
    badgeCls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    borderCls: 'border-emerald-500/40 hover:border-emerald-500/70',
    bgHeaderCls: 'bg-emerald-500/10 text-emerald-400',
    dotCls: 'bg-emerald-400',
    textCls: 'text-emerald-400'
  },
  cyan: {
    name: 'Sky Cyan',
    badgeCls: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    borderCls: 'border-cyan-500/40 hover:border-cyan-500/70',
    bgHeaderCls: 'bg-cyan-500/10 text-cyan-400',
    dotCls: 'bg-cyan-400',
    textCls: 'text-cyan-400'
  },
  slate: {
    name: 'Charcoal',
    badgeCls: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    borderCls: 'border-slate-500/40 hover:border-slate-500/70',
    bgHeaderCls: 'bg-slate-500/10 text-slate-400',
    dotCls: 'bg-slate-400',
    textCls: 'text-slate-400'
  }
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'new_enquiry', title: '🆕 New Enquiry', iconName: 'Sparkles', colorTheme: 'blue', visible: true },
  { key: 'hot_lead', title: '🔥 Hot Lead', iconName: 'Flame', colorTheme: 'rose', visible: true },
  { key: 'warm_lead', title: '☀️ Warm Lead', iconName: 'Sun', colorTheme: 'amber', visible: true },
  { key: 'repeat_user', title: '🔄 Repeat User', iconName: 'Repeat', colorTheme: 'purple', visible: true },
  { key: 'spam', title: '🚫 Spam / Disqualified', iconName: 'AlertOctagon', colorTheme: 'slate', visible: true }
]

export default function StagePropertiesPipelinePage() {
  const supabase = createClient()

  const [leads, setLeads] = useState<StageLead[]>([])
  const [agents, setAgents] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [agentFilter, setAgentFilter] = useState('All Sales Agents')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  const [selectedLead, setSelectedLead] = useState<StageLead | null>(null)

  // ── Agent Customization State (Stored in LocalStorage) ──
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS)
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false)
  const [myLeadsOnly, setMyLeadsOnly] = useState(false)

  // Note & status update form state
  const [newNoteText, setNewNoteText] = useState('')
  const [newStatus, setNewStatus] = useState<LeadStatus>('new_enquiry')
  const [reassignAgent, setReassignAgent] = useState<string>('')
  const [isSubmittingNote, setIsSubmittingNote] = useState(false)

  // ── Load Saved Customizations ──
  useEffect(() => {
    try {
      const savedCols = localStorage.getItem('stage_pipeline_cols_v2')
      if (savedCols) {
        setColumns(JSON.parse(savedCols))
      }
      const savedView = localStorage.getItem('stage_pipeline_view_v2')
      if (savedView === 'kanban' || savedView === 'table') {
        setViewMode(savedView)
      }
    } catch (e) {
      console.warn('LocalStorage load failed:', e)
    }
  }, [])

  // Save Columns to LocalStorage
  const saveColumns = (newCols: ColumnConfig[]) => {
    setColumns(newCols)
    try {
      localStorage.setItem('stage_pipeline_cols_v2', JSON.stringify(newCols))
    } catch (e) {}
  }

  // Save View Mode to LocalStorage
  const handleToggleView = (mode: ViewMode) => {
    setViewMode(mode)
    try {
      localStorage.setItem('stage_pipeline_view_v2', mode)
    } catch (e) {}
  }

  // ── Column Reordering & Customization Handlers ──
  const moveColumn = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= columns.length) return
    const updated = [...columns]
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp
    saveColumns(updated)
    toast.success(`Moved "${temp.title}" ${direction}`)
  }

  const changeColumnColor = (key: LeadStatus, newColor: string) => {
    const updated = columns.map(c => c.key === key ? { ...c, colorTheme: newColor } : c)
    saveColumns(updated)
    toast.success(`Updated column color to ${COLOR_PRESETS[newColor]?.name || newColor}`)
  }

  const toggleColumnVisibility = (key: LeadStatus) => {
    const updated = columns.map(c => c.key === key ? { ...c, visible: !c.visible } : c)
    saveColumns(updated)
  }

  const resetColumnsToDefault = () => {
    saveColumns(DEFAULT_COLUMNS)
    toast.success('Reset pipeline columns to standard configuration')
  }

  // ── Fetch Active Agents & Leads from Supabase ──
  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Fetch Staff Members (Sales Agents for Stage Properties only)
      const STAGE_PROPERTIES_ORG_ID = 'a1b2c3d4-e5f6-7890-abcd-111111111111'
      const { data: staffData } = await supabase
        .from('staff_members')
        .select('*')
        .eq('org_id', STAGE_PROPERTIES_ORG_ID)
        .eq('is_active', true)
        .order('full_name', { ascending: true })

      if (staffData && staffData.length > 0) {
        setAgents(staffData)
      } else {
        setAgents([
          { id: '12965bb8-61a8-44ea-a6e1-13605250722c', full_name: 'Ador', email: 'ador.ai815@gmail.com', phone_number: '0794357912', role: 'sales', is_active: true }
        ])
      }

      // 2. Fetch Leads from Supabase scoped to Stage Properties
      const { data: dbLeads, error } = await supabase
        .from('stage_leads')
        .select('*')
        .eq('org_id', STAGE_PROPERTIES_ORG_ID)
        .order('created_at', { ascending: false })

      if (dbLeads && dbLeads.length > 0) {
        const normalized = dbLeads.map(l => ({
          ...l,
          status: (l.status === 'new_inquiry' ? 'new_enquiry' : (l.status === 'repeat_inquiry' ? 'repeat_user' : l.status)) || 'new_enquiry',
          notes: Array.isArray(l.notes) ? l.notes : []
        }))
        setLeads(normalized)
      } else {
        // High fidelity sample leads
        setLeads([
          {
            id: 'SL-9001',
            full_name: 'Cheryl Atulah',
            phone_number: '+254794357912',
            property_interest: 'Sobha Hartland Waterfront Villa',
            intent: 'BUY',
            assigned_agent_name: 'Ador',
            status: 'new_enquiry',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            notes: [
              {
                id: 'N-1',
                lead_id: 'SL-9001',
                agent_name: 'AI Instagram Agent',
                note_text: 'Qualified via Instagram Direct Message. Client interested in purchasing off-plan waterfront villa in Sobha Hartland.',
                created_at: new Date().toISOString()
              }
            ]
          },
          {
            id: 'SL-9002',
            full_name: 'Ghassan Saliba',
            phone_number: '+971 52 208 1705',
            property_interest: 'Sobha Hartland 2 Off-Plan Residences',
            intent: 'BUY',
            assigned_agent_name: 'Ador',
            status: 'repeat_user',
            created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
            updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
            notes: [
              {
                id: 'N-2',
                lead_id: 'SL-9002',
                agent_name: 'Ador',
                note_text: 'Client re-inquired on Instagram about handover timeline and payment milestones.',
                created_at: new Date(Date.now() - 3600000 * 4).toISOString()
              }
            ]
          },
          {
            id: 'SL-9003',
            full_name: 'Tariq Al-Mansoor',
            phone_number: '+971 54 991 3320',
            property_interest: 'The Opus Commercial Suites',
            intent: 'RENT',
            assigned_agent_name: 'Cherryl Atulah',
            status: 'hot_lead',
            created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
            updated_at: new Date(Date.now() - 3600000 * 48).toISOString(),
            notes: [
              {
                id: 'N-3',
                lead_id: 'SL-9003',
                agent_name: 'Cherryl Atulah',
                note_text: 'Contract drafting in progress for 3,400 sq.ft commercial space.',
                created_at: new Date(Date.now() - 3600000 * 12).toISOString()
              }
            ]
          }
        ])
      }
    } catch (err) {
      toast.error('Failed to load Stage Properties pipeline')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // ── Date Filtering Helper ──
  const isWithinDateRange = (dateStr: string) => {
    if (dateFilter === 'all') return true
    const created = new Date(dateStr)
    const now = new Date()

    if (dateFilter === 'today') {
      return (
        created.getFullYear() === now.getFullYear() &&
        created.getMonth() === now.getMonth() &&
        created.getDate() === now.getDate()
      )
    }
    if (dateFilter === '7days') {
      const d7 = new Date()
      d7.setDate(now.getDate() - 7)
      return created >= d7
    }
    if (dateFilter === '30days') {
      const d30 = new Date()
      d30.setDate(now.getDate() - 30)
      return created >= d30
    }
    if (dateFilter === 'custom') {
      if (!customStartDate && !customEndDate) return true
      const start = customStartDate ? new Date(customStartDate) : new Date(0)
      const end = customEndDate ? new Date(customEndDate + 'T23:59:59') : new Date()
      return created >= start && created <= end
    }
    return true
  }

  // ── Filtered Leads ──
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchesAgent =
        agentFilter === 'All Sales Agents' ||
        (l.assigned_agent_name && l.assigned_agent_name.toLowerCase().includes(agentFilter.toLowerCase()))
      
      const matchesMyLeads = !myLeadsOnly || l.assigned_agent_name === 'Ador' // Quick filter for currently logged advisor

      const matchesDate = isWithinDateRange(l.created_at)

      const term = search.toLowerCase().trim()
      const matchesSearch =
        !term ||
        l.full_name?.toLowerCase().includes(term) ||
        l.phone_number?.toLowerCase().includes(term) ||
        l.property_interest?.toLowerCase().includes(term) ||
        l.ig_username?.toLowerCase().includes(term) ||
        l.id?.toLowerCase().includes(term)

      return matchesAgent && matchesMyLeads && matchesDate && matchesSearch
    })
  }, [leads, agentFilter, myLeadsOnly, dateFilter, customStartDate, customEndDate, search])

  // ── Metrics Calculation ──
  const totalLeads = leads.length
  const newCount = leads.filter(l => l.status === 'new_enquiry' || l.status === 'new_inquiry').length
  const hotCount = leads.filter(l => l.status === 'hot_lead').length
  const warmCount = leads.filter(l => l.status === 'warm_lead').length
  const repeatCount = leads.filter(l => l.status === 'repeat_user' || l.status === 'repeat_inquiry').length
  const spamCount = leads.filter(l => l.status === 'spam').length

  const todayCount = leads.filter(l => {
    const created = new Date(l.created_at)
    const now = new Date()
    return (
      created.getFullYear() === now.getFullYear() &&
      created.getMonth() === now.getMonth() &&
      created.getDate() === now.getDate()
    )
  }).length

  // ── Quick Change Lead Status (1-Click Pipeline Advance) ──
  const handleQuickAdvance = async (leadId: string, targetStatus: LeadStatus) => {
    const now = new Date().toISOString()
    const updated = leads.map(l => l.id === leadId ? { ...l, status: targetStatus, updated_at: now } : l)
    setLeads(updated)

    try {
      await supabase
        .from('stage_leads')
        .update({ status: targetStatus, updated_at: now })
        .eq('id', leadId)
      toast.success(`Moved to ${targetStatus.replace('_', ' ').toUpperCase()}`)
    } catch (err) {
      console.error(err)
    }
  }

  // ── Add Follow-up Note & Update Lead in Modal ──
  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLead) return

    setIsSubmittingNote(true)
    try {
      const now = new Date().toISOString()
      const updatedNotes = [...(selectedLead.notes || [])]

      if (newNoteText.trim()) {
        updatedNotes.unshift({
          id: `N-${Date.now()}`,
          lead_id: selectedLead.id,
          agent_name: reassignAgent || selectedLead.assigned_agent_name || 'Admin',
          note_text: newNoteText.trim(),
          created_at: now
        })
      }

      const assignedName = reassignAgent || selectedLead.assigned_agent_name

      const updatedLeads = leads.map(l => {
        if (l.id === selectedLead.id) {
          return {
            ...l,
            status: newStatus,
            assigned_agent_name: assignedName,
            updated_at: now,
            notes: updatedNotes
          }
        }
        return l
      })

      setLeads(updatedLeads)
      setSelectedLead({
        ...selectedLead,
        status: newStatus,
        assigned_agent_name: assignedName,
        updated_at: now,
        notes: updatedNotes
      })

      try {
        await supabase
          .from('stage_leads')
          .update({
            status: newStatus,
            assigned_agent_name: assignedName,
            updated_at: now
          })
          .eq('id', selectedLead.id)
      } catch (err) {
        console.error('Supabase update note:', err)
      }

      toast.success(`Updated lead: "${newStatus.replace('_', ' ').toUpperCase()}" assigned to ${assignedName}`)
      setNewNoteText('')
    } catch (err) {
      toast.error('Failed to update lead')
    } finally {
      setIsSubmittingNote(false)
    }
  }

  // Helper to build WhatsApp direct link
  const getWhatsAppLink = (lead: StageLead) => {
    const cleanPhone = (lead.phone_number || '').replace(/[^0-9]/g, '')
    const msg = `Hi ${lead.full_name}, this is ${lead.assigned_agent_name || 'your advisor'} from Stage Properties Brokers Dubai. I am reaching out regarding your interest in ${lead.property_interest}. Would you have a moment to connect?`
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24">
      {/* ── Top Header with Stage Properties Luxury Gold Branding ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" /> Stage Properties Brokers L.L.C • Dubai Real Estate
          </div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            📊 Sales CRM Pipeline & Advisor Command Center
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Empowering Stage Properties sales agents with customizable stages, column layouts, and 1-click buyer outreach
          </p>
        </div>

        {/* View Toggle & Workspace Customization Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Kanban vs Table View Switch */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 shadow-inner">
            <button
              onClick={() => handleToggleView('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Board
            </button>
            <button
              onClick={() => handleToggleView('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Table
            </button>
          </div>

          {/* Customize Board Columns Modal Trigger */}
          <Button
            size="sm"
            onClick={() => setIsCustomizeOpen(true)}
            className="bg-slate-900 border border-amber-500/30 text-amber-400 hover:bg-slate-800 hover:border-amber-400 text-xs gap-1.5 shadow-sm"
          >
            <Palette className="w-3.5 h-3.5" />
            Customize Columns & Colors
          </Button>

          {/* Refresh Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={fetchData}
            disabled={loading}
            className="border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Advisor Workspace Notice & Quick Agent Toggle ── */}
      <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-amber-950/20 border border-amber-500/30 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-300 shadow-md">
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong className="text-slate-100 font-semibold">Advisor Workspace:</strong> Customize your column order and colors. Drag or advance leads straight from each card.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMyLeadsOnly(!myLeadsOnly)}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
              myLeadsOnly
                ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {myLeadsOnly ? '⭐ Showing My Leads Only' : '👤 View All Agent Leads'}
          </button>
          <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-300 font-bold shrink-0">
            Today: {todayCount} Inquiries
          </span>
        </div>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
            <CardTitle className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Total Pipeline
            </CardTitle>
            <Users className="w-3.5 h-3.5 text-cyan-400" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl font-bold text-slate-100">{totalLeads}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">All active leads</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-blue-500/20 text-slate-100 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
            <CardTitle className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              🆕 New Enquiry
            </CardTitle>
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl font-bold text-blue-400">{newCount}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Fresh AI inquiries</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-rose-500/20 text-slate-100 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
            <CardTitle className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              🔥 Hot Leads
            </CardTitle>
            <Flame className="w-3.5 h-3.5 text-rose-400" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl font-bold text-rose-400">{hotCount}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Ready to sign/buy</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-amber-500/20 text-slate-100 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
            <CardTitle className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              ☀️ Warm Leads
            </CardTitle>
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl font-bold text-amber-400">{warmCount}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">In follow-up review</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-purple-500/20 text-slate-100 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
            <CardTitle className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              🔄 Repeat User
            </CardTitle>
            <Repeat className="w-3.5 h-3.5 text-purple-400" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl font-bold text-purple-400">{repeatCount}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Returning clients</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 text-slate-100 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
            <CardTitle className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              🚫 Spam / Disq
            </CardTitle>
            <AlertOctagon className="w-3.5 h-3.5 text-slate-500" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl font-bold text-slate-400">{spamCount}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Disqualified bots</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="space-y-4 bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search leads by name, phone, property interest, or Instagram ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-amber-400/60 transition-colors"
            />
          </div>

          {/* Sales Agent Select & Date Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Dynamic Sales Agent Filter */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
              <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <select
                value={agentFilter}
                onChange={e => setAgentFilter(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs font-medium"
              >
                <option value="All Sales Agents" className="bg-slate-900">All Sales Agents</option>
                {agents.map(ag => (
                  <option key={ag.id} value={ag.full_name} className="bg-slate-900">
                    {ag.full_name} ({ag.role || 'Sales'})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
              <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value as DateFilter)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs font-medium"
              >
                <option value="all" className="bg-slate-900">All Time</option>
                <option value="today" className="bg-slate-900">Today</option>
                <option value="7days" className="bg-slate-900">Last 7 Days</option>
                <option value="30days" className="bg-slate-900">Last 30 Days</option>
                <option value="custom" className="bg-slate-900">Custom Date Range</option>
              </select>
            </div>
          </div>
        </div>

        {/* Custom Date Pickers */}
        {dateFilter === 'custom' && (
          <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400">Custom Range:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400"
            />
          </div>
        )}
      </div>

      {/* ── KANBAN BOARD VIEW (Reorderable Columns & Customizable Colors) ── */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4 items-start select-none">
          {columns.filter(col => col.visible).map((col, colIndex) => {
            const colPreset = COLOR_PRESETS[col.colorTheme] || COLOR_PRESETS.blue
            const colLeads = filteredLeads.filter(l => {
              const norm = (l.status === 'new_inquiry' ? 'new_enquiry' : (l.status === 'repeat_inquiry' ? 'repeat_user' : l.status))
              return norm === col.key
            })

            return (
              <div
                key={col.key}
                className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3.5 space-y-3 min-w-[310px] w-[310px] shrink-0 shadow-xl transition-all"
              >
                {/* Column Header & Reordering Controls */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${colPreset.dotCls}`} />
                    <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      {col.title}
                    </h3>
                  </div>

                  {/* Column Count & Left/Right Order Controls */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                      {colLeads.length}
                    </span>

                    {/* Move Left Button */}
                    <button
                      onClick={() => moveColumn(colIndex, 'left')}
                      disabled={colIndex === 0}
                      title="Move Column Left"
                      className="p-1 text-slate-500 hover:text-amber-400 disabled:opacity-20 disabled:hover:text-slate-500 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Right Button */}
                    <button
                      onClick={() => moveColumn(colIndex, 'right')}
                      disabled={colIndex === columns.length - 1}
                      title="Move Column Right"
                      className="p-1 text-slate-500 hover:text-amber-400 disabled:opacity-20 disabled:hover:text-slate-500 transition-colors"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Column Lead Cards Container */}
                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                  {colLeads.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-600 italic border border-dashed border-slate-800/80 rounded-xl bg-slate-950/40">
                      No leads in this stage
                    </div>
                  ) : (
                    colLeads.map(lead => (
                      <Card
                        key={lead.id}
                        className={`bg-slate-900/95 border ${colPreset.borderCls} transition-all p-3.5 space-y-3 shadow-md hover:shadow-xl group`}
                      >
                        {/* Lead Top Bar */}
                        <div className="flex items-start justify-between gap-1.5">
                          <div>
                            <h4 className="text-sm font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                              {lead.full_name}
                            </h4>
                            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono mt-0.5">
                              <Phone className="w-3 h-3 shrink-0" />
                              <span>{lead.phone_number}</span>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            lead.intent === 'BUY'
                              ? 'bg-amber-400/10 text-amber-300 border border-amber-400/30'
                              : 'bg-cyan-400/10 text-cyan-300 border border-cyan-400/30'
                          }`}>
                            {lead.intent}
                          </span>
                        </div>

                        {/* Property Interest */}
                        <div className="text-xs text-slate-300 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/90 space-y-1">
                          <p className="font-semibold text-amber-400 line-clamp-1">{lead.property_interest}</p>
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>Advisor: <strong className="text-slate-200">{lead.assigned_agent_name || 'Ador'}</strong></span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(lead.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>

                        {/* Latest Note Snippet */}
                        {lead.notes && lead.notes.length > 0 && (
                          <div className="text-[11px] text-slate-400 bg-slate-950/40 p-2 rounded border border-slate-800/60 line-clamp-2 italic">
                            "{lead.notes[0].note_text}"
                          </div>
                        )}

                        {/* Quick 1-Click Outreach Buttons for Sales Agent */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                          {/* Direct WhatsApp Call/Chat */}
                          <div className="flex items-center gap-1.5">
                            <a
                              href={getWhatsAppLink(lead)}
                              target="_blank"
                              rel="noreferrer"
                              title="Chat on WhatsApp"
                              className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={`tel:${lead.phone_number}`}
                              title="Direct Phone Call"
                              className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 border border-cyan-500/30 transition-colors"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                            </a>
                          </div>

                          {/* Quick Stage Mover Selector */}
                          <div className="flex items-center gap-1">
                            <select
                              value={lead.status}
                              onChange={e => handleQuickAdvance(lead.id, e.target.value as LeadStatus)}
                              className="bg-slate-950 border border-slate-800 text-slate-300 rounded text-[11px] py-1 px-1.5 focus:outline-none focus:border-amber-400 cursor-pointer font-medium"
                            >
                              <option value="new_enquiry">Move: New</option>
                              <option value="hot_lead">Move: 🔥 Hot</option>
                              <option value="warm_lead">Move: ☀️ Warm</option>
                              <option value="repeat_user">Move: 🔄 Repeat</option>
                              <option value="spam">Move: 🚫 Spam</option>
                            </select>

                            {/* View Full Journey Modal Trigger */}
                            <button
                              onClick={() => {
                                setSelectedLead(lead)
                                setNewStatus((lead.status as LeadStatus) || 'new_enquiry')
                                setReassignAgent(lead.assigned_agent_name || '')
                              }}
                              title="Log Call & Full Notes"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── TABLE VIEW (High-Density Scanning for Fast Processing) ── */}
      {viewMode === 'table' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <p className="text-sm">Loading Stage Properties CRM pipeline...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
              <Users className="w-10 h-10 text-slate-600 mb-2" />
              <p className="text-base font-semibold text-slate-300">No leads match the active filters</p>
              <p className="text-xs text-slate-500">Try adjusting your search query, advisor filter, or date range</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">#</th>
                    <th className="py-3.5 px-4 font-semibold">Lead Contact</th>
                    <th className="py-3.5 px-4 font-semibold">Property Interest</th>
                    <th className="py-3.5 px-4 font-semibold">Intent</th>
                    <th className="py-3.5 px-4 font-semibold">Assigned Advisor</th>
                    <th className="py-3.5 px-4 font-semibold">Pipeline Stage</th>
                    <th className="py-3.5 px-4 font-semibold">Latest Call Note</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredLeads.map((lead, index) => {
                    const norm = (lead.status === 'new_inquiry' ? 'new_enquiry' : (lead.status === 'repeat_inquiry' ? 'repeat_user' : lead.status)) as LeadStatus
                    const colConfig = columns.find(c => c.key === norm) || DEFAULT_COLUMNS[0]
                    const colPreset = COLOR_PRESETS[colConfig.colorTheme] || COLOR_PRESETS.blue

                    return (
                      <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-4 font-mono text-xs text-slate-500 font-bold">
                          {index + 1}
                        </td>

                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-100">{lead.full_name}</p>
                            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                              <Phone className="w-3 h-3 shrink-0" />
                              <span>{lead.phone_number}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono">
                              IG: {lead.ig_user_id || 'Direct'}
                            </p>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="space-y-0.5">
                            <p className="font-medium text-amber-400 text-xs">{lead.property_interest}</p>
                            <p className="text-[10px] text-slate-500">Instagram DM / Webhook</p>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className={`inline-block px-2.5 py-0.5 text-[11px] font-bold rounded ${
                            lead.intent === 'BUY'
                              ? 'bg-amber-400/10 text-amber-300 border border-amber-400/30'
                              : 'bg-cyan-400/10 text-cyan-300 border border-cyan-400/30'
                          }`}>
                            {lead.intent}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-300">
                              {lead.assigned_agent_name?.[0] || 'A'}
                            </div>
                            <div>
                              <span className="text-xs font-medium text-slate-200 block truncate max-w-[120px]">
                                {lead.assigned_agent_name || 'Ador'}
                              </span>
                              <span className="text-[10px] text-slate-500">Stage Properties</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${colPreset.badgeCls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${colPreset.dotCls}`} />
                            {colConfig.title}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <p className="text-xs text-slate-300 line-clamp-2 max-w-xs font-light">
                            "{lead.notes?.[0]?.note_text || 'Qualified by Stage Properties AI Advisor'}"
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            {lead.notes?.[0]?.agent_name || 'AI System'}
                          </p>
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={getWhatsAppLink(lead)}
                              target="_blank"
                              rel="noreferrer"
                              title="Chat on WhatsApp"
                              className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedLead(lead)
                                setNewStatus((lead.status as LeadStatus) || 'new_enquiry')
                                setReassignAgent(lead.assigned_agent_name || '')
                              }}
                              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs py-1 px-2.5 h-auto gap-1"
                            >
                              Manage
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CUSTOMIZE COLUMNS & COLOR THEMES MODAL ── */}
      {isCustomizeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">
                    Customize Columns & Stage Colors
                  </h3>
                  <p className="text-xs text-slate-400">
                    Reorder columns, select custom theme colors, or toggle stage visibility
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomizeOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-1 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Column Order & Styling List */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Stage Name & Position</span>
                <span>Theme Color</span>
              </div>

              {columns.map((col, index) => {
                const colPreset = COLOR_PRESETS[col.colorTheme] || COLOR_PRESETS.blue

                return (
                  <div
                    key={col.key}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 gap-3"
                  >
                    {/* Position & Title */}
                    <div className="flex items-center gap-2.5">
                      {/* Move Buttons */}
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => moveColumn(index, 'left')}
                          disabled={index === 0}
                          title="Move Up / Left"
                          className="p-1 rounded bg-slate-900 text-slate-400 hover:text-amber-400 disabled:opacity-20 transition-colors"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveColumn(index, 'right')}
                          disabled={index === columns.length - 1}
                          title="Move Down / Right"
                          className="p-1 rounded bg-slate-900 text-slate-400 hover:text-amber-400 disabled:opacity-20 transition-colors"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-slate-200">
                        {col.title}
                      </span>
                    </div>

                    {/* Color Swatch Picker & Visibility */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                        {Object.entries(COLOR_PRESETS).map(([cKey, cVal]) => (
                          <button
                            key={cKey}
                            onClick={() => changeColumnColor(col.key, cKey)}
                            title={cVal.name}
                            className={`w-5 h-5 rounded-full ${cVal.dotCls} transition-transform ${
                              col.colorTheme === cKey
                                ? 'scale-125 ring-2 ring-white shadow-md'
                                : 'opacity-60 hover:opacity-100 hover:scale-110'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Visibility Toggle */}
                      <button
                        onClick={() => toggleColumnVisibility(col.key)}
                        title={col.visible ? 'Hide Column' : 'Show Column'}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          col.visible
                            ? 'bg-slate-900 text-slate-200 border-slate-800'
                            : 'bg-slate-950 text-slate-600 border-slate-900'
                        }`}
                      >
                        {col.visible ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-slate-600" />}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={resetColumnsToDefault}
                className="border-slate-800 text-slate-400 hover:text-amber-400 gap-1.5 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Defaults
              </Button>

              <Button
                size="sm"
                onClick={() => setIsCustomizeOpen(false)}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-5"
              >
                Save Layout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTOMER JOURNEY & NOTES DRAWER MODAL ── */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/30 flex items-center justify-center text-base font-bold text-amber-300">
                  {selectedLead.full_name[0]}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    {selectedLead.full_name}
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-amber-300 font-normal">
                      Intent: {selectedLead.intent}
                    </span>
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <a
                      href={getWhatsAppLink(selectedLead)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-emerald-400 hover:underline"
                    >
                      <Phone className="w-3.5 h-3.5" /> {selectedLead.phone_number} (Open WhatsApp)
                    </a>
                    <span>•</span>
                    <span className="text-amber-400 font-medium">
                      {selectedLead.property_interest}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-slate-400 hover:text-slate-100 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Stage & Agent Update Form */}
            <form onSubmit={handleUpdateLead} className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Status Column Selector */}
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-amber-400" /> Pipeline Stage / Status:
                  </label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as LeadStatus)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 focus:outline-none focus:border-amber-400 cursor-pointer font-medium"
                  >
                    <option value="new_enquiry">🆕 New Enquiry</option>
                    <option value="hot_lead">🔥 Hot Lead</option>
                    <option value="warm_lead">☀️ Warm Lead</option>
                    <option value="repeat_user">🔄 Repeat User</option>
                    <option value="spam">🚫 Spam</option>
                  </select>
                </div>

                {/* Reassign Active Agent */}
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-cyan-400" /> Assigned Advisor:
                  </label>
                  <select
                    value={reassignAgent}
                    onChange={e => setReassignAgent(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 focus:outline-none focus:border-amber-400 cursor-pointer font-medium"
                  >
                    {agents.map(ag => (
                      <option key={ag.id} value={ag.full_name}>
                        {ag.full_name} ({ag.role || 'Sales'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add Note Input */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" /> Log Call Note / Progress:
                </label>
                <textarea
                  rows={2}
                  placeholder="Record customer discussion, scheduled viewing, or offer details..."
                  value={newNoteText}
                  onChange={e => setNewNoteText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedLead(null)}
                  className="border-slate-700 text-slate-400 hover:text-slate-200 text-xs"
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingNote}
                  size="sm"
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs gap-1.5"
                >
                  {isSubmittingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Save Lead & Log Note
                </Button>
              </div>
            </form>

            {/* Notes & Activity Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Lead Journey & Call History ({selectedLead.notes?.length || 0})
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(!selectedLead.notes || selectedLead.notes.length === 0) ? (
                  <div className="p-4 text-center text-xs text-slate-500 italic bg-slate-950/40 rounded-lg border border-slate-800">
                    No notes recorded yet. Use the form above to log call updates.
                  </div>
                ) : (
                  selectedLead.notes.map(note => (
                    <div key={note.id} className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                        <span className="text-amber-400 font-bold">{note.agent_name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(note.created_at).toLocaleDateString()} {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed font-light">{note.note_text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
