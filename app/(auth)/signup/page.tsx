'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ONBOARDING_DEPARTMENTS,
  PLAN_BUNDLE_DISCOUNT_PERCENT,
  calculateOnboardingPrice,
  formatKes,
  type BillingCycle,
  type OnboardingDepartmentId,
} from '@/lib/onboarding-plans'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Globe,
  Loader2,
  Lock,
  Megaphone,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
} from 'lucide-react'

const DRAFT_STORAGE_KEY = 'cillah_org_onboarding_draft_v1'

const PHONE_PREFIXES = [
  { code: '+254', label: '🇰🇪 +254' },
  { code: '+1', label: '🇺🇸 +1' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+27', label: '🇿🇦 +27' },
  { code: '+233', label: '🇬🇭 +233' },
  { code: '+234', label: '🇳🇬 +234' },
  { code: '+255', label: '🇹🇿 +255' },
  { code: '+256', label: '🇺🇬 +256' },
]

const DEPT_ICONS: Record<
  OnboardingDepartmentId,
  { icon: typeof TrendingUp; accent: string; ring: string; glow: string }
> = {
  sales: {
    icon: TrendingUp,
    accent: 'text-emerald-400',
    ring: 'border-emerald-400/70 bg-emerald-500/[0.08]',
    glow: 'from-emerald-500/15 via-transparent to-transparent',
  },
  marketing: {
    icon: Megaphone,
    accent: 'text-[#C9A66B]',
    ring: 'border-[#C9A66B]/80 bg-[#C9A66B]/[0.10]',
    glow: 'from-[#C9A66B]/20 via-transparent to-transparent',
  },
  finance: {
    icon: DollarSign,
    accent: 'text-sky-400',
    ring: 'border-sky-400/70 bg-sky-500/[0.08]',
    glow: 'from-sky-500/15 via-transparent to-transparent',
  },
}

type Step = 1 | 2 | 3
type PaymentMethod = 'mpesa' | 'paystack'

interface ProvisionedWorkspace {
  organizationName: string
  organizationSlug: string
  departments: string[]
  receipt: string
  redirectUrl: string
}

function SignUpOnboardingInner() {
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Auth & workspace state
  const [authChecking, setAuthChecking] = useState(true)
  const [signedInUser, setSignedInUser] = useState<{
    id: string
    email: string
    fullName: string
  } | null>(null)
  const [existingWorkspaceHref, setExistingWorkspaceHref] = useState<string | null>(null)
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false)

  // Stepper state
  const [step, setStep] = useState<Step>(1)

  // Step 1 form fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phonePrefix, setPhonePrefix] = useState('+254')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [website, setWebsite] = useState('')

  // Step 2 plan selection
  const [selectedDepartments, setSelectedDepartments] = useState<OnboardingDepartmentId[]>([
    'marketing',
  ])
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')

  // Step 3 checkout
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa')
  const [mpesaPhone, setMpesaPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // M-Pesa polling & Paystack return states
  const [pendingMpesaSubId, setPendingMpesaSubId] = useState<string | null>(null)
  const [mpesaStatusText, setMpesaStatusText] = useState<string>('')
  const [verifyingPaystack, setVerifyingPaystack] = useState(false)
  const [provisioned, setProvisioned] = useState<ProvisionedWorkspace | null>(null)

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const pricing = useMemo(
    () => calculateOnboardingPrice(selectedDepartments, billingCycle),
    [selectedDepartments, billingCycle]
  )

  const persistDraft = useCallback(
    (overrides?: Partial<{
      organizationName: string
      website: string
      phone: string
      phonePrefix: string
      selectedDepartments: OnboardingDepartmentId[]
      billingCycle: BillingCycle
    }>) => {
      try {
        const draft = {
          organizationName: overrides?.organizationName ?? organizationName,
          website: overrides?.website ?? website,
          phone: overrides?.phone ?? phone,
          phonePrefix: overrides?.phonePrefix ?? phonePrefix,
          selectedDepartments: overrides?.selectedDepartments ?? selectedDepartments,
          billingCycle: overrides?.billingCycle ?? billingCycle,
        }
        window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
      } catch {
        // Ignore storage errors in private browsing
      }
    },
    [organizationName, website, phone, phonePrefix, selectedDepartments, billingCycle]
  )

  const clearDraft = () => {
    try {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY)
    } catch {
      // Ignore
    }
  }

  // Restore saved draft & detect active session on mount
  useEffect(() => {
    let active = true

    // 1. Restore draft from localStorage
    let restoredOrgName = ''
    try {
      const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.organizationName) {
          restoredOrgName = String(parsed.organizationName)
          setOrganizationName(restoredOrgName)
        }
        if (parsed.website) setWebsite(String(parsed.website))
        if (parsed.phone) {
          setPhone(String(parsed.phone))
          setMpesaPhone(String(parsed.phone))
        }
        if (parsed.phonePrefix) setPhonePrefix(String(parsed.phonePrefix))
        if (Array.isArray(parsed.selectedDepartments) && parsed.selectedDepartments.length > 0) {
          setSelectedDepartments(parsed.selectedDepartments)
        }
        if (parsed.billingCycle === 'annual' || parsed.billingCycle === 'monthly') {
          setBillingCycle(parsed.billingCycle)
        }
      }
    } catch {
      // Ignore malformed draft
    }

    // 2. Check Supabase auth session
    async function loadSession() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!active) return

        if (user && user.email) {
          const cleanEmail = user.email.toLowerCase().trim()
          const [{ data: profile }, { data: staff }] = await Promise.all([
            supabase
              .from('profiles')
              .select('full_name, first_name, last_name, phone_number, company_name')
              .eq('id', user.id)
              .maybeSingle(),
            supabase
              .from('staff_members')
              .select('status, is_active, org_id')
              .ilike('email', cleanEmail)
              .eq('is_active', true)
              .maybeSingle(),
          ])

          if (!active) return

          const resolvedFullName =
            profile?.full_name ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            cleanEmail.split('@')[0]

          setSignedInUser({
            id: user.id,
            email: cleanEmail,
            fullName: resolvedFullName,
          })
          setEmail(cleanEmail)
          if (profile?.first_name) setFirstName(profile.first_name)
          if (profile?.last_name) setLastName(profile.last_name)
          if (profile?.phone_number) {
            setPhone((prev) => prev || profile.phone_number)
            setMpesaPhone((prev) => prev || profile.phone_number)
          }
          if (profile?.company_name && !restoredOrgName) {
            setOrganizationName(profile.company_name)
            restoredOrgName = profile.company_name
          }

          if (staff) {
            const isAdmin = String(staff.status || '').toLowerCase() === 'admin'
            setExistingWorkspaceHref(isAdmin ? '/admin' : '/user/dashboard')
          }

          // If returning from Google OAuth or email verification with org name ready, jump to Step 2
          const stepParam = searchParams.get('step')
          if (stepParam === 'departments' && restoredOrgName.trim().length >= 2) {
            setStep(2)
          }
        }
      } catch (err) {
        console.warn('[Signup] Session load warning:', err)
      } finally {
        if (active) setAuthChecking(false)
      }
    }

    loadSession()
    return () => {
      active = false
    }
  }, [supabase, searchParams])

  // Auto-verify when returning from Paystack checkout (?paystack_ref=...&subId=...)
  useEffect(() => {
    const paystackRef = searchParams.get('paystack_ref') || searchParams.get('reference') || ''
    const subId = searchParams.get('subId') || ''
    if (!paystackRef) return

    let active = true
    setVerifyingPaystack(true)
    setStep(3)

    fetch(
      `/api/onboarding/paystack-verify?reference=${encodeURIComponent(
        paystackRef
      )}&subId=${encodeURIComponent(subId)}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!active) return
        if (data?.status === 'active' && data?.organizationSlug) {
          clearDraft()
          setProvisioned({
            organizationName: data.organizationName || organizationName || 'Your Workspace',
            organizationSlug: data.organizationSlug,
            departments: data.departments || selectedDepartments,
            receipt: data.receipt || paystackRef,
            redirectUrl: data.redirectUrl || `/admin?org=${encodeURIComponent(data.organizationSlug)}`,
          })
          toast.success('Payment verified! Your organization workspace is live.')
        } else {
          toast.error(data?.error || data?.resultDesc || 'Card payment was not completed.')
        }
      })
      .catch((err) => {
        if (!active) return
        toast.error(err?.message || 'Could not verify Paystack payment.')
      })
      .finally(() => {
        if (active) setVerifyingPaystack(false)
      })

    return () => {
      active = false
    }
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  // Poll M-Pesa checkout status when an STK push is active
  useEffect(() => {
    if (!pendingMpesaSubId) return

    let attempts = 0
    const maxAttempts = 45 // ~2.25 minutes

    const checkStatus = async () => {
      attempts += 1
      try {
        const res = await fetch(
          `/api/onboarding/status?subId=${encodeURIComponent(pendingMpesaSubId)}`,
          { cache: 'no-store' }
        )
        const data = await res.json()

        if (data?.status === 'active' && data?.organizationSlug) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current)
          pollTimerRef.current = null
          setPendingMpesaSubId(null)
          clearDraft()
          setProvisioned({
            organizationName: data.organizationName || organizationName,
            organizationSlug: data.organizationSlug,
            departments: data.departments || selectedDepartments,
            receipt: data.receipt || '',
            redirectUrl: data.redirectUrl || `/admin?org=${encodeURIComponent(data.organizationSlug)}`,
          })
          toast.success('M-Pesa payment confirmed! Your workspace is ready.')
          return
        }

        if (data?.status === 'cancelled' || data?.status === 'failed') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current)
          pollTimerRef.current = null
          setPendingMpesaSubId(null)
          setMpesaStatusText('')
          toast.error(data?.resultDesc || 'M-Pesa payment was cancelled or failed. Please try again.')
          return
        }

        if (attempts >= maxAttempts) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current)
          pollTimerRef.current = null
          setPendingMpesaSubId(null)
          setMpesaStatusText('')
          toast.error(
            'M-Pesa confirmation timed out. If you already entered your PIN, refresh or log in — your workspace activates automatically.'
          )
        }
      } catch {
        // Keep polling on transient network blip
      }
    }

    pollTimerRef.current = setInterval(checkStatus, 3000)
    checkStatus()

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }
  }, [pendingMpesaSubId, organizationName, selectedDepartments])

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true)
    persistDraft()
    try {
      const nextTarget = encodeURIComponent('/signup?step=departments')
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${nextTarget}`,
        },
      })
      if (error) throw error
    } catch (err: any) {
      toast.error(err.message || 'Google sign-up failed')
      setGoogleLoading(false)
    }
  }

  const handleSwitchAccount = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    setSignedInUser(null)
    setExistingWorkspaceHref(null)
    setEmail('')
    setPassword('')
    toast.success('Signed out. You can create or use another account.')
  }

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanOrg = organizationName.trim()
    if (cleanOrg.length < 2) {
      toast.error('Please enter your organization or business name.')
      return
    }

    persistDraft({ organizationName: cleanOrg, website: website.trim() })

    // If user is already authenticated, move straight to Step 2
    if (signedInUser) {
      setStep(2)
      return
    }

    if (!firstName.trim() || !lastName.trim() || !email.trim() || password.length < 6) {
      toast.error('Please fill in your name, email, and a password (min 6 characters).')
      return
    }

    setSubmitting(true)
    try {
      const fullNameCombined = `${firstName.trim()} ${lastName.trim()}`.trim()
      const cleanEmail = email.toLowerCase().trim()
      const nextTarget = encodeURIComponent('/signup?step=departments')

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${nextTarget}`,
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: fullNameCombined,
            phone_prefix: phonePrefix,
            phone_number: phone.trim(),
            company_name: cleanOrg,
          },
        },
      })

      if (error) throw error

      if (data.user) {
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: cleanEmail,
            full_name: fullNameCombined,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone_number: phone.trim() || null,
            phone_prefix: phonePrefix,
            company_name: cleanOrg,
            role: 'client',
            status: 'active',
            updated_at: new Date().toISOString(),
          })
        } catch (profileErr) {
          console.warn('Profile sync warning on signup:', profileErr)
        }

        if (!data.session) {
          setEmailConfirmationSent(true)
          toast.success('Account created! Please check your email to confirm, then continue here.')
          return
        }

        setSignedInUser({
          id: data.user.id,
          email: cleanEmail,
          fullName: fullNameCombined,
        })
        if (phone.trim() && !mpesaPhone) {
          setMpesaPhone(phone.trim())
        }
        toast.success('Account ready! Now pick the departments your team needs.')
        setStep(2)
      }
    } catch (err: any) {
      toast.error(err?.message || 'Could not create your account')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleDepartment = (deptId: OnboardingDepartmentId) => {
    setSelectedDepartments((prev) => {
      const next = prev.includes(deptId)
        ? prev.filter((id) => id !== deptId)
        : [...prev, deptId]
      persistDraft({ selectedDepartments: next })
      return next
    })
  }

  const selectAllDepartments = () => {
    const all: OnboardingDepartmentId[] = ['sales', 'marketing', 'finance']
    setSelectedDepartments(all)
    persistDraft({ selectedDepartments: all })
  }

  const handleCheckoutMpesa = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mpesaPhone.trim()) {
      toast.error('Enter the Safaricom M-Pesa phone number to receive the PIN prompt.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/onboarding/mpesa-stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: organizationName.trim(),
          website: website.trim(),
          fullName:
            signedInUser?.fullName || `${firstName.trim()} ${lastName.trim()}`.trim(),
          phone: phone.trim(),
          mpesaPhone: mpesaPhone.trim(),
          departments: selectedDepartments,
          billingCycle,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Could not send M-Pesa PIN prompt')
      }

      setPendingMpesaSubId(data.subscriptionId)
      setMpesaStatusText(
        `M-Pesa prompt sent to ${data.phone} for ${formatKes(data.amountKes)}. Enter your M-Pesa PIN on your phone...`
      )
      toast.success('M-Pesa PIN prompt sent! Check your phone.')
    } catch (err: any) {
      toast.error(err?.message || 'M-Pesa checkout failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCheckoutPaystack = async () => {
    setSubmitting(true)
    persistDraft()
    try {
      const res = await fetch('/api/onboarding/paystack-initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: organizationName.trim(),
          website: website.trim(),
          fullName:
            signedInUser?.fullName || `${firstName.trim()} ${lastName.trim()}`.trim(),
          phone: phone.trim() || mpesaPhone.trim(),
          departments: selectedDepartments,
          billingCycle,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.authorizationUrl) {
        throw new Error(data?.error || 'Could not launch Paystack checkout')
      }

      window.location.href = data.authorizationUrl
    } catch (err: any) {
      toast.error(err?.message || 'Paystack checkout failed')
      setSubmitting(false)
    }
  }

  // Celebration / Workspace Ready screen
  if (provisioned) {
    return (
      <div className="min-h-screen bg-[#090B12] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
        <div className="w-full max-w-lg rounded-3xl bg-[#0F1422] border border-emerald-500/35 p-7 sm:p-9 text-center space-y-6 shadow-2xl relative z-10">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-emerald-400" />
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C9A66B]">
              Workspace Activated
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome to {provisioned.organizationName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Your isolated organization workspace has been provisioned and your Admin permissions are live.
            </p>
          </div>

          <div className="rounded-2xl bg-[#090B12]/90 border border-white/10 p-4 space-y-3 text-left">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Organization</span>
              <span className="font-bold text-white">{provisioned.organizationName}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Payment Receipt</span>
              <span className="font-mono font-semibold text-[#E5C687]">
                {provisioned.receipt || 'Confirmed'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs gap-2">
              <span className="text-slate-400 shrink-0">Unlocked Departments</span>
              <div className="flex flex-wrap justify-end gap-1.5">
                {provisioned.departments.map((d) => (
                  <span
                    key={d}
                    className="px-2.5 py-0.5 rounded-full bg-[#C9A66B]/15 border border-[#C9A66B]/40 text-[11px] font-bold capitalize text-[#E5C687]"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => window.location.replace(provisioned.redirectUrl)}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[#C9A66B] to-[#E5C687] hover:opacity-95 text-[#090B12] font-black text-sm shadow-lg shadow-[#C9A66B]/20 cursor-pointer"
          >
            Launch My Workspace <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  // Paystack verification spinner screen
  if (verifyingPaystack) {
    return (
      <div className="min-h-screen bg-[#090B12] text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-[#0F1422] border border-[#C9A66B]/35 p-8 text-center space-y-4 shadow-2xl">
          <Loader2 className="w-10 h-10 text-[#C9A66B] animate-spin mx-auto" />
          <h1 className="text-xl font-black text-white">Verifying Payment &amp; Provisioning Workspace...</h1>
          <p className="text-xs text-slate-400">
            Setting up your isolated organization, admin role, and selected departments. This takes just a few seconds.
          </p>
        </div>
      </div>
    )
  }

  const stepsMeta = [
    { num: 1 as Step, label: 'Organization' },
    { num: 2 as Step, label: 'Departments' },
    { num: 3 as Step, label: 'Checkout' },
  ]

  return (
    <div className="min-h-screen bg-[#090B12] text-slate-100 relative overflow-hidden">
      {/* Subtle warm obsidian-gold glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[560px] h-[360px] bg-[#C9A66B]/[0.08] rounded-full blur-[130px] pointer-events-none" />

      {/* Minimal Luxury Top Bar */}
      <header className="relative z-10 border-b border-white/[0.06] bg-[#090B12]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-[#C9A66B]/45 shadow-md">
              <img
                src="/images/cillah-emblem.png"
                alt="Cillah"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="leading-tight">
              <span className="text-sm font-black tracking-tight text-white block">cillah.dev</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C9A66B] block">
                Workspace Onboarding
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3 text-xs">
            {existingWorkspaceHref && (
              <Link
                href={existingWorkspaceHref}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#C9A66B]/15 border border-[#C9A66B]/40 text-[#E5C687] font-bold hover:bg-[#C9A66B]/25 transition-colors"
              >
                Open My Workspace <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
            <Link
              href="/login"
              className="text-slate-400 hover:text-white font-semibold transition-colors"
            >
              Already have an account? <span className="text-[#E5C687]">Log In</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Heading & Stepper */}
        <div className="text-center space-y-5 max-w-2xl mx-auto">
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C9A66B]">
              Launch In 3 Minutes
            </p>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Set Up Your Organization Workspace
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Start with only the departments you need today — Sales, Marketing, or Finance — and scale anytime.
            </p>
          </div>

          {/* 3-Step Visual Stepper */}
          <div className="inline-flex items-center gap-2 sm:gap-3 px-4 py-2 rounded-full bg-[#0F1422] border border-white/10">
            {stepsMeta.map((s, idx) => {
              const isDone = step > s.num
              const isCurrent = step === s.num
              return (
                <div key={s.num} className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={s.num > step}
                    onClick={() => {
                      if (s.num < step) setStep(s.num)
                    }}
                    className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                      isCurrent
                        ? 'text-[#E5C687]'
                        : isDone
                        ? 'text-emerald-400 cursor-pointer hover:text-emerald-300'
                        : 'text-slate-500 cursor-default'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border ${
                        isCurrent
                          ? 'bg-[#C9A66B]/20 border-[#C9A66B] text-[#E5C687]'
                          : isDone
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-white/[0.03] border-white/15 text-slate-500'
                      }`}
                    >
                      {isDone ? <Check className="w-3 h-3" /> : s.num}
                    </span>
                    <span>{s.label}</span>
                  </button>
                  {idx < stepsMeta.length - 1 && (
                    <span className="w-5 h-px bg-white/15 hidden sm:inline-block" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* STEP 1: ORGANIZATION & ADMIN ACCOUNT */}
        {step === 1 && (
          <div className="max-w-lg mx-auto rounded-3xl bg-[#0F1422]/90 border border-white/10 p-6 sm:p-8 shadow-2xl space-y-6">
            {emailConfirmationSent ? (
              <div className="text-center space-y-4 py-4">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-[#C9A66B]/15 border border-[#C9A66B]/40 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-[#E5C687]" />
                </div>
                <h2 className="text-xl font-black text-white">Confirm Your Email to Continue</h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  We sent a verification link to{' '}
                  <span className="text-white font-semibold">{email}</span>. Click that link and you
                  will land right back here with{' '}
                  <span className="text-[#E5C687] font-semibold">{organizationName}</span> saved so
                  you can pick your departments and activate your workspace.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEmailConfirmationSent(false)}
                  className="border-white/15 bg-white/[0.03] text-slate-200 hover:bg-white/[0.08]"
                >
                  Use a different email
                </Button>
              </div>
            ) : (
              <form onSubmit={handleStep1Submit} className="space-y-5">
                {authChecking ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-xs text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin text-[#C9A66B]" />
                    Checking your session...
                  </div>
                ) : (
                  <>
                    {/* Organization Details (Always First!) */}
                    <div className="space-y-3 pb-4 border-b border-white/[0.07]">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C9A66B]">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Your Organization</span>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="orgName" className="text-slate-300 text-xs">
                          Organization / Business Name *
                        </Label>
                        <Input
                          id="orgName"
                          required
                          placeholder="e.g. Savannah Properties Kenya"
                          className="h-11 bg-[#090B12] border-white/10 text-white focus:border-[#C9A66B]"
                          value={organizationName}
                          onChange={(e) => setOrganizationName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="orgWebsite" className="text-slate-300 text-xs">
                          Website or Instagram Handle (Optional)
                        </Label>
                        <div className="relative">
                          <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <Input
                            id="orgWebsite"
                            placeholder="https://yourcompany.com"
                            className="h-11 pl-9 bg-[#090B12] border-white/10 text-white focus:border-[#C9A66B]"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Signed-in state vs Account creation */}
                    {signedInUser ? (
                      <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                            Organization Admin Account
                          </p>
                          <p className="text-sm font-bold text-white truncate mt-0.5">
                            {signedInUser.fullName}
                          </p>
                          <p className="text-xs text-slate-300 truncate">{signedInUser.email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleSwitchAccount}
                          className="text-[11px] font-semibold text-slate-400 hover:text-white underline shrink-0 cursor-pointer"
                        >
                          Switch
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <button
                          type="button"
                          onClick={handleGoogleSignUp}
                          disabled={googleLoading || submitting}
                          className="w-full h-11 flex items-center justify-center gap-3 px-4 bg-white text-slate-900 font-bold text-sm rounded-xl hover:bg-slate-100 transition-all shadow-sm disabled:opacity-60 cursor-pointer"
                        >
                          {googleLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                          ) : (
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                              <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              />
                              <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                              />
                              <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              />
                            </svg>
                          )}
                          <span>
                            {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
                          </span>
                        </button>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                          </div>
                          <div className="relative flex justify-center text-[11px]">
                            <span className="bg-[#0F1422] px-3 text-slate-500">
                              or create admin login with email
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="firstName" className="text-slate-300 text-xs">
                              First Name *
                            </Label>
                            <Input
                              id="firstName"
                              required
                              placeholder="Jane"
                              className="h-10 bg-[#090B12] border-white/10 text-white focus:border-[#C9A66B]"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="lastName" className="text-slate-300 text-xs">
                              Last Name *
                            </Label>
                            <Input
                              id="lastName"
                              required
                              placeholder="Wanjiku"
                              className="h-10 bg-[#090B12] border-white/10 text-white focus:border-[#C9A66B]"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="email" className="text-slate-300 text-xs">
                            Work Email *
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            required
                            placeholder="founder@yourcompany.com"
                            className="h-10 bg-[#090B12] border-white/10 text-white focus:border-[#C9A66B]"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1.5">
                            <Label htmlFor="phonePrefix" className="text-slate-300 text-xs">
                              Code
                            </Label>
                            <select
                              id="phonePrefix"
                              value={phonePrefix}
                              onChange={(e) => setPhonePrefix(e.target.value)}
                              className="w-full h-10 px-2 rounded-md bg-[#090B12] border border-white/10 text-white focus:border-[#C9A66B] focus:outline-none text-xs"
                            >
                              {PHONE_PREFIXES.map((p) => (
                                <option key={p.code} value={p.code} className="bg-[#0F1422]">
                                  {p.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-2 space-y-1.5">
                            <Label htmlFor="phone" className="text-slate-300 text-xs">
                              Phone / M-Pesa Number
                            </Label>
                            <Input
                              id="phone"
                              placeholder="0712 345 678"
                              className="h-10 bg-[#090B12] border-white/10 text-white focus:border-[#C9A66B]"
                              value={phone}
                              onChange={(e) => {
                                setPhone(e.target.value)
                                if (!mpesaPhone) setMpesaPhone(e.target.value)
                              }}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="password" className="text-slate-300 text-xs">
                            Password *
                          </Label>
                          <Input
                            id="password"
                            type="password"
                            required
                            minLength={6}
                            placeholder="At least 6 characters"
                            className="h-10 bg-[#090B12] border-white/10 text-white focus:border-[#C9A66B]"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={submitting || googleLoading}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-[#C9A66B] to-[#E5C687] hover:opacity-95 text-[#090B12] font-black text-sm shadow-lg shadow-[#C9A66B]/20 cursor-pointer"
                    >
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Creating Admin Account...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Continue to Department Picker <ArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </Button>
                  </>
                )}
              </form>
            )}
          </div>
        )}

        {/* STEP 2: MODULAR DEPARTMENT PICKER */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Controls Bar: Billing Cycle + Select All Bundle shortcut */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#0F1422] border border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBillingCycle('monthly')
                    persistDraft({ billingCycle: 'monthly' })
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    billingCycle === 'monthly'
                      ? 'bg-[#C9A66B] text-[#090B12]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBillingCycle('annual')
                    persistDraft({ billingCycle: 'annual' })
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    billingCycle === 'annual'
                      ? 'bg-[#C9A66B] text-[#090B12]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Annual</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      billingCycle === 'annual'
                        ? 'bg-[#090B12]/20 text-[#090B12]'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    2 Months Free
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={selectAllDepartments}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#C9A66B]/15 hover:bg-[#C9A66B]/25 border border-[#C9A66B]/40 text-xs font-bold text-[#E5C687] transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  Select All 3 Departments
                  {PLAN_BUNDLE_DISCOUNT_PERCENT > 0
                    ? ` (Save ${PLAN_BUNDLE_DISCOUNT_PERCENT}%)`
                    : ''}
                </span>
              </button>
            </div>

            {/* Department Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ONBOARDING_DEPARTMENTS.map((dept) => {
                const selected = selectedDepartments.includes(dept.id)
                const style = DEPT_ICONS[dept.id]
                const Icon = style.icon
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => toggleDepartment(dept.id)}
                    className={`group relative overflow-hidden rounded-3xl p-6 text-left border transition-all duration-150 cursor-pointer flex flex-col justify-between gap-5 ${
                      selected
                        ? `${style.ring} shadow-xl -translate-y-0.5`
                        : 'bg-[#0F1422] border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-b ${style.glow} opacity-60 pointer-events-none`}
                    />

                    <div className="relative space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="h-11 w-11 rounded-2xl bg-[#090B12] border border-white/10 flex items-center justify-center">
                          <Icon className={`w-5 h-5 ${style.accent}`} />
                        </div>
                        <span
                          className={`h-6 w-6 rounded-full flex items-center justify-center border transition-all ${
                            selected
                              ? 'bg-[#C9A66B] border-[#C9A66B] text-[#090B12]'
                              : 'border-white/20 bg-white/[0.03]'
                          }`}
                        >
                          {selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-black text-white">{dept.name}</h3>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{dept.tagline}</p>
                      </div>

                      <div className="pt-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-black text-white">
                            {formatKes(dept.monthlyKes)}
                          </span>
                          <span className="text-xs text-slate-400">/ month</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          ~${dept.monthlyUsd} USD / month
                        </p>
                      </div>

                      <ul className="space-y-2 pt-2 border-t border-white/[0.07]">
                        {dept.features.map((feat) => (
                          <li
                            key={feat}
                            className="flex items-start gap-2 text-xs text-slate-300 leading-snug"
                          >
                            <Check className={`w-3.5 h-3.5 ${style.accent} shrink-0 mt-0.5`} />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Summary & Continue Bar */}
            <div className="rounded-3xl bg-[#0F1422] border border-[#C9A66B]/35 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-2xl">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {organizationName || 'Your Organization'}
                  </span>
                  {pricing.isAllInOneBundle && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-[10px] font-bold text-emerald-300">
                      All-in-One{' '}
                      {PLAN_BUNDLE_DISCOUNT_PERCENT > 0
                        ? `${PLAN_BUNDLE_DISCOUNT_PERCENT}% `
                        : ''}
                      Bundle Applied
                    </span>
                  )}
                </div>

                {pricing.departments.length > 0 ? (
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <span className="text-2xl sm:text-3xl font-black text-white">
                      {formatKes(pricing.totalKes)}
                    </span>
                    <span className="text-xs text-slate-400">
                      / {billingCycle === 'annual' ? 'year (2 months free)' : 'month'} &bull; ~$
                      {pricing.totalUsd} USD
                    </span>
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-rose-400">
                    Pick at least 1 department above to continue
                  </p>
                )}

                {(pricing.bundleDiscountMonthlyKes > 0 || pricing.annualSavingsKes > 0) && (
                  <p className="text-[11px] text-emerald-300 font-semibold">
                    You save{' '}
                    {formatKes(
                      pricing.bundleDiscountMonthlyKes * (billingCycle === 'annual' ? 10 : 1) +
                        pricing.annualSavingsKes
                    )}{' '}
                    on this plan!
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="h-11 px-4 rounded-xl border-white/15 bg-white/[0.03] text-slate-200 hover:bg-white/[0.08] cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
                </Button>
                <Button
                  type="button"
                  disabled={pricing.departments.length === 0}
                  onClick={() => setStep(3)}
                  className="h-11 px-6 rounded-xl bg-gradient-to-r from-[#C9A66B] to-[#E5C687] hover:opacity-95 text-[#090B12] font-black text-sm shadow-lg shadow-[#C9A66B]/20 cursor-pointer disabled:opacity-40"
                >
                  Proceed to Checkout <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PAYMENT CHECKOUT (M-PESA EXPRESS OR PAYSTACK CARD) */}
        {step === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            {/* Left: Payment Method Form */}
            <div className="lg:col-span-3 rounded-3xl bg-[#0F1422] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-black text-white">Complete Activation</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Your workspace unlocks automatically the moment payment confirms.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={Boolean(pendingMpesaSubId)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer disabled:opacity-40"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Edit Plan
                </button>
              </div>

              {/* Payment Method Tabs */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={Boolean(pendingMpesaSubId)}
                  onClick={() => setPaymentMethod('mpesa')}
                  className={`flex items-center justify-center gap-2 h-12 rounded-2xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    paymentMethod === 'mpesa'
                      ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300 shadow-md'
                      : 'bg-[#090B12] border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>M-Pesa Express</span>
                </button>
                <button
                  type="button"
                  disabled={Boolean(pendingMpesaSubId)}
                  onClick={() => setPaymentMethod('paystack')}
                  className={`flex items-center justify-center gap-2 h-12 rounded-2xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    paymentMethod === 'paystack'
                      ? 'bg-[#C9A66B]/15 border-[#C9A66B] text-[#E5C687] shadow-md'
                      : 'bg-[#090B12] border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Card / Paystack</span>
                </button>
              </div>

              {paymentMethod === 'mpesa' ? (
                pendingMpesaSubId ? (
                  <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/35 p-6 text-center space-y-4">
                    <Loader2 className="w-9 h-9 text-emerald-400 animate-spin mx-auto" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white">Waiting for M-Pesa PIN...</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{mpesaStatusText}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (pollTimerRef.current) clearInterval(pollTimerRef.current)
                        pollTimerRef.current = null
                        setPendingMpesaSubId(null)
                        setMpesaStatusText('')
                      }}
                      className="text-xs font-semibold text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Cancel &amp; try a different number or card
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCheckoutMpesa} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="mpesaPhone" className="text-slate-300 text-xs">
                        Safaricom M-Pesa Phone Number *
                      </Label>
                      <Input
                        id="mpesaPhone"
                        required
                        placeholder="0712 345 678 or 254712345678"
                        className="h-12 bg-[#090B12] border-white/15 text-white text-sm focus:border-emerald-400"
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                      />
                      <p className="text-[11px] text-slate-500">
                        We will push an instant M-Pesa STK prompt to this phone. No manual paybill typing needed.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#090B12] font-black text-sm shadow-lg shadow-emerald-500/20 cursor-pointer"
                    >
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Sending M-Pesa Prompt...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Pay {formatKes(pricing.totalKes)} via M-Pesa{' '}
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </Button>
                  </form>
                )
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-[#090B12] border border-white/10 p-4 space-y-2 text-xs text-slate-300">
                    <p className="font-bold text-white">Pay securely via Paystack</p>
                    <p className="text-slate-400 leading-relaxed">
                      Supports Visa, Mastercard, Apple Pay, and Mobile Money (local &amp; international cards). You&apos;ll be redirected back here automatically once approved.
                    </p>
                  </div>

                  <Button
                    type="button"
                    disabled={submitting}
                    onClick={handleCheckoutPaystack}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-[#C9A66B] to-[#E5C687] hover:opacity-95 text-[#090B12] font-black text-sm shadow-lg shadow-[#C9A66B]/20 cursor-pointer"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Opening Paystack...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Pay {formatKes(pricing.totalKes)} with Paystack{' '}
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </div>
              )}

              <div className="pt-3 border-t border-white/[0.06] flex items-center gap-2 text-[11px] text-slate-500">
                <Lock className="w-3.5 h-3.5 text-[#C9A66B] shrink-0" />
                <span>
                  256-bit encrypted checkout. Your organization gets its own private isolated workspace.
                </span>
              </div>
            </div>

            {/* Right: Live Order Summary */}
            <div className="lg:col-span-2 rounded-3xl bg-[#0F1422] border border-[#C9A66B]/30 p-6 space-y-5 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C9A66B]">
                <ShieldCheck className="w-4 h-4" />
                <span>Order Summary</span>
              </div>

              <div className="space-y-2.5 text-xs border-b border-white/[0.08] pb-4">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Organization</span>
                  <span className="font-bold text-white text-right">{organizationName}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Admin Account</span>
                  <span className="font-semibold text-slate-200 truncate max-w-[190px]">
                    {signedInUser?.email || email}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Billing Cycle</span>
                  <span className="font-bold capitalize text-[#E5C687]">{billingCycle}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs border-b border-white/[0.08] pb-4">
                {pricing.departments.map((deptId) => {
                  const dept = ONBOARDING_DEPARTMENTS.find((d) => d.id === deptId)!
                  return (
                    <div key={deptId} className="flex justify-between items-center">
                      <span className="text-slate-200 font-semibold">{dept.name}</span>
                      <span className="text-slate-300">{formatKes(dept.monthlyKes)}/mo</span>
                    </div>
                  )
                })}
                {pricing.bundleDiscountMonthlyKes > 0 && (
                  <div className="flex justify-between items-center text-emerald-400 font-semibold">
                    <span>
                      All-in-One{' '}
                      {PLAN_BUNDLE_DISCOUNT_PERCENT > 0
                        ? `${PLAN_BUNDLE_DISCOUNT_PERCENT}% `
                        : ''}
                      Bundle Savings
                    </span>
                    <span>-{formatKes(pricing.bundleDiscountMonthlyKes)}/mo</span>
                  </div>
                )}
                {pricing.annualSavingsKes > 0 && (
                  <div className="flex justify-between items-center text-emerald-400 font-semibold">
                    <span>Annual Bonus (2 Months Free)</span>
                    <span>-{formatKes(pricing.annualSavingsKes)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Due Today
                </span>
                <div className="text-right">
                  <p className="text-2xl font-black text-white">{formatKes(pricing.totalKes)}</p>
                  <p className="text-[11px] text-slate-400">~${pricing.totalUsd} USD</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enterprise / Custom Software CTA */}
        <div className="rounded-3xl bg-gradient-to-r from-[#0F1422] via-[#141A2C] to-[#0F1422] border border-white/10 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-[#C9A66B]">
              Need Custom Software or Dedicated Enterprise Hosting?
            </p>
            <p className="text-xs sm:text-sm text-slate-300">
              Want bespoke AI automations, custom integrations, or a white-label build for your company? Book a 1-on-1 architecture call directly with Cillah.
            </p>
          </div>
          <Link
            href="/book-consultation"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-[#C9A66B]/40 text-xs font-bold text-[#E5C687] transition-colors shrink-0"
          >
            <Calendar className="w-4 h-4" />
            <span>Book 1-on-1 Strategy Call</span>
          </Link>
        </div>
      </main>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090B12] flex items-center justify-center text-[#C9A66B] text-sm gap-2">
          <Sparkles className="w-5 h-5 animate-spin" />
          <span>Loading workspace onboarding...</span>
        </div>
      }
    >
      <SignUpOnboardingInner />
    </Suspense>
  )
}
