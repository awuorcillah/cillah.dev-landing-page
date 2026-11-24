'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import MarketingHub from '@/components/marketing/marketing-hub'

export default function MarketingDepartmentPage() {
  const supabase = createClient()
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setUserEmail(data.user.email.toLowerCase())
      }
    })
  }, [supabase])

  return (
    <div className="w-full min-h-screen bg-[#0E131F] text-slate-100 rounded-2xl">
      <MarketingHub
        organizationSlug="cillah-dev"
        organizationName="Cillah"
        currentUserEmail={userEmail}
        isAdminView={true}
      />
    </div>
  )
}
