'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import CRMPipelineBoard from '@/components/crm/crm-pipeline-board'
import { Sparkles } from 'lucide-react'

export default function AdminPipelinePage() {
  const supabase = createClient()
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('atulah@cillah.dev')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setCurrentUserEmail(user.email.toLowerCase())
      }
      setLoading(false)
    }

    loadUser()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E131F] text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#C9A66B] font-medium">
          <Sparkles className="w-6 h-6 animate-spin" /> Loading Admin Sales Master Pipeline...
        </div>
      </div>
    )
  }

  return (
    <div className="pt-20">
      <CRMPipelineBoard currentUserEmail={currentUserEmail} isStaffAdmin={true} />
    </div>
  )
}
