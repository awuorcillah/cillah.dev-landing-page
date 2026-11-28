'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import {
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
  Share2,
  MessageSquare,
} from 'lucide-react'
import MarketingPostComposer from '@/components/marketing/marketing-post-composer'
import MarketingInboxView from '@/components/marketing/marketing-inbox-view'
import MarketingInsightsView from '@/components/marketing/marketing-insights-view'
import MarketingConnectionsView, {
  type ProviderReadinessMap,
  type SanitizedSocialConnection,
} from '@/components/marketing/marketing-connections-view'
import {
  ACTIVE_MARKETING_CHANNELS,
  MARKETING_ROLE_TIERS,
  getRolePermissions,
  type MarketingChannelId,
  type MarketingPostRecord,
  type MarketingRoleAssignment,
  type MarketingRoleTier,
} from '@/lib/marketing-config'

type MarketingActionTab = 'post' | 'inbox' | 'insights' | 'connections' | 'roles'

interface MarketingHubProps {
  organizationSlug?: string
  organizationName?: string
  currentUserEmail?: string
  isAdminView?: boolean
  onRoleLabelResolved?: (label: string) => void
}

export default function MarketingHub({
  organizationSlug = 'cillah-dev',
  organizationName = 'Cillah',
  currentUserEmail,
  isAdminView = false,
  onRoleLabelResolved,
}: MarketingHubProps) {
  const [activeAction, setActiveAction] = useState<MarketingActionTab>('post')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [channelDropdownOpen, setChannelDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const channelDropdownRef = useRef<HTMLDivElement>(null)

  const [selectedChannels, setSelectedChannels] = useState<MarketingChannelId[]>([
    'instagram',
    'whatsapp_status',
  ])

  const [posts, setPosts] = useState<MarketingPostRecord[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [schemaPending, setSchemaPending] = useState(false)
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all')

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
  const [oauthBanner, setOauthBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Handle OAuth callback return query params (?marketing_tab=connections&oauth_success=...)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('marketing_tab')
    const oauthSuccess = params.get('oauth_success')
    const oauthError = params.get('oauth_error')

    if (tab === 'connections') {
      setActiveAction('connections')
    } else if (tab === 'inbox') {
      setActiveAction('inbox')
    }
    if (oauthSuccess) {
      setOauthBanner({ type: 'success', message: oauthSuccess })
      toast.success(oauthSuccess)
    }
    if (oauthError) {
      setOauthBanner({ type: 'error', message: oauthError })
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
    onRoleLabelResolved?.(permissions.label)
  }, [permissions.label, onRoleLabelResolved])

  const toggleChannel = (channelId: MarketingChannelId) => {
    setSelectedChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    )
  }

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
      if (channelDropdownRef.current && !channelDropdownRef.current.contains(e.target as Node)) {
        setChannelDropdownOpen(false)
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
      id: 'inbox',
      label: 'Unified Chats & Inbox',
      subtitle: 'Read & reply to Instagram, Facebook, WhatsApp & YouTube in one place',
      icon: MessageSquare,
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

  // Unique team members for Agent/User filter dropdown in Marketing
  const memberOptions = Array.from(
    new Map(
      [
        ...roleAssignments.map((r) => [
          r.user_email.toLowerCase(),
          { email: r.user_email.toLowerCase(), label: r.full_name || r.user_email.split('@')[0] },
        ] as const),
        ...posts
          .filter((p) => p.author_email)
          .map((p) => [
            p.author_email.toLowerCase(),
            {
              email: p.author_email.toLowerCase(),
              label: p.author_name || p.author_email.split('@')[0],
            },
          ] as const),
      ]
    ).values()
  )

  const filteredPosts =
    selectedMemberFilter === 'all'
      ? posts
      : posts.filter(
          (p) => (p.author_email || '').toLowerCase() === selectedMemberFilter.toLowerCase()
        )

  const connectedChannelIds = connections
    .filter((c) => c.status === 'connected')
    .map((c) => c.channel)

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4 min-w-0 overflow-x-hidden">
      {/* CLEAN TOP BAR: Active Action ▾ | Channel ▾ (No redundant header badges — Access lives under Profile Avatar) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.08] min-w-0">
        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto min-w-0">
          {/* 1. ACTION DROPDOWN (Displays currently selected action!) */}
          <div className="relative min-w-0 sm:flex-initial" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => {
                setDropdownOpen((o) => !o)
                setChannelDropdownOpen(false)
              }}
              className={`w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 h-10 px-3 sm:px-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer min-w-0 ${
                dropdownOpen
                  ? 'bg-[#C9A66B]/15 border-[#C9A66B]/60 text-[#E5C687]'
                  : 'bg-[#0F1422] border-white/10 text-white hover:border-[#C9A66B]/50'
              }`}
            >
              <span className="inline-flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
                <CurrentIcon className="w-3.5 h-3.5 text-[#C9A66B] shrink-0" />
                <span className="truncate">{currentOption.label}</span>
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                  dropdownOpen ? 'rotate-180 text-[#C9A66B]' : ''
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-64 max-w-[calc(100vw-24px)] z-50 rounded-xl bg-[#0E131F] border border-[#C9A66B]/40 shadow-2xl overflow-hidden divide-y divide-white/[0.06]">
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
                      className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                        selected ? 'bg-[#C9A66B]/15' : 'hover:bg-white/[0.05]'
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

          {/* 2. CHANNEL DROPDOWN (Right next to Action!) */}
          <div className="relative min-w-0 sm:flex-initial" ref={channelDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setChannelDropdownOpen((o) => !o)
                setDropdownOpen(false)
              }}
              className={`w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 h-10 px-3 sm:px-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer min-w-0 ${
                channelDropdownOpen || selectedChannels.length > 0
                  ? 'bg-[#C9A66B]/15 border-[#C9A66B]/60 text-[#E5C687]'
                  : 'bg-[#0F1422] border-white/10 text-white hover:border-[#C9A66B]/50'
              }`}
            >
              <span className="inline-flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
                <Share2 className="w-3.5 h-3.5 text-[#C9A66B] shrink-0" />
                <span className="truncate">
                  Channel{selectedChannels.length > 0 ? ` (${selectedChannels.length})` : ''}
                </span>
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                  channelDropdownOpen ? 'rotate-180 text-[#C9A66B]' : ''
                }`}
              />
            </button>

            {channelDropdownOpen && (
              <div className="absolute right-0 sm:left-0 sm:right-auto top-full mt-1.5 w-64 max-w-[calc(100vw-24px)] max-h-[65vh] overflow-y-auto z-50 rounded-xl bg-[#0E131F] border border-[#C9A66B]/40 shadow-2xl p-1.5 space-y-0.5">
                <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/[0.07] mb-1 sticky top-0 bg-[#0E131F]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A66B]">
                    Select Channels
                  </span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedChannels(ACTIVE_MARKETING_CHANNELS.map((c) => c.id))
                      }
                      className="text-slate-300 hover:text-white font-semibold cursor-pointer"
                    >
                      All
                    </button>
                    {selectedChannels.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedChannels([])}
                        className="text-[#C9A66B] hover:underline font-semibold cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {ACTIVE_MARKETING_CHANNELS.map((channel) => {
                  const isSelected = selectedChannels.includes(channel.id)
                  const isLive =
                    channel.category === 'website' ||
                    (connectedChannelIds as string[]).includes(channel.id)
                  return (
                    <button
                      key={channel.id}
                      type="button"
                      disabled={!permissions.canUploadAndDraft}
                      onClick={() => {
                        toggleChannel(channel.id)
                        if (activeAction !== 'post') setActiveAction('post')
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#C9A66B]/15 text-white font-semibold'
                          : 'text-slate-200 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] shrink-0 ${
                            isSelected
                              ? 'bg-[#C9A66B] border-[#C9A66B] text-slate-950 font-bold'
                              : 'border-slate-600 bg-slate-950'
                          }`}
                        >
                          {isSelected ? '✓' : ''}
                        </span>
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: channel.accentHex }}
                        />
                        <span className="truncate">{channel.label}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold shrink-0 ${
                          isLive ? 'text-emerald-400' : 'text-amber-400/70'
                        }`}
                      >
                        {isLive ? 'Live' : 'Link'}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Admin-only Agent filter (Access badge lives cleanly under Profile Avatar) */}
        {isAdminView && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0F1422] border border-white/10 text-xs">
            <span className="text-slate-400">Agent:</span>
            <select
              value={selectedMemberFilter}
              onChange={(e) => setSelectedMemberFilter(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0E131F] text-white">
                All ({posts.length})
              </option>
              {memberOptions.map((m) => (
                <option key={m.email} value={m.email} className="bg-[#0E131F] text-white">
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        )}
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

      {oauthBanner && (
        <div
          className={`rounded-2xl border p-4 flex items-start justify-between gap-3 text-xs ${
            oauthBanner.type === 'error'
              ? 'border-red-500/40 bg-red-500/10 text-red-200'
              : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                oauthBanner.type === 'error' ? 'text-red-400' : 'text-emerald-400'
              }`}
            />
            <p className="leading-relaxed font-medium">{oauthBanner.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setOauthBanner(null)}
            className="text-slate-300 hover:text-white font-bold px-2 cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* ACTIVE VIEW BODY */}
      {activeAction === 'post' && (
        <MarketingPostComposer
          organizationSlug={organizationSlug}
          permissions={permissions}
          posts={filteredPosts}
          loadingPosts={loadingPosts}
          selectedChannels={selectedChannels}
          onToggleChannel={toggleChannel}
          connectedChannels={connectedChannelIds}
          onOpenConnections={() => setActiveAction('connections')}
          onPostsChanged={fetchPostsAndContext}
        />
      )}

      {activeAction === 'inbox' && (
        <MarketingInboxView
          organizationSlug={organizationSlug}
          permissions={permissions}
          onOpenConnections={() => setActiveAction('connections')}
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
          isSuperAdminView={isAdminView}
          onRefresh={fetchConnections}
        />
      )}

      {activeAction === 'roles' && permissions.canManageRoles && (
        <div className="space-y-4 sm:space-y-6 w-full min-w-0">
          {/* Role Tiers Guide Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
            {(Object.keys(MARKETING_ROLE_TIERS) as MarketingRoleTier[]).map((tierKey) => {
              const info = MARKETING_ROLE_TIERS[tierKey]
              return (
                <div
                  key={tierKey}
                  className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-2 min-w-0"
                >
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${info.badgeClass}`}
                  >
                    {info.label}
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed break-words">
                    {info.description}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Assign / Update Team Role Form */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 sm:p-6 space-y-4 shadow-xl min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#C9A66B] shrink-0" /> Assign Marketing Role Tier
            </h3>
            <form
              onSubmit={handleSaveRole}
              className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs min-w-0"
            >
              <input
                type="email"
                required
                value={roleEmail}
                onChange={(e) => setRoleEmail(e.target.value)}
                placeholder="team.member@cillah.dev"
                className="w-full min-w-0 rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A66B]"
              />
              <input
                type="text"
                value={roleFullName}
                onChange={(e) => setRoleFullName(e.target.value)}
                placeholder="Full Name (optional)"
                className="w-full min-w-0 rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A66B]"
              />
              <select
                value={roleTier}
                onChange={(e) => setRoleTier(e.target.value as MarketingRoleTier)}
                className="w-full min-w-0 rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-white focus:outline-none focus:border-[#C9A66B]"
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
                className="w-full rounded-xl bg-[#C9A66B] hover:bg-[#d8b87d] text-slate-950 font-bold px-4 py-2.5 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
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

          {/* Configured Role Assignments (Mobile Cards + Desktop Table — Zero Horizontal Cutoff!) */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl min-w-0">
            <div className="p-4 border-b border-slate-800 text-sm font-bold text-white">
              Active Marketing Team Permissions ({roleAssignments.length})
            </div>

            {loadingRoles ? (
              <div className="py-10 flex items-center justify-center text-slate-400 text-xs gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#C9A66B]" /> Loading role assignments...
              </div>
            ) : roleAssignments.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500 px-4">
                No role records yet. Add a team member above.
              </div>
            ) : (
              <>
                {/* Mobile Stacked Cards (100% fits phone width, no cut-off) */}
                <div className="sm:hidden divide-y divide-slate-800/70">
                  {roleAssignments.map((item) => {
                    const tierInfo = getRolePermissions(item.marketing_role)
                    return (
                      <div key={item.id} className="p-4 space-y-2.5 min-w-0">
                        <div className="flex items-start justify-between gap-2 min-w-0">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-white truncate">
                              {item.full_name || item.user_email.split('@')[0]}
                            </p>
                            <p className="text-[11px] text-slate-400 break-all mt-0.5">
                              {item.user_email}
                            </p>
                          </div>
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${tierInfo.badgeClass}`}
                          >
                            {tierInfo.label}
                          </span>
                        </div>
                        <select
                          value={item.marketing_role}
                          onChange={(e) =>
                            handleQuickRoleUpdate(
                              item,
                              e.target.value as MarketingRoleTier
                            )
                          }
                          className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white cursor-pointer"
                        >
                          {(Object.keys(MARKETING_ROLE_TIERS) as MarketingRoleTier[]).map(
                            (k) => (
                              <option key={k} value={k} className="bg-slate-900">
                                {MARKETING_ROLE_TIERS[k].label}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    )
                  })}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
