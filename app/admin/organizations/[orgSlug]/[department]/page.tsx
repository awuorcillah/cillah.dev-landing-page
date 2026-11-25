'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import CRMPipelineBoard from '@/components/crm/crm-pipeline-board'
import MarketingHub from '@/components/marketing/marketing-hub'
import { Building2, DollarSign, UserPlus, Sparkles } from 'lucide-react'

export default function DynamicOrganizationDepartmentPage() {
  const params = useParams()
  const supabase = createClient()
  const orgSlug = String(params?.orgSlug || '').toLowerCase()
  const deptParam = String(params?.department || 'sales').toLowerCase()

  const [org, setOrg] = useState<{ id: string; name: string; slug: string } | null>(null)
  const [userEmail, setUserEmail] = useState('awuorcillah@gmail.com')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([
      supabase.auth.getUser(),
      supabase.from('organizations').select('id, name, slug').eq('slug', orgSlug).maybeSingle(),
    ]).then(([{ data: authData }, { data: orgData }]) => {
      if (!active) return
      if (authData?.user?.email) setUserEmail(authData.user.email.toLowerCase())
      if (orgData?.id) setOrg(orgData)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [orgSlug, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center text-xs gap-2">
        <Sparkles className="w-4 h-4 text-[#C9A66B] animate-spin" />
        Loading organization workspace...
      </div>
    )
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 flex flex-col items-center justify-center gap-3 p-6 text-xs">
        <p>Organization &ldquo;{orgSlug}&rdquo; was not found.</p>
        <Link href="/admin/organizations" className="text-[#C9A66B] hover:underline font-semibold">
          Back to All Organizations Hub
        </Link>
      </div>
    )
  }

  if (deptParam === 'marketing') {
    return (
      <MarketingHub
        organizationSlug={org.slug}
        organizationName={org.name}
        currentUserEmail={userEmail}
        isAdminView={true}
      />
    )
  }

  if (deptParam === 'finance') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#C9A66B] uppercase tracking-wider mb-1">
              <Building2 className="w-3.5 h-3.5" />
              {org.name} • Finance Department
            </div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-400" />
              Finance Workspace
            </h1>
          </div>
          <Link
            href={`/admin/organizations/${org.slug}/finance/users`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#C9A66B]" /> Manage Finance Users
          </Link>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 text-xs text-slate-400">
          Finance ledger and billing modules for <strong className="text-white">{org.name}</strong> are ready to connect.
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#C9A66B] uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5" />
            {org.name} • Sales Department
          </div>
          <h1 className="text-2xl font-bold text-white">Executive &amp; Pipeline Dashboard</h1>
        </div>
        <Link
          href={`/admin/organizations/${org.slug}/sales/users`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200"
        >
          <UserPlus className="w-3.5 h-3.5 text-[#C9A66B]" /> Manage Sales Users
        </Link>
      </div>

      <CRMPipelineBoard
        currentUserEmail={userEmail}
        isStaffAdmin={true}
        forceUserOnly={false}
        embedded={true}
        orgId={org.id}
        excludeEmails={['atulah@cillah.dev']}
        currencyPrefix="KES "
      />
    </div>
  )
}
