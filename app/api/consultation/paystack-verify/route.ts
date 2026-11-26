import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { verifyPaystackTransaction } from "@/lib/paystack"
import { finalizeConfirmedConsultation } from "@/lib/consultation-confirm"

function getServiceSupabase() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/$/, "")
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Server Supabase credentials are missing.")
  }
  return createClient(supabaseUrl, serviceKey)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = (searchParams.get("reference") || searchParams.get("trxref") || "").trim()
    const bookingIdParam = (searchParams.get("bookingId") || "").trim()

    if (!reference) {
      return NextResponse.json({ error: "Payment reference is required" }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    // Find matching consultation_payments row
    let bookingRow: any = null
    const { data: byRef } = await supabase
      .from("consultation_payments")
      .select("*")
      .eq("paystack_reference", reference)
      .maybeSingle()
    bookingRow = byRef

    if (!bookingRow && bookingIdParam) {
      const { data: byId } = await supabase
        .from("consultation_payments")
        .select("*")
        .eq("id", bookingIdParam)
        .maybeSingle()
      bookingRow = byId
    }

    if (!bookingRow) {
      return NextResponse.json({ error: "Booking record not found" }, { status: 404 })
    }

    // If already confirmed, return existing confirmation immediately
    if (bookingRow.status === "paid" && bookingRow.google_meet_url) {
      return NextResponse.json({
        status: "paid",
        bookingId: bookingRow.id,
        receipt: bookingRow.mpesa_receipt || reference,
        googleMeetUrl: bookingRow.google_meet_url,
        calendarEventUrl: bookingRow.calendar_event_url || "",
        fullName: bookingRow.full_name,
        scheduledAt: bookingRow.scheduled_at,
      })
    }

    // Verify directly with Paystack API server-side
    const tx = await verifyPaystackTransaction(reference)

    if (tx.status !== "success") {
      if (tx.status === "failed" || tx.status === "abandoned") {
        await supabase
          .from("consultation_payments")
          .update({
            status: tx.status === "abandoned" ? "cancelled" : "failed",
            mpesa_result_desc: tx.gateway_response || "Card payment was not completed.",
            updated_at: new Date().toISOString(),
          })
          .eq("id", bookingRow.id)
          .eq("status", "pending_payment")
      }

      return NextResponse.json({
        status: tx.status === "abandoned" ? "cancelled" : tx.status,
        resultDesc: tx.gateway_response || "Card payment has not succeeded yet.",
      })
    }

    // Verify paid amount matches expected KES amount (Paystack returns subunits)
    const paidMajor = Math.round(Number(tx.amount) / 100)
    if (paidMajor < Number(bookingRow.amount_kes)) {
      return NextResponse.json(
        { error: "Paid amount does not match consultation fee." },
        { status: 400 }
      )
    }

    const confirmed = await finalizeConfirmedConsultation({
      bookingId: bookingRow.id,
      paymentProvider: "paystack_card",
      receipt: tx.reference,
      paidAmountKes: paidMajor,
      resultDesc: tx.gateway_response || "Card payment verified via Paystack.",
      paystackChannel: tx.channel || "card",
    })

    if (!confirmed) {
      return NextResponse.json(
        { error: "Payment succeeded but booking confirmation encountered an error." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: "paid",
      bookingId: confirmed.bookingId,
      receipt: confirmed.receipt,
      googleMeetUrl: confirmed.googleMeetUrl,
      calendarEventUrl: confirmed.calendarEventUrl,
      fullName: confirmed.fullName || bookingRow.full_name,
      scheduledAt: confirmed.scheduledAt || bookingRow.scheduled_at,
    })
  } catch (err: any) {
    console.error("[Paystack Consult Verify] Error:", err)
    return NextResponse.json(
      { error: err?.message || "Failed to verify card payment" },
      { status: 500 }
    )
  }
}
