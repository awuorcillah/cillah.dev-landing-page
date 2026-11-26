import { NextResponse } from "next/server"
import {
  getServiceSupabase,
  settleInvoiceAndAdvancePipeline,
} from "@/lib/finance-settlement"

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const invoiceIdParam = searchParams.get("invoiceId")
    const payload = await request.json()
    const stkCallback = payload.Body?.stkCallback

    if (!stkCallback) {
      return NextResponse.json({ error: "Invalid callback" }, { status: 400 })
    }

    const checkoutRequestId: string | undefined = stkCallback.CheckoutRequestID
    const resultCode = Number(stkCallback.ResultCode)
    const db = getServiceSupabase()

    let invoice: any = null
    if (invoiceIdParam) {
      const { data } = await db
        .from("finance_invoices")
        .select("*")
        .eq("id", invoiceIdParam)
        .maybeSingle()
      invoice = data
    }

    if (!invoice && checkoutRequestId) {
      const { data } = await db
        .from("finance_invoices")
        .select("*")
        .eq("mpesa_checkout_request_id", checkoutRequestId)
        .maybeSingle()
      invoice = data
    }

    if (!invoice) {
      return NextResponse.json({ ResponseCode: "0", ResponseDesc: "Accepted" })
    }

    if (resultCode !== 0) {
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

    await settleInvoiceAndAdvancePipeline({
      invoiceId: invoice.id,
      paymentMethod: "mpesa",
      paymentReference: mpesaReceipt || checkoutRequestId || `MPESA-${Date.now()}`,
      paidAmount,
    })

    return NextResponse.json({ ResponseCode: "0", ResponseDesc: "Processed" })
  } catch (err: any) {
    console.error("[Invoice Mpesa Callback] Error:", err)
    return NextResponse.json({ ResponseCode: "0", ResponseDesc: "Error handled" })
  }
}
