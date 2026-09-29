import { NextResponse } from "next/server"
import { getConsultationRecord, updateConsultationRecord, findConsultationRecordByEmail } from "@/lib/airtable"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const recordId = searchParams.get("recordId")
    const email = searchParams.get("email")
    const simulatePaid = searchParams.get("simulatePaid") === "true"

    if (!recordId) {
      return NextResponse.json({ error: "Record ID is required" }, { status: 400 })
    }

    // Retrieve the record to make sure it exists
    let record = null
    try {
      record = await getConsultationRecord(recordId)
      if (!record && email) {
        console.log(`[Payment Status] Record not found by ID: ${recordId}. Searching by email: ${email}...`)
        record = await findConsultationRecordByEmail(email)
      }
    } catch (err: any) {
      console.error("Airtable fetch failed during payment status query:", err)
      return NextResponse.json({ error: `Airtable connection error: ${err.message}` }, { status: 502 })
    }

    if (!record) {
      return NextResponse.json({ error: `Record not found (ID: ${recordId}, Email: ${email})` }, { status: 404 })
    }

    const actualRecordId = record.id

    // In development or simulation mode, let the client bypass by updating payment status
    if (simulatePaid) {
      console.log(`[Dev Simulation] Simulating successful payment callback for record: ${actualRecordId}`)
      await updateConsultationRecord(actualRecordId, {
        paymentStatus: "Paid",
        mpesaReceipt: "MOCK" + Math.random().toString(36).substring(2, 10).toUpperCase()
      })
      
      // Reload record to reflect simulation changes
      const updatedRecord = await getConsultationRecord(actualRecordId)
      if (updatedRecord) {
        record = updatedRecord
      }
    }

    return NextResponse.json({
      success: true,
      recordId: actualRecordId,
      paymentStatus: record.paymentStatus,
      name: record.name,
      email: record.email,
      company: record.company,
      phone: record.phone || "",
      mpesaReceipt: record.mpesaReceipt || ""
    })
  } catch (error: any) {
    console.error("Error retrieving payment status:", error)
    return NextResponse.json({ error: error.message || "Failed to retrieve status" }, { status: 500 })
  }
}
