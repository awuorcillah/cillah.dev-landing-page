import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, email, amount = 5000 } = body

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    // Format phone number to 2547xxxxxxxx or 2541xxxxxxxx
    let formattedPhone = phone.trim().replace(/\D/g, "")
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.substring(1)
    } else if (formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.substring(1)
    } else if (!formattedPhone.startsWith("254")) {
      if (formattedPhone.length === 9) {
        formattedPhone = "254" + formattedPhone
      } else {
        return NextResponse.json(
          { error: "Invalid phone number format. Use 07xxxxxxxx or 2547xxxxxxxx" },
          { status: 400 }
        )
      }
    }

    if (formattedPhone.length !== 12) {
      return NextResponse.json(
        { error: "Phone number must be 12 digits (e.g., 254712345678)" },
        { status: 400 }
      )
    }

    // Production Credentials
    const consumerKey = process.env.MPESA_CONSUMER_KEY || "jBA6rPD3TV50UgIL8AdiPcf1cbmTod9G5GQ8WlyxMDYSKIrh"
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET || "WGoQmnKI2DUq9S5CoqoQZrZm9LU7gjrMZ5jbabAGA8rOnGKv2pLK4G8cU5IeKxHs"
    const businessShortCode = process.env.MPESA_SHORTCODE || "4339129"
    const tillNumber = "3513268"
    const passkey = process.env.MPESA_PASSKEY || "eed2fce2619607467014bbee3f916a1c6781a74dcc0bfef1b7f2cd8e268ec506"

    // 1. Get OAuth Access Token from Safaricom
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")
    console.log("[Mpesa STK] Requesting OAuth access token...")
    
    let accessToken = ""
    try {
      const authResponse = await fetch(
        "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${auth}`,
          },
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
      return NextResponse.json(
        { 
          error: "Failed to authenticate with Safaricom. STK Push cannot be sent.",
          details: e.message 
        }, 
        { status: 502 }
      )
    }

    // 2. Prepare STK Push Payload
    const now = new Date()
    const eatOffset = 3 * 60 * 60 * 1000 // 3 hours in ms for EAT
    const eatDate = new Date(now.getTime() + eatOffset)
    
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
    const host = request.headers.get("host") || "cillah.dev"
    const callbackUrl = `${protocol}://${host}/api/consultation/mpesa-callback`

    const stkPayload = {
      BusinessShortCode: businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerBuyGoodsOnline",
      Amount: String(amount || 5000),
      PartyA: formattedPhone,
      PartyB: tillNumber,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: "CillahDevStrategy",
      TransactionDesc: "1-on-1 AI Strategy Call"
    }

    console.log("[Mpesa STK] Sending STK Push request to Safaricom for KES", amount, "to", formattedPhone)

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
    let stkData
    try {
      stkData = JSON.parse(responseText)
    } catch {
      stkData = { raw: responseText }
    }

    console.log("[Mpesa STK] Safaricom response:", stkData)

    if (!stkResponse.ok || stkData.ResponseCode !== "0") {
      return NextResponse.json(
        { 
          error: stkData.errorMessage || stkData.ResponseDescription || "Safaricom rejected the STK Push request",
          details: stkData 
        }, 
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "M-Pesa STK Push sent successfully. Please check your phone and enter your PIN.",
      checkoutRequestId: stkData.CheckoutRequestID,
      merchantRequestId: stkData.MerchantRequestID,
      phone: formattedPhone
    })
  } catch (error: any) {
    console.error("Error initiating STK push:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error initiating STK push" },
      { status: 500 }
    )
  }
}
