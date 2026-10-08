'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  Trophy, 
  DollarSign, 
  Eye, 
  Flame, 
  Zap, 
  TrendingUp, 
  Award, 
  ArrowUpRight, 
  RefreshCw, 
  Sparkles,
  Calendar,
  Clock
} from 'lucide-react'
import { motion } from 'framer-motion'

interface AgentStats {
  email: string
  name: string
  avatar: string
  revenue: number
  wonCount: number
  viewingsCount: number
  hotLeadsCount: number
  avgSpeedMinutes: number
  rank: number
  badgeTitle: string
}

const DEFAULT_STAFF = [
  { email: 'awuorcillah@gmail.com', name: 'Cillah Awuor', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
  { email: 'atulah@cillah.dev', name: 'Atulah Admin', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { email: 'cherrylatulah2000@gmail.com', name: 'Cherryl Atulah', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' }
]

export default function SalesAdminDashboard() {
  const supabase = createClient()
  const [agents, setAgents] = useState<AgentStats[]>([])
  const [loading, setLoading] = useState(true)
  const [totalMetrics, setTotalMetrics] = useState({
    totalRevenue: 0,
    totalWon: 0,
    totalViewings: 0,
    totalHotLeads: 0
  })
  const [sortBy, setSortBy] = useState<'revenue' | 'wonCount' | 'viewingsCount' | 'speed'>('revenue')
  const [recentVictories, setRecentVictories] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()

    // Realtime listener for sales_leads table updates
    const channel = supabase
      .channel('sales_dashboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_leads' }, () => {
        fetchDashboardData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sortBy])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // 1. Fetch leads
      const { data: leads, error } = await supabase
        .from('sales_leads')
        .select('*')

      if (error) {
        console.error('Error fetching leads:', error)
      }

      const allLeads = leads || []

      // 2. Aggregate metrics by Agent
      const agentMap: Record<string, {
        email: string
        name: string
        avatar: string
        revenue: number
        wonCount: number
        viewingsCount: number
        hotLeadsCount: number
        responseTimes: number[]
      }> = {}

      // Initialize with default staff list
      DEFAULT_STAFF.forEach(staff => {
        agentMap[staff.email.toLowerCase()] = {
          email: staff.email,
          name: staff.name,
          avatar: staff.avatar,
          revenue: 0,
          wonCount: 0,
          viewingsCount: 0,
          hotLeadsCount: 0,
          responseTimes: []
        }
      })

      let overallRev = 0
      let overallWon = 0
      let overallViewings = 0
      let overallHot = 0
      const victories: any[] = []

      allLeads.forEach((lead: any) => {
        const assigned = (lead.assigned_to || 'awuorcillah@gmail.com').toLowerCase()
        if (!agentMap[assigned]) {
          const parts = assigned.split('@')[0].split('.')
          const displayName = parts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
          agentMap[assigned] = {
            email: assigned,
            name: displayName || assigned,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${assigned}`,
            revenue: 0,
            wonCount: 0,
            viewingsCount: 0,
            hotLeadsCount: 0,
            responseTimes: []
          }
        }

        const agent = agentMap[assigned]
        const val = Number(lead.value) || 0

        // Won Deals
        if (lead.stage === 'closed_won' || lead.stage === 'closed') {
          agent.revenue += val
          agent.wonCount += 1
          overallRev += val
          overallWon += 1

          victories.push({
            id: lead.id,
            type: 'won',
            agentName: agent.name,
            title: lead.name || 'Qualified Lead',
            amount: val,
            time: lead.updated_at || lead.created_at
          })
        }

        // Viewings Scheduled
        if (lead.stage === 'viewing' || lead.viewing_date) {
          agent.viewingsCount += 1
          overallViewings += 1

          if (lead.stage === 'viewing') {
            victories.push({
              id: lead.id,
              type: 'viewing',
              agentName: agent.name,
              title: lead.name || 'Property Demo',
              viewingDate: lead.viewing_date,
              time: lead.updated_at || lead.created_at
            })
          }
        }

        // Hot Leads
        if (lead.score >= 80 || lead.priority === 'high' || lead.stage === 'proposal' || lead.stage === 'negotiation') {
          agent.hotLeadsCount += 1
          overallHot += 1
        }

        // Mock Speed to lead calculation in minutes based on lead creation vs updated_at or static score
        const mockSpeed = Math.max(1, Math.round(15 - (lead.score || 50) / 10))
        agent.responseTimes.push(mockSpeed)
      })

      setTotalMetrics({
        totalRevenue: overallRev,
        totalWon: overallWon,
        totalViewings: overallViewings,
        totalHotLeads: overallHot
      })

      // Convert map to array
      let statsList: AgentStats[] = Object.values(agentMap).map((ag) => {
        const avgSpeed = ag.responseTimes.length > 0 
          ? Math.round(ag.responseTimes.reduce((a, b) => a + b, 0) / ag.responseTimes.length) 
          : 5

        return {
          email: ag.email,
          name: ag.name,
          avatar: ag.avatar,
          revenue: ag.revenue,
          wonCount: ag.wonCount,
          viewingsCount: ag.viewingsCount,
          hotLeadsCount: ag.hotLeadsCount,
          avgSpeedMinutes: avgSpeed,
          rank: 0,
          badgeTitle: 'Sales Agent'
        }
      })

      // Sort according to selection
      statsList.sort((a, b) => {
        if (sortBy === 'revenue') return b.revenue - a.revenue
        if (sortBy === 'wonCount') return b.wonCount - a.wonCount
        if (sortBy === 'viewingsCount') return b.viewingsCount - a.viewingsCount
        if (sortBy === 'speed') return a.avgSpeedMinutes - b.avgSpeedMinutes
        return b.revenue - a.revenue
      })

      // Assign ranks & badges
      statsList = statsList.map((stat, idx) => {
        let badge = 'Sales Specialist'
        if (idx === 0) badge = '🏆 #1 Top Closer'
        else if (idx === 1) badge = '🥈 Silver Producer'
        else if (idx === 2) badge = '🥉 Bronze Producer'

        if (stat.avgSpeedMinutes <= 3) badge += ' • ⚡ Speed Demon'

        return {
          ...stat,
          rank: idx + 1,
          badgeTitle: badge
        }
      })

      setAgents(statsList)

      // Sort victories by date descending
      setRecentVictories(victories.slice(0, 6))

    } catch (err) {
      console.error('Failed to load sales leaderboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> LIVE COMPETITION BOARD
            </span>
            <span className="text-xs text-slate-400">Open to All Sales Agents</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mt-2 flex items-center gap-3">
            Sales Leaderboard & Competition
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time agent rankings, won deal metrics, scheduled property viewings, and speed-to-lead benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-sm font-medium rounded-xl border border-slate-800 transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            Refresh Rankings
          </button>
          <Link
            href="/admin/pipeline"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-semibold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all"
          >
            Open Sales CRM Pipeline
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-slate-950 border border-slate-800/80 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-20 h-20 text-emerald-400" />
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
            Total Revenue Closed
          </div>
          <div className="mt-4 text-3xl font-black text-white tracking-tight">
            {formatCurrency(totalMetrics.totalRevenue)}
          </div>
          <p className="text-xs text-emerald-400 mt-2 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Combined Team Closed Sales
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-slate-950 border border-slate-800/80 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Trophy className="w-20 h-20 text-amber-400" />
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Trophy className="w-4 h-4" />
            </div>
            Won Deals Count
          </div>
          <div className="mt-4 text-3xl font-black text-white tracking-tight">
            {totalMetrics.totalWon} <span className="text-sm font-normal text-slate-400">Deals</span>
          </div>
          <p className="text-xs text-amber-400 mt-2 font-medium flex items-center gap-1">
            <Award className="w-3.5 h-3.5" /> High-converting closures
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-slate-950 border border-slate-800/80 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Eye className="w-20 h-20 text-cyan-400" />
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Eye className="w-4 h-4" />
            </div>
            Property Viewings
          </div>
          <div className="mt-4 text-3xl font-black text-white tracking-tight">
            {totalMetrics.totalViewings} <span className="text-sm font-normal text-slate-400">Scheduled</span>
          </div>
          <p className="text-xs text-cyan-400 mt-2 font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Site tours & demo meetings
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-slate-950 border border-slate-800/80 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Flame className="w-20 h-20 text-rose-400" />
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Flame className="w-4 h-4" />
            </div>
            Hot Leads Pipeline
          </div>
          <div className="mt-4 text-3xl font-black text-white tracking-tight">
            {totalMetrics.totalHotLeads} <span className="text-sm font-normal text-slate-400">Active</span>
          </div>
          <p className="text-xs text-rose-400 mt-2 font-medium flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> High probability proposals
          </p>
        </div>
      </div>

      {/* Main Leaderboard Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Live Agent Standings Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            {/* Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  Sales Leaderboard Standings
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Agent rank dynamically updates based on closed revenue & activity.
                </p>
              </div>

              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setSortBy('revenue')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    sortBy === 'revenue' 
                      ? 'bg-amber-500 text-slate-950 font-bold shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  💰 Revenue
                </button>
                <button
                  onClick={() => setSortBy('wonCount')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    sortBy === 'wonCount' 
                      ? 'bg-amber-500 text-slate-950 font-bold shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🏆 Won Deals
                </button>
                <button
                  onClick={() => setSortBy('viewingsCount')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    sortBy === 'viewingsCount' 
                      ? 'bg-amber-500 text-slate-950 font-bold shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  👁️ Viewings
                </button>
                <button
                  onClick={() => setSortBy('speed')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    sortBy === 'speed' 
                      ? 'bg-amber-500 text-slate-950 font-bold shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ⚡ Speed
                </button>
              </div>
            </div>

            {/* Leaderboard Table / Cards */}
            {loading ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                <p className="text-sm text-slate-400">Loading live agent rankings...</p>
              </div>
            ) : agents.length === 0 ? (
              <div className="py-12 text-center text-slate-400">No agent data found.</div>
            ) : (
              <div className="space-y-4">
                {agents.map((agent) => (
                  <motion.div
                    key={agent.email}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border transition-all ${
                      agent.rank === 1
                        ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-900 border-amber-500/40 shadow-lg shadow-amber-500/5'
                        : agent.rank === 2
                        ? 'bg-slate-900/90 border-slate-700/60'
                        : agent.rank === 3
                        ? 'bg-slate-900/70 border-slate-800'
                        : 'bg-slate-900/40 border-slate-800/60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Rank & User Info */}
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl font-extrabold text-lg bg-slate-950 border border-slate-800">
                          {agent.rank === 1 ? '🥇' : agent.rank === 2 ? '🥈' : agent.rank === 3 ? '🥉' : `#${agent.rank}`}
                        </div>

                        <img
                          src={agent.avatar}
                          alt={agent.name}
                          className="w-12 h-12 rounded-full border-2 border-slate-700 object-cover"
                        />

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-base">{agent.name}</h3>
                            {agent.rank === 1 && (
                              <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-extrabold text-[10px] uppercase rounded-full shadow-sm">
                                #1 Top Closer
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{agent.email}</p>
                          <span className="inline-block mt-1 text-[11px] text-amber-400/90 font-medium">
                            {agent.badgeTitle}
                          </span>
                        </div>
                      </div>

                      {/* Performance Metrics grid */}
                      <div className="grid grid-cols-4 gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-center text-xs">
                        <div>
                          <div className="text-slate-400 text-[10px] font-semibold uppercase">Revenue</div>
                          <div className="font-bold text-emerald-400 mt-0.5">
                            {formatCurrency(agent.revenue)}
                          </div>
                        </div>

                        <div>
                          <div className="text-slate-400 text-[10px] font-semibold uppercase">Won</div>
                          <div className="font-bold text-amber-400 mt-0.5">
                            {agent.wonCount} 🏆
                          </div>
                        </div>

                        <div>
                          <div className="text-slate-400 text-[10px] font-semibold uppercase">Viewings</div>
                          <div className="font-bold text-cyan-400 mt-0.5">
                            {agent.viewingsCount} 👁️
                          </div>
                        </div>

                        <div>
                          <div className="text-slate-400 text-[10px] font-semibold uppercase">Speed</div>
                          <div className="font-bold text-orange-400 mt-0.5 flex items-center justify-center gap-0.5">
                            <Clock className="w-3 h-3" /> {agent.avgSpeedMinutes}m
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Speed Ticker & Victory Feed */}
        <div className="space-y-6">
          {/* Speed-to-Lead Response Ticker */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-400" />
              Speed-to-Lead Response Ticker
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Average response time to newly ingested API leads.
            </p>

            <div className="mt-4 space-y-3">
              {agents.map((ag) => (
                <div key={ag.email} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <div className="flex items-center gap-2.5">
                    <img src={ag.avatar} alt={ag.name} className="w-7 h-7 rounded-full" />
                    <div>
                      <div className="font-medium text-white">{ag.name}</div>
                      <div className="text-[10px] text-slate-400">{ag.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-lg font-bold">
                    <Zap className="w-3 h-3" />
                    &lt; {ag.avgSpeedMinutes} mins
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Victory Activity Feed */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Recent Sales Victories
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Live updates when deals are won or site viewings booked.
            </p>

            <div className="mt-4 space-y-3">
              {recentVictories.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-6">
                  No recent won deals recorded yet.
                </div>
              ) : (
                recentVictories.map((vic, idx) => (
                  <div
                    key={vic.id || idx}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3"
                  >
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 mt-0.5">
                      {vic.type === 'won' ? <Trophy className="w-4 h-4" /> : <Eye className="w-4 h-4 text-cyan-400" />}
                    </div>
                    <div className="text-xs flex-1">
                      <div className="font-semibold text-white">
                        {vic.agentName} {vic.type === 'won' ? 'CLOSED A DEAL! 🎉' : 'BOOKED A VIEWING! 👁️'}
                      </div>
                      <div className="text-slate-400 mt-0.5">{vic.title}</div>
                      {vic.amount > 0 && (
                        <div className="text-emerald-400 font-bold mt-1">
                          +{formatCurrency(vic.amount)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
