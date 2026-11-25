'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Building2,
  Cpu,
  Users,
  Plus,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
  UserPlus,
  Trash2,
  X,
  Loader2,
  Globe,
  TrendingUp,
  Megaphone,
  DollarSign,
  Layers,
} from 'lucide-react'

interface OrgMember {
  id: string
  email: string
  full_name: string
  phone_number: string
  departments: string[]
  access_role: 'admin' | 'user'
  lead_count: number
}

interface LiveOrganization {
  id: string
  name: string
  slug: string
  website: string
  created_at: string
  staff_count: number
  lead_count: number
  departments: string[]
  members: OrgMember[]
}

const ALL_DEPARTMENTS = [
  { id: 'sales', label: 'Sales' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'finance', label: 'Finance' },
]

export default function AdminOrganizationsHubPage() {
  const [orgs, setOrgs] = useState<LiveOrganization[]>([])
  const [loading, setLoading] = useState(true)

  // Add Organization Modal
  const [showAddOrgModal, setShowAddOrgModal] = useState(false)
  const [orgName, setOrgName] = useState('')
  const [orgWebsite, setOrgWebsite] = useState('')
  const [orgDepts, setOrgDepts] = useState<string[]>(['sales', 'marketing', 'finance'])
  const [initUserName, setInitUserName] = useState('')
  const [initUserEmail, setInitUserEmail] = useState('')
  const [initUserPhone, setInitUserPhone] = useState('')
  const [initUserRole, setInitUserRole] = useState<'admin' | 'user'>('admin')
  const [creatingOrg, setCreatingOrg] = useState(false)

  // Assign User to Existing Organization Modal
  const [assignOrg, setAssignOrg] = useState<LiveOrganization | null>(null)
  const [uName, setUName] = useState('')
  const [uEmail, setUEmail] = useState('')
  const [uPhone, setUPhone] = useState('')
  const [uRole, setURole] = useState<'admin' | 'user'>('user')
  const [uDepts, setUDepts] = useState<string[]>(['sales'])
  const [savingUser, setSavingUser] = useState(false)

  const fetchOrganizations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/organizations')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load organizations')
      setOrgs(data.organizations || [])
    } catch (err: any) {
      toast.error(err.message || 'Could not load organizations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrganizations()
  }, [fetchOrganizations])

  const toggleInList = (list: string[], value: string, setter: (next: string[]) => void) => {
    if (list.includes(value)) {
      if (list.length === 1) return
      setter(list.filter((d) => d !== value))
    } else {
      setter([...list, value])
    }
  }

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgName.trim()) {
      toast.error('Please enter an organization name')
      return
    }
    setCreatingOrg(true)
    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName.trim(),
          website: orgWebsite.trim(),
          departments: orgDepts,
          initial_user_name: initUserName.trim(),
          initial_user_email: initUserEmail.trim().toLowerCase(),
          initial_user_phone: initUserPhone.trim(),
          initial_user_role: initUserRole,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create organization')
      toast.success(data.message || `${orgName} created!`)
      setOrgName('')
      setOrgWebsite('')
      setOrgDepts(['sales', 'marketing', 'finance'])
      setInitUserName('')
      setInitUserEmail('')
      setInitUserPhone('')
      setInitUserRole('admin')
      setShowAddOrgModal(false)
      fetchOrganizations()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create organization')
    } finally {
      setCreatingOrg(false)
    }
  }

  const handleAssignUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignOrg || !uName.trim() || !uEmail.trim()) {
      toast.error('Please enter both name and email')
      return
    }
    setSavingUser(true)
    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign_user',
          orgId: assignOrg.id,
          full_name: uName.trim(),
          email: uEmail.trim().toLowerCase(),
          phone_number: uPhone.trim(),
          access_role: uRole,
          departments: uDepts,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to assign user')
      toast.success(data.message || 'User assigned!')
      setAssignOrg(null)
      setUName('')
      setUEmail('')
      setUPhone('')
      setURole('user')
      setUDepts(['sales'])
      fetchOrganizations()
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign user')
    } finally {
      setSavingUser(false)
    }
  }

  const handleDeleteOrg = async (org: LiveOrganization) => {
    if (!confirm(`Delete organization "${org.name}"? Its users will be deactivated.`)) return
    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: org.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not delete organization')
      toast.success(`Removed "${org.name}"`)
      fetchOrganizations()
    } catch (err: any) {
      toast.error(err.message || 'Delete failed')
    }
  }

  const getSalesHref = (org: LiveOrganization) => {
    if (org.slug === 'cillah-dev') return '/admin/dashboard'
    if (org.slug === 'chetu-healthcare') return '/admin/organizations/chetu-healthcare'
    if (org.slug === 'dendri-africa') return '/admin/organizations/dendri-africa'
    return `/admin/organizations/${org.slug}/sales`
  }

  const getMarketingHref = (org: LiveOrganization) =>
    org.slug === 'cillah-dev' ? '/admin/marketing' : `/admin/organizations/${org.slug}/marketing`

  const getFinanceHref = (org: LiveOrganization) =>
    org.slug === 'cillah-dev' ? '/admin/finance' : `/admin/organizations/${org.slug}/finance`

  const totalStaff = orgs.reduce((sum, o) => sum + o.staff_count, 0)
  const totalLeads = orgs.reduce((sum, o) => sum + o.lead_count, 0)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#C9A66B] uppercase tracking-wider mb-1">
            <Layers className="w-3.5 h-3.5" />
            Live Multi-Tenant Platform Control
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">All Organizations Hub</h1>
          <p className="text-xs text-slate-400 mt-1">
            100% live Supabase directory. Create new client organizations, assign departments, and set Admin or User roles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchOrganizations}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#C9A66B]' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowAddOrgModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C9A66B] hover:bg-[#C9A66B]/90 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-md shadow-[#C9A66B]/20"
          >
            <Plus className="w-4 h-4" />
            Add Organization
          </button>
        </div>
      </div>

      {/* Live Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="text-xs text-slate-400">Active Organizations</div>
          <div className="text-2xl font-bold text-white mt-1">{orgs.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Live from Supabase organizations table</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="text-xs text-slate-400">Total Active Users</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1">{totalStaff}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Strictly scoped to each organization</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="text-xs text-slate-400">Total Active Pipeline Leads</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{totalLeads}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Zero cross-organization data mixing</div>
        </div>
      </div>

      {/* Live Organizations Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500">
          Loading live organizations from Supabase...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {orgs.map((org) => {
            const isCillah = org.slug === 'cillah-dev'
            return (
              <div
                key={org.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 ${
                  isCillah
                    ? 'bg-gradient-to-br from-cyan-950/20 to-slate-900/90 border-cyan-500/30'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0 ${
                          isCillah ? 'text-cyan-400' : 'text-[#C9A66B]'
                        }`}
                      >
                        {isCillah ? <Cpu className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-base font-bold text-white truncate">{org.name}</h2>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span className="font-mono text-slate-500">/{org.slug}</span>
                          {org.website && (
                            <span className="inline-flex items-center gap-1 truncate text-slate-400">
                              <Globe className="w-3 h-3 text-slate-500" />
                              {org.website.replace(/^https?:\/\//, '')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        {org.staff_count} users · {org.lead_count} leads
                      </span>
                      {!isCillah && (
                        <button
                          type="button"
                          onClick={() => handleDeleteOrg(org)}
                          title="Delete Organization"
                          className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-500/40 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Assigned Users & Access Roles */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#C9A66B]" />
                        Assigned Users &amp; Status Roles
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAssignOrg(org)
                          setUName('')
                          setUEmail('')
                          setUPhone('')
                          setURole('user')
                          setUDepts(['sales'])
                        }}
                        className="inline-flex items-center gap-1 text-[#C9A66B] hover:underline font-semibold cursor-pointer"
                      >
                        <UserPlus className="w-3 h-3" /> Assign User
                      </button>
                    </div>

                    {org.members.length === 0 ? (
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-500">
                        No active users assigned yet — click &ldquo;Assign User&rdquo; to add an Admin or Sales Agent.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {org.members.map((m) => (
                          <div
                            key={m.id}
                            className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-100 truncate">{m.full_name}</div>
                              <div className="text-[10px] text-slate-400 truncate">{m.email}</div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {m.departments.map((d) => (
                                <span
                                  key={d}
                                  className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[9px] uppercase text-slate-300 font-semibold"
                                >
                                  {d}
                                </span>
                              ))}
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold border ${
                                  m.access_role === 'admin'
                                    ? 'bg-[#C9A66B]/15 text-[#C9A66B] border-[#C9A66B]/40'
                                    : 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                                }`}
                              >
                                {m.access_role}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Department Launch Bar */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                  <Link
                    href={getSalesHref(org)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#C9A66B] hover:bg-[#C9A66B]/90 text-slate-950 font-bold text-xs transition-colors"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    Sales Dashboard
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href={getMarketingHref(org)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-purple-300 font-semibold transition-colors"
                  >
                    <Megaphone className="w-3.5 h-3.5" /> Marketing
                  </Link>
                  <Link
                    href={getFinanceHref(org)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-sky-300 font-semibold transition-colors"
                  >
                    <DollarSign className="w-3.5 h-3.5" /> Finance
                  </Link>
                  <Link
                    href={`/admin/organizations/${org.slug}/sales/users`}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-semibold transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" /> Users
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ADD ORGANIZATION MODAL */}
      {showAddOrgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#C9A66B]" />
                  Add New Client Organization
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Creates an isolated tenant with its own departments, pipelines, and users.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddOrgModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrganization} className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Organization Name *</label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Ndakala Advisory LLP"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#C9A66B]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Website (Optional)</label>
                  <input
                    type="text"
                    value={orgWebsite}
                    onChange={(e) => setOrgWebsite(e.target.value)}
                    placeholder="https://company.co.ke"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#C9A66B]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Enabled Departments</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_DEPARTMENTS.map((d) => {
                    const checked = orgDepts.includes(d.id)
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleInList(orgDepts, d.id, setOrgDepts)}
                        className={`px-3 py-1.5 rounded-xl border font-semibold transition-colors cursor-pointer ${
                          checked
                            ? 'bg-[#C9A66B]/20 border-[#C9A66B] text-[#C9A66B]'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        {checked ? '✓ ' : ''}
                        {d.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-[#C9A66B]" />
                  Assign Initial Organization Admin / User (Optional)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={initUserName}
                    onChange={(e) => setInitUserName(e.target.value)}
                    placeholder="Full Name (e.g. Noah Ndakala)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#C9A66B]"
                  />
                  <input
                    type="email"
                    value={initUserEmail}
                    onChange={(e) => setInitUserEmail(e.target.value)}
                    placeholder="Email (e.g. noah@firm.co.ke)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#C9A66B]"
                  />
                  <input
                    type="tel"
                    value={initUserPhone}
                    onChange={(e) => setInitUserPhone(e.target.value)}
                    placeholder="Phone (+254 7XX XXX XXX)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#C9A66B]"
                  />
                  <select
                    value={initUserRole}
                    onChange={(e) => setInitUserRole(e.target.value as 'admin' | 'user')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#C9A66B] cursor-pointer"
                  >
                    <option value="admin">Admin (Org Owner / Manager)</option>
                    <option value="user">User (Standard Agent)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddOrgModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingOrg}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C9A66B] hover:bg-[#C9A66B]/90 text-slate-950 font-bold cursor-pointer disabled:opacity-50"
                >
                  {creatingOrg && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {creatingOrg ? 'Creating...' : 'Create Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN USER TO EXISTING ORGANIZATION MODAL */}
      {assignOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#C9A66B]" />
                  Assign User to {assignOrg.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Strictly scoped to {assignOrg.name} only.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignOrg(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignUser} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={uName}
                  onChange={(e) => setUName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#C9A66B]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Email *</label>
                  <input
                    type="email"
                    required
                    value={uEmail}
                    onChange={(e) => setUEmail(e.target.value)}
                    placeholder="user@company.co.ke"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#C9A66B]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={uPhone}
                    onChange={(e) => setUPhone(e.target.value)}
                    placeholder="+254 7XX XXX XXX"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#C9A66B]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Assign Departments</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_DEPARTMENTS.map((d) => {
                    const checked = uDepts.includes(d.id)
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleInList(uDepts, d.id, setUDepts)}
                        className={`px-3 py-1.5 rounded-xl border font-semibold transition-colors cursor-pointer ${
                          checked
                            ? 'bg-[#C9A66B]/20 border-[#C9A66B] text-[#C9A66B]'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        {checked ? '✓ ' : ''}
                        {d.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Status Role</label>
                <select
                  value={uRole}
                  onChange={(e) => setURole(e.target.value as 'admin' | 'user')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#C9A66B] cursor-pointer"
                >
                  <option value="user">User (Own Pipeline / Department Only)</option>
                  <option value="admin">Admin (Org Admin for Selected Departments Only)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignOrg(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C9A66B] hover:bg-[#C9A66B]/90 text-slate-950 font-bold cursor-pointer disabled:opacity-50"
                >
                  {savingUser && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {savingUser ? 'Saving...' : 'Save Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
