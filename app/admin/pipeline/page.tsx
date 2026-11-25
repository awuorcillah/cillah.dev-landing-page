'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import CRMPipelineBoard from '@/components/crm/crm-pipeline-board'
import { Sparkles } from 'lucide-react'

const CILLAH_ORG_ID = 'a1b2c3d4-e5f6-7890-abcd-222222222222'
const EXCLUDED_DEMO_EMAILS = [
  'cherrylatulah@gmail.com',
  'cherrylatulah2000@gmail.com',
  'kevin@ndakala-demo.co.ke',
  'brenda@ndakala-demo.co.ke',
  'kevin@rosyrealtors.co.ke',
  'brenda@rosyrealtors.co.ke',
  'tossie@cillah.dev',
  'ador.ai815@gmail.com',
]

export default function AdminPipelinePage() {
  const supabase = createClient()
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('awuorcillah@gmail.com')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
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
          <Sparkles className="w-6 h-6 animate-spin" /> Loading cillah.dev Sales Pipeline...
        </div>
      </div>
    )
  }

  return (
    <div className="pt-4">
      <CRMPipelineBoard
        currentUserEmail={currentUserEmail}
        isStaffAdmin={true}
        orgId={CILLAH_ORG_ID}
        excludeEmails={EXCLUDED_DEMO_EMAILS}
        currencyPrefix="KES "
      />
    </div>
  )
}
