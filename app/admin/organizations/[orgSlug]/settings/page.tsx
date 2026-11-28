'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ONBOARDING_DEPARTMENTS,
  calculateOnboardingPrice,
  formatKes,
  type BillingCycle,
  type OnboardingDepartmentId,
} from '@/lib/onboarding-plans'
import { toast } from 'sonner'
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Globe,
  Loader2,
  Megaphone,
  Save,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  TrendingUp,
} from 'lucide-react'

interface OrgSettingsData {
  organization: {
    id: string
    name: string
    slug: string
    website: string | null
    created_at: string
  }
  isSuperAdmin: boolean
  isProtectedPrimaryOrg: boolean
  activeDepartments: OnboardingDepartmentId[]
  subscription: {
    id: string
    departments: string[]
    billing_cycle: BillingCycle
    amount_kes: number
    status: string
    payment_provider: string
    payment_receipt: string | null
    paid_at: string | null
    current_period_end: string | null
  } | null
  stats: {
    teamMembers: number
    connectedSocials: number
    marketingPosts: number
    inboxThreads: number
  }
}

const DEPT_ICON_MAP = {
  sales: { icon: TrendingUp, accent: 'text-emerald-400' },
  marketing: { icon: Megaphone, accent: 'text-[#C9A66B]' },
  finance: { icon: DollarSign, accent: 'text-sky-400' },
}

function OrganizationSettingsInner() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const orgSlug = String(params?.orgSlug || '').toLowerCase()

  const [data, setData] = useState<OrgSettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // Profile form state
  const [orgName, setOrgName] = useState('')
  const [orgWebsite, setOrgWebsite] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // Upgrade department checkout state
  const [upgradeSelection, setUpgradeSelection] = useState<OnboardingDepartmentId[]>([])
  const [upgradeCycle, setUpgradeCycle] = useState<BillingCycle>('monthly')
  const [upgradePayMethod, setUpgradePayMethod] = useState<'mpesa' | 'paystack'>('mpesa')
  const [mpesaPhone, setMpesaPhone] = useState('')
  const [checkingOut, setCheckingOut] = useState(false)
  const [pendingMpesaSubId, setPendingMpesaSubId] = useState<string | null>(null)
  const [verifyingPaystack, setVerifyingPaystack] = useState(false)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Danger Zone delete confirmation state
  const [confirmDeleteText, setConfirmDeleteText] = useState('')
  const [deletingOrg, setDeletingOrg] = useState(false)

  const loadSettings = useCallback(async () => {
    if (!orgSlug) return
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch(
        `/api/admin/organization-settings?org=${encodeURIComponent(orgSlug)}`,
        { cache: 'no-store' }
      )
      const json = await res.json()
      if (!res.ok) {
        setErrorMsg(json.error || 'Could not load organization settings.')
        return
      }
      setData(json)
      setOrgName(json.organization?.name || '')
      setOrgWebsite(json.organization?.website || '')
    } catch {
      setErrorMsg('Network error loading organization settings.')
    } finally {
      setLoading(false)
    }
  }, [orgSlug])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Verify Paystack upgrade return (?paystack_ref=...&subId=...)
  useEffect(() => {
    const ref = searchParams.get('paystack_ref') || searchParams.get('reference') || ''
    const subId = searchParams.get('subId') || ''
    if (!ref) return

    let active = true
    setVerifyingPaystack(true)
    fetch(
      `/api/onboarding/paystack-verify?reference=${encodeURIComponent(
        ref
      )}&subId=${encodeURIComponent(subId)}`
    )
      .then((r) => r.json())
      .then((json) => {
        if (!active) return
        if (json?.status === 'active') {
          toast.success('Department upgrade verified and unlocked!')
          setUpgradeSelection([])
          loadSettings()
          router.replace(`/admin/organizations/${encodeURIComponent(orgSlug)}/settings`)
        } else {
          toast.error(json?.error || json?.resultDesc || 'Upgrade payment was not completed.')
        }
      })
      .catch(() => {
        if (active) toast.error('Could not verify upgrade payment.')
      })
      .finally(() => {
        if (active) setVerifyingPaystack(false)
      })

    return () => {
      active = false
    }
  }, [searchParams, orgSlug, router, loadSettings])

  // Poll M-Pesa upgrade confirmation
  useEffect(() => {
    if (!pendingMpesaSubId) return
    let attempts = 0

    const poll = async () => {
      attempts += 1
      try {
        const res = await fetch(
          `/api/onboarding/status?subId=${encodeURIComponent(pendingMpesaSubId)}`,
          { cache: 'no-store' }
        )
        const json = await res.json()
        if (json?.status === 'active') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current)
          pollTimerRef.current = null
          setPendingMpesaSubId(null)
          setUpgradeSelection([])
          toast.success('M-Pesa payment confirmed! New department unlocked.')
          loadSettings()
          return
        }
        if (json?.status === 'cancelled' || json?.status === 'failed') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current)
          pollTimerRef.current = null
          setPendingMpesaSubId(null)
          toast.error(json?.resultDesc || 'M-Pesa payment was cancelled or failed.')
          return
        }
        if (attempts >= 45) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current)
          pollTimerRef.current = null
          setPendingMpesaSubId(null)
          toast.error('M-Pesa confirmation timed out. Refresh if you already entered your PIN.')
        }
      } catch {
        // Keep polling
      }
    }

    pollTimerRef.current = setInterval(poll, 3000)
    poll()

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }
  }, [pendingMpesaSubId, loadSettings])

  const missingDepartments = useMemo(() => {
    const active = data?.activeDepartments || []
    return ONBOARDING_DEPARTMENTS.filter((d) => !active.includes(d.id))
  }, [data?.activeDepartments])

  const upgradePricing = useMemo(
    () => calculateOnboardingPrice(upgradeSelection, upgradeCycle),
    [upgradeSelection, upgradeCycle]
  )

  const toggleUpgradeDept = (id: OnboardingDepartmentId) => {
    setUpgradeSelection((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgName.trim() || orgName.trim().length < 2) {
      toast.error('Organization name must be at least 2 characters.')
      return
    }
    setSavingProfile(true)
    try {
      const res = await fetch('/api/admin/organization-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgSlug,
          name: orgName.trim(),
          website: orgWebsite.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Could not update organization profile.')
        return
      }
      toast.success('Organization profile saved!')
      loadSettings()
    } catch {
      toast.error('Network error updating profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleUpgradeMpesa = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!data || upgradeSelection.length === 0) return
    if (!mpesaPhone.trim()) {
      toast.error('Enter a Safaricom M-Pesa phone number.')
      return
    }
    setCheckingOut(true)
    try {
      const res = await fetch('/api/onboarding/mpesa-stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: data.organization.name,
          website: data.organization.website || '',
          upgradeOrganizationId: data.organization.id,
          upgradeOrganizationSlug: data.organization.slug,
          mpesaPhone: mpesaPhone.trim(),
          departments: upgradeSelection,
          billingCycle: upgradeCycle,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Could not send M-Pesa STK Push')
      }
      setPendingMpesaSubId(json.subscriptionId)
      toast.success('M-Pesa PIN prompt sent! Enter your PIN on your phone.')
    } catch (err: any) {
      toast.error(err?.message || 'M-Pesa upgrade failed')
    } finally {
      setCheckingOut(false)
    }
  }

  const handleUpgradePaystack = async () => {
    if (!data || upgradeSelection.length === 0) return
    setCheckingOut(true)
    try {
      const res = await fetch('/api/onboarding/paystack-initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: data.organization.name,
          website: data.organization.website || '',
          upgradeOrganizationId: data.organization.id,
          upgradeOrganizationSlug: data.organization.slug,
          returnPath: `/admin/organizations/${encodeURIComponent(data.organization.slug)}/settings`,
          departments: upgradeSelection,
          billingCycle: upgradeCycle,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.authorizationUrl) {
        throw new Error(json.error || 'Could not start Paystack checkout')
      }
      window.location.href = json.authorizationUrl
    } catch (err: any) {
      toast.error(err?.message || 'Paystack upgrade failed')
      setCheckingOut(false)
    }
  }

  const handleDeleteOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!data) return
    if (confirmDeleteText.trim().toLowerCase() !== data.organization.name.trim().toLowerCase()) {
      toast.error(`Please type "${data.organization.name}" exactly to confirm deletion.`)
      return
    }

    setDeletingOrg(true)
    try {
      const res = await fetch('/api/admin/organization-settings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgSlug: data.organization.slug,
          confirmName: confirmDeleteText.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Could not delete organization.')
        setDeletingOrg(false)
        return
      }

      toast.success(json.message || 'Organization and all associated data permanently wiped.')

      if (json.shouldSignOut) {
        await supabase.auth.signOut({ scope: 'local' })
        window.location.replace('/')
      } else {
        window.location.replace('/admin')
      }
    } catch {
      toast.error('Network error while deleting organization.')
      setDeletingOrg(false)
    }
  }

  if (loading || verifyingPaystack) {
    return (
      <div className="flex-1 flex items-center justify-center py-24 text-[#C9A66B] text-xs gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>
          {verifyingPaystack
            ? 'Verifying department upgrade payment...'
            : 'Loading organization settings...'}
        </span>
      </div>
    )
  }

  if (errorMsg || !data) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
        <p className="text-sm font-bold text-white">{errorMsg || 'Settings unavailable'}</p>
        <Link
          href={`/admin?org=${encodeURIComponent(orgSlug)}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E5C687] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Workspace
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C9A66B]">
            Organization Admin Settings
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {data.organization.name}
          </h1>
          <p className="text-xs text-slate-400">
            Manage your workspace profile, active departments, billing, and data privacy controls.
          </p>
        </div>

        <Link
          href={`/admin?org=${encodeURIComponent(data.organization.slug)}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0F1422] hover:bg-white/[0.08] border border-white/10 text-xs font-bold text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#C9A66B]" />
          <span>Back to Departments</span>
        </Link>
      </div>

      {/* Live Workspace Data Snapshot */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active Departments', value: data.activeDepartments.length },
          { label: 'Team Members', value: data.stats.teamMembers },
          { label: 'Connected Socials', value: data.stats.connectedSocials },
          { label: 'Posts & Chats', value: data.stats.marketingPosts + data.stats.inboxThreads },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl bg-[#0F1422] border border-white/10 p-4 space-y-1"
          >
            <p className="text-[11px] text-slate-400">{stat.label}</p>
            <p className="text-2xl font-black text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* 1. Organization Profile */}
      <form
        onSubmit={handleSaveProfile}
        className="rounded-3xl bg-[#0F1422] border border-white/10 p-5 sm:p-6 space-y-4"
      >
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C9A66B]">
          <Building2 className="w-4 h-4" />
          <span>Organization Profile</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-semibold block">Organization Name</label>
            <input
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl bg-[#090B12] border border-white/10 text-xs text-white focus:outline-none focus:border-[#C9A66B]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-semibold block">Website URL</label>
            <div className="relative">
              <Globe className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={orgWebsite}
                onChange={(e) => setOrgWebsite(e.target.value)}
                placeholder="https://yourcompany.com"
                className="w-full h-10 pl-8 pr-3.5 rounded-xl bg-[#090B12] border border-white/10 text-xs text-white focus:outline-none focus:border-[#C9A66B]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingProfile}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C9A66B] hover:bg-[#d8b87d] text-[#090B12] font-black text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {savingProfile ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save Changes</span>
          </button>
        </div>
      </form>

      {/* 2. Active Plan & Upgrade Departments */}
      <div className="rounded-3xl bg-[#0F1422] border border-[#C9A66B]/30 p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C9A66B]">
            <ShieldCheck className="w-4 h-4" />
            <span>Active Plan &amp; Departments</span>
          </div>
          {data.subscription?.current_period_end && (
            <span className="text-[11px] text-slate-400">
              Active until{' '}
              <strong className="text-white">
                {new Date(data.subscription.current_period_end).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </strong>
            </span>
          )}
        </div>

        {/* Unlocked Departments */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ONBOARDING_DEPARTMENTS.map((dept) => {
            const unlocked = data.activeDepartments.includes(dept.id)
            const selectedToAdd = upgradeSelection.includes(dept.id)
            const iconMeta = DEPT_ICON_MAP[dept.id]
            const Icon = iconMeta.icon
            return (
              <div
                key={dept.id}
                onClick={() => {
                  if (!unlocked) toggleUpgradeDept(dept.id)
                }}
                className={`rounded-2xl p-4 border transition-all flex flex-col justify-between gap-3 ${
                  unlocked
                    ? 'bg-emerald-500/[0.06] border-emerald-500/35'
                    : selectedToAdd
                    ? 'bg-[#C9A66B]/12 border-[#C9A66B] cursor-pointer'
                    : 'bg-[#090B12] border-white/10 hover:border-white/25 cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${iconMeta.accent}`} />
                    <span className="text-xs font-black text-white">{dept.name}</span>
                  </div>
                  {unlocked ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span
                      className={`h-5 w-5 rounded-full flex items-center justify-center border ${
                        selectedToAdd
                          ? 'bg-[#C9A66B] border-[#C9A66B] text-[#090B12]'
                          : 'border-white/25'
                      }`}
                    >
                      {selectedToAdd && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">{dept.tagline}</p>

                {!unlocked && (
                  <p className="text-xs font-bold text-[#E5C687]">
                    + {formatKes(dept.monthlyKes)} / mo
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* Upgrade Checkout Panel (only shown when org doesn't have all 3 yet and selected one to add) */}
        {missingDepartments.length > 0 && upgradeSelection.length > 0 && (
          <div className="rounded-2xl bg-[#090B12] border border-[#C9A66B]/40 p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C9A66B]" />
                  Add {upgradeSelection.map((d) => d.toUpperCase()).join(' + ')} to{' '}
                  {data.organization.name}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Total due now:{' '}
                  <strong className="text-[#E5C687]">{formatKes(upgradePricing.totalKes)}</strong> (
                  {upgradeCycle})
                </p>
              </div>

              <div className="flex items-center gap-1 bg-[#0F1422] p-1 rounded-xl border border-white/10 text-[11px]">
                {(['monthly', 'annual'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setUpgradeCycle(c)}
                    className={`px-2.5 py-1 rounded-lg font-bold capitalize cursor-pointer ${
                      upgradeCycle === c
                        ? 'bg-[#C9A66B] text-[#090B12]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {c === 'annual' ? 'Annual (2 mo free)' : 'Monthly'}
                  </button>
                ))}
              </div>
            </div>

            {/* Method Toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={Boolean(pendingMpesaSubId)}
                onClick={() => setUpgradePayMethod('mpesa')}
                className={`h-10 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                  upgradePayMethod === 'mpesa'
                    ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300'
                    : 'bg-[#0F1422] border-white/10 text-slate-400'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> M-Pesa Express
              </button>
              <button
                type="button"
                disabled={Boolean(pendingMpesaSubId)}
                onClick={() => setUpgradePayMethod('paystack')}
                className={`h-10 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                  upgradePayMethod === 'paystack'
                    ? 'bg-[#C9A66B]/15 border-[#C9A66B] text-[#E5C687]'
                    : 'bg-[#0F1422] border-white/10 text-slate-400'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" /> Card / Paystack
              </button>
            </div>

            {upgradePayMethod === 'mpesa' ? (
              pendingMpesaSubId ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/35 text-center space-y-2">
                  <Loader2 className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-white">
                    Waiting for M-Pesa PIN on your phone...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleUpgradeMpesa} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                    placeholder="Safaricom number (e.g. 0712345678)"
                    className="flex-1 h-10 px-3.5 rounded-xl bg-[#0F1422] border border-white/15 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="submit"
                    disabled={checkingOut}
                    className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#090B12] font-black text-xs cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {checkingOut
                      ? 'Sending PIN Prompt...'
                      : `Pay ${formatKes(upgradePricing.totalKes)} via M-Pesa`}
                  </button>
                </form>
              )
            ) : (
              <button
                type="button"
                disabled={checkingOut}
                onClick={handleUpgradePaystack}
                className="w-full h-10 rounded-xl bg-gradient-to-r from-[#C9A66B] to-[#E5C687] text-[#090B12] font-black text-xs cursor-pointer disabled:opacity-50"
              >
                {checkingOut
                  ? 'Opening Paystack...'
                  : `Pay ${formatKes(upgradePricing.totalKes)} with Paystack`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Danger Zone: Permanent Delete & Data Wipe */}
      <div className="rounded-3xl bg-rose-950/20 border border-rose-500/35 p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/35 shrink-0">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm sm:text-base font-black text-rose-200">
              Delete Organization &amp; Permanently Wipe All Data
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Deleting <strong className="text-white">{data.organization.name}</strong> permanently
              removes your organization profile, disconnects and erases all encrypted social media
              tokens (YouTube, TikTok, Instagram, Facebook, LinkedIn, WhatsApp), deletes all
              marketing posts, unified inbox chats, analytics snapshots, leads, invoices, and team
              access. <strong>We retain zero copy of your organization data after deletion.</strong>
            </p>
          </div>
        </div>

        {data.isProtectedPrimaryOrg ? (
          <div className="rounded-xl bg-[#090B12]/80 border border-white/10 p-3.5 text-xs text-slate-400">
            <strong className="text-slate-200">Protected Primary Organization:</strong>{' '}
            <code>cillah.dev</code> is the root platform organization and cannot be self-deleted.
          </div>
        ) : (
          <form onSubmit={handleDeleteOrganization} className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs text-rose-200 font-semibold block">
                Type <span className="font-mono text-white">{data.organization.name}</span> to
                confirm permanent deletion:
              </label>
              <input
                type="text"
                required
                value={confirmDeleteText}
                onChange={(e) => setConfirmDeleteText(e.target.value)}
                placeholder={data.organization.name}
                className="w-full h-10 px-3.5 rounded-xl bg-[#090B12] border border-rose-500/40 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-400"
              />
            </div>

            <button
              type="submit"
              disabled={
                deletingOrg ||
                confirmDeleteText.trim().toLowerCase() !==
                  data.organization.name.trim().toLowerCase()
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {deletingOrg ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>
                {deletingOrg
                  ? 'Wiping Organization Data...'
                  : 'Permanently Delete Organization & Wipe Data'}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function OrganizationSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center py-24 text-[#C9A66B] text-xs gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading settings...</span>
        </div>
      }
    >
      <OrganizationSettingsInner />
    </Suspense>
  )
}
