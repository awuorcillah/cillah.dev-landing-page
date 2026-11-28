import type { UserWorkspaceRole } from "@/lib/auth-roles"

export type OnboardingDepartmentId = UserWorkspaceRole // "sales" | "marketing" | "finance"
export type BillingCycle = "monthly" | "annual"

export interface DepartmentPlan {
  id: OnboardingDepartmentId
  name: string
  tagline: string
  monthlyKes: number
  monthlyUsd: number
  features: string[]
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback
  const trimmed = raw.trim()
  if (!/^\d+$/.test(trimmed)) return fallback
  const parsed = Number.parseInt(trimmed, 10)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return fallback
  return parsed
}

export const PLAN_SALES_MONTHLY_KES = parsePositiveInt(
  process.env.NEXT_PUBLIC_PLAN_SALES_KES,
  15000
)
export const PLAN_MARKETING_MONTHLY_KES = parsePositiveInt(
  process.env.NEXT_PUBLIC_PLAN_MARKETING_KES,
  20000
)
export const PLAN_FINANCE_MONTHLY_KES = parsePositiveInt(
  process.env.NEXT_PUBLIC_PLAN_FINANCE_KES,
  15000
)

// Bundle price when all 3 departments are selected together (defaults to 20% off sum = KES 40,000)
const FULL_SUM_MONTHLY_KES =
  PLAN_SALES_MONTHLY_KES + PLAN_MARKETING_MONTHLY_KES + PLAN_FINANCE_MONTHLY_KES
const DEFAULT_BUNDLE_MONTHLY_KES = Math.round(FULL_SUM_MONTHLY_KES * 0.8)
export const PLAN_ALL_IN_ONE_MONTHLY_KES = parsePositiveInt(
  process.env.NEXT_PUBLIC_PLAN_BUNDLE_KES,
  DEFAULT_BUNDLE_MONTHLY_KES
)
export const PLAN_BUNDLE_DISCOUNT_PERCENT = Math.max(
  0,
  Math.round(((FULL_SUM_MONTHLY_KES - PLAN_ALL_IN_ONE_MONTHLY_KES) / FULL_SUM_MONTHLY_KES) * 100)
)

// Approximate KES -> USD conversion rate for display
const KES_PER_USD = 129

export const ONBOARDING_DEPARTMENTS: DepartmentPlan[] = [
  {
    id: "sales",
    name: "Sales Department",
    tagline: "AI CRM pipeline, lead tracking & automated follow-ups",
    monthlyKes: PLAN_SALES_MONTHLY_KES,
    monthlyUsd: Math.round(PLAN_SALES_MONTHLY_KES / KES_PER_USD),
    features: [
      "Visual lead pipeline & deal stage tracking",
      "Team assignment & staff performance visibility",
      "Automated follow-up logs & client nurturing",
      "Dedicated isolated workspace for your sales reps",
    ],
  },
  {
    id: "marketing",
    name: "Marketing Hub",
    tagline: "Omnichannel publishing, unified platform chats & live analytics",
    monthlyKes: PLAN_MARKETING_MONTHLY_KES,
    monthlyUsd: Math.round(PLAN_MARKETING_MONTHLY_KES / KES_PER_USD),
    features: [
      "Connect your brand's own YouTube, TikTok, IG, FB & LinkedIn",
      "Schedule & publish videos, reels, and multi-channel campaigns",
      "Unified multi-platform social chats & engagement tracking",
      "Live audience insights & AI-assisted campaign studio",
    ],
  },
  {
    id: "finance",
    name: "Finance & Billing",
    tagline: "Branded invoices, contracts, M-Pesa & Paystack settlements",
    monthlyKes: PLAN_FINANCE_MONTHLY_KES,
    monthlyUsd: Math.round(PLAN_FINANCE_MONTHLY_KES / KES_PER_USD),
    features: [
      "Generate branded invoices & digital agreements",
      "Accept M-Pesa STK Push & Card payments online",
      "Automatic receipting & payment reconciliation",
      "Real-time revenue & pending invoice dashboard",
    ],
  },
]

const VALID_DEPARTMENTS: OnboardingDepartmentId[] = ["sales", "marketing", "finance"]

export function normalizeDepartments(input: unknown): OnboardingDepartmentId[] {
  if (!Array.isArray(input)) return []
  const unique = new Set<OnboardingDepartmentId>()
  for (const item of input) {
    const clean = String(item || "").toLowerCase().trim() as OnboardingDepartmentId
    if (VALID_DEPARTMENTS.includes(clean)) {
      unique.add(clean)
    }
  }
  return VALID_DEPARTMENTS.filter((d) => unique.has(d))
}

export interface OnboardingPriceBreakdown {
  departments: OnboardingDepartmentId[]
  billingCycle: BillingCycle
  baseMonthlyKes: number
  effectiveMonthlyKes: number
  isAllInOneBundle: boolean
  bundleDiscountMonthlyKes: number
  totalKes: number
  totalUsd: number
  annualSavingsKes: number
}

/**
 * Server-authoritative modular pricing calculator.
 * - Individual departments sum their monthly rates.
 * - Selecting all 3 departments applies the All-in-One Bundle rate (20% savings by default).
 * - Annual billing charges 10 months for 12 months of access (2 months free).
 */
export function calculateOnboardingPrice(
  departmentsInput: unknown,
  billingCycleInput?: string | null
): OnboardingPriceBreakdown {
  const departments = normalizeDepartments(departmentsInput)
  const billingCycle: BillingCycle = billingCycleInput === "annual" ? "annual" : "monthly"

  const priceMap: Record<OnboardingDepartmentId, number> = {
    sales: PLAN_SALES_MONTHLY_KES,
    marketing: PLAN_MARKETING_MONTHLY_KES,
    finance: PLAN_FINANCE_MONTHLY_KES,
  }

  const baseMonthlyKes = departments.reduce((sum, d) => sum + priceMap[d], 0)
  const isAllInOneBundle = departments.length === 3
  const effectiveMonthlyKes = isAllInOneBundle
    ? Math.min(baseMonthlyKes, PLAN_ALL_IN_ONE_MONTHLY_KES)
    : baseMonthlyKes
  const bundleDiscountMonthlyKes = Math.max(0, baseMonthlyKes - effectiveMonthlyKes)

  // Annual = 10 months billed for 12 months of access (2 months free)
  const totalKes =
    billingCycle === "annual" ? effectiveMonthlyKes * 10 : effectiveMonthlyKes
  const annualSavingsKes =
    billingCycle === "annual" ? effectiveMonthlyKes * 2 : 0
  const totalUsd = Math.max(1, Math.round(totalKes / KES_PER_USD))

  return {
    departments,
    billingCycle,
    baseMonthlyKes,
    effectiveMonthlyKes,
    isAllInOneBundle,
    bundleDiscountMonthlyKes,
    totalKes,
    totalUsd,
    annualSavingsKes,
  }
}

export function formatKes(amount: number): string {
  return `KES ${Math.round(amount).toLocaleString("en-US")}`
}
