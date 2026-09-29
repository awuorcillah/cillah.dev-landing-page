import { NextResponse } from "next/server"
import { updateConsultationRecord } from "@/lib/airtable"

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const recordId = searchParams.get("recordId")

    if (!recordId) {
      console.error("[Mpesa Callback] Missing recordId in callback URL parameters")
      return NextResponse.json({ error: "Missing recordId" }, { status: 400 })
    }

    const payload = await request.json()
    console.log(`[Mpesa Callback] Received callback for record ${recordId}:`, JSON.stringify(payload))

    const stkCallback = payload.Body?.stkCallback
    if (!stkCallback) {
      console.error("[Mpesa Callback] Invalid callback format, missing stkCallback")
      return NextResponse.json({ error: "Invalid payload format" }, { status: 400 })
    }

    const resultCode = stkCallback.ResultCode
    const resultDesc = stkCallback.ResultDesc

    if (resultCode === 0) {
      // Payment was successful!
      // Extract receipt number and phone number from CallbackMetadata
      let mpesaReceipt = ""
      let phone = ""
      
      const metadataItems = stkCallback.CallbackMetadata?.Item
      if (Array.isArray(metadataItems)) {
        for (const item of metadataItems) {
          if (item.Name === "MpesaReceiptNumber") {
            mpesaReceipt = item.Value?.toString() || ""
          } else if (item.Name === "PhoneNumber") {
            phone = item.Value?.toString() || ""
          }
        }
      }

      console.log(`[Mpesa Callback] Payment successful! Receipt: ${mpesaReceipt}, Phone: ${phone}. Updating Airtable...`)

      // Update the status in Airtable
      const success = await updateConsultationRecord(recordId, {
        paymentStatus: "Paid",
        mpesaReceipt,
        ...(phone ? { phone } : {})
      })

      if (success) {
        console.log(`[Mpesa Callback] Successfully marked record ${recordId} as Paid`)
      } else {
        console.error(`[Mpesa Callback] Failed to find or update record ${recordId}`)
      }
    } else {
      console.warn(`[Mpesa Callback] Payment failed/cancelled by user. Code: ${resultCode}, Desc: ${resultDesc}`)
      // Optionally we could mark it as Failed, but we'll leave it as Pending Payment for retry
    }

    // Safaricom expects a 200 response with a JSON success payload
    return NextResponse.json({ ResponseCode: "0", ResponseDesc: "Callback received successfully" })
  } catch (error) {
    console.error("[Mpesa Callback] Exception in callback route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
