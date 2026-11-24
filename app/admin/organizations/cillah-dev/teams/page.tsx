'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Building2,
  Users,
  Shield,
  Plus,
  Search,
  RefreshCw,
  Edit3,
  Trash2,
  Loader2,
  DollarSign,
  Megaphone,
  Wrench,
  BarChart3,
  Briefcase,
  CheckCircle2,
  Database,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  MARKETING_ROLE_TIERS,
  getRolePermissions,
  type MarketingRoleTier,
} from '@/lib/marketing-config'

interface LiveTeamMember {
  id: string
  crm_id?: string | null
  email: string
  full_name: string
  phone_number: string
  departments: string[]
  raw_role: string
  platform_access: 'super_admin' | 'admin' | 'user'
  has_auth_profile: boolean
  profile_id?: string | null
  marketing_role: MarketingRoleTier | null
  is_active: boolean
  created_at?: string
  updated_at?: string
  source: 'staff_members' | 'profiles_only'
}

const DEPARTMENTS = [
  {
    id: 'sales',
    label: 'Sales',
    description: 'Sales CRM pipeline, leads, viewings & closing deals',
    icon: BarChart3,
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  {
    id: 'marketing',
    label: 'Marketing',
    description: 'Omnichannel posting, scheduling, uploads & insights',
    icon: Megaphone,
    badgeClass: 'bg-[#C9A66B]/15 text-[#E5C992] border-[#C9A66B]/35',
  },
  {
    id: 'finance',
    label: 'Finance',
    description: 'M-Pesa reconciliations, invoices & retainer billing',
    icon: DollarSign,
    badgeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  },
  {
    id: 'operations',
    label: 'Operations',
    description: 'Client onboarding, system deployments & support SLAs',
    icon: Briefcase,
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  },
  {
    id: 'engineering',
    label: 'Engineering',
    description: 'AI agents, n8n workflows & infrastructure',
    icon: Wrench,
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  },
] as const

export default function TeamsAndRolesPage() {
  const [members, setMembers] = useState<LiveTeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all')

  // Add / Edit Member Modal
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null)
  const [saving, setSaving] = useState(false)
  const [formEmail, setFormEmail] = useState('')
  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formDepartments, setFormDepartments] = useState<string[]>(['sales'])
  const [formPlatformAccess, setFormPlatformAccess] = useState<'admin' | 'user'>('user')
  const [formMarketingRole, setFormMarketingRole] =
    useState<MarketingRoleTier>('content_creator')
  const [formActive, setFormActive] = useState(true)
  const [editingIsSuperAdmin, setEditingIsSuperAdmin] = useState(false)

  const fetchLiveTeams = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/teams?org=cillah-dev')
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Failed to load Supabase team members')
        return
      }
      setMembers(json.members || [])
    } catch {
      toast.error('Network error loading live Supabase team members')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLiveTeams()
  }, [fetchLiveTeams])

  const openAddModal = () => {
    setModalMode('add')
    setEditingIsSuperAdmin(false)
    setFormEmail('')
    setFormName('')
    setFormPhone('')
    setFormDepartments(['sales', 'marketing'])
    setFormPlatformAccess('user')
    setFormMarketingRole('content_creator')
    setFormActive(true)
  }

  const openEditModal = (m: LiveTeamMember) => {
    setModalMode('edit')
    setEditingIsSuperAdmin(m.platform_access === 'super_admin')
    setFormEmail(m.email)
    setFormName(m.full_name)
    setFormPhone(m.phone_number || '')
    setFormDepartments(m.departments.length > 0 ? m.departments : ['sales'])
    setFormPlatformAccess(m.platform_access === 'user' ? 'user' : 'admin')
    setFormMarketingRole(m.marketing_role || 'content_creator')
    setFormActive(m.is_active)
  }

  const toggleDept = (deptId: string) => {
    setFormDepartments((prev) =>
      prev.includes(deptId) ? prev.filter((d) => d !== deptId) : [...prev, deptId]
    )
  }

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formEmail.trim() || !formName.trim()) {
      toast.error('Email and full name are required.')
      return
    }
    if (formDepartments.length === 0) {
      toast.error('Select at least one department.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/teams?org=cillah-dev', {
        method: modalMode === 'add' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formEmail.trim().toLowerCase(),
          full_name: formName.trim(),
          phone_number: formPhone.trim(),
          departments: formDepartments,
          platform_access: formPlatformAccess,
          marketing_role: formDepartments.includes('marketing')
            ? formMarketingRole
            : undefined,
          is_active: formActive,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Could not save changes to Supabase.')
        return
      }
      toast.success(`Synced ${formEmail.trim()} directly to Supabase!`)
      setModalMode(null)
      fetchLiveTeams()
    } catch {
      toast.error('Network error saving team permissions.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMember = async (member: LiveTeamMember) => {
    if (member.platform_access === 'super_admin') {
      toast.error('Super Admin cannot be removed.')
      return
    }
    if (!confirm(`Remove ${member.email} from Cillah organization staff?`)) return

    try {
      const res = await fetch(
        `/api/admin/teams?org=cillah-dev&email=${encodeURIComponent(member.email)}`,
        { method: 'DELETE' }
      )
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Could not remove member.')
        return
      }
      toast.success(`Removed ${member.email} from Supabase staff_members.`)
      fetchLiveTeams()
    } catch {
      toast.error('Network error removing member.')
    }
  }

  const filteredMembers = members.filter((m) => {
    const matchesDept =
      selectedDeptFilter === 'all' ||
      m.departments.includes(selectedDeptFilter) ||
      (selectedDeptFilter === 'engineering' && m.departments.includes('ceo'))
    const term = search.toLowerCase().trim()
    const matchesSearch =
      !term ||
      m.full_name.toLowerCase().includes(term) ||
      m.email.toLowerCase().includes(term) ||
      m.departments.join(' ').toLowerCase().includes(term) ||
      (m.marketing_role || '').toLowerCase().includes(term)

    return matchesDept && matchesSearch
  })

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" /> Cillah Organization &amp; Infrastructure
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold normal-case">
              <Database className="w-3 h-3" /> Live Supabase Sync
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">
            Teams, Departments &amp; Role Management
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Changes here write directly to Supabase (<code className="text-cyan-300">staff_members</code>, <code className="text-cyan-300">profiles</code>, and <code className="text-cyan-300">marketing_role_assignments</code>) and immediately control what each user sees after login.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={openAddModal}
            className="bg-[#C9A66B] hover:bg-[#d8b87d] text-slate-950 font-bold gap-1.5 text-xs"
          >
            <Plus className="w-4 h-4" />
            Add Team Member
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchLiveTeams}
            disabled={loading}
            className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 gap-2 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Live Department Count Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {DEPARTMENTS.map((dept) => {
          const IconComp = dept.icon
          const count = members.filter(
            (m) =>
              m.departments.includes(dept.id) ||
              (dept.id === 'engineering' && m.departments.includes('ceo'))
          ).length
          const isSelected = selectedDeptFilter === dept.id
          return (
            <Card
              key={dept.id}
              onClick={() => setSelectedDeptFilter(isSelected ? 'all' : dept.id)}
              className={`border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500 shadow-xl ring-1 ring-cyan-500/50'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {dept.label}
                </CardTitle>
                <IconComp className="w-4 h-4 text-cyan-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-100">
                  {count} {count === 1 ? 'Member' : 'Members'}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{dept.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Search & Department Filter Bar */}
      <div className="space-y-4 bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search live Supabase users by name, email, department, or marketing tier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setSelectedDeptFilter('all')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                selectedDeptFilter === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({members.length})
            </button>
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept.id}
                type="button"
                onClick={() => setSelectedDeptFilter(dept.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  selectedDeptFilter === dept.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {dept.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
          <div>
            Showing <strong className="text-cyan-400 font-bold">{filteredMembers.length}</strong> real Supabase account{filteredMembers.length === 1 ? '' : 's'} under <strong>Cillah</strong>
          </div>
          <span className="text-[11px] text-emerald-400">
            Zero demo placeholders — 100% live database records
          </span>
        </div>
      </div>

      {/* Live Supabase Members Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            <p className="text-sm">Fetching live accounts &amp; roles from Supabase...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
            <Users className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-base font-semibold text-slate-300">No team members match this filter</p>
            <p className="text-xs text-slate-500">Click &ldquo;Add Team Member&rdquo; or switch filters above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">#</th>
                  <th className="py-3.5 px-4 font-semibold">Team Member</th>
                  <th className="py-3.5 px-4 font-semibold">Assigned Departments</th>
                  <th className="py-3.5 px-4 font-semibold">Marketing Role Tier</th>
                  <th className="py-3.5 px-4 font-semibold">Platform Access</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredMembers.map((member, index) => {
                  const mktTier = member.marketing_role
                    ? getRolePermissions(member.marketing_role)
                    : null
                  return (
                    <tr key={member.email} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-4 font-mono text-xs text-slate-500 font-bold">
                        {index + 1}
                      </td>

                      {/* Identity */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C9A66B]/25 to-cyan-500/20 border border-[#C9A66B]/40 flex items-center justify-center text-xs font-bold text-[#E5C992] shrink-0 uppercase">
                            {(member.full_name || member.email)[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-100">{member.full_name}</p>
                              {!member.is_active && (
                                <span className="px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/30 text-red-300 text-[10px] font-bold">
                                  Paused
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">{member.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Multi-Department Badges */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {member.departments.length === 0 ? (
                            <span className="text-xs text-slate-500 italic">No department assigned</span>
                          ) : (
                            member.departments.map((d) => {
                              const cfg = DEPARTMENTS.find((x) => x.id === d)
                              return (
                                <span
                                  key={d}
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize ${
                                    cfg?.badgeClass ||
                                    'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                  }`}
                                >
                                  {cfg?.label || d.toUpperCase()}
                                </span>
                              )
                            })
                          )}
                        </div>
                      </td>

                      {/* Marketing Role Tier */}
                      <td className="py-4 px-4">
                        {mktTier ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${mktTier.badgeClass}`}
                          >
                            {mktTier.label}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </td>

                      {/* Platform Access */}
                      <td className="py-4 px-4">
                        {member.platform_access === 'super_admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#C9A66B]/20 text-[#E5C992] border border-[#C9A66B]/40">
                            <Shield className="w-3 h-3" /> Super Admin
                          </span>
                        ) : member.platform_access === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <Shield className="w-3 h-3" /> Org Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            Team User
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditModal(member)}
                            className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 text-xs gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit Roles
                          </Button>
                          {member.platform_access !== 'super_admin' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMember(member)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Remove from organization"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Add / Edit Member Modal (Live Supabase Write) */}
      {modalMode && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  {modalMode === 'add' ? 'Add Real Team Member' : `Edit Access: ${formName}`}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Updates Supabase live — changes apply immediately to their workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    disabled={modalMode === 'edit'}
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="member@cillah.dev"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 disabled:opacity-60 focus:outline-none focus:border-[#C9A66B]"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Atulah"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-[#C9A66B]"
                  />
                </div>
              </div>

              {/* Multi-Select Departments */}
              <div>
                <label className="block text-slate-300 font-semibold mb-2">
                  Assigned Departments (Controls Workspace Dropdown) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DEPARTMENTS.map((dept) => {
                    const checked = formDepartments.includes(dept.id)
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => toggleDept(dept.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                          checked
                            ? 'bg-[#C9A66B]/15 border-[#C9A66B] text-white font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 ${
                            checked ? 'text-[#C9A66B]' : 'text-slate-600'
                          }`}
                        />
                        <span>{dept.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Marketing Role Tier (shown when Marketing department is checked) */}
              {formDepartments.includes('marketing') && (
                <div className="p-3.5 rounded-xl bg-[#C9A66B]/5 border border-[#C9A66B]/30 space-y-2">
                  <label className="block text-[#E5C992] font-bold">
                    Marketing Role Tier (Controls Post / Approve / Insights Access)
                  </label>
                  <select
                    value={formMarketingRole}
                    disabled={editingIsSuperAdmin}
                    onChange={(e) =>
                      setFormMarketingRole(e.target.value as MarketingRoleTier)
                    }
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 focus:outline-none focus:border-[#C9A66B]"
                  >
                    {(Object.keys(MARKETING_ROLE_TIERS) as MarketingRoleTier[]).map((k) => (
                      <option key={k} value={k} className="bg-slate-900">
                        {MARKETING_ROLE_TIERS[k].label} — {MARKETING_ROLE_TIERS[k].description}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Platform Access Level */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Platform Portal Level
                </label>
                <select
                  value={formPlatformAccess}
                  disabled={editingIsSuperAdmin}
                  onChange={(e) => setFormPlatformAccess(e.target.value as 'admin' | 'user')}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 disabled:opacity-60 focus:outline-none focus:border-[#C9A66B]"
                >
                  <option value="user" className="bg-slate-900">
                    Team User (Logs into /user/dashboard with assigned departments)
                  </option>
                  <option value="admin" className="bg-slate-900">
                    Org Admin (Logs into /admin/dashboard)
                  </option>
                </select>
              </div>

              {!editingIsSuperAdmin && (
                <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="w-4 h-4 accent-[#C9A66B] rounded"
                  />
                  <span className="text-slate-300 font-medium">
                    Account Active (Uncheck to pause access without deleting)
                  </span>
                </label>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalMode(null)}
                  className="border-slate-700 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="bg-[#C9A66B] hover:bg-[#d8b87d] text-slate-950 font-bold"
                >
                  {saving ? 'Syncing to Supabase...' : 'Save to Supabase'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
