import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  CONSULTATION_PRICE_KES,
  CONSULTATION_PRICE_USD,
} from "@/lib/consultation-price"
import {
  generatePaymentReference,
  initializePaystackTransaction,
  isPaystackConfigured,
} from "@/lib/paystack"

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

export async function POST(request: Request) {
  try {
    if (!isPaystackConfigured()) {
      return NextResponse.json(
        {
          error:
            "Card checkout is almost ready — PAYSTACK_SECRET_KEY has not been added to Vercel / .env.local yet.",
        },
        { status: 503 }
      )
    }

    const body = await request.json()
    const {
      fullName,
      email,
      phone,
      agencyName = "",
      websiteUrl = "N/A",
      bottlenecks = "",
      scheduledAt,
    } = body

    if (!fullName || !email || !scheduledAt) {
      return NextResponse.json(
        { error: "Full name, email, and appointment time are required before payment." },
        { status: 400 }
      )
    }

    const parsedDate = new Date(scheduledAt)
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid appointment date/time." }, { status: 400 })
    }

    const minAdvanceMs = Date.now() + 24 * 60 * 60 * 1000
    if (parsedDate.getTime() < minAdvanceMs) {
      return NextResponse.json(
        {
          error:
            "Consultations must be booked at least 24 hours in advance. Please pick a later slot.",
        },
        { status: 400 }
      )
    }

    const supabase = getServiceSupabase()
    const reference = generatePaymentReference("CIL-CONSULT")

    // 1. Create pending_payment row in consultation_payments (server-enforced amount)
    const { data: pendingBooking, error: insertError } = await supabase
      .from("consultation_payments")
      .insert({
        full_name: String(fullName).trim(),
        email: String(email).toLowerCase().trim(),
        phone: String(phone || "N/A").trim(),
        mpesa_phone: String(phone || "CARD").trim(),
        agency_name: String(agencyName || "").trim(),
        website_url: String(websiteUrl || "N/A").trim(),
        bottlenecks: String(bottlenecks || "").trim(),
        scheduled_at: parsedDate.toISOString(),
        amount_kes: CONSULTATION_PRICE_KES,
        amount_usd: CONSULTATION_PRICE_USD,
        status: "pending_payment",
        payment_provider: "paystack_card",
        paystack_reference: reference,
        currency: "KES",
      })
      .select("id")
      .single()

    if (insertError || !pendingBooking?.id) {
      console.error("[Paystack Consult Init] Supabase insert error:", insertError)
      return NextResponse.json(
        {
          error:
            "Could not initialize card checkout record. Ensure supabase/finance_paystack_and_documents_schema.sql has been executed.",
          details: insertError?.message,
        },
        { status: 500 }
      )
    }

    const protocol = request.headers.get("x-forwarded-proto") || "https"
    const host = request.headers.get("host") || "www.cillah.dev"
    const origin = `${protocol}://${host}`
    const callbackUrl = `${origin}/book-consultation?paystack_ref=${encodeURIComponent(
      reference
    )}&bookingId=${encodeURIComponent(pendingBooking.id)}`

    // 2. Initialize Paystack card-only checkout (works for local & international Visa/Mastercard/Apple Pay)
    const init = await initializePaystackTransaction({
      email: String(email).trim(),
      amountMajor: CONSULTATION_PRICE_KES,
      currency: "KES",
      reference,
      callbackUrl,
      channels: ["card", "apple_pay"],
      metadata: {
        kind: "consultation",
        bookingId: pendingBooking.id,
        fullName: String(fullName).trim(),
        agencyName: String(agencyName || "").trim(),
        scheduledAt: parsedDate.toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      bookingId: pendingBooking.id,
      reference: init.reference,
      authorizationUrl: init.authorization_url,
    })
  } catch (err: any) {
    console.error("[Paystack Consult Init] Error:", err)
    return NextResponse.json(
      { error: err?.message || "Failed to initialize card payment" },
      { status: 500 }
    )
  }
}
