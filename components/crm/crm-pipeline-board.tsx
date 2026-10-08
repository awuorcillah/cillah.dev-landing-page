'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  MessageCircle,
  Phone,
  Mail,
  Calendar,
  Clock,
  UserCheck,
  Search,
  Filter,
  LayoutGrid,
  List,
  Sparkles,
  Plus,
  ChevronDown,
  X,
  CheckCircle2,
  AlertCircle,
  Flame,
  Award,
  ShieldCheck,
  Building,
  Tag
} from 'lucide-react'

export interface SalesLead {
  id: string
  full_name: string
  email: string | null
  phone_number: string | null
  company_name: string | null
  source: string
  stage: string
  assigned_agent_email: string | null
  assigned_agent_id: string | null
  is_qualified: boolean
  estimated_value: number
  last_interaction_at: string
  created_at: string
  updated_at: string
  followup_status: string | null
  next_followup_at: string | null
  followup_title: string | null
}

export interface LeadNote {
  id: string
  lead_id: string
  author_email: string
  author_name: string | null
  source: string
  note_text: string
  created_at: string
}

export interface StaffMember {
  id: string
  email: string
  full_name: string
  role: string
  status: string
}

const STAGES = [
  { id: 'new_lead', name: 'New Inquiry', color: 'bg-sky-500/10 border-sky-500/30 text-sky-400', badge: 'bg-sky-500' },
  { id: 'hot_lead', name: 'Hot Lead', color: 'bg-amber-500/10 border-amber-500/30 text-amber-400', badge: 'bg-amber-500' },
  { id: 'warm_lead', name: 'Warm Lead', color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400', badge: 'bg-yellow-500' },
  { id: 'cold_lead', name: 'Cold Lead', color: 'bg-slate-500/10 border-slate-500/30 text-slate-400', badge: 'bg-slate-500' },
  { id: 'spam', name: 'Spam', color: 'bg-red-500/10 border-red-500/30 text-red-400', badge: 'bg-red-500' },
  { id: 'closed_won', name: 'Won Deals', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', badge: 'bg-emerald-500' }
]

interface CRMPipelineBoardProps {
  currentUserEmail?: string
  isStaffAdmin?: boolean
}

export default function CRMPipelineBoard({
  currentUserEmail = 'atulah@cillah.dev',
  isStaffAdmin = true
}: CRMPipelineBoardProps) {
  const supabase = createClient()
  const [leads, setLeads] = useState<SalesLead[]>([])
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)

  // Filters & State
  const [agentFilter, setAgentFilter] = useState<string>(isStaffAdmin ? 'all' : currentUserEmail)
  const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '30d' | 'all'>('all')
  const [stageFilter, setStageFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')

  // Selected Lead Modal Drawer State
  const [selectedLead, setSelectedLead] = useState<SalesLead | null>(null)
  const [notes, setNotes] = useState<LeadNote[]>([])
  const [newNoteText, setNewNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  // Followup Form State inside Modal
  const [followupChoice, setFollowupChoice] = useState<'1_month' | '3_months' | '1_year' | 'forever' | 'custom'>('1_month')
  const [customDate, setCustomDate] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [updatingFollowup, setUpdatingFollowup] = useState(false)
  const [actionSuccessMsg, setActionSuccessMsg] = useState('')

  // 1. Fetch Staff & Leads on Mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      // Fetch Staff Members
      const { data: staffData } = await supabase.from('staff_members').select('*')
      if (staffData) setStaffMembers(staffData)

      // Fetch Sales Leads
      let query = supabase.from('sales_leads').select('*').order('created_at', { ascending: false })

      if (!isStaffAdmin) {
        query = query.eq('assigned_agent_email', currentUserEmail)
      } else if (agentFilter !== 'all') {
        query = query.eq('assigned_agent_email', agentFilter)
      }

      const { data: leadsData } = await query
      if (leadsData) setLeads(leadsData)

      setLoading(false)
    }

    fetchData()

    // 2. Realtime Subscriptions
    const channel = supabase
      .channel('public:sales_leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_leads' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setLeads((prev) => [payload.new as SalesLead, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setLeads((prev) =>
            prev.map((l) => (l.id === payload.new.id ? (payload.new as SalesLead) : l))
          )
          setSelectedLead((prev) => (prev?.id === payload.new.id ? (payload.new as SalesLead) : prev))
        } else if (payload.eventType === 'DELETE') {
          setLeads((prev) => prev.filter((l) => l.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [agentFilter, isStaffAdmin, currentUserEmail])

  // Fetch Notes when a lead is selected
  useEffect(() => {
    if (!selectedLead) return

    async function fetchNotes() {
      const { data } = await supabase
        .from('lead_notes')
        .select('*')
        .eq('lead_id', selectedLead!.id)
        .order('created_at', { ascending: false })

      const notesList = data || []
      
      // If lead has an initial_note from single HTTP ingestion, include it as an initial note entry
      if (selectedLead?.initial_note && !notesList.some(n => n.note_text === selectedLead.initial_note)) {
        notesList.push({
          id: 'initial-' + selectedLead.id,
          lead_id: selectedLead.id,
          author_email: selectedLead.assigned_agent_email || 'system@cillah.dev',
          author_name: 'Email Campaign Bot',
          source: 'email_reply',
          note_text: selectedLead.initial_note,
          created_at: selectedLead.created_at
        })
      }

      setNotes(notesList)
    }

    fetchNotes()
  }, [selectedLead])

  // Filtered Leads Calculation
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Agent Filter
      if (isStaffAdmin && agentFilter !== 'all' && lead.assigned_agent_email !== agentFilter) {
        return false
      }

      // Stage Filter
      if (stageFilter !== 'all' && lead.stage !== stageFilter) {
        return false
      }

      // Time Filter
      if (timeFilter !== 'all') {
        const createdAt = new Date(lead.created_at).getTime()
        const now = new Date().getTime()
        const diffHours = (now - createdAt) / (1000 * 60 * 60)

        if (timeFilter === '24h' && diffHours > 24) return false
        if (timeFilter === '7d' && diffHours > 24 * 7) return false
        if (timeFilter === '30d' && diffHours > 24 * 30) return false
      }

      // Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase()
        const matchName = lead.full_name?.toLowerCase().includes(q)
        const matchEmail = lead.email?.toLowerCase().includes(q)
        const matchPhone = lead.phone_number?.toLowerCase().includes(q)
        const matchCompany = lead.company_name?.toLowerCase().includes(q)
        if (!matchName && !matchEmail && !matchPhone && !matchCompany) return false
      }

      return true
    })
  }, [leads, agentFilter, isStaffAdmin, stageFilter, timeFilter, searchQuery])

  // Metrics Counters
  const metrics = useMemo(() => {
    const now = new Date()
    const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const newToday = leads.filter((l) => new Date(l.created_at) >= past24h).length
    const hotLeads = leads.filter((l) => l.stage === 'hot_lead').length
    const upcomingAppointments = leads.filter(
      (l) => l.next_followup_at && new Date(l.next_followup_at) > now
    ).length
    const wonDealsCount = leads.filter((l) => l.stage === 'closed_won').length
    const wonDealsValue = leads
      .filter((l) => l.stage === 'closed_won')
      .reduce((sum, l) => sum + (l.estimated_value || 0), 0)

    return { newToday, hotLeads, upcomingAppointments, wonDealsCount, wonDealsValue }
  }, [leads])

  // Stage Move Handler
  const handleStageChange = async (leadId: string, newStage: string) => {
    const { error } = await supabase
      .from('sales_leads')
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq('id', leadId)

    if (!error) {
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l)))
    }
  }

  // Add Note Handler
  const handleAddNote = async () => {
    if (!selectedLead || !newNoteText.trim()) return
    setAddingNote(true)

    const { data: newNote, error } = await supabase
      .from('lead_notes')
      .insert({
        lead_id: selectedLead.id,
        author_email: currentUserEmail,
        author_name: currentUserEmail.split('@')[0],
        source: 'sales_agent',
        note_text: newNoteText.trim()
      })
      .select('*')
      .single()

    if (!error && newNote) {
      setNotes((prev) => [newNote, ...prev])
      setNewNoteText('')
    }
    setAddingNote(false)
  }

  // Update Follow-up Handler
  const handleSaveFollowup = async () => {
    if (!selectedLead) return
    setUpdatingFollowup(true)
    setActionSuccessMsg('')

    try {
      const res = await fetch('/api/leads/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: selectedLead.id,
          followup_choice: followupChoice,
          custom_date: followupChoice === 'custom' ? customDate : null,
          followup_title: customTitle || null,
          agent_email: currentUserEmail
        })
      })

      const data = await res.json()
      if (data.success) {
        setActionSuccessMsg('Follow-up schedule updated successfully!')
        setTimeout(() => setActionSuccessMsg(''), 4000)
      }
    } catch (err) {
      console.error('Followup update failed:', err)
    } finally {
      setUpdatingFollowup(false)
    }
  }

  // WhatsApp Link Builder
  const getWhatsAppLink = (phone: string | null) => {
    if (!phone) return '#'
    const cleanPhone = phone.replace(/[^0-9]/g, '')
    return `https://wa.me/${cleanPhone}`
  }

  // Overdue check
  const isOverdue = (nextFollowup: string | null) => {
    if (!nextFollowup) return false
    return new Date(nextFollowup) < new Date()
  }

  return (
    <div className="w-full min-h-screen bg-[#0E131F] text-slate-100 p-4 md:p-8 font-sans">
      {/* HEADER BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-[#C9A66B]" /> Sales Engine & CRM Pipeline
            </h1>
            <span className="px-3 py-1 bg-[#C9A66B]/20 text-[#C9A66B] text-xs font-semibold rounded-full border border-[#C9A66B]/30 uppercase">
              {isStaffAdmin ? 'Admin Control' : 'Sales Workspace'}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Logged in as <span className="text-slate-200 font-medium">{currentUserEmail}</span>
          </p>
        </div>

        {/* CONTROLS: AGENT FILTER & VIEW MODE */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Staff Admin Agent Switcher */}
          {isStaffAdmin && (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs">
              <UserCheck className="w-4 h-4 text-[#C9A66B]" />
              <span className="text-slate-400">Agent:</span>
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">All Sales Agents</option>
                {staffMembers
                  .filter((s) => s.role === 'sales' || s.role === 'ceo')
                  .map((agent) => (
                    <option key={agent.id} value={agent.email} className="bg-slate-900 text-white">
                      {agent.full_name} ({agent.email})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'kanban' ? 'bg-[#C9A66B] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Kanban Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'table' ? 'bg-[#C9A66B] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" /> Table View
            </button>
          </div>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
            <InboxIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{metrics.newToday}</div>
            <div className="text-xs text-slate-400 font-medium">New Leads (24h)</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-400">{metrics.hotLeads}</div>
            <div className="text-xs text-slate-400 font-medium">Hot Leads</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-purple-300">{metrics.upcomingAppointments}</div>
            <div className="text-xs text-slate-400 font-medium">Upcoming Follow-ups</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-emerald-500/20 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-400">
              ${metrics.wonDealsValue.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Won Deals ({metrics.wonDealsCount})
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search lead by name, phone, email, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/70 text-slate-100 text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#C9A66B]"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs">
            {(['all', '24h', '7d', '30d'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeFilter(t)}
                className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                  timeFilter === t ? 'bg-slate-800 text-[#C9A66B] font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'all' ? 'All Time' : t}
              </button>
            ))}
          </div>

          {/* Stage Filter Dropdown */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Stages</option>
              {STAGES.map((st) => (
                <option key={st.id} value={st.id} className="bg-slate-900">
                  {st.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 overflow-x-auto pb-8">
          {STAGES.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.stage === stage.id)

            return (
              <div
                key={stage.id}
                className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex flex-col min-h-[500px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const leadId = e.dataTransfer.getData('leadId')
                  if (leadId) handleStageChange(leadId, stage.id)
                }}
              >
                {/* Column Header */}
                <div className={`p-3 rounded-xl border ${stage.color} mb-4 flex items-center justify-between`}>
                  <span className="font-bold text-xs uppercase tracking-wider">{stage.name}</span>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-950/80">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 flex flex-col gap-3">
                  {stageLeads.map((lead) => {
                    const overdue = isOverdue(lead.next_followup_at)

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('leadId', lead.id)}
                        onClick={() => setSelectedLead(lead)}
                        className={`bg-slate-950 border ${
                          overdue ? 'border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.25)]' : 'border-slate-800 hover:border-[#C9A66B]/50'
                        } rounded-xl p-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 shadow-md group`}
                      >
                        {/* Header Badges */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A66B] bg-[#C9A66B]/10 px-2 py-0.5 rounded-md border border-[#C9A66B]/20">
                            {lead.source?.replace('_', ' ')}
                          </span>
                          {overdue && (
                            <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/30 flex items-center gap-1 animate-pulse">
                              <AlertCircle className="w-3 h-3" /> Overdue
                            </span>
                          )}
                        </div>

                        {/* Name & Company */}
                        <h4 className="font-bold text-sm text-slate-100 group-hover:text-[#C9A66B] transition-colors">
                          {lead.full_name}
                        </h4>
                        {lead.company_name && (
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Building className="w-3 h-3" /> {lead.company_name}
                          </div>
                        )}

                        {/* Estimated Value */}
                        {lead.estimated_value > 0 && (
                          <div className="text-xs font-semibold text-emerald-400 mt-2">
                            ${lead.estimated_value.toLocaleString()}
                          </div>
                        )}

                        {/* Agent Assignment */}
                        <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-900 flex items-center justify-between">
                          <span>{lead.assigned_agent_email?.split('@')[0] || 'Unassigned'}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {/* 1-CLICK QUICK ACTION COMMUNICATION ICONS */}
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-900">
                          {lead.phone_number && (
                            <a
                              href={getWhatsAppLink(lead.phone_number)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              title="Chat on WhatsApp"
                              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {lead.phone_number && (
                            <a
                              href={`tel:${lead.phone_number}`}
                              onClick={(e) => e.stopPropagation()}
                              title="Call Lead"
                              className="p-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {lead.email && (
                            <a
                              href={`mailto:${lead.email}`}
                              onClick={(e) => e.stopPropagation()}
                              title="Send Email"
                              className="p-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg transition-colors"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Quick Stage Move Dropdown */}
                          <select
                            value={lead.stage}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleStageChange(lead.id, e.target.value)}
                            className="ml-auto bg-slate-900 border border-slate-800 text-[10px] text-slate-300 rounded-lg px-1.5 py-1 focus:outline-none"
                          >
                            {STAGES.map((st) => (
                              <option key={st.id} value={st.id}>
                                {st.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-4">Lead Name</th>
                <th className="p-4">Contact Details</th>
                <th className="p-4">Source</th>
                <th className="p-4">Stage</th>
                <th className="p-4">Assigned Agent</th>
                <th className="p-4">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLeads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="p-4 font-bold text-slate-100">{lead.full_name}</td>
                  <td className="p-4 text-slate-300">
                    <div>{lead.email || 'No email'}</div>
                    <div className="text-slate-400">{lead.phone_number || 'No phone'}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-slate-950 text-slate-300 border border-slate-800 rounded-md font-mono">
                      {lead.source}
                    </span>
                  </td>
                  <td className="p-4">
                    <select
                      value={lead.stage}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleStageChange(lead.id, e.target.value)}
                      className="bg-slate-950 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs"
                    >
                      {STAGES.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4 text-slate-300">{lead.assigned_agent_email || 'Unassigned'}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {lead.phone_number && (
                        <a
                          href={getWhatsAppLink(lead.phone_number)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                      {lead.phone_number && (
                        <a
                          href={`tel:${lead.phone_number}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg hover:bg-sky-500/20"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* INTERACTIVE LEAD DETAIL DRAWER / MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-[#0E131F] border-l border-slate-800 min-h-screen p-6 overflow-y-auto flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300">
            <div>
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {selectedLead.full_name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Source: <span className="text-[#C9A66B] font-semibold">{selectedLead.source}</span> | Created: {new Date(selectedLead.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 1-CLICK QUICK ACTION BAR IN MODAL */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {selectedLead.phone_number ? (
                  <a
                    href={getWhatsAppLink(selectedLead.phone_number)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold transition-all"
                  >
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </a>
                ) : (
                  <button disabled className="py-2.5 bg-slate-900 text-slate-600 rounded-xl text-xs font-bold opacity-50">
                    No WhatsApp
                  </button>
                )}

                {selectedLead.phone_number ? (
                  <a
                    href={`tel:${selectedLead.phone_number}`}
                    className="flex items-center justify-center gap-2 py-2.5 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 rounded-xl text-xs font-bold transition-all"
                  >
                    <Phone className="w-4 h-4" /> Direct Call
                  </a>
                ) : (
                  <button disabled className="py-2.5 bg-slate-900 text-slate-600 rounded-xl text-xs font-bold opacity-50">
                    No Phone
                  </button>
                )}

                {selectedLead.email ? (
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="flex items-center justify-center gap-2 py-2.5 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-400 rounded-xl text-xs font-bold transition-all"
                  >
                    <Mail className="w-4 h-4" /> Send Email
                  </a>
                ) : (
                  <button disabled className="py-2.5 bg-slate-900 text-slate-600 rounded-xl text-xs font-bold opacity-50">
                    No Email
                  </button>
                )}
              </div>

              {/* STAGE & AGENT ASSIGNMENT */}
              <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Current Stage</label>
                  <select
                    value={selectedLead.stage}
                    onChange={(e) => handleStageChange(selectedLead.id, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2 font-bold focus:outline-none"
                  >
                    {STAGES.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">Assigned Agent</label>
                  <div className="text-slate-200 font-bold p-2 bg-slate-950 rounded-lg border border-slate-800">
                    {selectedLead.assigned_agent_email || 'Unassigned'}
                  </div>
                </div>
              </div>

              {/* FOLLOW-UP CLOSURE & SCHEDULER SECTION */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 mb-6">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#C9A66B]" /> Follow-Up Scheduler & Closure
                </h4>

                {actionSuccessMsg && (
                  <div className="mb-3 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> {actionSuccessMsg}
                  </div>
                )}

                {/* Preset Choices */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  {[
                    { id: '1_month', label: '1 Month' },
                    { id: '3_months', label: '3 Months' },
                    { id: '1_year', label: '1 Year' },
                    { id: 'forever', label: 'Forever (Close)' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setFollowupChoice(p.id as any)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                        followupChoice === p.id
                          ? 'bg-[#C9A66B] text-slate-950 border-[#C9A66B]'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Custom Date Option Toggle */}
                <button
                  onClick={() => setFollowupChoice('custom')}
                  className={`w-full py-2 mb-3 text-xs font-bold rounded-xl border transition-colors ${
                    followupChoice === 'custom'
                      ? 'bg-[#C9A66B] text-slate-950 border-[#C9A66B]'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  📆 Custom Date & Time Picker
                </button>

                {/* Custom Form Fields */}
                {followupChoice === 'custom' && (
                  <div className="space-y-3 mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Follow-up Reason / Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Call back after client reviews AI proposal"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Date & Time</label>
                      <input
                        type="datetime-local"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSaveFollowup}
                  disabled={updatingFollowup}
                  className="w-full py-2.5 bg-[#C9A66B] text-slate-950 font-bold rounded-xl text-xs hover:bg-[#C9A66B]/90 transition-all shadow-md"
                >
                  {updatingFollowup ? 'Saving Schedule...' : 'Save Follow-Up Schedule'}
                </button>
              </div>

              {/* MULTI-SOURCE NOTES TIMELINE */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#C9A66B]" /> Interaction Notes History
                </h4>

                {/* Add Note Box */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Type a manual note..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-[#C9A66B]"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={addingNote || !newNoteText.trim()}
                    className="px-4 py-2 bg-[#C9A66B] text-slate-950 text-xs font-bold rounded-xl hover:bg-[#C9A66B]/90 transition-all disabled:opacity-50"
                  >
                    Add Note
                  </button>
                </div>

                {/* Notes List */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {notes.length === 0 ? (
                    <div className="text-xs text-slate-500 italic">No notes logged for this lead yet.</div>
                  ) : (
                    notes.map((note) => (
                      <div key={note.id} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl text-xs">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span className="font-bold text-[#C9A66B]">{note.author_name || note.author_email}</span>
                          <span>{new Date(note.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-200">{note.note_text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InboxIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  )
}
