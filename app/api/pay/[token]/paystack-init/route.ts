import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/finance-settlement"
import {
  generatePaymentReference,
  initializePaystackTransaction,
  isPaystackConfigured,
  type PaystackChannel,
} from "@/lib/paystack"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    if (!isPaystackConfigured()) {
      return NextResponse.json(
        {
          error:
            "Paystack is not configured on the server yet. Add PAYSTACK_SECRET_KEY in Vercel / .env.local to activate live Card & Paystack M-Pesa checkout.",
        },
        { status: 503 }
      )
    }

    const { token } = await context.params
    const body = await request.json().catch(() => ({}))
    const method: "card" | "mpesa" = body.method === "mpesa" ? "mpesa" : "card"
    const payerEmailInput = String(body.email || "").trim().toLowerCase()

    const db = getServiceSupabase()
    const { data: invoice, error } = await db
      .from("finance_invoices")
      .select("*")
      .eq("public_token", String(token || "").trim())
      .maybeSingle()

    if (error || !invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 })
    }

    if (invoice.status === "payment_made") {
      return NextResponse.json(
        { error: "This invoice has already been paid.", alreadyPaid: true },
        { status: 400 }
      )
    }

    if (invoice.status === "cancelled") {
      return NextResponse.json({ error: "This invoice has been cancelled." }, { status: 400 })
    }

    // Validate M-Pesa per-transaction limit (Safaricom cap: KES 150,000)
    if (method === "mpesa" && Number(invoice.amount_kes) > 150000) {
      return NextResponse.json(
        {
          error:
            "Safaricom M-Pesa has a maximum limit of KES 150,000 per single transaction. Please select Card (Visa / Mastercard) for amounts above KES 150,000.",
        },
        { status: 400 }
      )
    }

    const email = payerEmailInput || invoice.client_email || "atulah@cillah.dev"
    const reference = generatePaymentReference("CIL-INV")

    const protocol = request.headers.get("x-forwarded-proto") || "https"
    const host = request.headers.get("host") || "www.cillah.dev"
    const callbackUrl = `${protocol}://${host}/pay/${encodeURIComponent(
      invoice.public_token
    )}?paystack_ref=${encodeURIComponent(reference)}`

    const channels: PaystackChannel[] =
      method === "mpesa" ? ["mobile_money"] : ["card", "apple_pay"]

    const init = await initializePaystackTransaction({
      email,
      amountMajor: Number(invoice.amount_kes),
      currency: "KES",
      reference,
      callbackUrl,
      channels,
      metadata: {
        kind: "finance_invoice",
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        orgId: invoice.org_id,
        orgSlug: invoice.org_slug,
        leadId: invoice.lead_id,
        clientName: invoice.client_name,
        chosenMethod: method,
      },
    })

    // Store latest Paystack reference on invoice for webhook/verify lookup
    await db
      .from("finance_invoices")
      .update({
        payment_reference: reference,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoice.id)

    return NextResponse.json({
      success: true,
      reference: init.reference,
      authorizationUrl: init.authorization_url,
    })
  } catch (err: any) {
    console.error("[Paystack Invoice Init] Error:", err)
    return NextResponse.json(
      { error: err?.message || "Failed to initialize Paystack checkout" },
      { status: 500 }
    )
  }
}
