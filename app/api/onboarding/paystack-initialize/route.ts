import { NextResponse } from "next/server"
import { createClient as createServerSupabase } from "@/lib/supabase/server"
import {
  generatePaymentReference,
  initializePaystackTransaction,
  isPaystackConfigured,
} from "@/lib/paystack"
import { calculateOnboardingPrice } from "@/lib/onboarding-plans"
import { getOnboardingServiceSupabase } from "@/lib/onboarding-provision"

export async function POST(request: Request) {
  try {
    if (!isPaystackConfigured()) {
      return NextResponse.json(
        {
          error:
            "Card checkout is not configured yet (PAYSTACK_SECRET_KEY missing). Please use M-Pesa Express or contact support.",
        },
        { status: 503 }
      )
    }

    const authClient = await createServerSupabase()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user || !user.email) {
      return NextResponse.json(
        { error: "Please sign in or create your account in Step 1 before checking out." },
        { status: 401 }
      )
    }

    const body = await request.json()
    const organizationName = String(body.organizationName || "").trim()
    const website = String(body.website || "").trim()
    const upgradeOrgId = String(body.upgradeOrganizationId || "").trim() || null
    const upgradeOrgSlug = String(body.upgradeOrganizationSlug || "").trim() || null
    const returnPath = String(body.returnPath || "/signup").startsWith("/")
      ? String(body.returnPath || "/signup")
      : "/signup"
    const fullName =
      String(body.fullName || "").trim() ||
      String(user.user_metadata?.full_name || user.user_metadata?.name || "").trim() ||
      user.email.split("@")[0]
    const phone = String(body.phone || "").trim()
    const pricing = calculateOnboardingPrice(body.departments, body.billingCycle)

    if (!organizationName || organizationName.length < 2) {
      return NextResponse.json(
        { error: "Please enter your organization or company name." },
        { status: 400 }
      )
    }

    if (pricing.departments.length === 0 || pricing.totalKes <= 0) {
      return NextResponse.json(
        { error: "Select at least one department (Sales, Marketing, or Finance)." },
        { status: 400 }
      )
    }

    const db = getOnboardingServiceSupabase()
    const reference = generatePaymentReference("CIL-ORG")

    const { data: pendingSub, error: insertErr } = await db
      .from("organization_subscriptions")
      .insert({
        organization_id: upgradeOrgId,
        organization_slug: upgradeOrgSlug,
        owner_user_id: user.id,
        owner_email: user.email.toLowerCase().trim(),
        owner_name: fullName,
        owner_phone: phone || null,
        organization_name: organizationName,
        organization_website: website || null,
        departments: pricing.departments,
        billing_cycle: pricing.billingCycle,
        amount_kes: pricing.totalKes,
        amount_usd: pricing.totalUsd,
        currency: "KES",
        status: "pending_payment",
        payment_provider: "paystack_card",
        paystack_reference: reference,
      })
      .select("id")
      .single()

    if (insertErr || !pendingSub?.id) {
      console.error("[Onboarding Paystack Init] Insert error:", insertErr)
      return NextResponse.json(
        {
          error:
            "Could not initialize organization subscription. Please ensure the organization_subscriptions table migration has been applied.",
          details: insertErr?.message,
        },
        { status: 500 }
      )
    }

    const protocol = request.headers.get("x-forwarded-proto") || "https"
    const host = request.headers.get("host") || "www.cillah.dev"
    const origin = `${protocol}://${host}`
    const sep = returnPath.includes("?") ? "&" : "?"
    const callbackUrl = `${origin}${returnPath}${sep}paystack_ref=${encodeURIComponent(
      reference
    )}&subId=${encodeURIComponent(pendingSub.id)}`

    const init = await initializePaystackTransaction({
      email: user.email,
      amountMajor: pricing.totalKes,
      currency: "KES",
      reference,
      callbackUrl,
      channels: ["card", "mobile_money", "apple_pay"],
      metadata: {
        kind: "org_onboarding",
        subscriptionId: pendingSub.id,
        organizationName,
        departments: pricing.departments,
        billingCycle: pricing.billingCycle,
      },
    })

    return NextResponse.json({
      success: true,
      subscriptionId: pendingSub.id,
      reference: init.reference,
      authorizationUrl: init.authorization_url,
    })
  } catch (err: any) {
    console.error("[Onboarding Paystack Init] Error:", err)
    return NextResponse.json(
      { error: err?.message || "Failed to initialize Paystack checkout" },
      { status: 500 }
    )
  }
}
