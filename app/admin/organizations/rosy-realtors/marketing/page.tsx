'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import MarketingHub from '@/components/marketing/marketing-hub'

export default function RosyRealtorsMarketingPage() {
  const supabase = createClient()
  const [userEmail, setUserEmail] = useState('awuorcillah@gmail.com')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) setUserEmail(data.user.email.toLowerCase())
    })
  }, [supabase])

  return (
    <MarketingHub
      organizationSlug="rosy-realtors"
      organizationName="Rosy Realtors Nairobi"
      currentUserEmail={userEmail}
      isAdminView={true}
    />
  )
}
