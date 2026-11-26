'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import CRMPipelineBoard from '@/components/crm/crm-pipeline-board'
import MarketingHub from '@/components/marketing/marketing-hub'
import FinanceDepartmentHub from '@/components/finance/finance-department-hub'
import {
  Building2,
  UserPlus,
  Sparkles,
  ChevronDown,
  Check,
  TrendingUp,
  Megaphone,
  DollarSign,
} from 'lucide-react'

const BUILTIN_ORG_FALLBACKS: Record<string, { id: string; name: string; slug: string }> = {
  'cillah-dev': {
    id: 'a1b2c3d4-e5f6-7890-abcd-222222222222',
    name: 'cillah.dev',
    slug: 'cillah-dev',
  },
  'rosy-realtors': {
    id: 'a1b2c3d4-e5f6-7890-abcd-555555555555',
    name: 'Rosy Realtors Nairobi',
    slug: 'rosy-realtors',
  },
  'chetu-healthcare': {
    id: 'a1b2c3d4-e5f6-7890-abcd-333333333333',
    name: 'Chetu Healthcare',
    slug: 'chetu-healthcare',
  },
  'dendri-africa': {
    id: 'a1b2c3d4-e5f6-7890-abcd-444444444444',
    name: 'Dendri Africa',
    slug: 'dendri-africa',
  },
}

export default function DynamicOrganizationDepartmentPage() {
  const params = useParams()
  const supabase = createClient()
  const orgSlug = String(params?.orgSlug || '').toLowerCase()
  const deptParam = String(params?.department || 'sales').toLowerCase()

  const [org, setOrg] = useState<{ id: string; name: string; slug: string } | null>(
    BUILTIN_ORG_FALLBACKS[orgSlug] || null
  )
  const [orgAgents, setOrgAgents] = useState<Array<{ email: string; full_name: string }>>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('all')
  const [agentMenuOpen, setAgentMenuOpen] = useState(false)
  const agentMenuRef = useRef<HTMLDivElement>(null)
  const [userEmail, setUserEmail] = useState('awuorcillah@gmail.com')
  const [loading, setLoading] = useState(!BUILTIN_ORG_FALLBACKS[orgSlug])

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (agentMenuRef.current && !agentMenuRef.current.contains(e.target as Node)) {
        setAgentMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([
      supabase.auth.getUser(),
      supabase.from('organizations').select('id, name, slug').eq('slug', orgSlug).maybeSingle(),
    ]).then(async ([{ data: authData }, { data: orgData }]) => {
      if (!active) return
      if (authData?.user?.email) setUserEmail(authData.user.email.toLowerCase())
      const resolvedOrg = orgData?.id ? orgData : BUILTIN_ORG_FALLBACKS[orgSlug] || null
      if (resolvedOrg) {
        setOrg(resolvedOrg)
        const { data: staffRows } = await supabase
          .from('staff_members')
          .select('email, full_name')
          .eq('org_id', resolvedOrg.id)
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
      <div className="min-h-screen bg-[#090B12] text-slate-400 flex items-center justify-center text-xs gap-2">
        <Sparkles className="w-4 h-4 text-[#C9A66B] animate-spin" />
        Loading workspace...
      </div>
    )
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-[#090B12] text-slate-300 flex flex-col items-center justify-center gap-3 p-6 text-xs">
        <p>Organization &ldquo;{orgSlug}&rdquo; was not found.</p>
        <Link href="/admin/organizations" className="text-[#C9A66B] hover:underline font-semibold">
          Back to All Organizations Hub
        </Link>
      </div>
    )
  }

  // Unified sleek department pill bar matching cillah.dev dark-obsidian luxury theme
  const deptTabs = [
    { id: 'sales', label: 'Sales', href: `/admin/organizations/${org.slug}/sales`, icon: TrendingUp },
    { id: 'marketing', label: 'Marketing', href: `/admin/organizations/${org.slug}/marketing`, icon: Megaphone },
    { id: 'finance', label: 'Finance', href: `/admin/organizations/${org.slug}/finance`, icon: DollarSign },
  ]

  const activeAgentLabel =
    selectedAgent === 'all'
      ? 'All Agents'
      : orgAgents.find((a) => a.email.toLowerCase() === selectedAgent)?.full_name || selectedAgent

  if (deptParam === 'marketing') {
    return (
      <div className="min-h-screen bg-[#090B12] text-slate-100 min-w-0 overflow-x-hidden">
        <MarketingHub
          organizationSlug={org.slug}
          organizationName={org.name}
          currentUserEmail={userEmail}
          isAdminView={true}
        />
      </div>
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
    <div className="min-h-screen bg-[#090B12] text-slate-100 px-2 sm:px-4 py-3 space-y-4 min-w-0 overflow-x-hidden">
      {/* Compact Luxury Organization Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#0F1422] border border-[#C9A66B]/30 text-xs font-bold text-[#E5C687] truncate">
            <Building2 className="w-3.5 h-3.5 text-[#C9A66B] shrink-0" />
            <span className="truncate">{org.name}</span>
          </span>

          <div className="hidden sm:inline-flex items-center gap-1 bg-[#0F1422] border border-white/10 rounded-xl p-1">
            {deptTabs.map((t) => {
              const Icon = t.icon
              const active = deptParam === t.id
              return (
                <Link
                  key={t.id}
                  href={t.href}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                    active
                      ? 'bg-[#C9A66B]/20 text-[#E5C687]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{t.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Custom Obsidian-Gold Agent Dropdown */}
          <div className="relative" ref={agentMenuRef}>
            <button
              type="button"
              onClick={() => setAgentMenuOpen((o) => !o)}
              className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                agentMenuOpen || selectedAgent !== 'all'
                  ? 'bg-[#C9A66B]/15 border-[#C9A66B]/60 text-[#E5C687]'
                  : 'bg-[#0F1422] border-white/10 text-white hover:border-[#C9A66B]/50'
              }`}
            >
              <span className="truncate max-w-[120px]">{activeAgentLabel}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  agentMenuOpen ? 'rotate-180 text-[#C9A66B]' : ''
                }`}
              />
            </button>

            {agentMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 max-w-[calc(100vw-24px)] z-50 rounded-xl bg-[#0E131F] border border-[#C9A66B]/40 shadow-2xl overflow-hidden divide-y divide-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAgent('all')
                    setAgentMenuOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-left cursor-pointer ${
                    selectedAgent === 'all'
                      ? 'bg-[#C9A66B]/15 text-[#E5C687]'
                      : 'text-slate-200 hover:bg-white/[0.05]'
                  }`}
                >
                  <span>All Agents</span>
                  {selectedAgent === 'all' && <Check className="w-3.5 h-3.5 text-[#C9A66B]" />}
                </button>
                {orgAgents.map((ag) => {
                  const val = ag.email.toLowerCase()
                  const active = selectedAgent === val
                  return (
                    <button
                      key={ag.email}
                      type="button"
                      onClick={() => {
                        setSelectedAgent(val)
                        setAgentMenuOpen(false)
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-bold text-left cursor-pointer ${
                        active
                          ? 'bg-[#C9A66B]/15 text-[#E5C687]'
                          : 'text-slate-200 hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className="truncate">{ag.full_name}</span>
                      {active && <Check className="w-3.5 h-3.5 text-[#C9A66B] shrink-0" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <Link
            href={`/admin/organizations/${org.slug}/sales/users`}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[#0F1422] hover:bg-white/[0.08] border border-white/10 text-xs font-bold text-slate-200"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#C9A66B]" />
            <span className="hidden sm:inline">Users</span>
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
