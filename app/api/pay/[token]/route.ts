import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/finance-settlement"
import { isPaystackConfigured } from "@/lib/paystack"

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params
    const cleanToken = String(token || "").trim()
    if (!cleanToken) {
      return NextResponse.json({ error: "Invalid payment link" }, { status: 400 })
    }

    const db = getServiceSupabase()
    const { data: invoice, error } = await db
      .from("finance_invoices")
      .select(
        "id, org_id, org_slug, invoice_number, public_token, client_name, client_email, client_phone, client_company, title, description, invoice_type, amount_kes, currency, allowed_methods, contract_url, contract_name, contract_notes, status, payment_method, payment_reference, paid_amount, paid_at, due_date, created_at"
      )
      .eq("public_token", cleanToken)
      .maybeSingle()

    if (error || !invoice) {
      return NextResponse.json(
        { error: "This invoice link was not found or has expired." },
        { status: 404 }
      )
    }

    const { data: orgRow } = await db
      .from("organizations")
      .select("name, slug, website")
      .eq("id", invoice.org_id)
      .maybeSingle()

    return NextResponse.json({
      invoice,
      organization: orgRow || {
        name: invoice.org_slug === "rosy-realtors" ? "Rosy Realtors Nairobi" : "cillah.dev",
        slug: invoice.org_slug,
        website: invoice.org_slug === "rosy-realtors" ? "https://rosyrealtors.co.ke" : "https://www.cillah.dev",
      },
      paystackConfigured: isPaystackConfigured(),
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load invoice" },
      { status: 500 }
    )
  }
}
