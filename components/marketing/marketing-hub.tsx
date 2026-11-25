'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import {
  Megaphone,
  Send,
  BarChart3,
  Shield,
  ChevronDown,
  Check,
  UserPlus,
  AlertTriangle,
  Sparkles,
  Loader2,
  Link2,
} from 'lucide-react'
import MarketingPostComposer from '@/components/marketing/marketing-post-composer'
import MarketingInsightsView from '@/components/marketing/marketing-insights-view'
import MarketingConnectionsView, {
  type ProviderReadinessMap,
  type SanitizedSocialConnection,
} from '@/components/marketing/marketing-connections-view'
import {
  MARKETING_ROLE_TIERS,
  getRolePermissions,
  type MarketingPostRecord,
  type MarketingRoleAssignment,
  type MarketingRoleTier,
} from '@/lib/marketing-config'

type MarketingActionTab = 'post' | 'insights' | 'connections' | 'roles'

interface MarketingHubProps {
  organizationSlug?: string
  organizationName?: string
  currentUserEmail?: string
  isAdminView?: boolean
}

export default function MarketingHub({
  organizationSlug = 'cillah-dev',
  organizationName = 'Cillah',
  currentUserEmail,
  isAdminView = false,
}: MarketingHubProps) {
  const [activeAction, setActiveAction] = useState<MarketingActionTab>('post')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [posts, setPosts] = useState<MarketingPostRecord[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [schemaPending, setSchemaPending] = useState(false)

  const [marketingRole, setMarketingRole] = useState<MarketingRoleTier>(
    isAdminView ? 'marketing_admin' : 'publisher'
  )
  const [roleAssignments, setRoleAssignments] = useState<MarketingRoleAssignment[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)

  // Connected Social Accounts state
  const [connections, setConnections] = useState<SanitizedSocialConnection[]>([])
  const [providerConfig, setProviderConfig] = useState<ProviderReadinessMap>({})
  const [connectionsSchemaPending, setConnectionsSchemaPending] = useState(false)
  const [loadingConnections, setLoadingConnections] = useState(false)

  // Handle OAuth callback return query params (?marketing_tab=connections&oauth_success=...)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('marketing_tab')
    const oauthSuccess = params.get('oauth_success')
    const oauthError = params.get('oauth_error')

    if (tab === 'connections') {
      setActiveAction('connections')
    }
    if (oauthSuccess) {
      toast.success(oauthSuccess)
    }
    if (oauthError) {
      toast.error(oauthError)
    }
    if (tab || oauthSuccess || oauthError) {
      params.delete('marketing_tab')
      params.delete('oauth_success')
      params.delete('oauth_error')
      const cleanQuery = params.toString()
      const nextUrl = `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ''}`
      window.history.replaceState({}, '', nextUrl)
    }
  }, [])

  // Add / Update Role Form
  const [roleEmail, setRoleEmail] = useState('')
  const [roleFullName, setRoleFullName] = useState('')
  const [roleTier, setRoleTier] = useState<MarketingRoleTier>('content_creator')
  const [savingRole, setSavingRole] = useState(false)

  const permissions = getRolePermissions(marketingRole)

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const fetchPostsAndContext = useCallback(async () => {
    setLoadingPosts(true)
    try {
      const res = await fetch(
        `/api/marketing/posts?org=${encodeURIComponent(organizationSlug)}`
      )
      const json = await res.json()
      if (res.ok) {
        setPosts(json.posts || [])
        setSchemaPending(Boolean(json.schema_pending))
        if (json.roleContext?.marketingRole) {
          const resolvedRole = json.roleContext.marketingRole as MarketingRoleTier
          setMarketingRole(resolvedRole)
          // Automatically direct read-only Analysts to Insights
          if (resolvedRole === 'analyst') {
            setActiveAction('insights')
          }
        }
      }
    } catch {
      toast.error('Failed to load Marketing Hub data.')
    } finally {
      setLoadingPosts(false)
    }
  }, [organizationSlug])

  const fetchRoles = useCallback(async () => {
    setLoadingRoles(true)
    try {
      const res = await fetch(
        `/api/marketing/roles?org=${encodeURIComponent(organizationSlug)}`
      )
      const json = await res.json()
      if (res.ok) {
        setRoleAssignments(json.assignments || [])
        if (json.schema_pending) setSchemaPending(true)
      }
    } catch {
      // ignore
    } finally {
      setLoadingRoles(false)
    }
  }, [organizationSlug])

  const fetchConnections = useCallback(async () => {
    setLoadingConnections(true)
    try {
      const res = await fetch(
        `/api/marketing/connections?org=${encodeURIComponent(organizationSlug)}`
      )
      const json = await res.json()
      if (res.ok) {
        setConnections(json.connections || [])
        setProviderConfig(json.providerConfig || {})
        setConnectionsSchemaPending(Boolean(json.schema_pending))
      }
    } catch {
      // ignore
    } finally {
      setLoadingConnections(false)
    }
  }, [organizationSlug])

  useEffect(() => {
    fetchPostsAndContext()
    fetchRoles()
    fetchConnections()
  }, [fetchPostsAndContext, fetchRoles, fetchConnections])

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roleEmail.trim()) return

    setSavingRole(true)
    try {
      const res = await fetch('/api/marketing/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_slug: organizationSlug,
          user_email: roleEmail.trim().toLowerCase(),
          full_name: roleFullName.trim(),
          marketing_role: roleTier,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Could not save role tier.')
        return
      }
      toast.success(
        `Assigned ${roleEmail.trim()} as ${MARKETING_ROLE_TIERS[roleTier].label}`
      )
      setRoleEmail('')
      setRoleFullName('')
      setRoleTier('content_creator')
      fetchRoles()
    } catch {
      toast.error('Failed to save role assignment.')
    } finally {
      setSavingRole(false)
    }
  }

  const handleQuickRoleUpdate = async (
    assignment: MarketingRoleAssignment,
    nextTier: MarketingRoleTier
  ) => {
    try {
      const res = await fetch('/api/marketing/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_slug: organizationSlug,
          user_email: assignment.user_email,
          full_name: assignment.full_name || '',
          marketing_role: nextTier,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Failed to update role.')
        return
      }
      toast.success(
        `${assignment.user_email} updated to ${MARKETING_ROLE_TIERS[nextTier].label}`
      )
      fetchRoles()
    } catch {
      toast.error('Network error updating role.')
    }
  }

  const actionOptions: {
    id: MarketingActionTab
    label: string
    subtitle: string
    icon: typeof Send
    hidden?: boolean
  }[] = [
    {
      id: 'post',
      label: 'Post & Schedule',
      subtitle: 'Upload media/docs, choose channels, write caption & publish',
      icon: Send,
    },
    {
      id: 'insights',
      label: 'Insights & Analytics',
      subtitle: 'Combined or per-channel performance in one easy read',
      icon: BarChart3,
    },
    {
      id: 'connections',
      label: `Connected Accounts (${connections.length})`,
      subtitle: 'Link Meta (IG & FB), LinkedIn, YouTube, TikTok & WhatsApp',
      icon: Link2,
    },
    {
      id: 'roles',
      label: 'Role Tiers & Access',
      subtitle: 'Assign Marketing Admin, Publisher, Content Creator, Analyst',
      icon: Shield,
      hidden: !permissions.canManageRoles,
    },
  ]

  const visibleActions = actionOptions.filter((a) => !a.hidden)
  const currentOption =
    visibleActions.find((a) => a.id === activeAction) || visibleActions[0]
  const CurrentIcon = currentOption.icon

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-5">
      {/* MINIMALIST FUNCTIONAL ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#C9A66B]/15 text-[#E5C992] border border-[#C9A66B]/30">
            <Megaphone className="w-3 h-3" /> {organizationName} &bull; Marketing
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${permissions.badgeClass}`}
          >
            <Shield className="w-3 h-3" /> {permissions.label}
          </span>
        </div>

        {/* SINGLE FUNCTIONAL ACTION DROPDOWN */}
        <div className="w-full sm:w-72 relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-[#C9A66B]/45 hover:border-[#C9A66B] text-left transition-all shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <CurrentIcon className="w-4 h-4 text-[#C9A66B] shrink-0" />
              <span className="text-sm font-bold text-white truncate">{currentOption.label}</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[#C9A66B] shrink-0 transition-transform ${
                dropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 left-0 top-12 z-40 rounded-xl bg-slate-950 border border-[#C9A66B]/40 shadow-2xl overflow-hidden divide-y divide-slate-800/80">
              {visibleActions.map((opt) => {
                const Icon = opt.icon
                const selected = opt.id === activeAction
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setActiveAction(opt.id)
                      setDropdownOpen(false)
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                      selected ? 'bg-[#C9A66B]/15' : 'hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          selected ? 'text-[#C9A66B]' : 'text-slate-400'
                        }`}
                      />
                      <span className="text-xs font-bold text-white truncate">{opt.label}</span>
                    </div>
                    {selected && <Check className="w-4 h-4 text-[#C9A66B] shrink-0" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ONE-TIME SCHEMA INITIALIZATION NOTICE (ONLY IF SQL NOT YET RUN) */}
      {schemaPending && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-200">
              Database Setup Pending — One Quick Step in Supabase
            </p>
            <p className="text-slate-300 leading-relaxed">
              Run <code className="px-1.5 py-0.5 rounded bg-slate-950 text-[#E5C992]">supabase/marketing_hub_schema.sql</code> in your Supabase SQL Editor to activate persistent post storage, file uploads (<code className="px-1 rounded bg-slate-950">marketing-media</code> bucket), and team role tiers.
            </p>
          </div>
        </div>
      )}

      {/* ACTIVE VIEW BODY */}
      {activeAction === 'post' && (
        <MarketingPostComposer
          organizationSlug={organizationSlug}
          permissions={permissions}
          posts={posts}
          loadingPosts={loadingPosts}
          connectedChannels={connections
            .filter((c) => c.status === 'connected')
            .map((c) => c.channel)}
          onOpenConnections={() => setActiveAction('connections')}
          onPostsChanged={fetchPostsAndContext}
        />
      )}

      {activeAction === 'insights' && (
        <MarketingInsightsView
          organizationSlug={organizationSlug}
          permissions={permissions}
        />
      )}

      {activeAction === 'connections' && (
        <MarketingConnectionsView
          organizationSlug={organizationSlug}
          organizationName={organizationName}
          permissions={permissions}
          connections={connections}
          providerConfig={providerConfig}
          schemaPending={connectionsSchemaPending}
          loading={loadingConnections}
          onRefresh={fetchConnections}
        />
      )}

      {activeAction === 'roles' && permissions.canManageRoles && (
        <div className="space-y-6">
          {/* Role Tiers Guide Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.keys(MARKETING_ROLE_TIERS) as MarketingRoleTier[]).map((tierKey) => {
              const info = MARKETING_ROLE_TIERS[tierKey]
              return (
                <div
                  key={tierKey}
                  className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-2"
                >
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${info.badgeClass}`}
                  >
                    {info.label}
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">{info.description}</p>
                </div>
              )
            })}
          </div>

          {/* Assign / Update Team Role Form */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#C9A66B]" /> Assign Marketing Role Tier
            </h3>
            <form
              onSubmit={handleSaveRole}
              className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs"
            >
              <input
                type="email"
                required
                value={roleEmail}
                onChange={(e) => setRoleEmail(e.target.value)}
                placeholder="team.member@cillah.dev"
                className="rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A66B]"
              />
              <input
                type="text"
                value={roleFullName}
                onChange={(e) => setRoleFullName(e.target.value)}
                placeholder="Full Name (optional)"
                className="rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A66B]"
              />
              <select
                value={roleTier}
                onChange={(e) => setRoleTier(e.target.value as MarketingRoleTier)}
                className="rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-white focus:outline-none focus:border-[#C9A66B]"
              >
                {(Object.keys(MARKETING_ROLE_TIERS) as MarketingRoleTier[]).map((k) => (
                  <option key={k} value={k} className="bg-slate-900">
                    {MARKETING_ROLE_TIERS[k].label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={savingRole}
                className="rounded-xl bg-[#C9A66B] hover:bg-[#d8b87d] text-slate-950 font-bold px-4 py-2.5 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                {savingRole ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Save Role Tier</span>
              </button>
            </form>
          </div>

          {/* Configured Role Assignments Table */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 text-sm font-bold text-white">
              Active Marketing Team Permissions ({roleAssignments.length})
            </div>

            {loadingRoles ? (
              <div className="py-10 flex items-center justify-center text-slate-400 text-xs gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#C9A66B]" /> Loading role assignments...
              </div>
            ) : roleAssignments.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500">
                No role records yet. Run the SQL schema or add a team member above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Team Member</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Current Role Tier</th>
                      <th className="py-3 px-4 text-right">Change Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {roleAssignments.map((item) => {
                      const tierInfo = getRolePermissions(item.marketing_role)
                      return (
                        <tr key={item.id} className="hover:bg-slate-800/30">
                          <td className="py-3.5 px-4 font-semibold text-white">
                            {item.full_name || item.user_email.split('@')[0]}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">{item.user_email}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${tierInfo.badgeClass}`}
                            >
                              {tierInfo.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <select
                              value={item.marketing_role}
                              onChange={(e) =>
                                handleQuickRoleUpdate(
                                  item,
                                  e.target.value as MarketingRoleTier
                                )
                              }
                              className="rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-white cursor-pointer"
                            >
                              {(Object.keys(MARKETING_ROLE_TIERS) as MarketingRoleTier[]).map(
                                (k) => (
                                  <option key={k} value={k} className="bg-slate-900">
                                    {MARKETING_ROLE_TIERS[k].label}
                                  </option>
                                )
                              )}
                            </select>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
