import { NextResponse } from "next/server"
import { createClient as createServerSupabase } from "@/lib/supabase/server"
import { calculateOnboardingPrice } from "@/lib/onboarding-plans"
import {
  formatKenyanMpesaPhone,
  getOnboardingServiceSupabase,
} from "@/lib/onboarding-provision"

export async function POST(request: Request) {
  try {
    const authClient = await createServerSupabase()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user || !user.email) {
      return NextResponse.json(
        { error: "Please sign in or create your account in Step 1 before checking out." },
        { status: 401 }
      )
    }

    const body = await request.json()
    const organizationName = String(body.organizationName || "").trim()
    const website = String(body.website || "").trim()
    const fullName =
      String(body.fullName || "").trim() ||
      String(user.user_metadata?.full_name || user.user_metadata?.name || "").trim() ||
      user.email.split("@")[0]
    const rawMpesaPhone = String(body.mpesaPhone || body.phone || "").trim()
    const pricing = calculateOnboardingPrice(body.departments, body.billingCycle)

    if (!organizationName || organizationName.length < 2) {
      return NextResponse.json(
        { error: "Please enter your organization or company name." },
        { status: 400 }
      )
    }

    if (pricing.departments.length === 0 || pricing.totalKes <= 0) {
      return NextResponse.json(
        { error: "Select at least one department (Sales, Marketing, or Finance)." },
        { status: 400 }
      )
    }

    const formattedPhone = formatKenyanMpesaPhone(rawMpesaPhone)
    if (!formattedPhone) {
      return NextResponse.json(
        { error: "Invalid Kenyan M-Pesa number. Use 07xxxxxxxx, 01xxxxxxxx, or 2547xxxxxxxx." },
        { status: 400 }
      )
    }

    const db = getOnboardingServiceSupabase()

    // 1. Insert pending subscription row FIRST (server-enforced pricing)
    const { data: pendingSub, error: insertErr } = await db
      .from("organization_subscriptions")
      .insert({
        owner_user_id: user.id,
        owner_email: user.email.toLowerCase().trim(),
        owner_name: fullName,
        owner_phone: formattedPhone,
        organization_name: organizationName,
        organization_website: website || null,
        departments: pricing.departments,
        billing_cycle: pricing.billingCycle,
        amount_kes: pricing.totalKes,
        amount_usd: pricing.totalUsd,
        currency: "KES",
        status: "pending_payment",
        payment_provider: "mpesa",
        mpesa_phone: formattedPhone,
      })
      .select("id")
      .single()

    if (insertErr || !pendingSub?.id) {
      console.error("[Onboarding M-Pesa STK] Insert error:", insertErr)
      return NextResponse.json(
        {
          error:
            "Could not initialize M-Pesa checkout. Please ensure the organization_subscriptions table exists in Supabase.",
          details: insertErr?.message,
        },
        { status: 500 }
      )
    }

    const subId: string = pendingSub.id

    // Production Safaricom Daraja credentials (shared with consultation checkout)
    const consumerKey =
      process.env.MPESA_CONSUMER_KEY || "jBA6rPD3TV50UgIL8AdiPcf1cbmTod9G5GQ8WlyxMDYSKIrh"
    const consumerSecret =
      process.env.MPESA_CONSUMER_SECRET ||
      "WGoQmnKI2DUq9S5CoqoQZrZm9LU7gjrMZ5jbabAGA8rOnGKv2pLK4G8cU5IeKxHs"
    const businessShortCode = process.env.MPESA_SHORTCODE || "4339129"
    const tillNumber = process.env.MPESA_TILL_NUMBER || "3513268"
    const passkey =
      process.env.MPESA_PASSKEY ||
      "eed2fce2619607467014bbee3f916a1c6781a74dcc0bfef1b7f2cd8e268ec506"

    // 2. Get Safaricom OAuth token
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")
    let accessToken = ""
    try {
      const authRes = await fetch(
        "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
        {
          method: "GET",
          headers: { Authorization: `Basic ${auth}` },
        }
      )
      if (!authRes.ok) {
        const errText = await authRes.text()
        console.error("[Onboarding M-Pesa] Safaricom auth failed:", errText)
        throw new Error(`Safaricom OAuth failed: ${authRes.statusText}`)
      }
      const authData = await authRes.json()
      accessToken = authData.access_token
    } catch (e: any) {
      await db
        .from("organization_subscriptions")
        .update({
          status: "failed",
          result_desc: e.message || "Safaricom OAuth failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", subId)

      return NextResponse.json(
        { error: "Could not reach Safaricom M-Pesa right now. Please try again or pay by card." },
        { status: 502 }
      )
    }

    // 3. Build STK Push payload
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
    const callbackUrl = `${protocol}://${host}/api/onboarding/mpesa-callback?subId=${encodeURIComponent(
      subId
    )}`

    const stkPayload = {
      BusinessShortCode: businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerBuyGoodsOnline",
      Amount: String(pricing.totalKes),
      PartyA: formattedPhone,
      PartyB: tillNumber,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: "CillahWorkspace",
      TransactionDesc: `${organizationName.slice(0, 12)} Plan`,
    }

    const stkRes = await fetch("https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(stkPayload),
    })

    const rawText = await stkRes.text()
    let stkData: any
    try {
      stkData = JSON.parse(rawText)
    } catch {
      stkData = { raw: rawText }
    }

    if (!stkRes.ok || stkData.ResponseCode !== "0") {
      const errMsg =
        stkData.errorMessage ||
        stkData.ResponseDescription ||
        "Safaricom rejected the M-Pesa STK Push request."

      await db
        .from("organization_subscriptions")
        .update({
          status: "failed",
          result_desc: errMsg,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subId)

      return NextResponse.json({ error: errMsg, details: stkData }, { status: 400 })
    }

    await db
      .from("organization_subscriptions")
      .update({
        mpesa_checkout_request_id: stkData.CheckoutRequestID || null,
        mpesa_merchant_request_id: stkData.MerchantRequestID || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subId)

    return NextResponse.json({
      success: true,
      message: "M-Pesa PIN prompt sent! Enter your PIN on your phone to unlock your workspace.",
      subscriptionId: subId,
      checkoutRequestId: stkData.CheckoutRequestID,
      phone: formattedPhone,
      amountKes: pricing.totalKes,
    })
  } catch (err: any) {
    console.error("[Onboarding M-Pesa STK] Error:", err)
    return NextResponse.json(
      { error: err?.message || "Failed to send M-Pesa STK Push" },
      { status: 500 }
    )
  }
}
