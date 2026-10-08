'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Calendar,
  Clock,
  UserCheck,
  Search,
  Filter,
  MessageCircle,
  Phone,
  Mail,
  Video,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building
} from 'lucide-react'

export default function UpcomingAppointmentsPage() {
  const supabase = createClient()
  const [appointments, setAppointments] = useState<any[]>([])
  const [staffMembers, setStaffMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [agentFilter, setAgentFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      // 1. Fetch Staff Members
      const { data: staff } = await supabase.from('staff_members').select('*')
      if (staff) setStaffMembers(staff)

      // 2. Fetch Appointments joined with Lead details
      const { data: apptData, error } = await supabase
        .from('appointments')
        .select(`
          *,
          sales_leads (
            id,
            full_name,
            email,
            phone_number,
            company_name,
            source,
            stage
          )
        `)
        .order('scheduled_at', { ascending: true })

      if (apptData) setAppointments(apptData)
      setLoading(false)
    }

    fetchData()
  }, [])

  // Filter Appointments
  const filteredAppointments = appointments.filter((item) => {
    // Agent Filter
    if (agentFilter !== 'all' && item.assigned_agent_email !== agentFilter) {
      return false
    }

    // Time Filter
    if (timeFilter !== 'all') {
      const scheduledAt = new Date(item.scheduled_at).getTime()
      const now = new Date().getTime()
      const diffHours = (scheduledAt - now) / (1000 * 60 * 60)

      if (timeFilter === 'today' && (diffHours < 0 || diffHours > 24)) return false
      if (timeFilter === 'week' && (diffHours < 0 || diffHours > 24 * 7)) return false
      if (timeFilter === 'month' && (diffHours < 0 || diffHours > 24 * 30)) return false
    }

    // Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase()
      const matchTitle = item.title?.toLowerCase().includes(q)
      const matchLeadName = item.sales_leads?.full_name?.toLowerCase().includes(q)
      const matchAgent = item.assigned_agent_email?.toLowerCase().includes(q)
      if (!matchTitle && !matchLeadName && !matchAgent) return false
    }

    return true
  })

  const getWhatsAppLink = (phone: string | null) => {
    if (!phone) return '#'
    return `https://wa.me/${phone.replace(/[^0-9]/g, '')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E131F] text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#C9A66B] font-medium">
          <Sparkles className="w-6 h-6 animate-spin" /> Loading Upcoming Appointments...
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-[#0E131F] text-slate-100 p-4 md:p-8 font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Calendar className="w-7 h-7 text-[#C9A66B]" /> Upcoming Appointments & Meetings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Filter scheduled follow-ups by sales agent, date, and meeting time.
          </p>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search appointment title, lead name, agent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/70 text-slate-100 text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#C9A66B]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Agent Filter */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs">
            <UserCheck className="w-4 h-4 text-[#C9A66B]" />
            <span className="text-slate-400">Agent:</span>
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Sales Agents</option>
              {staffMembers.map((agent) => (
                <option key={agent.id} value={agent.email} className="bg-slate-900">
                  {agent.full_name} ({agent.email})
                </option>
              ))}
            </select>
          </div>

          {/* Time Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs">
            {(['all', 'today', 'week', 'month'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeFilter(t)}
                className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                  timeFilter === t ? 'bg-slate-800 text-[#C9A66B] font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'all' ? 'All Scheduled' : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* APPOINTMENTS LIST */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-200">No Upcoming Appointments Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Appointments scheduled by sales agents will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAppointments.map((appt) => {
            const lead = appt.sales_leads
            const isPast = new Date(appt.scheduled_at) < new Date()

            return (
              <div
                key={appt.id}
                className={`bg-slate-900/90 border ${
                  isPast ? 'border-red-500/40' : 'border-slate-800'
                } rounded-2xl p-5 shadow-xl flex flex-col justify-between`}
              >
                <div>
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A66B] bg-[#C9A66B]/10 px-2.5 py-1 rounded-md border border-[#C9A66B]/20">
                      {appt.status || 'Upcoming'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(appt.scheduled_at).toLocaleString()}
                    </span>
                  </div>

                  {/* Title & Lead */}
                  <h3 className="text-base font-bold text-white mb-1">{appt.title}</h3>
                  {lead && (
                    <div className="text-xs text-slate-300 font-medium mb-3 flex items-center gap-1.5">
                      <span>Lead: <strong className="text-[#C9A66B]">{lead.full_name}</strong></span>
                      {lead.company_name && <span className="text-slate-500">({lead.company_name})</span>}
                    </div>
                  )}

                  {appt.description && (
                    <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800/80 mb-4">
                      {appt.description}
                    </p>
                  )}
                </div>

                {/* Agent & Communication Actions */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    Agent: <span className="text-slate-200 font-medium">{appt.assigned_agent_email?.split('@')[0]}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {lead?.phone_number && (
                      <a
                        href={getWhatsAppLink(lead.phone_number)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl transition-colors"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                    {lead?.phone_number && (
                      <a
                        href={`tel:${lead.phone_number}`}
                        className="p-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-xl transition-colors"
                        title="Call"
                      >
                        <Phone className="w-4 h-4" />
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
  )
}
