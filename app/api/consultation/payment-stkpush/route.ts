import { NextResponse } from "next/server"
import { getConsultationRecord, updateConsultationRecord, findConsultationRecordByEmail } from "@/lib/airtable"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { recordId, email, phone } = body

    if (!recordId) {
      return NextResponse.json({ error: "Record ID is required" }, { status: 400 })
    }

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
      // If it doesn't start with 254 and has 9 digits (e.g. 712345678)
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

    // Retrieve the record to make sure it exists
    let record = null
    try {
      record = await getConsultationRecord(recordId)
      if (!record && email) {
        console.log(`[STK Push] Record not found by ID: ${recordId}. Searching by email: ${email}...`)
        record = await findConsultationRecordByEmail(email)
      }
    } catch (err: any) {
      console.error("Airtable fetch failed during STK push:", err)
      return NextResponse.json({ error: `Airtable connection error: ${err.message}` }, { status: 502 })
    }

    if (!record) {
      return NextResponse.json({ error: `Record not found (ID: ${recordId}, Email: ${email})` }, { status: 404 })
    }

    const actualRecordId = record.id

    // Save the formatted phone number to the Airtable record
    await updateConsultationRecord(actualRecordId, { phone: formattedPhone })

    // Production Credentials from User
    const consumerKey = "jBA6rPD3TV50UgIL8AdiPcf1cbmTod9G5GQ8WlyxMDYSKIrh"
    const consumerSecret = "WGoQmnKI2DUq9S5CoqoQZrZm9LU7gjrMZ5jbabAGA8rOnGKv2pLK4G8cU5IeKxHs"
    const businessShortCode = "4339129" // Store Number / Business Short Code
    const tillNumber = "3513268"        // Till Number
    const passkey = "eed2fce2619607467014bbee3f916a1c6781a74dcc0bfef1b7f2cd8e268ec506"

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
      // Provide a helpful error that it failed to connect to Safaricom
      return NextResponse.json(
        { 
          error: "Failed to authenticate with Safaricom. STK Push cannot be sent.",
          details: e.message 
        }, 
        { status: 502 }
      )
    }

    // 2. Prepare STK Push Payload
    // Format timestamp: YYYYMMDDHHmmss in GMT+3 (EAT)
    // We will generate the timestamp from the current date in UTC, then add 3 hours
    const now = new Date()
    const eatOffset = 3 * 60 * 60 * 1000 // 3 hours in milliseconds
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
    
    // Determine callback URL (Dynamic backend hostname or mock)
    const protocol = request.headers.get("x-forwarded-proto") || "http"
    const host = request.headers.get("host") || "localhost:3000"
    const callbackUrl = `${protocol}://${host}/api/consultation/mpesa-callback?recordId=${actualRecordId}`

    const amount = process.env.NEXT_PUBLIC_CONSULTATION_AMOUNT || "2000"

    const stkPayload = {
      BusinessShortCode: businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerBuyGoodsOnline",
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: tillNumber, // PartyB is Till Number for CustomerBuyGoodsOnline
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: `CillahConsultation`,
      TransactionDesc: `Booking Fee`,
    }

    console.log("[Mpesa STK] Sending STK Push request...", stkPayload)

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

    const stkData = await stkResponse.json()
    console.log("[Mpesa STK] Response from Safaricom:", stkData)

    if (!stkResponse.ok || stkData.ResponseCode !== "0") {
      return NextResponse.json(
        { 
          error: stkData.errorMessage || stkData.ResponseDescription || "Safaricom STK Push failed",
          details: stkData 
        },
        { status: 502 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      recordId: actualRecordId,
      MerchantRequestID: stkData.MerchantRequestID,
      CheckoutRequestID: stkData.CheckoutRequestID,
      message: stkData.CustomerMessage || stkData.ResponseDescription
    })
  } catch (error: any) {
    console.error("Error in M-PESA STK Push handler:", error)
    return NextResponse.json({ error: error.message || "Internal payment error" }, { status: 500 })
  }
}
