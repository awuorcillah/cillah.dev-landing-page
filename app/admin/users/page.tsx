'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Users, UserCheck, Shield, Search, RefreshCw,
  Phone, Building, Mail, Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type UserRole = 'user' | 'client' | 'admin'
type UserStatus = 'active' | 'inactive'

interface Profile {
  id: string
  email?: string
  full_name?: string
  phone_number?: string
  company_name?: string
  role: UserRole
  status?: UserStatus
  created_at: string
  updated_at?: string
  bookings_count?: number
}

export default function AdminUsersPage() {
  const supabase = createClient()

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)

  // ── Load Profiles ──
  const fetchProfiles = async () => {
    setLoading(true)
    try {
      const { data: fetchedProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        toast.error('Failed to load user profiles from database')
        setProfiles([])
        return
      }

      let bookingCounts: Record<string, number> = {}
      try {
        const { data: bookings } = await supabase
          .from('bookings')
          .select('id, user_id, client_id')
        
        if (bookings) {
          bookings.forEach((b: any) => {
            const uid = b.user_id || b.client_id
            if (uid) {
              bookingCounts[uid] = (bookingCounts[uid] || 0) + 1
            }
          })
        }
      } catch (err) {
        // Bookings count optional
      }

      const formattedProfiles: Profile[] = (fetchedProfiles || []).map((p: any) => ({
        id: p.id,
        email: p.email || 'No email provided',
        full_name: p.full_name || p.name || 'Unnamed User',
        phone_number: p.phone_number || p.phone || 'N/A',
        company_name: p.company_name || p.company || 'N/A',
        role: (p.role as UserRole) || 'user',
        status: (p.status as UserStatus) || 'active',
        created_at: p.created_at || new Date().toISOString(),
        updated_at: p.updated_at,
        bookings_count: bookingCounts[p.id] || 0
      }))

      setProfiles(formattedProfiles)
    } catch (err: any) {
      console.error('Unexpected error:', err)
      toast.error('An error occurred while fetching users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfiles()
  }, [])

  // ── Change User Role ──
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingId(userId)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) {
        console.error('Failed to update role:', error)
        toast.error(`Error updating role: ${error.message}`)
        return
      }

      toast.success(`Role updated to "${newRole}" successfully`)
      setProfiles(prev =>
        prev.map(p => (p.id === userId ? { ...p, role: newRole } : p))
      )
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => (prev ? { ...prev, role: newRole } : null))
      }
    } catch (err: any) {
      toast.error('Failed to update user role')
    } finally {
      setUpdatingId(null)
    }
  }

  // ── Change User Status ──
  const handleStatusToggle = async (userId: string, currentStatus?: UserStatus) => {
    const newStatus: UserStatus = currentStatus === 'active' ? 'inactive' : 'active'
    setUpdatingId(userId)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) {
        toast.error(`Failed to update status: ${error.message}`)
        return
      }

      toast.success(`Status updated to "${newStatus}"`)
      setProfiles(prev =>
        prev.map(p => (p.id === userId ? { ...p, status: newStatus } : p))
      )
    } catch (err) {
      toast.error('Failed to update user status')
    } finally {
      setUpdatingId(null)
    }
  }

  // ── Filtered Profiles ──
  const filteredProfiles = profiles.filter(p => {
    const matchesRole = roleFilter === 'all' || p.role === roleFilter
    const term = search.toLowerCase().trim()
    const matchesSearch =
      !term ||
      p.full_name?.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term) ||
      p.phone_number?.toLowerCase().includes(term) ||
      p.company_name?.toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term)

    return matchesRole && matchesSearch
  })

  // ── Stats ──
  const totalCount = profiles.length
  const userCount = profiles.filter(p => p.role === 'user').length
  const clientCount = profiles.filter(p => p.role === 'client').length
  const adminCount = profiles.filter(p => p.role === 'admin').length

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" /> Users Management
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            View all registered users and manage account status & role permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchProfiles}
            disabled={loading}
            className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 gap-2 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh List
          </Button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/70 border-slate-800 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total Users
            </CardTitle>
            <Users className="w-4 h-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{userCount}</div>
            <p className="text-[11px] text-slate-500 mt-1">Registered site users</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/70 border-slate-800 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Clients
            </CardTitle>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{clientCount}</div>
            <p className="text-[11px] text-slate-500 mt-1">Upgraded & booking clients</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/70 border-slate-800 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Admins
            </CardTitle>
            <Shield className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{adminCount}</div>
            <p className="text-[11px] text-slate-500 mt-1">Full portal access</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/70 border-slate-800 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total Accounts
            </CardTitle>
            <Users className="w-4 h-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{totalCount}</div>
            <p className="text-[11px] text-slate-500 mt-1">All profiles in database</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Search and Filter Controls ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, phone, company or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-purple-500/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-lg">
          {(['all', 'user', 'client', 'admin'] as const).map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                roleFilter === role
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {role === 'all' ? `All (${totalCount})` : `${role}s`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Users Table ── */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            <p className="text-sm">Fetching user profiles from Supabase...</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
            <Users className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-base font-semibold text-slate-300">No matching user accounts found</p>
            <p className="text-xs text-slate-500">
              {search ? 'Try clearing your search query' : 'No user records exist in the database.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">User Details</th>
                  <th className="py-3.5 px-4 font-semibold">Contact & Company</th>
                  <th className="py-3.5 px-4 font-semibold">Role</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Joined Date</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProfiles.map(user => (
                  <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-300 flex-shrink-0">
                          {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-100 truncate">{user.full_name}</p>
                          <p className="text-xs text-slate-400 truncate">{user.email}</p>
                          <p className="text-[10px] text-slate-600 font-mono mt-0.5 truncate">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Building className="w-3.5 h-3.5 text-slate-500" />
                          <span>{user.company_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span>{user.phone_number}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <select
                        value={user.role}
                        disabled={updatingId === user.id}
                        onChange={e => handleRoleChange(user.id, e.target.value as UserRole)}
                        className={`appearance-none bg-slate-950 border px-3 py-1.5 pr-8 rounded-lg text-xs font-semibold cursor-pointer focus:outline-none transition-colors ${
                          user.role === 'admin'
                            ? 'border-amber-500/40 text-amber-400 bg-amber-500/10'
                            : user.role === 'client'
                            ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                            : 'border-purple-500/40 text-purple-300 bg-purple-500/10'
                        }`}
                      >
                        <option value="user" className="bg-slate-900 text-purple-300">
                          user
                        </option>
                        <option value="client" className="bg-slate-900 text-emerald-400">
                          client
                        </option>
                        <option value="admin" className="bg-slate-900 text-amber-400">
                          admin
                        </option>
                      </select>
                    </td>

                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleStatusToggle(user.id, user.status)}
                        disabled={updatingId === user.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                          user.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'
                          }`}
                        />
                        <span className="capitalize">{user.status || 'active'}</span>
                      </button>
                    </td>

                    <td className="py-4 px-4 text-xs text-slate-400">
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.role === 'user' && (
                          <Button
                            size="sm"
                            onClick={() => handleRoleChange(user.id, 'client')}
                            disabled={updatingId === user.id}
                            className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs py-1 px-2.5 h-auto gap-1"
                          >
                            <UserCheck className="w-3 h-3" />
                            Promote to Client
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedUser(user)}
                          className="text-slate-400 hover:text-white hover:bg-slate-800 text-xs py-1 px-2 h-auto"
                        >
                          Details
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── User Detail Modal ── */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center text-base font-bold text-purple-300">
                  {selectedUser.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">{selectedUser.full_name}</h3>
                  <p className="text-xs text-slate-400">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-200 text-sm p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-500 block mb-1">Company</span>
                <span className="text-slate-200 font-medium">{selectedUser.company_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Phone</span>
                <span className="text-slate-200 font-medium">{selectedUser.phone_number}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Current Role</span>
                <span className="capitalize font-semibold text-purple-400">{selectedUser.role}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Total Bookings</span>
                <span className="text-slate-200 font-medium">{selectedUser.bookings_count} bookings</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedUser(null)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
