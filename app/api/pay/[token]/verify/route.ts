import { NextRequest, NextResponse } from "next/server"
import { verifyPaystackTransaction } from "@/lib/paystack"
import {
  getServiceSupabase,
  settleInvoiceAndAdvancePipeline,
} from "@/lib/finance-settlement"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params
    const reference = (
      request.nextUrl.searchParams.get("reference") ||
      request.nextUrl.searchParams.get("trxref") ||
      ""
    ).trim()

    if (!reference) {
      return NextResponse.json({ error: "Payment reference is required." }, { status: 400 })
    }

    const db = getServiceSupabase()
    const { data: invoice } = await db
      .from("finance_invoices")
      .select("*")
      .eq("public_token", String(token || "").trim())
      .maybeSingle()

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 })
    }

    if (invoice.status === "payment_made") {
      return NextResponse.json({
        status: "payment_made",
        invoice,
      })
    }

    const tx = await verifyPaystackTransaction(reference)
    if (tx.status !== "success") {
      return NextResponse.json({
        status: tx.status,
        message: tx.gateway_response || "Payment was not completed.",
      })
    }

    const paidMajor = Math.round(Number(tx.amount) / 100)
    if (paidMajor < Number(invoice.amount_kes)) {
      return NextResponse.json(
        { error: "Paid amount is less than the agreed invoice total." },
        { status: 400 }
      )
    }

    const paymentMethod =
      String(tx.channel || "").toLowerCase() === "mobile_money"
        ? "paystack_mpesa"
        : "paystack_card"

    const settled = await settleInvoiceAndAdvancePipeline({
      invoiceId: invoice.id,
      paymentMethod,
      paymentReference: tx.reference,
      paidAmount: paidMajor,
    })

    return NextResponse.json({
      status: "payment_made",
      invoice: settled.invoice,
    })
  } catch (err: any) {
    console.error("[Paystack Invoice Verify] Error:", err)
    return NextResponse.json(
      { error: err?.message || "Could not verify payment" },
      { status: 500 }
    )
  }
}
