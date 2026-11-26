'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import CRMPipelineBoard from '@/components/crm/crm-pipeline-board'
import MarketingHub from '@/components/marketing/marketing-hub'
import FinanceDepartmentHub from '@/components/finance/finance-department-hub'
import { Building2, UserPlus, Sparkles } from 'lucide-react'

export default function DynamicOrganizationDepartmentPage() {
  const params = useParams()
  const supabase = createClient()
  const orgSlug = String(params?.orgSlug || '').toLowerCase()
  const deptParam = String(params?.department || 'sales').toLowerCase()

  const [org, setOrg] = useState<{ id: string; name: string; slug: string } | null>(null)
  const [orgAgents, setOrgAgents] = useState<Array<{ email: string; full_name: string }>>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('all')
  const [userEmail, setUserEmail] = useState('awuorcillah@gmail.com')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([
      supabase.auth.getUser(),
      supabase.from('organizations').select('id, name, slug').eq('slug', orgSlug).maybeSingle(),
    ]).then(async ([{ data: authData }, { data: orgData }]) => {
      if (!active) return
      if (authData?.user?.email) setUserEmail(authData.user.email.toLowerCase())
      if (orgData?.id) {
        setOrg(orgData)
        const { data: staffRows } = await supabase
          .from('staff_members')
          .select('email, full_name')
          .eq('org_id', orgData.id)
          .eq('is_active', true)
          .order('full_name', { ascending: true })
        if (active && staffRows) setOrgAgents(staffRows as any[])
      }
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
      <FinanceDepartmentHub
        orgSlug={org.slug}
        orgName={org.name}
        isDemoOrg={org.slug === 'rosy-realtors'}
        showManageUsersLink={true}
      />
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
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs">
            <span className="text-slate-400">Agent:</span>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">All Agents</option>
              {orgAgents.map((ag) => (
                <option key={ag.email} value={ag.email.toLowerCase()} className="bg-slate-900 text-white">
                  {ag.full_name}
                </option>
              ))}
            </select>
          </div>
          <Link
            href={`/admin/organizations/${org.slug}/sales/users`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#C9A66B]" /> Manage Sales Users
          </Link>
        </div>
      </div>

      <CRMPipelineBoard
        currentUserEmail={userEmail}
        isStaffAdmin={true}
        forceUserOnly={false}
        embedded={true}
        orgId={org.id}
        excludeEmails={['atulah@cillah.dev']}
        currencyPrefix="KES "
        externalAgentFilter={selectedAgent}
      />
    </div>
  )
}
