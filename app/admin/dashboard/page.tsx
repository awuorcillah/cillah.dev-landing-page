'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { ShieldCheck, LogOut, Users, Calendar, DollarSign, Activity, RefreshCw } from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = createClient()

  const [adminProfile, setAdminProfile] = useState<any>(null)
  const [allProfiles, setAllProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadAdminData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Verify admin role
      const { data: currentProfile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileErr || currentProfile?.role !== 'admin') {
        toast.error('Unauthorized access. Admin role required.', { position: 'top-left' })
        router.push('/client/dashboard')
        return
      }

      setAdminProfile(currentProfile)

      // Fetch all user profiles
      const { data: profiles, error: listErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (!listErr && profiles) {
        setAllProfiles(profiles)
      }
    } catch (err: any) {
      toast.error('Error loading admin dashboard', { position: 'top-left' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [])

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
      toast.success(`User role updated to ${newRole.toUpperCase()}`, { position: 'top-left' })
      loadAdminData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role', { position: 'top-left' })
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Logged out successfully', { position: 'top-left' })
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-2 text-cyan-400">
          <ShieldCheck className="w-5 h-5 animate-spin" /> Verifying admin access...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100">{adminProfile?.full_name || 'Admin'}</h1>
                <Badge className="bg-cyan-500 text-slate-950 font-bold px-2 py-0.5 text-xs">ADMIN</Badge>
              </div>
              <p className="text-sm text-slate-400">System Administrator Portal (cillah.dev)</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAdminData}
              className="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4 mr-2" /> Log Out
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-900/60 border-slate-800 text-slate-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Users</CardTitle>
              <Users className="w-4 h-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allProfiles.length}</div>
              <p className="text-xs text-slate-500 mt-1">Registered in database</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800 text-slate-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Active Clients</CardTitle>
              <Activity className="w-4 h-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {allProfiles.filter(p => p.role === 'client' || p.role === 'admin').length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Clients & Admins</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800 text-slate-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Active Sessions</CardTitle>
              <Calendar className="w-4 h-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2 Types</div>
              <p className="text-xs text-slate-500 mt-1">Free Audit & Strategy Call</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800 text-slate-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">System Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KES 0.00</div>
              <p className="text-xs text-slate-500 mt-1">Ready for M-Pesa testing</p>
            </CardContent>
          </Card>
        </div>

        {/* User Directory & Role Management Table */}
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold">User Directory & Role Controls</CardTitle>
            <CardDescription className="text-slate-400">
              Manage user roles (`user`, `client`, `admin`) and account status in real-time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allProfiles.length === 0 ? (
              <p className="text-slate-500 py-4 text-center">No users registered yet.</p>
            ) : (
              <div className="rounded-lg border border-slate-800 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-950">
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400">First Name</TableHead>
                      <TableHead className="text-slate-400">Last Name</TableHead>
                      <TableHead className="text-slate-400">Phone</TableHead>
                      <TableHead className="text-slate-400">City</TableHead>
                      <TableHead className="text-slate-400">Country</TableHead>
                      <TableHead className="text-slate-400">Company</TableHead>
                      <TableHead className="text-slate-400">Role</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allProfiles.map((p) => (
                      <TableRow key={p.id} className="border-slate-800 hover:bg-slate-800/40">
                        <TableCell className="font-medium text-slate-200">{p.first_name || '—'}</TableCell>
                        <TableCell className="text-slate-300">{p.last_name || '—'}</TableCell>
                        <TableCell className="text-slate-400 font-mono text-xs">
                          {p.phone_prefix || p.phone_number ? `${p.phone_prefix || ''} ${p.phone_number || ''}`.trim() : '—'}
                        </TableCell>
                        <TableCell className="text-slate-400">{p.city || '—'}</TableCell>
                        <TableCell className="text-slate-400">{p.country || '—'}</TableCell>
                        <TableCell className="text-slate-400">{p.company_name || '—'}</TableCell>
                        <TableCell>
                          <Badge className={
                            p.role === 'admin' 
                              ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' 
                              : p.role === 'client' 
                              ? 'bg-purple-500/20 text-purple-400 border-purple-500/40' 
                              : 'bg-slate-800 text-slate-300'
                          }>
                            {p.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 capitalize">
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {p.role !== 'admin' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRoleUpdate(p.id, 'admin')}
                              className="border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-400 text-xs"
                            >
                              Make Admin
                            </Button>
                          )}
                          {p.role === 'user' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRoleUpdate(p.id, 'client')}
                              className="border-slate-700 hover:border-purple-500 text-slate-300 hover:text-purple-400 text-xs"
                            >
                              Make Client
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
