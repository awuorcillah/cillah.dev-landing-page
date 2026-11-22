import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function getServiceSupabase() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/$/, "")
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing Supabase service role credentials")
  }
  return createClient(supabaseUrl, serviceKey)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get("bookingId")?.trim() || ""

    if (!bookingId || !UUID_REGEX.test(bookingId)) {
      return NextResponse.json({ error: "Valid bookingId is required" }, { status: 400 })
    }

    const supabase = getServiceSupabase()
    const { data: row, error } = await supabase
      .from("consultation_payments")
      .select(
        "id, status, mpesa_receipt, mpesa_result_desc, paid_at, google_meet_url, calendar_event_url"
      )
      .eq("id", bookingId)
      .maybeSingle()

    if (error) {
      console.error("[Mpesa Status] Supabase read error:", error)
      return NextResponse.json({ error: "Could not check payment status" }, { status: 500 })
    }

    if (!row) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Only unlock Google Meet & confirmed status after Safaricom callback verified payment AND finalized links
    if (row.status === "paid" && row.google_meet_url) {
      return NextResponse.json({
        status: "paid",
        mpesaReceipt: row.mpesa_receipt || "",
        paidAt: row.paid_at,
        googleMeetUrl: row.google_meet_url,
        calendarEventUrl: row.calendar_event_url || "",
      })
    }

    if (row.status === "cancelled" || row.status === "failed") {
      return NextResponse.json({
        status: row.status,
        resultDesc: row.mpesa_result_desc || "Payment was not completed.",
      })
    }

    return NextResponse.json({
      status: "pending_payment",
    })
  } catch (error: any) {
    console.error("[Mpesa Status] Exception:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
