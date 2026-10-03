'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sparkles } from 'lucide-react'

export default function UnifiedDashboardRedirect() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function routeUser() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login'
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const email = user.email?.toLowerCase() || ''
      const role = profile?.role || 'user'
      const isAdmin = role === 'admin' || email.includes('cillah') || email.includes('admin') || email === 'awuorcillah@gmail.com'

      if (isAdmin) {
        window.location.href = '/admin/dashboard'
      } else if (role === 'client') {
        window.location.href = '/client/dashboard'
      } else {
        window.location.href = '/user/dashboard'
      }
    }

    routeUser()
  }, [supabase])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
      <div className="flex items-center gap-3 text-cyan-400 font-medium">
        <Sparkles className="w-6 h-6 animate-spin" /> Routing to your personalized dashboard...
      </div>
    </div>
  )
}

