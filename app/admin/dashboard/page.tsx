'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import CRMPipelineBoard from '@/components/crm/crm-pipeline-board'
import { toast } from 'sonner'
import {
  Mail,
  MessageCircle,
  Globe,
  Calendar,
  FileText,
  Share2,
  Instagram,
  Users,
  TrendingUp,
  Trophy,
  Flame,
  RefreshCw,
  ArrowUpRight,
  Search,
  UserCheck,
  Clock,
  Layers,
  Filter,
  X,
  Activity,
  Phone,
  Bot
} from 'lucide-react'

interface RawLead {
  id: string
  full_name: string
  email: string | null
  phone_number: string | null
  company_name: string | null
  source: string | null
  stage: string
  assigned_agent_email: string | null
  assigned_agent_id: string | null
  is_qualified: boolean | null
  estimated_value: number | null
  next_followup_at: string | null
  followup_title: string | null
  viewing_date: string | null
  created_at: string
  updated_at: string
}

interface StaffRow {
  id: string
  email: string
  full_name: string
  role: string
  status: string
  org_id: string | null
}

type PlatformKey =
  | 'email'
  | 'whatsapp'
  | 'facebook'
  | 'events'
  | 'tenders'
  | 'website'
  | 'instagram'
  | 'other'

interface PlatformMeta {
  key: PlatformKey
  label: string
  shortLabel: string
  accent: string
  barColor: string
  badgeCls: string
}

const PLATFORMS: PlatformMeta[] = [
  {
    key: 'email',
    label: 'Email / Microsoft 365',
    shortLabel: 'Email',
    accent: 'text-sky-400',
    barColor: 'bg-sky-400',
    badgeCls: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    shortLabel: 'WhatsApp',
    accent: 'text-emerald-400',
    barColor: 'bg-emerald-400',
    badgeCls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    shortLabel: 'Facebook',
    accent: 'text-blue-400',
    barColor: 'bg-blue-400',
    badgeCls: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  },
  {
    key: 'events',
    label: 'Events & Forums',
    shortLabel: 'Events',
    accent: 'text-amber-400',
    barColor: 'bg-amber-400',
    badgeCls: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  },
  {
    key: 'tenders',
    label: 'Tenders & RFPs',
    shortLabel: 'Tenders',
    accent: 'text-violet-400',
    barColor: 'bg-violet-400',
    badgeCls: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
  },
  {
    key: 'website',
    label: 'Website',
    shortLabel: 'Website',
    accent: 'text-cyan-400',
    barColor: 'bg-cyan-400',
    badgeCls: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    shortLabel: 'Instagram',
    accent: 'text-pink-400',
    barColor: 'bg-pink-400',
    badgeCls: 'bg-pink-500/10 text-pink-300 border-pink-500/30',
  },
]

const STAGE_LABELS: Record<string, { label: string; cls: string }> = {
  new_lead: { label: 'New Inquiry', cls: 'bg-sky-500/10 text-sky-300 border-sky-500/30' },
  repeat_lead: { label: 'Repeat Inquiry', cls: 'bg-violet-500/10 text-violet-300 border-violet-500/30' },
  hot_lead: { label: 'Hot Lead', cls: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
  warm_lead: { label: 'Warm Lead', cls: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' },
  viewing: { label: 'Booked Consultation', cls: 'bg-purple-500/10 text-purple-300 border-purple-500/30' },
  cold_lead: { label: 'Cold Lead', cls: 'bg-slate-500/10 text-slate-300 border-slate-600/40' },
  closed_won: { label: 'Won Deal', cls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
  spam: { label: 'Spam', cls: 'bg-rose-500/10 text-rose-300 border-rose-500/30' },
}

function classifyPlatform(source?: string | null): PlatformKey {
  const s = (source || '').toLowerCase().trim()
  if (s.includes('whatsapp')) return 'whatsapp'
  if (s.includes('facebook') || s === 'fb') return 'facebook'
  if (s.includes('instagram') || s.includes('ig_')) return 'instagram'
  if (s.includes('tender') || s.includes('rfp')) return 'tenders'
  if (s.includes('event') || s.includes('forum')) return 'events'
  if (s.includes('website') || s.includes('web_') || s.includes('landing')) return 'website'
  if (s.includes('email') || s.includes('outlook') || s.includes('microsoft_365') || s.includes('gmail')) return 'email'
  return 'other'
}

function PlatformIcon({ platform, className = 'w-4 h-4' }: { platform: PlatformKey; className?: string }) {
  switch (platform) {
    case 'email':
      return <Mail className={className} />
    case 'whatsapp':
      return <MessageCircle className={className} />
    case 'facebook':
      return <Share2 className={className} />
    case 'events':
      return <Calendar className={className} />
    case 'tenders':
      return <FileText className={className} />
    case 'website':
      return <Globe className={className} />
    case 'instagram':
      return <Instagram className={className} />
    default:
      return <Layers className={className} />
  }
}

export default function SalesAdminDashboard() {
  const supabase = createClient()
  const [adminEmail, setAdminEmail] = useState<string>('awuorcillah@gmail.com')
  const [leads, setLeads] = useState<RawLead[]>([])
  const [staff, setStaff] = useState<StaffRow[]>([])
  const [loading, setLoading] = useState(true)

  // Filters for Master Lead Intake & Assignment Table
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformKey | 'all'>('all')
  const [selectedAgent, setSelectedAgent] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [reassigningId, setReassigningId] = useState<string | null>(null)
  const [recentActivities, setRecentActivities] = useState<any[]>([])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [{ data: authData }, { data: leadsData }, { data: staffData }, actRes] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('sales_leads').select('*').order('created_at', { ascending: false }),
        supabase.from('staff_members').select('id, email, full_name, role, status, org_id').eq('is_active', true),
        fetch('/api/leads/activity?limit=18').catch(() => null),
      ])

      if (actRes && actRes.ok) {
        const actJson = await actRes.json()
        setRecentActivities(actJson.activities || [])
      }

      if (authData?.user?.email) {
        setAdminEmail(authData.user.email.toLowerCase())
      }
      setLeads((leadsData || []) as RawLead[])
      setStaff((staffData || []) as StaffRow[])
    } catch (err) {
      console.error('Failed to load admin dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()

    const channel = supabase
      .channel('admin_executive_dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_leads' }, () => {
        fetchDashboardData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Active (non-trash, non-spam) leads
  const activeLeads = useMemo(
    () => leads.filter((l) => l.stage !== 'trash' && l.stage !== 'spam'),
    [leads]
  )

  // Map email -> staff record
  const staffByEmail = useMemo(() => {
    const map: Record<string, StaffRow> = {}
    staff.forEach((s) => {
      if (s.email) map[s.email.toLowerCase()] = s
    })
    return map
  }, [staff])

  // Sales agents eligible for assignment (Cillah org)
  const assignableAgents = useMemo(() => {
    return staff.filter((s) => {
      const r = (s.role || '').toLowerCase()
      return r.includes('sales') || r.includes('ceo') || s.status === 'admin'
    })
  }, [staff])

  const getAgentDisplayName = (email?: string | null) => {
    if (!email) return 'Unassigned'
    const record = staffByEmail[email.toLowerCase()]
    if (record?.full_name) return record.full_name
    return email.split('@')[0]
  }

  // Executive KPIs
  const kpis = useMemo(() => {
    let totalPipelineValue = 0
    let wonValue = 0
    let wonCount = 0
    let hotAndConsultations = 0

    activeLeads.forEach((l) => {
      const val = Number(l.estimated_value) || 0
      totalPipelineValue += val
      if (l.stage === 'closed_won' || l.stage === 'closed') {
        wonValue += val
        wonCount += 1
      }
      if (l.stage === 'hot_lead' || l.stage === 'viewing' || Boolean(l.viewing_date)) {
        hotAndConsultations += 1
      }
    })

    const activeChannels = new Set(activeLeads.map((l) => classifyPlatform(l.source))).size

    return {
      totalLeads: activeLeads.length,
      activeChannels,
      totalPipelineValue,
      wonValue,
      wonCount,
      hotAndConsultations,
    }
  }, [activeLeads])

  // Platform breakdown counts & KES value
  const platformStats = useMemo(() => {
    const total = activeLeads.length || 1
    const base = PLATFORMS.map((meta) => {
      const matching = activeLeads.filter((l) => classifyPlatform(l.source) === meta.key)
      const value = matching.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0)
      return {
        ...meta,
        count: matching.length,
        sharePct: Math.round((matching.length / total) * 100),
        value,
      }
    })

    const otherLeads = activeLeads.filter((l) => classifyPlatform(l.source) === 'other')
    if (otherLeads.length > 0) {
      base.push({
        key: 'other',
        label: 'Direct / Other',
        shortLabel: 'Other',
        accent: 'text-slate-300',
        barColor: 'bg-slate-400',
        badgeCls: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
        count: otherLeads.length,
        sharePct: Math.round((otherLeads.length / total) * 100),
        value: otherLeads.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0),
      })
    }

    return base.sort((a, b) => b.count - a.count)
  }, [activeLeads])

  // Agent accountability stats
  const agentStats = useMemo(() => {
    const map: Record<
      string,
      {
        email: string
        name: string
        totalLeads: number
        hotCount: number
        consultations: number
        wonCount: number
        wonValue: number
        pipelineValue: number
        speedMins: number[]
      }
    > = {}

    assignableAgents.forEach((s) => {
      const key = s.email.toLowerCase()
      map[key] = {
        email: key,
        name: s.full_name,
        totalLeads: 0,
        hotCount: 0,
        consultations: 0,
        wonCount: 0,
        wonValue: 0,
        pipelineValue: 0,
        speedMins: [],
      }
    })

    activeLeads.forEach((l) => {
      const email = (l.assigned_agent_email || 'unassigned').toLowerCase()
      if (!map[email]) {
        map[email] = {
          email,
          name: getAgentDisplayName(l.assigned_agent_email),
          totalLeads: 0,
          hotCount: 0,
          consultations: 0,
          wonCount: 0,
          wonValue: 0,
          pipelineValue: 0,
          speedMins: [],
        }
      }
      const ag = map[email]
      const val = Number(l.estimated_value) || 0
      ag.totalLeads += 1
      ag.pipelineValue += val
      if (l.stage === 'hot_lead') ag.hotCount += 1
      if (l.stage === 'viewing' || Boolean(l.viewing_date)) ag.consultations += 1
      if (l.stage === 'closed_won' || l.stage === 'closed') {
        ag.wonCount += 1
        ag.wonValue += val
      }
      const diffMs =
        l.updated_at && l.created_at
          ? Math.abs(new Date(l.updated_at).getTime() - new Date(l.created_at).getTime())
          : 180000
      ag.speedMins.push(Math.min(18, Math.max(2, Math.round(diffMs / 60000))))
    })

    return Object.values(map)
      .filter((a) => a.totalLeads > 0 || a.email !== 'unassigned')
      .map((a) => ({
        ...a,
        avgSpeed:
          a.speedMins.length > 0
            ? Math.round(a.speedMins.reduce((x, y) => x + y, 0) / a.speedMins.length)
            : 4,
      }))
      .sort((a, b) => b.totalLeads - a.totalLeads || b.wonValue - a.wonValue)
  }, [activeLeads, assignableAgents, staffByEmail])

  // Filtered rows for Master Lead Intake & Assignment Table
  const filteredTableLeads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return activeLeads.filter((l) => {
      if (selectedPlatform !== 'all' && classifyPlatform(l.source) !== selectedPlatform) return false
      if (selectedAgent !== 'all' && (l.assigned_agent_email || '').toLowerCase() !== selectedAgent.toLowerCase()) {
        return false
      }
      if (q) {
        const hay = `${l.full_name} ${l.company_name || ''} ${l.email || ''} ${l.phone_number || ''} ${l.source || ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [activeLeads, selectedPlatform, selectedAgent, searchQuery])

  // Inline 1-click Agent Reassignment for Admin
  const handleInlineReassign = async (lead: RawLead, newEmail: string) => {
    if (!newEmail || newEmail.toLowerCase() === (lead.assigned_agent_email || '').toLowerCase()) return
    setReassigningId(lead.id)
    try {
      const targetStaff = staffByEmail[newEmail.toLowerCase()]
      const { error } = await supabase
        .from('sales_leads')
        .update({
          assigned_agent_email: newEmail,
          assigned_agent_id: targetStaff?.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id)

      if (error) throw error

      await supabase.from('lead_notes').insert({
        lead_id: lead.id,
        author_email: adminEmail,
        author_name: 'Admin',
        source: 'lead_transfer',
        note_text: `Reassigned from ${getAgentDisplayName(lead.assigned_agent_email)} to ${targetStaff?.full_name || newEmail} via Admin Dashboard.`,
      })

      setLeads((prev) =>
        prev.map((row) =>
          row.id === lead.id
            ? { ...row, assigned_agent_email: newEmail, assigned_agent_id: targetStaff?.id || null }
            : row
        )
      )
      toast.success(`Assigned "${lead.full_name}" to ${targetStaff?.full_name || newEmail}`)
    } catch (err) {
      console.error('Reassignment failed:', err)
      toast.error('Failed to reassign lead')
    } finally {
      setReassigningId(null)
    }
  }

  const formatKES = (amount: number) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(amount)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
      {/* Top Executive Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Lead Intake & Executive Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Live omnichannel lead volume across Email, WhatsApp, Facebook, Events & Tenders — with agent ownership.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium rounded-xl border border-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#C9A66B]' : ''}`} />
            Refresh
          </button>
          <Link
            href="/admin/pipeline"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#C9A66B] hover:bg-[#C9A66B]/90 text-slate-950 font-bold text-xs rounded-xl transition-colors"
          >
            Full Pipeline Board
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Total Active Leads</span>
            <Layers className="w-4 h-4 text-[#C9A66B]" />
          </div>
          <div className="mt-2.5 text-2xl font-bold text-white">{kpis.totalLeads}</div>
          <p className="text-[11px] text-slate-400 mt-1">
            Captured across <span className="text-slate-200 font-semibold">{kpis.activeChannels} channels</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Total Pipeline Value</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2.5 text-2xl font-bold text-white">{formatKES(kpis.totalPipelineValue)}</div>
          <p className="text-[11px] text-emerald-400 mt-1 font-medium">
            {formatKES(kpis.wonValue)} closed won
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Hot & Consultations</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2.5 text-2xl font-bold text-white">{kpis.hotAndConsultations}</div>
          <p className="text-[11px] text-slate-400 mt-1">High-priority deals & scheduled calls</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/20">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Won Engagements</span>
            <Trophy className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2.5 text-2xl font-bold text-emerald-400">{kpis.wonCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">{formatKES(kpis.wonValue)} confirmed revenue</p>
        </div>
      </div>

      {/* LEADS BY PLATFORM / CHANNEL BREAKDOWN */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold text-white">Leads by Platform</h2>
            <p className="text-xs text-slate-400">
              Click any platform to filter the lead assignment table below.
            </p>
          </div>
          {selectedPlatform !== 'all' && (
            <button
              onClick={() => setSelectedPlatform('all')}
              className="inline-flex items-center gap-1.5 text-xs text-[#C9A66B] hover:underline cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Clear platform filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {platformStats.map((p) => {
            const isSelected = selectedPlatform === p.key
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setSelectedPlatform(isSelected ? 'all' : p.key)}
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#C9A66B]/10 border-[#C9A66B]/70 ring-1 ring-[#C9A66B]/40'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={p.accent}>
                    <PlatformIcon platform={p.key} className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">{p.sharePct}%</span>
                </div>
                <div className="text-xl font-bold text-white leading-none">{p.count}</div>
                <div className="text-[11px] text-slate-300 font-medium mt-1 truncate" title={p.label}>
                  {p.shortLabel}
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-2.5">
                  <div
                    className={`h-full rounded-full ${p.barColor}`}
                    style={{ width: `${Math.max(p.count > 0 ? 10 : 0, p.sharePct)}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 mt-1.5 truncate">
                  {p.value > 0 ? formatKES(p.value) : 'KES 0'}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* MASTER LEAD ASSIGNMENT TABLE + AGENT ACCOUNTABILITY */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left 2 Columns: Lead Intake & Assignment Ledger */}
        <div className="xl:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#C9A66B]" />
                Lead Intake & Agent Assignments
                <span className="text-[11px] font-normal text-slate-400">
                  ({filteredTableLeads.length})
                </span>
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search lead or firm..."
                  className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#C9A66B] w-44"
                />
              </div>

              {/* Agent Filter */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
                <Filter className="w-3 h-3 text-slate-500" />
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900">All Agents</option>
                  {agentStats.map((ag) => (
                    <option key={ag.email} value={ag.email} className="bg-slate-900">
                      {ag.name} ({ag.totalLeads})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 text-[10px] uppercase tracking-wider text-slate-400 bg-slate-950/50">
                  <th className="py-3 px-4 font-semibold">Client / Organization</th>
                  <th className="py-3 px-3 font-semibold">Platform</th>
                  <th className="py-3 px-3 font-semibold">Assigned Agent</th>
                  <th className="py-3 px-3 font-semibold">Stage</th>
                  <th className="py-3 px-3 font-semibold text-right">Est. Value</th>
                  <th className="py-3 px-4 font-semibold">Next Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      Loading leads across platforms...
                    </td>
                  </tr>
                ) : filteredTableLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      No leads match the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredTableLeads.slice(0, 15).map((lead) => {
                    const pKey = classifyPlatform(lead.source)
                    const pMeta = PLATFORMS.find((p) => p.key === pKey)
                    const st = STAGE_LABELS[lead.stage] || {
                      label: lead.stage.replace(/_/g, ' '),
                      cls: 'bg-slate-800 text-slate-300 border-slate-700',
                    }
                    return (
                      <tr key={lead.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{lead.full_name}</div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                            {lead.company_name || lead.email || lead.phone_number || '—'}
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                              pMeta?.badgeCls || 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            <PlatformIcon platform={pKey} className="w-3 h-3" />
                            {pMeta?.shortLabel || 'Direct'}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <select
                            value={(lead.assigned_agent_email || '').toLowerCase()}
                            disabled={reassigningId === lead.id}
                            onChange={(e) => handleInlineReassign(lead, e.target.value)}
                            className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-[#C9A66B] cursor-pointer max-w-[155px]"
                          >
                            {!lead.assigned_agent_email && (
                              <option value="" className="bg-slate-900">Unassigned</option>
                            )}
                            {assignableAgents.map((ag) => (
                              <option key={ag.id} value={ag.email.toLowerCase()} className="bg-slate-900">
                                {ag.full_name}
                              </option>
                            ))}
                            {lead.assigned_agent_email &&
                              !assignableAgents.some(
                                (a) => a.email.toLowerCase() === lead.assigned_agent_email?.toLowerCase()
                              ) && (
                                <option value={lead.assigned_agent_email.toLowerCase()} className="bg-slate-900">
                                  {getAgentDisplayName(lead.assigned_agent_email)}
                                </option>
                              )}
                          </select>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${st.cls}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-emerald-400 whitespace-nowrap">
                          {lead.estimated_value && lead.estimated_value > 0
                            ? formatKES(Number(lead.estimated_value))
                            : '—'}
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-400 max-w-[170px] truncate">
                          {lead.followup_title ||
                            (lead.next_followup_at
                              ? new Date(lead.next_followup_at).toLocaleDateString()
                              : '—')}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Agent Accountability & Workload */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#C9A66B]" />
                Agent Accountability
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Click an agent to inspect their assigned leads.
              </p>
            </div>
            {selectedAgent !== 'all' && (
              <button
                onClick={() => setSelectedAgent('all')}
                className="text-[11px] text-[#C9A66B] hover:underline cursor-pointer"
              >
                Show All
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {agentStats.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-8">No active sales agents yet.</div>
            ) : (
              agentStats.map((ag) => {
                const isSelected = selectedAgent.toLowerCase() === ag.email.toLowerCase()
                const initials = ag.name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
                return (
                  <button
                    key={ag.email}
                    type="button"
                    onClick={() => setSelectedAgent(isSelected ? 'all' : ag.email)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#C9A66B]/10 border-[#C9A66B]/60'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#C9A66B]/15 border border-[#C9A66B]/40 flex items-center justify-center text-xs font-bold text-[#C9A66B] shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{ag.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{ag.email}</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[11px] font-bold text-white shrink-0">
                        {ag.totalLeads} leads
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-800/80 text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Won</span>
                        <span className="font-bold text-emerald-400">{ag.wonCount}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Pipeline</span>
                        <span className="font-semibold text-slate-200 truncate block">
                          {ag.pipelineValue > 0 ? `${(ag.pipelineValue / 1000000).toFixed(1)}M` : '—'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block text-[10px]">Avg SLA</span>
                        <span className="font-semibold text-amber-400 inline-flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" /> {ag.avgSpeed}m
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Live Agent Follow-Up Activity Log */}
      {recentActivities.length > 0 && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Live Agent Follow-Up Activity Log
            </h2>
            <span className="text-[11px] text-slate-400">{recentActivities.length} recent actions</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {recentActivities.slice(0, 6).map((act) => (
              <div
                key={act.id}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-2.5 text-xs"
              >
                <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                  {act.activity_type === 'call_logged' || act.activity_type === 'voip_call' ? (
                    <Phone className="w-3.5 h-3.5 text-sky-400" />
                  ) : act.activity_type === 'ai_draft' || act.activity_type === 'ai_pipeline_query' ? (
                    <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white truncate">
                      {act.agent_name || act.agent_email?.split('@')[0]}
                    </span>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2">
                    {act.summary || act.activity_type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Embedded Full CRM Pipeline Board (All Agents / Per-Agent Filtering) */}
      <div className="border-t border-slate-800/80 pt-6">
        <CRMPipelineBoard
          currentUserEmail={adminEmail}
          isStaffAdmin={true}
          forceUserOnly={false}
          embedded={true}
        />
      </div>
    </div>
  )
}
