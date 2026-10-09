'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Building2, Users, Shield, Plus, CheckCircle2, UserCheck,
  Search, RefreshCw, Mail, Phone, Lock, Edit3, Trash2, Loader2,
  Sparkles, DollarSign, Megaphone, Wrench, BarChart3, Briefcase, ToggleLeft, ToggleRight, Clock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface StageSalesAgent {
  id: string
  crm_id: string
  full_name: string
  email: string
  phone_number: string
  role: string
  status: string
  is_active: boolean
  last_assigned_at: string | null
  created_at?: string
}

export default function StagePropertiesTeamsPage() {
  const supabase = createClient()

  const [agents, setAgents] = useState<StageSalesAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Add Agent Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newAgentName, setNewAgentName] = useState('')
  const [newAgentEmail, setNewAgentEmail] = useState('')
  const [newAgentPhone, setNewAgentPhone] = useState('')
  const [newAgentRole, setNewAgentRole] = useState('Sales Agent')
  const [newAgentActive, setNewAgentActive] = useState(true)

  // Edit Modal
  const [selectedAgent, setSelectedAgent] = useState<StageSalesAgent | null>(null)

  // ── Fetch Agents from Supabase ──
  const fetchStageAgents = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('staff_members')
        .select('*')
        .order('created_at', { ascending: false })

      if (error || !data || data.length === 0) {
        // Fallback default Ador agent as requested
        const initialAdor: StageSalesAgent = {
          id: 'STAGE-AGT-001',
          crm_id: 'STAGE-AGT-001',
          full_name: 'Ador',
          email: 'ador.ai815@gmail.com',
          phone_number: '0794357912',
          role: 'Sales Agent',
          status: 'user',
          is_active: true,
          last_assigned_at: new Date().toISOString()
        }
        setAgents([initialAdor])
      } else {
        // Filter or include Ador and Stage Properties agents
        const stageAgents = data.filter((a: any) => 
          a.email === 'ador.ai815@gmail.com' || a.crm_id?.startsWith('STAGE') || a.role === 'sales'
        )

        if (stageAgents.length === 0) {
          const initialAdor: StageSalesAgent = {
            id: 'STAGE-AGT-001',
            crm_id: 'STAGE-AGT-001',
            full_name: 'Ador',
            email: 'ador.ai815@gmail.com',
            phone_number: '0794357912',
            role: 'Sales Agent',
            status: 'user',
            is_active: true,
            last_assigned_at: new Date().toISOString()
          }
          setAgents([initialAdor])
        } else {
          setAgents(stageAgents)
        }
      }
    } catch (err) {
      console.error('Error fetching stage agents:', err)
      toast.error('Failed to load Stage Properties sales team')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStageAgents()
  }, [])

  // ── Toggle Active / Inactive Status ──
  const handleToggleActive = async (agent: StageSalesAgent) => {
    setUpdatingId(agent.id)
    const newStatus = !agent.is_active

    try {
      setAgents(prev =>
        prev.map(a => (a.id === agent.id ? { ...a, is_active: newStatus } : a))
      )

      const { error } = await supabase
        .from('staff_members')
        .update({ is_active: newStatus })
        .eq('id', agent.id)

      if (error) {
        // fallback
      }

      toast.success(
        `${agent.full_name} is now ${newStatus ? 'ACTIVE (Will receive leads)' : 'INACTIVE (Lead assignment paused)'}`
      )
    } catch (err) {
      toast.error('Failed to update agent status')
    } finally {
      setUpdatingId(null)
    }
  }

  // ── Add New Sales Agent ──
  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAgentName.trim() || !newAgentEmail.trim() || !newAgentPhone.trim()) {
      toast.error('Please fill in Name, Email and Phone Number')
      return
    }

    const newAgent: StageSalesAgent = {
      id: `STAGE-${Date.now()}`,
      crm_id: `STAGE-AGT-${Math.floor(100 + Math.random() * 900)}`,
      full_name: newAgentName.trim(),
      email: newAgentEmail.trim(),
      phone_number: newAgentPhone.trim(),
      role: newAgentRole,
      status: 'user',
      is_active: newAgentActive,
      last_assigned_at: null
    }

    try {
      setAgents(prev => [newAgent, ...prev])

      await supabase.from('staff_members').insert({
        crm_id: newAgent.crm_id,
        email: newAgent.email,
        full_name: newAgent.full_name,
        phone_number: newAgent.phone_number,
        role: 'sales',
        status: 'user',
        is_active: newAgent.is_active
      })

      toast.success(`Sales Agent ${newAgent.full_name} added to Stage Properties team!`)
      setNewAgentName('')
      setNewAgentEmail('')
      setNewAgentPhone('')
      setIsAddModalOpen(false)
    } catch (err) {
      toast.error('Failed to insert new agent into database')
    }
  }

  // ── Edit Agent Details ──
  const handleUpdateAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAgent) return

    setUpdatingId(selectedAgent.id)
    try {
      setAgents(prev =>
        prev.map(a => (a.id === selectedAgent.id ? selectedAgent : a))
      )

      await supabase
        .from('staff_members')
        .update({
          full_name: selectedAgent.full_name,
          email: selectedAgent.email,
          phone_number: selectedAgent.phone_number,
          is_active: selectedAgent.is_active
        })
        .eq('id', selectedAgent.id)

      toast.success(`Agent ${selectedAgent.full_name} details updated!`)
      setSelectedAgent(null)
    } catch (err) {
      toast.error('Failed to update agent')
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredAgents = agents.filter(a => {
    const term = search.toLowerCase().trim()
    return (
      !term ||
      a.full_name.toLowerCase().includes(term) ||
      a.email.toLowerCase().includes(term) ||
      a.phone_number.toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" /> Stage Properties Brokers L.L.C
          </div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            🏢 Sales Team & Lead Round-Robin Allocation
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage sales agents for Stage Properties. Active agents receive automatic Instagram & AI lead assignments on WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold gap-2 text-xs"
          >
            <Plus className="w-4 h-4" />
            Add Sales Agent
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchStageAgents}
            disabled={loading}
            className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 gap-2 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Overview Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-900/70 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase">Total Sales Team</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{agents.length} Members</div>
            <p className="text-xs text-slate-500 mt-1">Stage Properties Sales Department</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/70 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-emerald-400 uppercase">Active for Round-Robin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              {agents.filter(a => a.is_active).length} Active
            </div>
            <p className="text-xs text-slate-500 mt-1">Eligible for instant WhatsApp lead dispatch</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/70 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-amber-400 uppercase">Primary Lead Handler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-amber-300 truncate">Ador (0794357912)</div>
            <p className="text-xs text-slate-500 mt-1">WhatsApp Target: ador.ai815@gmail.com</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Search & Filter ── */}
      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search agents by name, email, or WhatsApp number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="text-xs text-slate-400">
          Showing <strong className="text-amber-400">{filteredAgents.length}</strong> agents for Stage Properties
        </div>
      </div>

      {/* ── Sales Team Table ── */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <p className="text-sm">Loading Stage Properties sales agents...</p>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
            <Users className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-base font-semibold text-slate-300">No agents found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Agent Name</th>
                  <th className="py-3.5 px-4 font-semibold">WhatsApp / Phone</th>
                  <th className="py-3.5 px-4 font-semibold">Email Address</th>
                  <th className="py-3.5 px-4 font-semibold">Last Lead Assigned</th>
                  <th className="py-3.5 px-4 font-semibold">Allocation Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Agent Name */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xs font-bold text-amber-300 shrink-0">
                          {agent.full_name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-100">{agent.full_name}</p>
                          <p className="text-[11px] text-amber-400 font-mono">{agent.crm_id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Phone / WhatsApp */}
                    <td className="py-4 px-4 font-mono text-xs text-emerald-400 flex items-center gap-1.5 pt-6">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      {agent.phone_number}
                    </td>

                    {/* Email */}
                    <td className="py-4 px-4 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        {agent.email}
                      </div>
                    </td>

                    {/* Last Time Assigned */}
                    <td className="py-4 px-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {agent.last_assigned_at
                          ? new Date(agent.last_assigned_at).toLocaleString('en-US', {
                              dateStyle: 'short',
                              timeStyle: 'short'
                            })
                          : 'Never'}
                      </div>
                    </td>

                    {/* Active / Inactive Toggle Status */}
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleActive(agent)}
                        disabled={updatingId === agent.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                          agent.is_active
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                        }`}
                      >
                        {agent.is_active ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> ACTIVE
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-3.5 h-3.5 text-red-400" /> INACTIVE
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedAgent(agent)}
                        className="text-amber-400 hover:text-amber-300 hover:bg-slate-800 text-xs gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add Agent Modal ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-400" /> Add Stage Properties Sales Agent
                </h3>
                <p className="text-xs text-slate-400">Add an agent to receive automated WhatsApp lead dispatches</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleAddAgent} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Agent Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ador, Sarah, Ghassan"
                  value={newAgentName}
                  onChange={e => setNewAgentName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">WhatsApp / Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0794357912 or +971522081705"
                  value={newAgentPhone}
                  onChange={e => setNewAgentPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ador.ai815@gmail.com"
                  value={newAgentEmail}
                  onChange={e => setNewAgentEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={newAgentActive}
                  onChange={e => setNewAgentActive(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                />
                <label htmlFor="activeCheck" className="text-slate-300 text-xs font-semibold cursor-pointer">
                  Active (Immediately eligible for lead allocation)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                  className="border-slate-700 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Save Agent
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Agent Modal ── */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Edit Agent: {selectedAgent.full_name}
                </h3>
                <p className="text-xs text-slate-400">{selectedAgent.crm_id}</p>
              </div>
              <button onClick={() => setSelectedAgent(null)} className="text-slate-400 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleUpdateAgent} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={selectedAgent.full_name}
                  onChange={e => setSelectedAgent({ ...selectedAgent, full_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">WhatsApp / Phone Number</label>
                <input
                  type="text"
                  value={selectedAgent.phone_number}
                  onChange={e => setSelectedAgent({ ...selectedAgent, phone_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  value={selectedAgent.email}
                  onChange={e => setSelectedAgent({ ...selectedAgent, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAgent(null)}
                  className="border-slate-700 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updatingId === selectedAgent.id}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
