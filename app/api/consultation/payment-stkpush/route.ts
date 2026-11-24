import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  CONSULTATION_PRICE_KES,
  CONSULTATION_PRICE_USD,
} from "@/lib/consultation-price"

function getServiceSupabase() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/$/, "")
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Server Supabase credentials (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) are missing.")
  }
  return createClient(supabaseUrl, serviceKey)
}

function formatKenyanPhone(raw: string): string | null {
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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      fullName,
      email,
      phone,
      mpesaPhone,
      agencyName = "",
      websiteUrl = "N/A",
      bottlenecks = "",
      scheduledAt,
    } = body

    const rawMpesaPhone = String(mpesaPhone || phone || "").trim()
    if (!rawMpesaPhone) {
      return NextResponse.json({ error: "M-Pesa phone number is required" }, { status: 400 })
    }

    if (!fullName || !email || !scheduledAt) {
      return NextResponse.json(
        { error: "Full name, email, and appointment time are required before payment." },
        { status: 400 }
      )
    }

    const formattedPhone = formatKenyanPhone(rawMpesaPhone)
    if (!formattedPhone) {
      return NextResponse.json(
        { error: "Invalid M-Pesa phone number. Use 07xxxxxxxx, 01xxxxxxxx, or 2547xxxxxxxx." },
        { status: 400 }
      )
    }

    const parsedDate = new Date(scheduledAt)
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid appointment date/time." }, { status: 400 })
    }

    // Enforce strict 24-hour minimum advance notice server-side
    const minAdvanceMs = Date.now() + 24 * 60 * 60 * 1000
    if (parsedDate.getTime() < minAdvanceMs) {
      return NextResponse.json(
        { error: "Consultations must be booked at least 24 hours in advance. Please pick a later slot." },
        { status: 400 }
      )
    }

    const supabase = getServiceSupabase()

    // 1. Insert pending_payment booking record in Supabase FIRST (server-enforced amount)
    const { data: pendingBooking, error: insertError } = await supabase
      .from("consultation_payments")
      .insert({
        full_name: String(fullName).trim(),
        email: String(email).toLowerCase().trim(),
        phone: String(phone || formattedPhone).trim(),
        mpesa_phone: formattedPhone,
        agency_name: String(agencyName || "").trim(),
        website_url: String(websiteUrl || "N/A").trim(),
        bottlenecks: String(bottlenecks || "").trim(),
        scheduled_at: parsedDate.toISOString(),
        amount_kes: CONSULTATION_PRICE_KES,
        amount_usd: CONSULTATION_PRICE_USD,
        status: "pending_payment",
      })
      .select("id")
      .single()

    if (insertError || !pendingBooking?.id) {
      console.error("[Mpesa STK] Failed to create pending_payment row:", insertError)
      return NextResponse.json(
        {
          error:
            "Could not initialize payment record. Please verify the consultation_payments table exists in Supabase.",
          details: insertError?.message,
        },
        { status: 500 }
      )
    }

    const bookingId: string = pendingBooking.id

    // Production Safaricom Daraja credentials
    const consumerKey = process.env.MPESA_CONSUMER_KEY || "jBA6rPD3TV50UgIL8AdiPcf1cbmTod9G5GQ8WlyxMDYSKIrh"
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET || "WGoQmnKI2DUq9S5CoqoQZrZm9LU7gjrMZ5jbabAGA8rOnGKv2pLK4G8cU5IeKxHs"
    const businessShortCode = process.env.MPESA_SHORTCODE || "4339129"
    const tillNumber = "3513268"
    const passkey = process.env.MPESA_PASSKEY || "eed2fce2619607467014bbee3f916a1c6781a74dcc0bfef1b7f2cd8e268ec506"

    // 2. Get OAuth Access Token from Safaricom
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")
    console.log("[Mpesa STK] Requesting OAuth access token for booking", bookingId)

    let accessToken = ""
    try {
      const authResponse = await fetch(
        "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
        {
          method: "GET",
          headers: { Authorization: `Basic ${auth}` },
        }
      )

      if (!authResponse.ok) {
        const errText = await authResponse.text()
        console.error("Safaricom Auth Error Response:", errText)
        throw new Error(`Safaricom OAuth failed: ${authResponse.statusText}`)
      }

      const authData = await authResponse.json()
      accessToken = authData.access_token
    } catch (e: any) {
      console.error("Safaricom OAuth Exception:", e)
      await supabase
        .from("consultation_payments")
        .update({
          status: "failed",
          mpesa_result_desc: e.message || "Safaricom OAuth failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId)

      return NextResponse.json(
        {
          error: "Failed to authenticate with Safaricom. STK Push cannot be sent.",
          details: e.message,
        },
        { status: 502 }
      )
    }

    // 3. Prepare STK Push Payload with bookingId in CallBackURL
    const now = new Date()
    const eatDate = new Date(now.getTime() + 3 * 60 * 60 * 1000)
    const pad = (n: number) => n.toString().padStart(2, "0")
    const timestamp =
      eatDate.getUTCFullYear().toString() +
      pad(eatDate.getUTCMonth() + 1) +
      pad(eatDate.getUTCDate()) +
      pad(eatDate.getUTCHours()) +
      pad(eatDate.getUTCMinutes()) +
      pad(eatDate.getUTCSeconds())

    const password = Buffer.from(businessShortCode + passkey + timestamp).toString("base64")

    const protocol = request.headers.get("x-forwarded-proto") || "https"
    const host = request.headers.get("host") || "www.cillah.dev"
    const callbackUrl = `${protocol}://${host}/api/consultation/mpesa-callback?bookingId=${encodeURIComponent(bookingId)}`

    const stkPayload = {
      BusinessShortCode: businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerBuyGoodsOnline",
      Amount: String(CONSULTATION_PRICE_KES),
      PartyA: formattedPhone,
      PartyB: tillNumber,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: "CillahStrategy",
      TransactionDesc: "1-on-1 AI Strategy Call",
    }

    console.log(
      "[Mpesa STK] Sending STK Push for KES",
      CONSULTATION_PRICE_KES,
      "to",
      formattedPhone,
      "bookingId=",
      bookingId
    )

    const stkResponse = await fetch(
      "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(stkPayload),
      }
    )

    const responseText = await stkResponse.text()
    let stkData: any
    try {
      stkData = JSON.parse(responseText)
    } catch {
      stkData = { raw: responseText }
    }

    console.log("[Mpesa STK] Safaricom response:", stkData)

    if (!stkResponse.ok || stkData.ResponseCode !== "0") {
      const errMsg =
        stkData.errorMessage ||
        stkData.ResponseDescription ||
        "Safaricom rejected the STK Push request"

      await supabase
        .from("consultation_payments")
        .update({
          status: "failed",
          mpesa_result_desc: errMsg,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId)

      return NextResponse.json({ error: errMsg, details: stkData }, { status: 400 })
    }

    // 4. Save Safaricom CheckoutRequestID & MerchantRequestID on the pending booking
    await supabase
      .from("consultation_payments")
      .update({
        checkout_request_id: stkData.CheckoutRequestID || null,
        merchant_request_id: stkData.MerchantRequestID || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)

    return NextResponse.json({
      success: true,
      message: "M-Pesa PIN prompt sent. Enter your PIN on your phone to confirm your booking.",
      bookingId,
      checkoutRequestId: stkData.CheckoutRequestID,
      merchantRequestId: stkData.MerchantRequestID,
      phone: formattedPhone,
    })
  } catch (error: any) {
    console.error("Error initiating STK push:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error initiating STK push" },
      { status: 500 }
    )
  }
}
