import { NextResponse } from "next/server"
import {
  finalizeOnboardingSubscription,
  getOnboardingServiceSupabase,
} from "@/lib/onboarding-provision"

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const subIdParam = (searchParams.get("subId") || "").trim()
    const payload = await request.json()
    const stkCallback = payload?.Body?.stkCallback

    if (!stkCallback) {
      return NextResponse.json({ error: "Invalid M-Pesa callback payload" }, { status: 400 })
    }

    const checkoutRequestId: string | undefined = stkCallback.CheckoutRequestID
    const resultCode = Number(stkCallback.ResultCode)
    const resultDesc = String(stkCallback.ResultDesc || "")
    const db = getOnboardingServiceSupabase()

    let subRow: any = null
    if (subIdParam) {
      const { data } = await db
        .from("organization_subscriptions")
        .select("*")
        .eq("id", subIdParam)
        .maybeSingle()
      subRow = data
    }

    if (!subRow && checkoutRequestId) {
      const { data } = await db
        .from("organization_subscriptions")
        .select("*")
        .eq("mpesa_checkout_request_id", checkoutRequestId)
        .maybeSingle()
      subRow = data
    }

    if (!subRow) {
      return NextResponse.json({ ResponseCode: "0", ResponseDesc: "Accepted" })
    }

    if (resultCode !== 0) {
      const nextStatus = resultCode === 1032 ? "cancelled" : "failed"
      await db
        .from("organization_subscriptions")
        .update({
          status: nextStatus,
          result_desc: resultDesc || "M-Pesa payment was not completed.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", subRow.id)
        .eq("status", "pending_payment")

      return NextResponse.json({ ResponseCode: "0", ResponseDesc: "Accepted" })
    }

    let mpesaReceipt = ""
    let paidAmount: number | null = null
    const items = stkCallback.CallbackMetadata?.Item
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item.Name === "MpesaReceiptNumber") mpesaReceipt = String(item.Value || "")
        if (item.Name === "Amount") {
          const parsed = Number(item.Value)
          if (!Number.isNaN(parsed)) paidAmount = parsed
        }
      }
    }

    await finalizeOnboardingSubscription({
      subscriptionId: subRow.id,
      paymentProvider: "mpesa",
      paymentReference: mpesaReceipt || checkoutRequestId || `MPESA-${Date.now()}`,
      paidAmountKes: paidAmount,
      resultDesc: resultDesc || "M-Pesa payment confirmed.",
    })

    return NextResponse.json({ ResponseCode: "0", ResponseDesc: "Processed" })
  } catch (err: any) {
    console.error("[Onboarding M-Pesa Callback] Error:", err)
    return NextResponse.json({ ResponseCode: "0", ResponseDesc: "Error handled" })
  }
}
