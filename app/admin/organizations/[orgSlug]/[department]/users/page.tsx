'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DepartmentUsersManager from '@/components/admin/department-users-manager'
import { Sparkles } from 'lucide-react'

const FALLBACK_ORGS: Record<string, { id: string; name: string }> = {
  'cillah-dev': {
    id: 'a1b2c3d4-e5f6-7890-abcd-222222222222',
    name: 'cillah.dev',
  },
  'rosy-realtors': {
    id: 'a1b2c3d4-e5f6-7890-abcd-555555555555',
    name: 'Rosy Realtors Nairobi',
  },
}

export default function OrganizationDepartmentUsersPage() {
  const params = useParams()
  const supabase = createClient()
  const orgSlug = String(params?.orgSlug || 'cillah-dev').toLowerCase()
  const deptParam = String(params?.department || 'sales').toLowerCase()
  const department: 'sales' | 'marketing' | 'finance' =
    deptParam === 'marketing' || deptParam === 'finance' ? deptParam : 'sales'

  const [org, setOrg] = useState<{ id: string; name: string } | null>(
    FALLBACK_ORGS[orgSlug] || null
  )
  const [loading, setLoading] = useState(!FALLBACK_ORGS[orgSlug])

  useEffect(() => {
    let active = true
    supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('slug', orgSlug)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return
        if (data?.id) {
          setOrg({ id: data.id, name: data.name })
        }
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [orgSlug, supabase])

  if (loading || !org) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center text-xs gap-2">
        <Sparkles className="w-4 h-4 text-[#C9A66B] animate-spin" />
        Loading organization directory...
      </div>
    )
  }

  const dashboardHref =
    orgSlug === 'cillah-dev'
      ? department === 'sales'
        ? '/admin/dashboard'
        : department === 'marketing'
        ? '/admin/marketing'
        : '/admin/finance'
      : `/admin/organizations/${orgSlug}/${department}`

  return (
    <DepartmentUsersManager
      orgId={org.id}
      orgName={org.name}
      orgSlug={orgSlug}
      department={department}
      dashboardHref={dashboardHref}
    />
  )
}
