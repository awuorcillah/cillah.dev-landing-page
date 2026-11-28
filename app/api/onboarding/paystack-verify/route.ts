import { NextResponse } from "next/server"
import { verifyPaystackTransaction } from "@/lib/paystack"
import {
  finalizeOnboardingSubscription,
  getOnboardingServiceSupabase,
} from "@/lib/onboarding-provision"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = (searchParams.get("reference") || searchParams.get("trxref") || "").trim()
    const subIdParam = (searchParams.get("subId") || "").trim()

    if (!reference) {
      return NextResponse.json({ error: "Payment reference is required" }, { status: 400 })
    }

    const db = getOnboardingServiceSupabase()

    let subRow: any = null
    const { data: byRef } = await db
      .from("organization_subscriptions")
      .select("*")
      .eq("paystack_reference", reference)
      .maybeSingle()
    subRow = byRef

    if (!subRow && subIdParam) {
      const { data: byId } = await db
        .from("organization_subscriptions")
        .select("*")
        .eq("id", subIdParam)
        .maybeSingle()
      subRow = byId
    }

    if (!subRow) {
      return NextResponse.json({ error: "Subscription checkout record not found" }, { status: 404 })
    }

    if (subRow.status === "active" && subRow.organization_slug) {
      return NextResponse.json({
        status: "active",
        subscriptionId: subRow.id,
        organizationId: subRow.organization_id,
        organizationSlug: subRow.organization_slug,
        organizationName: subRow.organization_name,
        departments: subRow.departments || [],
        receipt: subRow.payment_receipt || reference,
        redirectUrl: `/admin?org=${encodeURIComponent(subRow.organization_slug)}`,
      })
    }

    // Verify directly with Paystack API server-side
    const tx = await verifyPaystackTransaction(reference)

    if (tx.status !== "success") {
      if (tx.status === "failed" || tx.status === "abandoned") {
        await db
          .from("organization_subscriptions")
          .update({
            status: tx.status === "abandoned" ? "cancelled" : "failed",
            result_desc: tx.gateway_response || "Payment was not completed.",
            updated_at: new Date().toISOString(),
          })
          .eq("id", subRow.id)
          .eq("status", "pending_payment")
      }

      return NextResponse.json({
        status: tx.status === "abandoned" ? "cancelled" : tx.status,
        resultDesc: tx.gateway_response || "Payment has not succeeded yet.",
      })
    }

    const paidMajor = Math.round(Number(tx.amount) / 100)
    if (paidMajor < Number(subRow.amount_kes)) {
      return NextResponse.json(
        { error: "Paid amount does not match selected workspace plan." },
        { status: 400 }
      )
    }

    const provider =
      String(tx.channel || "").toLowerCase() === "mobile_money"
        ? "paystack_mpesa"
        : "paystack_card"

    const provisioned = await finalizeOnboardingSubscription({
      subscriptionId: subRow.id,
      paymentProvider: provider,
      paymentReference: tx.reference,
      paidAmountKes: paidMajor,
      resultDesc: tx.gateway_response || "Verified via Paystack checkout.",
    })

    if (!provisioned) {
      return NextResponse.json(
        { error: "Payment succeeded, but workspace provisioning failed. Contact support with your receipt." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: "active",
      ...provisioned,
    })
  } catch (err: any) {
    console.error("[Onboarding Paystack Verify] Error:", err)
    return NextResponse.json(
      { error: err?.message || "Failed to verify Paystack payment" },
      { status: 500 }
    )
  }
}
