'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import CRMPipelineBoard from '@/components/crm/crm-pipeline-board'
import MarketingHub from '@/components/marketing/marketing-hub'
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
  ChevronDown,
  Check,
  Building2,
  Receipt,
  Wallet,
  FileSpreadsheet,
} from 'lucide-react'

const DEPARTMENT_META: Record<
  UserWorkspaceRole,
  {
    label: string
    subtitle: string
    icon: typeof TrendingUp
    accentClass: string
  }
> = {
  sales: {
    label: 'Sales',
    subtitle: 'CRM Pipeline, Leads & Follow-Ups',
    icon: TrendingUp,
    accentClass: 'text-emerald-400',
  },
  marketing: {
    label: 'Marketing',
    subtitle: 'Multi-Channel Posts, Scheduling & Insights',
    icon: Megaphone,
    accentClass: 'text-[#C9A66B]',
  },
  finance: {
    label: 'Finance',
    subtitle: 'M-Pesa Reconciliations, Retainers & Billing',
    icon: DollarSign,
    accentClass: 'text-sky-400',
  },
}

export default function UserDashboardPage() {
  const supabase = createClient()
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('')
  const [displayName, setDisplayName] = useState<string>('')
  const [assignedWorkspaces, setAssignedWorkspaces] = useState<UserWorkspaceRole[]>([
    'sales',
    'marketing',
    'finance',
  ])
  const [activeWorkspace, setActiveWorkspace] = useState<UserWorkspaceRole>('marketing')
  const [deptMenuOpen, setDeptMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const deptMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (deptMenuRef.current && !deptMenuRef.current.contains(e.target as Node)) {
        setDeptMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  useEffect(() => {
    async function loadUserWorkspace() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login'
        return
      }

      const email = (user.email || '').toLowerCase().trim()
      setCurrentUserEmail(email)

      const [{ data: profile }, { data: staff }] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('staff_members')
          .select('full_name, role, status')
          .ilike('email', email)
          .maybeSingle(),
      ])

      const name =
        staff?.full_name ||
        profile?.full_name ||
        user.user_metadata?.full_name ||
        email.split('@')[0]
      setDisplayName(name)

      const workspaces = parseAssignedWorkspaces(staff?.role)
      setAssignedWorkspaces(workspaces)

      const urlParams =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search)
          : null
      const returningFromMarketingOAuth = Boolean(urlParams?.get('marketing_tab'))

      // Restore last chosen department if still allowed, otherwise pick first assigned
      const savedDept =
        typeof window !== 'undefined'
          ? (localStorage.getItem('cillah_active_department') as UserWorkspaceRole | null)
          : null

      if (returningFromMarketingOAuth && workspaces.includes('marketing')) {
        setActiveWorkspace('marketing')
      } else if (savedDept && workspaces.includes(savedDept)) {
        setActiveWorkspace(savedDept)
      } else {
        setActiveWorkspace(workspaces[0] || 'sales')
      }
      setLoading(false)
    }

    loadUserWorkspace()
  }, [supabase])

  const selectDepartment = (dept: UserWorkspaceRole) => {
    setActiveWorkspace(dept)
    setDeptMenuOpen(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('cillah_active_department', dept)
    }
  }

  const handleLogout = async () => {
    try {
      await Promise.race([
        supabase.auth.signOut({ scope: 'local' }),
        new Promise((resolve) => setTimeout(resolve, 1200)),
      ])
    } catch {
      // Proceed even if network signOut fails
    } finally {
      window.location.replace('/login')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E131F] text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#C9A66B] font-medium">
          <Sparkles className="w-6 h-6 animate-spin" /> Loading Your Cillah Workspace...
        </div>
      </div>
    )
  }

  const activeMeta = DEPARTMENT_META[activeWorkspace]
  const ActiveIcon = activeMeta.icon

  return (
    <div className="min-h-screen bg-[#0E131F] text-slate-100 flex flex-col">
      {/* Dedicated Organization Workspace Header with Form-Style Department Selector */}
      <header className="sticky top-0 z-40 border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand + Organization + User Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-full overflow-hidden border border-[#C9A66B]/40 shrink-0">
              <img
                src="/images/cillah-emblem.png"
                alt="Cillah Logo"
                className="object-cover h-full w-full"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-white leading-tight truncate">
                  {displayName || 'Workspace'}
                </p>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-bold text-cyan-300">
                  <Building2 className="w-2.5 h-2.5" /> Cillah Org
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight truncate">
                {currentUserEmail}
              </p>
            </div>
          </div>

          {/* Interactive Department Selector (Form-Style Dropdown on Mobile + Pills + Dropdown on Desktop) */}
          <div className="flex items-center gap-2">
            <div className="relative" ref={deptMenuRef}>
              <button
                type="button"
                onClick={() => setDeptMenuOpen((o) => !o)}
                className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-[#C9A66B]/45 hover:border-[#C9A66B] text-xs font-bold text-white transition-all shadow-sm cursor-pointer"
              >
                <span className="text-[10px] uppercase tracking-wider text-slate-400 hidden sm:inline">
                  Department:
                </span>
                <ActiveIcon className={`w-3.5 h-3.5 ${activeMeta.accentClass}`} />
                <span>{activeMeta.label}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#C9A66B] transition-transform ${
                    deptMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {deptMenuOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-0 top-12 w-72 rounded-2xl bg-slate-950 border border-[#C9A66B]/35 shadow-2xl overflow-hidden divide-y divide-slate-800/80 z-50">
                  <div className="px-4 py-2.5 bg-slate-900/70">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#C9A66B]">
                      Select Department — Cillah
                    </p>
                  </div>
                  <div className="p-1.5 space-y-1">
                    {assignedWorkspaces.map((dept) => {
                      const meta = DEPARTMENT_META[dept]
                      const Icon = meta.icon
                      const isSelected = dept === activeWorkspace
                      return (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => selectDepartment(dept)}
                          className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#C9A66B]/15 border border-[#C9A66B]/40'
                              : 'hover:bg-slate-900 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                              <Icon className={`w-4 h-4 ${meta.accentClass}`} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white">{meta.label}</p>
                              <p className="text-[10px] text-slate-400 truncate">{meta.subtitle}</p>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#C9A66B] shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Quick-Switch Department Pills */}
            <div className="hidden xl:flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
              {assignedWorkspaces.map((dept) => {
                const meta = DEPARTMENT_META[dept]
                const Icon = meta.icon
                const isSelected = activeWorkspace === dept
                return (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => selectDepartment(dept)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#C9A66B] text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{meta.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Profile & Logout */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/user/profile"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-[#C9A66B]" />
              <span className="hidden sm:inline">Profile</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-300 hover:bg-red-500/20 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Active Department Body */}
      <main className="flex-1">
        {activeWorkspace === 'sales' && (
          <CRMPipelineBoard
            currentUserEmail={currentUserEmail}
            isStaffAdmin={false}
            forceUserOnly={true}
          />
        )}

        {activeWorkspace === 'marketing' && (
          <MarketingHub
            organizationSlug="cillah-dev"
            organizationName="Cillah"
            currentUserEmail={currentUserEmail}
            isAdminView={false}
          />
        )}

        {activeWorkspace === 'finance' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <DollarSign className="w-6 h-6 text-sky-400" />
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Finance Department
                  </h1>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  Cillah Organization &bull; Next Department Build Phase
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-semibold uppercase tracking-wider self-start sm:self-auto">
                Up Next
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-white">M-Pesa &amp; Bank Reconciliation</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automatic matching of Safaricom Daraja STK callbacks, consultation fees, and monthly retainer payments.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#C9A66B]/15 border border-[#C9A66B]/30 text-[#C9A66B] flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-white">Client Invoices &amp; Retainers</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Generate branded KES/USD invoices, track due dates, and send automated WhatsApp &amp; email payment reminders.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-white">Cashflow &amp; Expense Ledger</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Department budgets, ad-spend ROI from Marketing, and export-ready monthly financial reports.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/60 border border-[#C9A66B]/25 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#C9A66B]">
                  Finance Workspace is queued for our next build step
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Use the Department selector above anytime to switch between Sales, Marketing, and Finance.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => selectDepartment('marketing')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C9A66B] text-slate-950 font-bold text-xs hover:bg-[#d6b67d] transition-colors cursor-pointer"
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>Open Marketing</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectDepartment('sales')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Open Sales</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
