import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/finance-settlement"

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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params
    const body = await request.json()
    const rawPhone = String(body.mpesaPhone || "").trim()

    const formattedPhone = formatKenyanPhone(rawPhone)
    if (!formattedPhone) {
      return NextResponse.json(
        { error: "Enter a valid Kenyan M-Pesa number (07xxxxxxxx, 01xxxxxxxx, or 2547xxxxxxxx)." },
        { status: 400 }
      )
    }

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
      return NextResponse.json({ error: "This invoice is already paid." }, { status: 400 })
    }

    const amountWhole = Math.round(Number(invoice.amount_kes))
    if (amountWhole > 150000) {
      return NextResponse.json(
        {
          error:
            "M-Pesa STK Push supports up to KES 150,000 per transaction. Please use Card (Visa / Mastercard) for larger amounts.",
        },
        { status: 400 }
      )
    }

    // Production Safaricom Daraja credentials (same verified account as consultation checkout)
    const consumerKey =
      process.env.MPESA_CONSUMER_KEY || "jBA6rPD3TV50UgIL8AdiPcf1cbmTod9G5GQ8WlyxMDYSKIrh"
    const consumerSecret =
      process.env.MPESA_CONSUMER_SECRET || "WGoQmnKI2DUq9S5CoqoQZrZm9LU7gjrMZ5jbabAGA8rOnGKv2pLK4G8cU5IeKxHs"
    const businessShortCode = process.env.MPESA_SHORTCODE || "4339129"
    const tillNumber = "3513268"
    const passkey =
      process.env.MPESA_PASSKEY || "eed2fce2619607467014bbee3f916a1c6781a74dcc0bfef1b7f2cd8e268ec506"

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")
    const authRes = await fetch(
      "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        method: "GET",
        headers: { Authorization: `Basic ${auth}` },
      }
    )

    if (!authRes.ok) {
      return NextResponse.json(
        { error: "Could not authenticate with Safaricom M-Pesa." },
        { status: 502 }
      )
    }

    const { access_token: accessToken } = await authRes.json()

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
    const callbackUrl = `${protocol}://${host}/api/pay/mpesa-callback?invoiceId=${encodeURIComponent(
      invoice.id
    )}`

    const stkRes = await fetch(
      "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: businessShortCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerBuyGoodsOnline",
          Amount: String(amountWhole),
          PartyA: formattedPhone,
          PartyB: tillNumber,
          PhoneNumber: formattedPhone,
          CallBackURL: callbackUrl,
          AccountReference: String(invoice.invoice_number || "CillahInvoice").slice(0, 12),
          TransactionDesc: "Client Invoice Payment",
        }),
      }
    )

    const stkData = await stkRes.json().catch(() => ({}))
    if (!stkRes.ok || stkData.ResponseCode !== "0") {
      return NextResponse.json(
        {
          error:
            stkData.errorMessage ||
            stkData.ResponseDescription ||
            "Safaricom rejected the M-Pesa STK Push.",
        },
        { status: 400 }
      )
    }

    await db
      .from("finance_invoices")
      .update({
        mpesa_checkout_request_id: stkData.CheckoutRequestID || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoice.id)

    return NextResponse.json({
      success: true,
      checkoutRequestId: stkData.CheckoutRequestID,
      message: "M-Pesa PIN prompt sent! Enter your PIN on your phone.",
    })
  } catch (err: any) {
    console.error("[Invoice Mpesa STK] Error:", err)
    return NextResponse.json(
      { error: err?.message || "Failed to send M-Pesa prompt" },
      { status: 500 }
    )
  }
}
