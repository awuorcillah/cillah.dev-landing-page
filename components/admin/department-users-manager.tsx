'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Users,
  UserPlus,
  Trash2,
  ShieldCheck,
  User,
  RefreshCw,
  ArrowRightLeft,
  CheckCircle2,
  X,
  Building2,
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
} from 'lucide-react'

interface DepartmentUser {
  id: string
  crm_id: string | null
  email: string
  full_name: string
  phone_number: string
  departments: string[]
  access_level: 'admin' | 'user'
  is_super_admin: boolean
  lead_count: number
  created_at: string
}

interface DepartmentUsersManagerProps {
  orgId: string
  orgName: string
  orgSlug: string
  department: 'sales' | 'marketing' | 'finance'
  dashboardHref: string
}

const DEPT_LABELS: Record<'sales' | 'marketing' | 'finance', string> = {
  sales: 'Sales Department',
  marketing: 'Marketing Department',
  finance: 'Finance Department',
}

export default function DepartmentUsersManager({
  orgId,
  orgName,
  department,
  dashboardHref,
}: DepartmentUsersManagerProps) {
  const [users, setUsers] = useState<DepartmentUser[]>([])
  const [loading, setLoading] = useState(true)

  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newAccess, setNewAccess] = useState<'user' | 'admin'>('user')
  const [submittingAdd, setSubmittingAdd] = useState(false)

  // Delete & Lead Transfer Modal State
  const [deleteTarget, setDeleteTarget] = useState<DepartmentUser | null>(null)
  const [transferMode, setTransferMode] = useState<'single' | 'round_robin' | 'unassigned'>('single')
  const [targetAgentEmail, setTargetAgentEmail] = useState('')
  const [submittingDelete, setSubmittingDelete] = useState(false)

  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/admin/department-users?orgId=${encodeURIComponent(orgId)}&department=${encodeURIComponent(department)}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load users')
      setUsers(data.users || [])
    } catch (err: any) {
      toast.error(err.message || 'Could not load department users')
    } finally {
      setLoading(false)
    }
  }, [orgId, department])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newEmail.trim()) {
      toast.error('Please enter both name and email')
      return
    }
    setSubmittingAdd(true)
    try {
      const res = await fetch('/api/admin/department-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          department,
          full_name: newName.trim(),
          email: newEmail.trim().toLowerCase(),
          phone_number: newPhone.trim(),
          access_level: newAccess,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add user')
      toast.success(data.message || `${newName} added successfully!`)
      setNewName('')
      setNewEmail('')
      setNewPhone('')
      setNewAccess('user')
      setShowAddModal(false)
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to add user')
    } finally {
      setSubmittingAdd(false)
    }
  }

  const handleToggleAccessRole = async (user: DepartmentUser, nextAccess: 'user' | 'admin') => {
    if (user.is_super_admin || user.access_level === nextAccess) return
    setUpdatingRoleId(user.id)
    try {
      const res = await fetch('/api/admin/department-users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, access_level: nextAccess }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update access role')
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, access_level: nextAccess } : u))
      )
      toast.success(`Updated ${user.full_name}'s role to ${nextAccess.toUpperCase()}`)
    } catch (err: any) {
      toast.error(err.message || 'Role update failed')
    } finally {
      setUpdatingRoleId(null)
    }
  }

  const openDeleteModal = (user: DepartmentUser) => {
    setDeleteTarget(user)
    const remaining = users.filter((u) => u.id !== user.id)
    if (remaining.length > 0) {
      setTransferMode('single')
      setTargetAgentEmail(remaining[0].email)
    } else {
      setTransferMode('unassigned')
      setTargetAgentEmail('')
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    if (
      department === 'sales' &&
      deleteTarget.lead_count > 0 &&
      transferMode === 'single' &&
      !targetAgentEmail
    ) {
      toast.error('Please pick a destination agent to receive the existing leads.')
      return
    }

    setSubmittingDelete(true)
    try {
      const res = await fetch('/api/admin/department-users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: deleteTarget.id,
          orgId,
          department,
          transferMode,
          targetAgentEmail,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to remove user')
      toast.success(data.message || 'User removed cleanly')
      setDeleteTarget(null)
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message || 'Delete failed')
    } finally {
      setSubmittingDelete(false)
    }
  }

  const otherAgents = deleteTarget ? users.filter((u) => u.id !== deleteTarget.id) : []

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#C9A66B] uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5" />
            {orgName} • {DEPT_LABELS[department]}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#C9A66B]" />
            Users & Access Control
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {department === 'sales'
              ? 'Admin / CEO can add new sales agents (instant pipeline created), manage Admin vs User access, or remove an agent and transfer their existing leads.'
              : `Manage ${DEPT_LABELS[department]} team members and access roles for ${orgName}.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={dashboardHref}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
          <button
            type="button"
            onClick={fetchUsers}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#C9A66B]' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C9A66B] hover:bg-[#C9A66B]/90 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-md shadow-[#C9A66B]/15"
          >
            <UserPlus className="w-4 h-4" />
            Add {department === 'sales' ? 'Sales Agent' : 'User'}
          </button>
        </div>
      </div>

      {/* Governance Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="text-xs text-slate-400">Active Team Members</div>
          <div className="text-2xl font-bold text-white mt-1">{users.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Synced live with Supabase</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="text-xs text-slate-400">Admin / CEO Accounts</div>
          <div className="text-2xl font-bold text-[#C9A66B] mt-1">
            {users.filter((u) => u.access_level === 'admin').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Full oversight, reassignment & deletion</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="text-xs text-slate-400">
            {department === 'sales' ? 'Active Sales Pipelines' : 'Standard User Accounts'}
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {users.filter((u) => u.access_level === 'user').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {department === 'sales' ? 'Own pipeline only · Delete locked' : 'Department workspace access'}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[10px] uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-5 font-semibold">Team Member</th>
                <th className="py-3.5 px-4 font-semibold">Contact</th>
                <th className="py-3.5 px-4 font-semibold">Access Role</th>
                {department === 'sales' && <th className="py-3.5 px-4 font-semibold">Pipeline Status</th>}
                <th className="py-3.5 px-5 font-semibold text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {loading ? (
                <tr>
                  <td colSpan={department === 'sales' ? 5 : 4} className="py-12 text-center text-slate-500">
                    Loading {orgName} team members...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={department === 'sales' ? 5 : 4} className="py-12 text-center text-slate-500">
                    No users in {DEPT_LABELS[department]} yet. Click &ldquo;Add User&rdquo; above to create one.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const initials = u.full_name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#C9A66B]/15 border border-[#C9A66B]/40 flex items-center justify-center text-xs font-bold text-[#C9A66B] shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              {u.full_name}
                              {u.is_super_admin && (
                                <span className="px-1.5 py-0.5 rounded bg-[#C9A66B]/20 text-[#C9A66B] text-[9px] uppercase font-bold">
                                  CEO / Owner
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">{u.crm_id || 'Active Member'}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-200">
                          <Mail className="w-3 h-3 text-slate-500" />
                          {u.email}
                        </div>
                        {u.phone_number && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <Phone className="w-3 h-3 text-slate-500" />
                            {u.phone_number}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {u.is_super_admin ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#C9A66B]/15 border border-[#C9A66B]/40 text-[#C9A66B] font-bold text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5" /> Admin
                          </span>
                        ) : (
                          <select
                            value={u.access_level}
                            disabled={updatingRoleId === u.id}
                            onChange={(e) =>
                              handleToggleAccessRole(u, e.target.value as 'user' | 'admin')
                            }
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold border focus:outline-none cursor-pointer ${
                              u.access_level === 'admin'
                                ? 'bg-[#C9A66B]/15 border-[#C9A66B]/40 text-[#C9A66B]'
                                : 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                            }`}
                          >
                            <option value="user" className="bg-slate-900 text-slate-100">
                              User (Standard)
                            </option>
                            <option value="admin" className="bg-slate-900 text-slate-100">
                              Admin (Full Control)
                            </option>
                          </select>
                        )}
                      </td>

                      {department === 'sales' && (
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold">
                              <CheckCircle2 className="w-3 h-3" /> Pipeline Active
                            </span>
                            <span className="text-slate-300 font-semibold">{u.lead_count} leads</span>
                          </div>
                        </td>
                      )}

                      <td className="py-3.5 px-5 text-right">
                        {u.is_super_admin ? (
                          <span className="text-[11px] text-slate-500">Protected</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openDeleteModal(u)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {department === 'sales' ? 'Remove & Transfer' : 'Remove'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD USER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#C9A66B]" />
                  Add User to {DEPT_LABELS[department]}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {department === 'sales'
                    ? `Creates an active pipeline immediately inside ${orgName}.`
                    : `Adds member to ${orgName} (${DEPT_LABELS[department]}).`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Grace Wanjiru"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A66B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="agent@company.co.ke"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A66B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+254 7XX XXX XXX"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A66B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Access Role</label>
                  <select
                    value={newAccess}
                    onChange={(e) => setNewAccess(e.target.value as 'user' | 'admin')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#C9A66B] cursor-pointer"
                  >
                    <option value="user">User (Own Pipeline Only)</option>
                    <option value="admin">Admin (Full Oversight)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C9A66B] hover:bg-[#C9A66B]/90 text-slate-950 font-bold text-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingAdd && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {submittingAdd ? 'Creating...' : 'Create User & Pipeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE USER & LEAD TRANSFER MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400">
                <ArrowRightLeft className="w-4 h-4" />
                <h3 className="text-sm font-bold text-white">
                  Remove {deleteTarget.full_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {department === 'sales' && deleteTarget.lead_count > 0 ? (
                <>
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                    <strong>{deleteTarget.full_name}</strong> currently holds{' '}
                    <strong>{deleteTarget.lead_count} active leads</strong>. Choose how to transfer
                    their pipeline before removing this user:
                  </div>

                  <div className="space-y-2.5">
                    {otherAgents.length > 0 && (
                      <label className="block p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="transferMode"
                            checked={transferMode === 'single'}
                            onChange={() => setTransferMode('single')}
                            className="accent-[#C9A66B]"
                          />
                          <span className="font-semibold text-white">
                            Transfer all {deleteTarget.lead_count} leads to a specific agent
                          </span>
                        </div>
                        {transferMode === 'single' && (
                          <select
                            value={targetAgentEmail}
                            onChange={(e) => setTargetAgentEmail(e.target.value)}
                            className="mt-2.5 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C9A66B]"
                          >
                            {otherAgents.map((ag) => (
                              <option key={ag.id} value={ag.email}>
                                {ag.full_name} ({ag.email}) — {ag.lead_count} leads
                              </option>
                            ))}
                          </select>
                        )}
                      </label>
                    )}

                    {otherAgents.length > 1 && (
                      <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                        <input
                          type="radio"
                          name="transferMode"
                          checked={transferMode === 'round_robin'}
                          onChange={() => setTransferMode('round_robin')}
                          className="accent-[#C9A66B]"
                        />
                        <div>
                          <div className="font-semibold text-white">Distribute evenly (Round-Robin)</div>
                          <div className="text-[11px] text-slate-400">
                            Split leads automatically across the remaining {otherAgents.length} sales agents.
                          </div>
                        </div>
                      </label>
                    )}

                    <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="transferMode"
                        checked={transferMode === 'unassigned'}
                        onChange={() => setTransferMode('unassigned')}
                        className="accent-[#C9A66B]"
                      />
                      <div>
                        <div className="font-semibold text-white">Leave leads unassigned</div>
                        <div className="text-[11px] text-slate-400">
                          Leads stay intact in the organization for Admin reassignment later.
                        </div>
                      </div>
                    </label>
                  </div>
                </>
              ) : (
                <p className="text-slate-300">
                  Are you sure you want to remove <strong>{deleteTarget.full_name}</strong> ({deleteTarget.email}) from{' '}
                  {DEPT_LABELS[department]}?
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingDelete}
                  onClick={handleConfirmDelete}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {submittingDelete && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {submittingDelete ? 'Processing...' : 'Confirm Remove'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
