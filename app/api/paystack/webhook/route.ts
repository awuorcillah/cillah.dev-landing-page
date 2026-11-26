import { NextResponse } from "next/server"
import { verifyPaystackWebhookSignature } from "@/lib/paystack"
import { finalizeConfirmedConsultation } from "@/lib/consultation-confirm"
import {
  getServiceSupabase,
  settleInvoiceAndAdvancePipeline,
} from "@/lib/finance-settlement"

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get("x-paystack-signature")

    if (!verifyPaystackWebhookSignature(rawBody, signature)) {
      console.warn("[Paystack Webhook] Invalid or missing x-paystack-signature header")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const event = JSON.parse(rawBody)
    if (event?.event !== "charge.success") {
      return NextResponse.json({ received: true, ignored: event?.event || "unknown" })
    }

    const data = event.data || {}
    const reference: string = String(data.reference || "").trim()
    const channel: string = String(data.channel || "card").toLowerCase()
    const paidMajor = Math.round(Number(data.amount || 0) / 100)
    const metadata = data.metadata || {}
    const supabase = getServiceSupabase()

    // Case 1: Consultation booking card payment
    if (metadata.kind === "consultation" || reference.startsWith("CIL-CONSULT-")) {
      let bookingId: string | null = metadata.bookingId || null
      if (!bookingId && reference) {
        const { data: row } = await supabase
          .from("consultation_payments")
          .select("id")
          .eq("paystack_reference", reference)
          .maybeSingle()
        bookingId = row?.id || null
      }

      if (bookingId) {
        await finalizeConfirmedConsultation({
          bookingId,
          paymentProvider: "paystack_card",
          receipt: reference,
          paidAmountKes: paidMajor,
          resultDesc: data.gateway_response || "Verified via Paystack webhook.",
          paystackChannel: channel,
        })
      }

      return NextResponse.json({ received: true, kind: "consultation" })
    }

    // Case 2: Finance Department client invoice payment (Card OR M-Pesa via Paystack)
    if (metadata.kind === "finance_invoice" || reference.startsWith("CIL-INV-")) {
      let invoiceId: string | null = metadata.invoiceId || null
      if (!invoiceId && reference) {
        const { data: row } = await supabase
          .from("finance_invoices")
          .select("id")
          .eq("payment_reference", reference)
          .maybeSingle()
        invoiceId = row?.id || null
      }

      if (invoiceId) {
        const paymentMethod =
          channel === "mobile_money" ? "paystack_mpesa" : "paystack_card"
        await settleInvoiceAndAdvancePipeline({
          invoiceId,
          paymentMethod,
          paymentReference: reference,
          paidAmount: paidMajor,
        })
      }

      return NextResponse.json({ received: true, kind: "finance_invoice" })
    }

    return NextResponse.json({ received: true, kind: "unmatched" })
  } catch (err: any) {
    console.error("[Paystack Webhook] Error:", err)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
