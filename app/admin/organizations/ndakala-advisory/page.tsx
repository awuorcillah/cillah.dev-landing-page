'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import CRMPipelineBoard from '@/components/crm/crm-pipeline-board'
import {
  Mail,
  MessageCircle,
  Globe,
  Calendar,
  FileText,
  Share2,
  Users,
  TrendingUp,
  Trophy,
  Flame,
  RefreshCw,
  Clock,
  Layers,
  X,
  ShieldCheck,
  Lock,
  Building2,
  Activity,
  Phone,
  Bot
} from 'lucide-react'

const NDAKALA_ORG_ID = 'a1b2c3d4-e5f6-7890-abcd-555555555555'
const EXCLUDED_REAL_EMAILS = ['atulah@cillah.dev']
const TOSSIE_EMAIL = 'cherrylatulah@gmail.com'

interface RawLead {
  id: string
  full_name: string
  source: string | null
  stage: string
  assigned_agent_email: string | null
  estimated_value: number | null
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

type PlatformKey = 'email' | 'whatsapp' | 'facebook' | 'events' | 'tenders' | 'website' | 'other'

interface PlatformMeta {
  key: PlatformKey
  label: string
  shortLabel: string
  accent: string
  barColor: string
}

const PLATFORMS: PlatformMeta[] = [
  { key: 'email', label: 'Email / Microsoft 365', shortLabel: 'Email', accent: 'text-sky-400', barColor: 'bg-sky-400' },
  { key: 'whatsapp', label: 'WhatsApp', shortLabel: 'WhatsApp', accent: 'text-emerald-400', barColor: 'bg-emerald-400' },
  { key: 'facebook', label: 'Facebook', shortLabel: 'Facebook', accent: 'text-blue-400', barColor: 'bg-blue-400' },
  { key: 'events', label: 'Events & Forums', shortLabel: 'Events', accent: 'text-amber-400', barColor: 'bg-amber-400' },
  { key: 'tenders', label: 'Tenders & RFPs', shortLabel: 'Tenders', accent: 'text-violet-400', barColor: 'bg-violet-400' },
  { key: 'website', label: 'Website', shortLabel: 'Website', accent: 'text-cyan-400', barColor: 'bg-cyan-400' },
]

function classifyPlatform(source?: string | null): PlatformKey {
  const s = (source || '').toLowerCase().trim()
  if (s.includes('whatsapp')) return 'whatsapp'
  if (s.includes('facebook') || s === 'fb') return 'facebook'
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
    default:
      return <Layers className={className} />
  }
}

export default function NdakalaAdvisoryDashboardPage() {
  const supabase = createClient()
  const [adminEmail, setAdminEmail] = useState<string>('awuorcillah@gmail.com')
  const [leads, setLeads] = useState<RawLead[]>([])
  const [orgStaff, setOrgStaff] = useState<StaffRow[]>([])
  const [loading, setLoading] = useState(true)

  // Live Role Demo Switcher: CEO/Admin vs Restricted Sales Agent (Tossie)
  const [viewRole, setViewRole] = useState<'ceo_admin' | 'sales_agent'>('ceo_admin')

  // Clicking a Platform or Agent card filters the unified CRM Pipeline Board below
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformKey | 'all'>('all')
  const [selectedAgent, setSelectedAgent] = useState<string>('all')
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [activityByAgent, setActivityByAgent] = useState<Record<string, any>>({})

  const fetchOrgData = async () => {
    setLoading(true)
    try {
      const [{ data: authData }, { data: staffData }, { data: leadsData }, actRes] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from('staff_members')
          .select('id, email, full_name, role, status, org_id')
          .eq('org_id', NDAKALA_ORG_ID)
          .eq('is_active', true)
          .order('full_name', { ascending: true }),
        supabase
          .from('sales_leads')
          .select('id, full_name, source, stage, assigned_agent_email, estimated_value, viewing_date, created_at, updated_at')
          .order('created_at', { ascending: false }),
        fetch(`/api/leads/activity?orgId=${NDAKALA_ORG_ID}&excludeEmails=${EXCLUDED_REAL_EMAILS.join(',')}&limit=25`).catch(() => null),
      ])

      if (authData?.user?.email) {
        setAdminEmail(authData.user.email.toLowerCase())
      }

      if (actRes && actRes.ok) {
        const actJson = await actRes.json()
        setRecentActivities(actJson.activities || [])
        setActivityByAgent(actJson.byAgent || {})
      }

      const validStaff = ((staffData || []) as StaffRow[]).filter(
        (s) => !EXCLUDED_REAL_EMAILS.includes((s.email || '').toLowerCase())
      )
      setOrgStaff(validStaff)

      const allowedEmails = new Set(validStaff.map((s) => s.email.toLowerCase()))
      const orgOnlyLeads = ((leadsData || []) as RawLead[]).filter((l) => {
        const assigned = (l.assigned_agent_email || '').toLowerCase()
        if (EXCLUDED_REAL_EMAILS.includes(assigned)) return false
        return allowedEmails.has(assigned)
      })
      setLeads(orgOnlyLeads)
    } catch (err) {
      console.error('Failed to load Ndakala Advisory demo data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrgData()

    const channel = supabase
      .channel('ndakala_advisory_executive_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_leads' }, () => {
        fetchOrgData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const activeLeads = useMemo(
    () => leads.filter((l) => l.stage !== 'trash' && l.stage !== 'spam'),
    [leads]
  )

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

  const platformStats = useMemo(() => {
    const total = activeLeads.length || 1
    return PLATFORMS.map((meta) => {
      const matching = activeLeads.filter((l) => classifyPlatform(l.source) === meta.key)
      const value = matching.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0)
      return {
        ...meta,
        count: matching.length,
        sharePct: Math.round((matching.length / total) * 100),
        value,
      }
    }).sort((a, b) => b.count - a.count)
  }, [activeLeads])

  const agentStats = useMemo(() => {
    return orgStaff
      .map((ag) => {
        const emailLower = ag.email.toLowerCase()
        const agLeads = activeLeads.filter(
          (l) => (l.assigned_agent_email || '').toLowerCase() === emailLower
        )
        const wonLeads = agLeads.filter((l) => l.stage === 'closed_won' || l.stage === 'closed')
        const pipelineValue = agLeads.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0)
        const speedMins = agLeads.map((l) => {
          const diffMs =
            l.updated_at && l.created_at
              ? Math.abs(new Date(l.updated_at).getTime() - new Date(l.created_at).getTime())
              : 180000
          return Math.min(18, Math.max(2, Math.round(diffMs / 60000)))
        })
        const avgSpeed =
          speedMins.length > 0
            ? Math.round(speedMins.reduce((a, b) => a + b, 0) / speedMins.length)
            : 4

        return {
          email: emailLower,
          name: ag.full_name,
          totalLeads: agLeads.length,
          wonCount: wonLeads.length,
          pipelineValue,
          avgSpeed,
        }
      })
      .sort((a, b) => b.totalLeads - a.totalLeads)
  }, [orgStaff, activeLeads])

  const formatKES = (amount: number) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(amount)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
      {/* Executive Header & Role Access Preview Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#C9A66B] uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5" />
            Ndakala Advisory LLP • Organization Workspace
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {viewRole === 'ceo_admin'
              ? 'Managing Partner & CEO Dashboard'
              : 'Sales Agent View — Tossie (Restricted Access)'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {viewRole === 'ceo_admin'
              ? 'Full visibility across all practice desks, lead channels, activity timestamps, and Admin-only deletion.'
              : 'Agents see only their own assigned leads, can update stages & draft with AI, and cannot delete leads.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewRole('ceo_admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewRole === 'ceo_admin'
                  ? 'bg-[#C9A66B] text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              CEO / Admin View
            </button>
            <button
              type="button"
              onClick={() => setViewRole('sales_agent')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewRole === 'sales_agent'
                  ? 'bg-sky-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Agent View (Tossie)
            </button>
          </div>

          <button
            type="button"
            onClick={fetchOrgData}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium rounded-xl border border-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#C9A66B]' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Role Access Governance Banner */}
      <div
        className={`rounded-xl px-4 py-3 border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
          viewRole === 'ceo_admin'
            ? 'bg-[#C9A66B]/10 border-[#C9A66B]/30 text-slate-200'
            : 'bg-sky-500/10 border-sky-500/30 text-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          {viewRole === 'ceo_admin' ? (
            <ShieldCheck className="w-4 h-4 text-[#C9A66B] shrink-0" />
          ) : (
            <Lock className="w-4 h-4 text-sky-400 shrink-0" />
          )}
          <span>
            {viewRole === 'ceo_admin' ? (
              <>
                <strong className="text-white">Admin Governance Active:</strong> Inspect all {orgStaff.length} sales
                desks, reassign inquiries directly in the board/table below, and delete/restore via Recycle Bin.
              </>
            ) : (
              <>
                <strong className="text-white">Sales Agent Permissions Active (Tossie):</strong> Scoped strictly to own
                leads. Stage movement & Personal AI enabled — <strong className="text-sky-300">deletion locked to Admins</strong>.
              </>
            )}
          </span>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 shrink-0">
          {viewRole === 'ceo_admin' ? 'Delete: Enabled' : 'Delete: Locked'}
        </span>
      </div>

      {viewRole === 'ceo_admin' && (
        <>
          {/* 4 Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium">Total Firm Leads</span>
                <Layers className="w-4 h-4 text-[#C9A66B]" />
              </div>
              <div className="mt-2.5 text-2xl font-bold text-white">{kpis.totalLeads}</div>
              <p className="text-[11px] text-slate-400 mt-1">
                Across <span className="text-slate-200 font-semibold">{kpis.activeChannels} channels</span> &{' '}
                <span className="text-slate-200 font-semibold">{orgStaff.length} desks</span>
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
              <p className="text-[11px] text-slate-400 mt-1">Active proposals & scheduled partner calls</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/20">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium">Won Engagements</span>
                <Trophy className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2.5 text-2xl font-bold text-emerald-400">{kpis.wonCount}</div>
              <p className="text-[11px] text-slate-400 mt-1">{formatKES(kpis.wonValue)} confirmed fees</p>
            </div>
          </div>

          {/* LEADS BY PLATFORM BREAKDOWN (Filters CRM Board directly below) */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-bold text-white">Leads by Platform</h2>
                <p className="text-xs text-slate-400">
                  Click any channel to filter the CRM Pipeline Board below.
                </p>
              </div>
              {selectedPlatform !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedPlatform('all')}
                  className="inline-flex items-center gap-1.5 text-xs text-[#C9A66B] hover:underline cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Clear channel filter
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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

          {/* 2-COLUMN EXECUTIVE PULSE: AGENT ACCOUNTABILITY + LIVE FOLLOW-UP ACTIVITY LOG */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left: Sales Agent Accountability */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#C9A66B]" />
                    Sales Agent Accountability
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click an agent to filter the pipeline board below to their desk.
                  </p>
                </div>
                {selectedAgent !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedAgent('all')}
                    className="text-[11px] text-[#C9A66B] hover:underline cursor-pointer"
                  >
                    Show All
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {agentStats.map((ag) => {
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

                      <div className="grid grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-slate-800/80 text-[11px]">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Won</span>
                          <span className="font-bold text-emerald-400">{ag.wonCount}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Pipeline</span>
                          <span className="font-semibold text-slate-200">
                            {ag.pipelineValue > 0 ? `${(ag.pipelineValue / 1000000).toFixed(1)}M` : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Actions</span>
                          <span className="font-semibold text-cyan-300">
                            {activityByAgent[ag.email]?.totalActions || 0} logged
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
                })}
              </div>
            </div>

            {/* Right: Live Agent Follow-Up Activity Log */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    Live Agent Follow-Up Activity Log
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Every call, WhatsApp, Email, AI draft & follow-up date timestamped automatically.
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {recentActivities.length} logged
                </span>
              </div>

              {recentActivities.length === 0 ? (
                <div className="text-xs text-slate-500 py-8 text-center">
                  No logged activities yet — interact with a lead below to see live timestamps appear here.
                </div>
              ) : (
                <div className="space-y-2.5 overflow-y-auto max-h-[320px] pr-1">
                  {recentActivities.slice(0, 10).map((act) => {
                    const icon =
                      act.activity_type === 'call_logged' || act.activity_type === 'voip_call' ? (
                        <Phone className="w-3.5 h-3.5 text-sky-400" />
                      ) : act.activity_type === 'whatsapp_click' ? (
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      ) : act.activity_type === 'email_click' ? (
                        <Mail className="w-3.5 h-3.5 text-purple-400" />
                      ) : act.activity_type === 'ai_draft' || act.activity_type === 'ai_pipeline_query' ? (
                        <Bot className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                      )

                    return (
                      <div
                        key={act.id}
                        className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3 text-xs"
                      >
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                          {icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-white truncate">
                              {act.agent_name || act.agent_email?.split('@')[0]}
                            </span>
                            <span className="text-[10px] text-slate-500 shrink-0">
                              {new Date(act.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2">
                            {act.summary || act.activity_type.replace(/_/g, ' ')}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                            {act.lead_name && <span className="text-slate-400">{act.lead_name}</span>}
                            {act.duration_seconds && (
                              <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 font-semibold">
                                {Math.floor(act.duration_seconds / 60)}m {act.duration_seconds % 60}s call
                              </span>
                            )}
                            {act.recording_url && (
                              <a
                                href={act.recording_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-cyan-400 hover:underline font-semibold"
                              >
                                Play Recording
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* SINGLE UNIFIED MULTI-AGENT CRM PIPELINE BOARD (Kanban + Table View) */}
      <div className="border-t border-slate-800/80 pt-6">
        <CRMPipelineBoard
          currentUserEmail={viewRole === 'ceo_admin' ? adminEmail : TOSSIE_EMAIL}
          isStaffAdmin={viewRole === 'ceo_admin'}
          forceUserOnly={viewRole === 'sales_agent'}
          embedded={true}
          orgId={NDAKALA_ORG_ID}
          excludeEmails={EXCLUDED_REAL_EMAILS}
          currencyPrefix="KES "
          externalAgentFilter={selectedAgent}
          externalPlatformFilter={selectedPlatform}
        />
      </div>
    </div>
  )
}
