'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { User, LogOut, ShieldAlert, Sparkles, Building, Phone, Mail, CheckCircle2 } from 'lucide-react'

export default function ClientDashboard() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<any>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/login')
          return
        }

        setUserEmail(user.email || '')

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error
        setProfile(data)

        if (data?.role === 'admin') {
          window.location.href = '/admin/dashboard'
          return
        }
      } catch (err: any) {
        toast.error('Failed to load user profile', { position: 'top-left' })
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Logged out successfully', { position: 'top-left' })
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-2 text-cyan-400">
          <Sparkles className="w-5 h-5 animate-spin" /> Loading client dashboard...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-lg">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">{profile?.full_name || 'Valued User'}</h1>
              <p className="text-sm text-slate-400">{userEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              Role: {profile?.role || 'user'}
            </Badge>
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

        {/* Dashboard Content */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Profile Card */}
          <Card className="bg-slate-900/80 border-slate-800 text-slate-100 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-200">
                <User className="w-5 h-5 text-cyan-400" /> User Profile Information
              </CardTitle>
              <CardDescription className="text-slate-400">
                Auto-created in Supabase `profiles` table on signup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-slate-300">
                <Building className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-400 text-sm">Company:</span>
                <span className="font-medium text-slate-200">{profile?.company_name || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Phone className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-400 text-sm">Phone:</span>
                <span className="font-medium text-slate-200">{profile?.phone_number || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-400 text-sm">Account Status:</span>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 capitalize">
                  {profile?.status || 'active'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Testing Instructions Card */}
          <Card className="bg-slate-900/80 border-slate-800 text-slate-100 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-400">
                <ShieldAlert className="w-5 h-5" /> Testing Admin Role Escalation
              </CardTitle>
              <CardDescription className="text-slate-400">
                How to manually test Admin access in Supabase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-300">
              <p>1. Open your <strong>Supabase Dashboard</strong> table editor.</p>
              <p>2. Locate your row in the <code>profiles</code> table.</p>
              <p>3. Change the <code>role</code> column from <code>user</code> to <code>admin</code>.</p>
              <p>4. Click <strong>Log Out</strong> above and log back in to test automatic redirection to <strong>`/admin/dashboard`</strong>!</p>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
