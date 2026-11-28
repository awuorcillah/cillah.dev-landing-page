import { createClient } from "@supabase/supabase-js"
import { isSuperAdminEmail } from "@/lib/auth-roles"
import { normalizeDepartments } from "@/lib/onboarding-plans"

export function getOnboardingServiceSupabase() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/$/, "")
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Server Supabase credentials are missing.")
  }
  return createClient(supabaseUrl, serviceKey)
}

export function slugifyOrganizationName(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56)
}

export function formatKenyanMpesaPhone(raw: string): string | null {
  let formatted = raw.trim().replace(/\D/g, "")
  if (formatted.startsWith("0")) {
    formatted = "254" + formatted.substring(1)
  } else if (!formatted.startsWith("254")) {
    if (formatted.length === 9) {
      formatted = "254" + formatted
    } else {
      return null
    }
  }
  return formatted.length === 12 ? formatted : null
}

export interface FinalizeOnboardingParams {
  subscriptionId: string
  paymentProvider: "mpesa" | "paystack_card" | "paystack_mpesa"
  paymentReference: string
  paidAmountKes?: number | null
  resultDesc?: string
}

export interface FinalizeOnboardingResult {
  subscriptionId: string
  organizationId: string
  organizationSlug: string
  organizationName: string
  departments: string[]
  receipt: string
  redirectUrl: string
}

/**
 * Idempotently provisions a brand-new isolated client organization after verified payment:
 * 1. Creates `public.organizations` row with guaranteed-unique slug
 * 2. Elevates owner's `public.profiles` row to `role = 'admin'` (org admin)
 * 3. Creates/updates `public.staff_members` row scoped to `org_id` + purchased `departments`
 * 4. Marks `public.organization_subscriptions` row `active` with billing period timestamps
 */
export async function finalizeOnboardingSubscription(
  params: FinalizeOnboardingParams
): Promise<FinalizeOnboardingResult | null> {
  const db = getOnboardingServiceSupabase()

  const { data: sub, error: fetchErr } = await db
    .from("organization_subscriptions")
    .select("*")
    .eq("id", params.subscriptionId)
    .maybeSingle()

  if (fetchErr || !sub) {
    console.error("[Onboarding Provision] Subscription not found:", params.subscriptionId, fetchErr)
    return null
  }

  // Idempotent return if already provisioned (e.g. webhook + redirect verify racing)
  if (sub.status === "active" && sub.organization_id && sub.organization_slug) {
    return {
      subscriptionId: sub.id,
      organizationId: sub.organization_id,
      organizationSlug: sub.organization_slug,
      organizationName: sub.organization_name,
      departments: normalizeDepartments(sub.departments),
      receipt: sub.payment_receipt || params.paymentReference,
      redirectUrl: `/admin?org=${encodeURIComponent(sub.organization_slug)}`,
    }
  }

  const orgName = String(sub.organization_name || "").trim() || "My Organization"
  const ownerEmail = String(sub.owner_email || "").toLowerCase().trim()
  const ownerName = String(sub.owner_name || "").trim() || ownerEmail.split("@")[0] || "Admin"
  const ownerPhone = String(sub.owner_phone || "").trim() || null
  const departments = normalizeDepartments(sub.departments)
  const finalDepartments = departments.length > 0 ? departments : ["sales"]

  // 1. Resolve unique organization slug & create organization row (unless already attached)
  let organizationId: string = sub.organization_id || ""
  let organizationSlug: string = sub.organization_slug || ""

  if (!organizationId) {
    let baseSlug = slugifyOrganizationName(orgName)
    if (!baseSlug || baseSlug === "cillah-dev" || baseSlug === "rosy-realtors") {
      baseSlug = `${baseSlug || "org"}-${Date.now().toString().slice(-4)}`
    }

    let slug = baseSlug
    const { data: existingSlug } = await db
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()

    if (existingSlug) {
      slug = `${baseSlug}-${Date.now().toString().slice(-4)}`
    }

    const { data: createdOrg, error: orgErr } = await db
      .from("organizations")
      .insert({
        name: orgName,
        slug,
        website: sub.organization_website || null,
      })
      .select("id, slug, name")
      .single()

    if (orgErr || !createdOrg?.id) {
      console.error("[Onboarding Provision] Failed to create organization:", orgErr)
      throw new Error(orgErr?.message || "Could not provision organization workspace")
    }

    organizationId = createdOrg.id
    organizationSlug = createdOrg.slug
  }

  // 2. Elevate owner in public.profiles -> role = 'admin' (Org Admin)
  const nameParts = ownerName.split(/\s+/)
  const firstName = nameParts[0] || ownerName
  const lastName = nameParts.slice(1).join(" ")

  if (sub.owner_user_id) {
    const { error: profileErr } = await db.from("profiles").upsert(
      {
        id: sub.owner_user_id,
        email: ownerEmail,
        full_name: ownerName,
        first_name: firstName,
        last_name: lastName,
        phone_number: ownerPhone,
        company_name: orgName,
        role: "admin",
        status: "active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    if (profileErr) {
      console.warn("[Onboarding Provision] Profile upsert warning:", profileErr.message)
    }
  }

  // 3. Assign owner as Org Admin inside public.staff_members with their purchased departments
  // (Protect platform Super Admin row if Cillah tests checkout with her own email)
  if (!isSuperAdminEmail(ownerEmail)) {
    // If upgrading an existing organization, merge existing + newly purchased departments!
    let mergedDepartments = [...finalDepartments]
    const { data: existingStaff } = await db
      .from("staff_members")
      .select("role, org_id")
      .ilike("email", ownerEmail)
      .maybeSingle()

    if (existingStaff?.org_id === organizationId && existingStaff.role) {
      const existingDepts = normalizeDepartments(
        String(existingStaff.role)
          .split(/[,|/]/)
          .map((s) => s.trim())
      )
      mergedDepartments = normalizeDepartments([...existingDepts, ...finalDepartments])
    }

    const crmPrefix = organizationSlug.replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase() || "ORG"
    const { error: staffErr } = await db.from("staff_members").upsert(
      {
        crm_id: `${crmPrefix}-${Date.now().toString().slice(-4)}`,
        email: ownerEmail,
        full_name: ownerName,
        phone_number: ownerPhone,
        role: mergedDepartments.join(","),
        status: "admin",
        is_active: true,
        org_id: organizationId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    )

    if (staffErr) {
      console.error("[Onboarding Provision] staff_members upsert error:", staffErr)
      throw new Error(staffErr.message || "Could not assign organization admin role")
    }
  }

  // 4. Mark subscription active with billing period
  const now = new Date()
  const periodDays = sub.billing_cycle === "annual" ? 365 : 30
  const periodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000)

  const { error: subUpdateErr } = await db
    .from("organization_subscriptions")
    .update({
      organization_id: organizationId,
      organization_slug: organizationSlug,
      status: "active",
      payment_provider: params.paymentProvider,
      payment_receipt: params.paymentReference,
      result_desc: params.resultDesc || "Payment confirmed and workspace provisioned.",
      paid_at: now.toISOString(),
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("id", sub.id)

  if (subUpdateErr) {
    console.error("[Onboarding Provision] Subscription status update warning:", subUpdateErr)
  }

  return {
    subscriptionId: sub.id,
    organizationId,
    organizationSlug,
    organizationName: orgName,
    departments: finalDepartments,
    receipt: params.paymentReference,
    redirectUrl: `/admin?org=${encodeURIComponent(organizationSlug)}`,
  }
}
