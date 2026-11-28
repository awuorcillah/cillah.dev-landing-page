import { NextResponse } from "next/server"
import { getOnboardingServiceSupabase } from "@/lib/onboarding-provision"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const subId = (searchParams.get("subId") || "").trim()

    if (!subId || !UUID_REGEX.test(subId)) {
      return NextResponse.json({ error: "Valid subId is required" }, { status: 400 })
    }

    const db = getOnboardingServiceSupabase()
    const { data: row, error } = await db
      .from("organization_subscriptions")
      .select(
        "id, status, organization_id, organization_slug, organization_name, departments, payment_receipt, result_desc, paid_at"
      )
      .eq("id", subId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: "Could not check checkout status" }, { status: 500 })
    }

    if (!row) {
      return NextResponse.json({ error: "Checkout session not found" }, { status: 404 })
    }

    if (row.status === "active" && row.organization_slug) {
      return NextResponse.json({
        status: "active",
        subscriptionId: row.id,
        organizationId: row.organization_id,
        organizationSlug: row.organization_slug,
        organizationName: row.organization_name,
        departments: row.departments || [],
        receipt: row.payment_receipt || "",
        paidAt: row.paid_at,
        redirectUrl: `/admin?org=${encodeURIComponent(row.organization_slug)}`,
      })
    }

    if (row.status === "cancelled" || row.status === "failed") {
      return NextResponse.json({
        status: row.status,
        resultDesc: row.result_desc || "Payment was not completed.",
      })
    }

    return NextResponse.json({
      status: "pending_payment",
    })
  } catch (err: any) {
    console.error("[Onboarding Status] Error:", err)
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
