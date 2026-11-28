'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import CRMPipelineBoard from '@/components/crm/crm-pipeline-board'
import MarketingHub from '@/components/marketing/marketing-hub'
import FinanceDepartmentHub from '@/components/finance/finance-department-hub'
import {
  parseAssignedWorkspaces,
  type UserWorkspaceRole,
} from '@/lib/auth-roles'
import {
  Sparkles,
  TrendingUp,
  Megaphone,
  DollarSign,
  LogOut,
  User,
  Home,
  ChevronDown,
  Check,
  ArrowRight,
  Building2,
} from 'lucide-react'

type ActiveView = 'home' | UserWorkspaceRole

const DEPARTMENT_META: Record<
  UserWorkspaceRole,
  {
    label: string
    headline: string
    subtitle: string
    icon: typeof TrendingUp
    accentClass: string
    glowClass: string
    borderClass: string
  }
> = {
  sales: {
    label: 'Sales',
    headline: 'Sales Pipeline',
    subtitle: 'Leads, follow-ups, deals & client nurturing',
    icon: TrendingUp,
    accentClass: 'text-emerald-400',
    glowClass: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    borderClass: 'hover:border-emerald-400/60',
  },
  marketing: {
    label: 'Marketing',
    headline: 'Marketing Hub',
    subtitle: 'Campaign posts, scheduling & analytics',
    icon: Megaphone,
    accentClass: 'text-[#C9A66B]',
    glowClass: 'from-[#C9A66B]/15 via-[#C9A66B]/5 to-transparent',
    borderClass: 'hover:border-[#C9A66B]/70',
  },
  finance: {
    label: 'Finance',
    headline: 'Finance & Billing',
    subtitle: 'Invoices, contracts, M-Pesa & Paystack settlements',
    icon: DollarSign,
    accentClass: 'text-sky-400',
    glowClass: 'from-sky-500/15 via-sky-500/5 to-transparent',
    borderClass: 'hover:border-sky-400/60',
  },
}

const WORKSPACE_CACHE_KEY = 'cillah_user_workspace_cache'

export default function UserDashboardPage() {
  const supabase = createClient()
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('')
  const [displayName, setDisplayName] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [organizationId, setOrganizationId] = useState<string>('a1b2c3d4-e5f6-7890-abcd-222222222222')
  const [organizationSlug, setOrganizationSlug] = useState<string>('cillah-dev')
  const [organizationName, setOrganizationName] = useState<string>('cillah.dev')
  const [assignedWorkspaces, setAssignedWorkspaces] = useState<UserWorkspaceRole[]>(['sales'])
  const [accessLabel, setAccessLabel] = useState<string>('User')
  const [activeView, setActiveView] = useState<ActiveView>('home')
  const [deptMenuOpen, setDeptMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const deptMenuRef = useRef<HTMLDivElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (deptMenuRef.current && !deptMenuRef.current.contains(e.target as Node)) {
        setDeptMenuOpen(false)
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  useEffect(() => {
    let active = true

    // 1. INSTANT 0ms HYDRATION from sessionStorage cache (no loading flash on login or navigation)
    try {
      const cachedRaw = sessionStorage.getItem(WORKSPACE_CACHE_KEY)
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw)
        if (cached?.email) {
          setCurrentUserEmail(cached.email)
          setDisplayName(cached.displayName || cached.email.split('@')[0])
          setAvatarUrl(cached.avatarUrl || null)
          if (cached.orgId) setOrganizationId(cached.orgId)
          if (cached.orgSlug) setOrganizationSlug(cached.orgSlug)
          if (cached.orgName) setOrganizationName(cached.orgName)
          if (cached.accessLabel) setAccessLabel(cached.accessLabel)
          const cachedRoles = parseAssignedWorkspaces(cached.staffRole)
          setAssignedWorkspaces(cachedRoles)
          const savedTab = sessionStorage.getItem('cillah_active_workspace_tab') as ActiveView | null
          if (savedTab && (savedTab === 'home' || cachedRoles.includes(savedTab))) {
            setActiveView(savedTab)
          }
          setLoading(false)
        }
      }
    } catch {}

    // 2. FAST LOCAL SESSION + PARALLEL BACKGROUND REVALIDATION
    async function loadUserWorkspace() {
      // Read local session first (0ms), fallback to getUser if needed
      const {
        data: { session },
      } = await supabase.auth.getSession()

      let user = session?.user ?? null
      if (!user) {
        const { data } = await supabase.auth.getUser()
        user = data.user
      }

      if (!user) {
        window.location.replace('/login')
        return
      }

      const email = (user.email || '').toLowerCase().trim()
      if (!active) return
      setCurrentUserEmail(email)

      const [{ data: profile }, { data: staff }] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, role, avatar_url')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('staff_members')
          .select('full_name, role, status, org_id')
          .ilike('email', email)
          .maybeSingle(),
      ])

      if (!active) return

      let resolvedOrgId = staff?.org_id || 'a1b2c3d4-e5f6-7890-abcd-222222222222'
      let resolvedOrgSlug = 'cillah-dev'
      let resolvedOrgName = 'cillah.dev'

      if (staff?.org_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('slug, name')
          .eq('id', staff.org_id)
          .maybeSingle()

        if (org?.slug) {
          resolvedOrgSlug = org.slug
          resolvedOrgName = org.name || org.slug
        }
      }

      if (!active) return

      const name =
        staff?.full_name ||
        profile?.full_name ||
        user.user_metadata?.full_name ||
        email.split('@')[0]
      const resolvedAvatar = profile?.avatar_url || user.user_metadata?.avatar_url || null
      const workspaces = parseAssignedWorkspaces(staff?.role)
      const resolvedAccess =
        String(profile?.role || '').toLowerCase() === 'admin' ||
        String(staff?.status || '').toLowerCase() === 'admin'
          ? 'Admin'
          : 'User'

      setDisplayName(name)
      setAvatarUrl(resolvedAvatar)
      setAccessLabel(resolvedAccess)
      setOrganizationId(resolvedOrgId)
      setOrganizationSlug(resolvedOrgSlug)
      setOrganizationName(resolvedOrgName)
      setAssignedWorkspaces(workspaces)

      // Persist fresh cache for 0ms repeat loads
      try {
        sessionStorage.setItem(
          WORKSPACE_CACHE_KEY,
          JSON.stringify({
            email,
            displayName: name,
            avatarUrl: resolvedAvatar,
            accessLabel: resolvedAccess,
            staffRole: staff?.role || 'sales',
            orgId: resolvedOrgId,
            orgSlug: resolvedOrgSlug,
            orgName: resolvedOrgName,
            cachedAt: Date.now(),
          })
        )
      } catch {}

      const urlParams =
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      const returningFromMarketingOAuth = Boolean(urlParams?.get('marketing_tab'))

      if (returningFromMarketingOAuth && workspaces.includes('marketing')) {
        setActiveView('marketing')
      } else {
        const savedTab =
          typeof window !== 'undefined'
            ? (sessionStorage.getItem('cillah_active_workspace_tab') as ActiveView | null)
            : null
        if (savedTab && savedTab !== 'home' && workspaces.includes(savedTab)) {
          setActiveView(savedTab)
        } else {
          setActiveView('home')
        }
      }

      setLoading(false)

      // 3. BACKGROUND PRE-WARM: Fetch user's sales leads while they're on Home so tapping Sales opens in 0ms!
      if (workspaces.includes('sales')) {
        supabase
          .from('sales_leads')
          .select('*')
          .eq('assigned_agent_email', email)
          .order('created_at', { ascending: false })
          .then(({ data: prewarmLeads }) => {
            if (prewarmLeads) {
              try {
                sessionStorage.setItem(
                  `cillah_crm_leads_cache:${email}`,
                  JSON.stringify({ leads: prewarmLeads, cachedAt: Date.now() })
                )
              } catch {}
            }
          })
      }
    }

    loadUserWorkspace()
    return () => {
      active = false
    }
  }, [supabase])

  const selectView = (view: ActiveView) => {
    setActiveView(view)
    setDeptMenuOpen(false)
    setProfileMenuOpen(false)
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('cillah_active_workspace_tab', view)
      } catch {}
    }
  }

  const handleLogout = async () => {
    setProfileMenuOpen(false)
    try {
      sessionStorage.removeItem(WORKSPACE_CACHE_KEY)
      sessionStorage.removeItem('cillah_active_workspace_tab')
      await Promise.race([
        supabase.auth.signOut({ scope: 'local' }),
        new Promise((resolve) => setTimeout(resolve, 900)),
      ])
    } catch {
      // Proceed even if network signOut fails
    } finally {
      window.location.replace('/')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090B12] text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-[#C9A66B] text-sm font-medium">
          <Sparkles className="w-5 h-5 animate-spin" />
          <span>Opening workspace...</span>
        </div>
      </div>
    )
  }

  const activeDeptMeta = activeView !== 'home' ? DEPARTMENT_META[activeView] : null
  const ActiveDeptIcon = activeDeptMeta?.icon

  return (
    <div className="min-h-screen bg-[#090B12] text-slate-100 flex flex-col selection:bg-[#C9A66B]/30">
      {/* ULTRA-MINIMAL LUXURY TOP BAR (NO LOGO — PROFILE AVATAR FAR RIGHT) */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#090B12]/90 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-3.5 sm:px-6 h-14 flex items-center justify-between gap-3">
          {/* Left: Clean Org / Workspace Switcher (No Logo Image) */}
          <div className="flex items-center gap-2.5 min-w-0">
            {activeView === 'home' ? (
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-[#C9A66B]/30 text-[11px] font-bold text-[#E5C687] truncate">
                  <Building2 className="w-3 h-3 shrink-0" />
                  <span className="truncate">{organizationName}</span>
                </span>
              </div>
            ) : (
              <div className="relative" ref={deptMenuRef}>
                <button
                  type="button"
                  onClick={() => setDeptMenuOpen((o) => !o)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 hover:border-[#C9A66B]/50 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  {ActiveDeptIcon && (
                    <ActiveDeptIcon className={`w-3.5 h-3.5 ${activeDeptMeta?.accentClass}`} />
                  )}
                  <span>{activeDeptMeta?.label}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#C9A66B] transition-transform ${
                      deptMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {deptMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40 bg-black/40 sm:hidden"
                      onClick={() => setDeptMenuOpen(false)}
                    />
                    <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:left-0 sm:top-11 sm:w-64 rounded-2xl bg-[#0E131F] border border-[#C9A66B]/35 shadow-2xl overflow-hidden divide-y divide-white/[0.06] z-50">
                      <div className="px-3.5 py-2.5 bg-white/[0.02] flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A66B]">
                          {organizationName}
                        </span>
                        <button
                          type="button"
                          onClick={() => selectView('home')}
                          className="text-[11px] font-semibold text-slate-300 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Home className="w-3 h-3" /> All Roles
                        </button>
                      </div>
                      <div className="p-1.5 space-y-1">
                        {assignedWorkspaces.map((dept) => {
                          const meta = DEPARTMENT_META[dept]
                          const Icon = meta.icon
                          const isSelected = dept === activeView
                          return (
                            <button
                              key={dept}
                              type="button"
                              onClick={() => selectView(dept)}
                              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#C9A66B]/15 border border-[#C9A66B]/40'
                                  : 'hover:bg-white/[0.05] border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Icon className={`w-4 h-4 ${meta.accentClass} shrink-0`} />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-white">{meta.label}</p>
                                  <p className="text-[10px] text-slate-400 truncate">
                                    {meta.subtitle}
                                  </p>
                                </div>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-[#C9A66B] shrink-0" />}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Far Right: Profile Image / Icon Avatar with Dropdown (Home, Profile, Logout) */}
          <div className="relative shrink-0" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setProfileMenuOpen((p) => !p)}
              aria-label="Open profile menu"
              className="flex items-center gap-2 p-0.5 pr-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-[#C9A66B]/40 hover:border-[#C9A66B] transition-all cursor-pointer shadow-sm"
            >
              <div className="h-9 w-9 rounded-full overflow-hidden bg-gradient-to-br from-[#1B1F2E] to-[#0E131F] flex items-center justify-center border border-[#C9A66B]/30 shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName || 'Profile'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-[#C9A66B]" />
                )}
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  profileMenuOpen ? 'rotate-180 text-[#C9A66B]' : ''
                }`}
              />
            </button>

            {profileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/35 sm:hidden"
                  onClick={() => setProfileMenuOpen(false)}
                />
                <div className="absolute right-0 top-12 w-56 rounded-2xl bg-[#0E131F] border border-white/10 shadow-2xl overflow-hidden divide-y divide-white/[0.06] z-50">
                  <div className="px-4 py-3 bg-white/[0.02]">
                    <p className="text-xs font-bold text-white truncate">
                      {displayName || 'Team Member'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {currentUserEmail}
                    </p>
                    <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full bg-[#C9A66B]/15 border border-[#C9A66B]/35 text-[10px] font-bold text-[#E5C687]">
                      Access: {accessLabel}
                    </span>
                  </div>

                  <div className="p-1.5 space-y-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => selectView('home')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                        activeView === 'home'
                          ? 'bg-[#C9A66B]/15 text-[#E5C687]'
                          : 'text-slate-200 hover:bg-white/[0.05]'
                      }`}
                    >
                      <Home className="w-4 h-4 text-[#C9A66B]" />
                      <span>Home</span>
                    </button>

                    <Link
                      href="/user/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold text-slate-200 hover:bg-white/[0.05] transition-colors"
                    >
                      <User className="w-4 h-4 text-sky-400" />
                      <span>Profile</span>
                    </Link>
                  </div>

                  <div className="p-1.5 text-xs">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* BODY: TEAM HOME ROLE SELECTOR OR ACTIVE PIPELINE */}
      <main className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
        {activeView === 'home' && (
          <div className="flex-1 flex items-center justify-center px-4 py-10 sm:py-16 relative overflow-hidden">
            {/* Subtle warm champagne glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full bg-[#C9A66B]/[0.07] blur-[110px] pointer-events-none" />

            <div className="w-full max-w-2xl mx-auto text-center space-y-8 relative z-10">
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C9A66B]">
                  {organizationName}
                </p>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  Welcome, {displayName || currentUserEmail.split('@')[0]}
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Choose a workspace to enter
                </p>
              </div>

              {/* BOLD ASSIGNED ROLES IN THE MIDDLE */}
              <div
                className={`grid gap-3.5 sm:gap-4 ${
                  assignedWorkspaces.length === 1
                    ? 'grid-cols-1 max-w-sm mx-auto'
                    : assignedWorkspaces.length === 2
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : 'grid-cols-1 sm:grid-cols-3'
                }`}
              >
                {assignedWorkspaces.map((dept) => {
                  const meta = DEPARTMENT_META[dept]
                  const Icon = meta.icon
                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => selectView(dept)}
                      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-b ${meta.glowClass} bg-[#0F1422] border border-white/10 ${meta.borderClass} p-6 sm:p-7 text-left transition-all duration-150 active:scale-[0.98] hover:-translate-y-0.5 shadow-xl cursor-pointer`}
                    >
                      <div className="flex items-center justify-between mb-5">
                        <div className="h-11 w-11 rounded-xl bg-[#090B12]/90 border border-white/10 flex items-center justify-center shadow-inner">
                          <Icon className={`w-5 h-5 ${meta.accentClass}`} />
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-[#C9A66B] group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {meta.label}
                      </h2>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        {meta.subtitle}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {activeView === 'sales' && (
          <CRMPipelineBoard
            currentUserEmail={currentUserEmail}
            isStaffAdmin={false}
            forceUserOnly={true}
            orgId={organizationId}
            currencyPrefix="KES "
          />
        )}

        {activeView === 'marketing' && (
          <MarketingHub
            organizationSlug={organizationSlug}
            organizationName={organizationName}
            currentUserEmail={currentUserEmail}
            isAdminView={false}
            onRoleLabelResolved={(label) => setAccessLabel(label)}
          />
        )}

        {activeView === 'finance' && (
          <FinanceDepartmentHub
            orgSlug={organizationSlug}
            orgName={organizationName}
            isDemoOrg={organizationSlug === 'rosy-realtors'}
            showManageUsersLink={false}
          />
        )}
      </main>
    </div>
  )
}
