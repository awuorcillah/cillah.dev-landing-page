'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  TrendingUp, Users, Flame, Snowflake, Crown,
  Search, Filter, RefreshCw, Send, MessageSquare,
  Plus, Calendar, Clock, Phone, Mail, Building,
  CheckCircle2, AlertCircle, Loader2, ArrowRight,
  UserCheck, Shield, ChevronRight, FileText
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export type StageId = 'leads' | 'warm' | 'hot' | 'cold' | 'clients'

export interface NoteItem {
  id: string
  timestamp: string
  author: string
  text: string
}

export interface LeadItem {
  id: string
  client_name: string
  client_email: string
  client_phone: string
  company_name?: string
  stage: StageId
  assigned_agent: string // 'atulah@cillah.dev' | 'atulavernesa@gmail.com'
  amount?: string
  session_title?: string
  created_at: string
  updated_at: string
  notes: NoteItem[]
}

const SALES_AGENTS = [
  { name: 'Atulah (Sales Lead)', email: 'atulah@cillah.dev' },
  { name: 'Vernesa (Sales Agent)', email: 'atulavernesa@gmail.com' }
]

const SAMPLE_LEADS: LeadItem[] = [
  {
    id: 'LD-101',
    client_name: 'David Ochieng (Prime Housing)',
    client_email: 'david@primehousing.co.ke',
    client_phone: '254712345678',
    company_name: 'Prime Housing Kenya',
    stage: 'leads',
    assigned_agent: 'atulah@cillah.dev',
    session_title: 'Free Automation Audit',
    amount: '—',
    created_at: '2026-10-04T09:00:00Z',
    updated_at: '2026-10-04T09:00:00Z',
    notes: [
      { id: 'n1', timestamp: '2026-10-04 09:15', author: 'atulah@cillah.dev', text: 'Submitted Free Automation Audit request via website.' }
    ]
  },
  {
    id: 'LD-102',
    client_name: 'Sarah Kimani (Rosy Realtors)',
    client_email: 'sarah@rosyrealtors.co.ke',
    client_phone: '254722998877',
    company_name: 'Rosy Realtors Ltd',
    stage: 'warm',
    assigned_agent: 'atulavernesa@gmail.com',
    session_title: 'WhatsApp Bot Strategy Demo',
    amount: '—',
    created_at: '2026-10-03T14:30:00Z',
    updated_at: '2026-10-04T10:00:00Z',
    notes: [
      { id: 'n2', timestamp: '2026-10-03 14:35', author: 'atulavernesa@gmail.com', text: 'Initial call completed. Interested in automated WhatsApp lead qualification.' },
      { id: 'n3', timestamp: '2026-10-04 10:00', author: 'atulavernesa@gmail.com', text: 'Sent demo video on WhatsApp. Awaiting review.' }
    ]
  },
  {
    id: 'LD-103',
    client_name: 'James Mwangi (Nairobi Homes)',
    client_email: 'james@nairobihomes.co.ke',
    client_phone: '254733112233',
    company_name: 'Nairobi Homes Agency',
    stage: 'hot',
    assigned_agent: 'atulah@cillah.dev',
    session_title: '1-on-1 AI Strategy & Architecture Call',
    amount: 'KES 5,000',
    created_at: '2026-10-02T11:00:00Z',
    updated_at: '2026-10-04T11:30:00Z',
    notes: [
      { id: 'n4', timestamp: '2026-10-02 11:05', author: 'atulah@cillah.dev', text: 'Paid KES 5,000 via M-Pesa STK for Strategy Call.' },
      { id: 'n5', timestamp: '2026-10-04 11:30', author: 'atulah@cillah.dev', text: 'Approved strategy call slot for Tuesday 10:00 AM.' }
    ]
  },
  {
    id: 'LD-104',
    client_name: 'Amina Hassan (Luxury Haven)',
    client_email: 'amina@luxuryhaven.co.ke',
    client_phone: '254700554433',
    company_name: 'Luxury Haven Kenya',
    stage: 'clients',
    assigned_agent: 'atulavernesa@gmail.com',
    session_title: 'Monthly Retainer Suite',
    amount: 'Retainer Plan',
    created_at: '2026-09-25T08:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    notes: [
      { id: 'n6', timestamp: '2026-09-25 08:30', author: 'atulavernesa@gmail.com', text: 'Signed monthly retainer SLA.' }
    ]
  }
]

export default function SalesPipelinePage() {
  const supabase = createClient()

  const [leads, setLeads] = useState<LeadItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [agentFilter, setAgentFilter] = useState<string>('all')
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null)

  // ── Modal State ──
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null)
  const [newNoteText, setNewNoteText] = useState('')
  const [customWhatsAppMsg, setCustomWhatsAppMsg] = useState('')
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('atulah@cillah.dev')

  // ── Load Current User & Leads ──
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setCurrentUserEmail(user.email)
      }
      
      const saved = localStorage.getItem('cillah_crm_leads')
      if (saved) {
        try {
          setLeads(JSON.parse(saved))
        } catch (e) {
          setLeads(SAMPLE_LEADS)
        }
      } else {
        setLeads(SAMPLE_LEADS)
      }
      setLoading(false)
    }
    init()
  }, [])

  // Save to localStorage when leads state updates
  const saveLeadsToStorage = (updated: LeadItem[]) => {
    setLeads(updated)
    localStorage.setItem('cillah_crm_leads', JSON.stringify(updated))
  }

  // ── Round-Robin Assignment Engine ──
  const handleAssignRoundRobin = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId)
    if (!lead) return

    // Find next agent in round robin
    const currentIdx = SALES_AGENTS.findIndex(a => a.email === lead.assigned_agent)
    const nextIdx = (currentIdx + 1) % SALES_AGENTS.length
    const nextAgent = SALES_AGENTS[nextIdx].email

    const updated = leads.map(l =>
      l.id === leadId ? { ...l, assigned_agent: nextAgent, updated_at: new Date().toISOString() } : l
    )
    saveLeadsToStorage(updated)
    toast.success(`Reassigned lead ${lead.id} to ${SALES_AGENTS[nextIdx].name} via Round-Robin!`)
  }

  // ── Change Stage (Kanban Drag & Drop or 1-Click) ──
  const handleMoveStage = (leadId: string, targetStage: StageId) => {
    const updated = leads.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          stage: targetStage,
          updated_at: new Date().toISOString()
        }
      }
      return l
    })
    saveLeadsToStorage(updated)
    const stageNames: Record<StageId, string> = {
      leads: 'Leads (Free Audit)',
      warm: 'Warm Lead',
      hot: 'Hot Lead (Paid Call)',
      cold: 'Cold Lead',
      clients: 'Retainer Client'
    }
    toast.success(`Moved lead to "${stageNames[targetStage]}"`)
  }

  // ── Cumulative Notes Engine ──
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLead || !newNoteText.trim()) return

    const now = new Date()
    const formattedTimestamp = now.toISOString().replace('T', ' ').slice(0, 16)

    const newNoteObj: NoteItem = {
      id: `note-${Date.now()}`,
      timestamp: formattedTimestamp,
      author: currentUserEmail,
      text: newNoteText.trim()
    }

    const updated = leads.map(l => {
      if (l.id === selectedLead.id) {
        const cumulativeNotes = [newNoteObj, ...(l.notes || [])]
        const leadUpdated = { ...l, notes: cumulativeNotes, updated_at: now.toISOString() }
        setSelectedLead(leadUpdated)
        return leadUpdated
      }
      return l
    })

    saveLeadsToStorage(updated)
    setNewNoteText('')
    toast.success('Cumulative note recorded!')
  }

  // ── Send WhatsApp Message ──
  const handleSendWhatsApp = async () => {
    if (!selectedLead) return
    setSendingWhatsApp(true)
    try {
      const res = await fetch('/api/admin/bookings/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedLead.id,
          phone: selectedLead.client_phone,
          customMessage: customWhatsAppMsg,
          newStatus: selectedLead.stage === 'hot' ? 'confirmed' : 'pending'
        })
      })

      const data = await res.json()
      if (data.whatsappSent) {
        toast.success('WhatsApp interactive message sent successfully!')
      } else {
        toast.warning(data.message || 'Updated in CRM. Check WhatsApp API settings in .env')
      }
    } catch (err: any) {
      toast.error('Failed to send WhatsApp message')
    } finally {
      setSendingWhatsApp(false)
    }
  }

  // ── Filtered Leads ──
  const filteredLeads = leads.filter(l => {
    const matchesAgent = agentFilter === 'all' || l.assigned_agent === agentFilter
    const term = search.toLowerCase().trim()
    const matchesSearch =
      !term ||
      l.client_name.toLowerCase().includes(term) ||
      l.client_email.toLowerCase().includes(term) ||
      l.client_phone.includes(term) ||
      (l.company_name && l.company_name.toLowerCase().includes(term)) ||
      l.id.toLowerCase().includes(term)

    return matchesAgent && matchesSearch
  })

  // Group by Stage
  const stageColumns: { id: StageId; label: string; icon: any; color: string; bg: string }[] = [
    { id: 'leads',   label: '1. Leads (Free Audit)',  icon: Users,     color: 'text-purple-400', bg: 'border-purple-500/30 bg-purple-950/10' },
    { id: 'warm',    label: '2. Warm Leads',           icon: TrendingUp,color: 'text-cyan-400',   bg: 'border-cyan-500/30 bg-cyan-950/10' },
    { id: 'hot',     label: '3. Hot Leads (Paid 5k)',  icon: Flame,     color: 'text-amber-400',  bg: 'border-amber-500/30 bg-amber-950/10' },
    { id: 'cold',    label: '4. Cold / Nurture',       icon: Snowflake, color: 'text-blue-400',   bg: 'border-blue-500/30 bg-blue-950/10' },
    { id: 'clients', label: '5. Retainer Clients',    icon: Crown,     color: 'text-emerald-400',bg: 'border-emerald-500/30 bg-emerald-950/10' },
  ]

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-cyan-400" /> Sales CRM Pipeline & Round-Robin Leads
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage incoming leads, drag across stages, auto-assign agents via Round-Robin, and track cumulative timestamped notes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLeads(SAMPLE_LEADS)}
            className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 gap-2 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset Demo Data
          </Button>
        </div>
      </div>

      {/* ── Controls: Search & Agent Filter Bar ── */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads by name, email, phone, company..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        {/* Agent Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-400 shrink-0">Assigned Agent:</span>
          <select
            value={agentFilter}
            onChange={e => setAgentFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="all">All Sales Agents</option>
            <option value="atulah@cillah.dev">Atulah (atulah@cillah.dev)</option>
            <option value="atulavernesa@gmail.com">Vernesa (atulavernesa@gmail.com)</option>
          </select>
        </div>
      </div>

      {/* ── Kanban Pipeline Columns ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stageColumns.map(col => {
          const Icon = col.icon
          const colLeads = filteredLeads.filter(l => l.stage === col.id)

          return (
            <div
              key={col.id}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault()
                if (draggedLeadId) {
                  handleMoveStage(draggedLeadId, col.id)
                  setDraggedLeadId(null)
                }
              }}
              className={`border ${col.bg} rounded-2xl p-4 min-h-[500px] flex flex-col space-y-3 transition-colors`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${col.color}`} />
                  <h3 className="text-xs font-bold text-slate-200">{col.label}</h3>
                </div>
                <Badge className="bg-slate-950 text-slate-300 font-mono text-[10px] px-2 py-0.5 border border-slate-800">
                  {colLeads.length}
                </Badge>
              </div>

              {/* Cards Container */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[650px] pr-1">
                {colLeads.length === 0 ? (
                  <div className="h-32 border border-dashed border-slate-800 rounded-xl flex items-center justify-center text-slate-600 text-xs text-center p-4">
                    Drop lead cards here
                  </div>
                ) : (
                  colLeads.map(lead => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={() => setDraggedLeadId(lead.id)}
                      onClick={() => {
                        setSelectedLead(lead)
                        setCustomWhatsAppMsg(
                          `Hello ${lead.client_name.split(' ')[0]}! This is ${currentUserEmail.split('@')[0]} from Cillah.dev regarding your request for ${lead.session_title || 'AI Automation'}.`
                        )
                      }}
                      className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-3 space-y-2.5 shadow-lg cursor-pointer transition-all hover:scale-[1.01]"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-slate-100 text-xs truncate hover:text-cyan-300">
                            {lead.client_name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">{lead.client_email}</p>
                        </div>
                        <span className="text-[10px] font-mono bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">
                          {lead.id}
                        </span>
                      </div>

                      {/* Agent Badge & Round Robin Button */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                        <span className="text-slate-400 truncate max-w-[120px]">
                          👤 {lead.assigned_agent.split('@')[0]}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAssignRoundRobin(lead.id)
                          }}
                          title="Assign next agent via Round-Robin"
                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[9px] font-semibold transition-colors"
                        >
                          🔄 Rotate
                        </button>
                      </div>

                      {/* Move Stage Quick Options */}
                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/40">
                        <span className="text-slate-500 font-mono">{lead.amount || '—'}</span>
                        <select
                          value={lead.stage}
                          onClick={e => e.stopPropagation()}
                          onChange={e => handleMoveStage(lead.id, e.target.value as StageId)}
                          className="bg-slate-950 border border-slate-800 text-slate-300 rounded px-1.5 py-0.5 text-[10px] font-medium focus:outline-none cursor-pointer"
                        >
                          <option value="leads">1. Leads</option>
                          <option value="warm">2. Warm</option>
                          <option value="hot">3. Hot</option>
                          <option value="cold">4. Cold</option>
                          <option value="clients">5. Client</option>
                        </select>
                      </div>

                      {/* Notes Counter */}
                      {lead.notes && lead.notes.length > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-1">
                          <FileText className="w-3 h-3 text-cyan-400" />
                          <span>{lead.notes.length} cumulative notes</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Lead Detail & Cumulative Notes Modal ── */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-8">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  {selectedLead.client_name}
                  <span className="text-xs px-2 py-0.5 bg-slate-800 text-cyan-300 font-mono rounded border border-slate-700">
                    {selectedLead.id}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedLead.client_email} • {selectedLead.client_phone}</p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Quick Details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block">Stage</span>
                <span className="font-bold text-cyan-400 capitalize">{selectedLead.stage}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Assigned Agent</span>
                <span className="font-semibold text-slate-200">{selectedLead.assigned_agent}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Session / Amount</span>
                <span className="font-semibold text-emerald-400">{selectedLead.amount || 'Free Audit'}</span>
              </div>
            </div>

            {/* ── Cumulative Notes Section ── */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-400" /> Cumulative Activity & Call Notes Log
              </h4>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  rows={3}
                  required
                  placeholder="Type new call or lead notes here... (Timestamp and author will be attached automatically)"
                  value={newNoteText}
                  onChange={e => setNewNoteText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-cyan-500 resize-none"
                />
                <div className="flex justify-end">
                  <Button type="submit" size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs">
                    + Record Note
                  </Button>
                </div>
              </form>

              {/* Notes Timeline List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 divide-y divide-slate-800/60">
                {selectedLead.notes && selectedLead.notes.length > 0 ? (
                  selectedLead.notes.map(note => (
                    <div key={note.id} className="pt-2 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="text-cyan-400 font-semibold">{note.author}</span>
                        <span>{note.timestamp}</span>
                      </div>
                      <p className="text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                        {note.text}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-xs italic py-2">No notes recorded yet for this lead.</p>
                )}
              </div>
            </div>

            {/* ── WhatsApp Quick Action ── */}
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" /> Send WhatsApp Message to Lead
                </span>
                <span className="text-[10px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">
                  {selectedLead.client_phone}
                </span>
              </div>
              <textarea
                rows={3}
                value={customWhatsAppMsg}
                onChange={e => setCustomWhatsAppMsg(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-emerald-500 resize-none"
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleSendWhatsApp}
                  disabled={sendingWhatsApp}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5"
                >
                  {sendingWhatsApp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Send WhatsApp
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setSelectedLead(null)} className="border-slate-700 text-slate-300 text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
