import { NextResponse } from "next/server"
import { createConsultationRecord } from "@/lib/airtable"
import { notifyOwnerOfError } from "@/lib/error-notify"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, company } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 })
    }

    if (!company || typeof company !== "string" || company.trim().length === 0) {
      return NextResponse.json({ error: "Company details are required" }, { status: 400 })
    }

    const recordId = await createConsultationRecord({
      name: name.trim(),
      email: email.trim(),
      company: company.trim(),
    })

    // Trigger external webhook if configured in environment variables
    const webhookUrl = process.env.NEXT_PUBLIC_BOOKING_WEBHOOK_URL
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recordId,
            name: name.trim(),
            email: email.trim(),
            company: company.trim(),
            status: "Pending Payment",
            createdAt: new Date().toISOString()
          })
        })
        console.log("Successfully triggered registration webhook:", webhookUrl)
      } catch (webhookErr) {
        console.error("Failed to trigger registration webhook:", webhookErr)
        // Non-blocking error to ensure user flow is uninterrupted
      }
    }

    return NextResponse.json({ success: true, recordId })
  } catch (error: any) {
    console.error("Error creating consultation record:", error)
    await notifyOwnerOfError({
      source: "Create Record — Airtable",
      errorMessage: error.message || "Failed to create consultation record",
      extraDetails: "A client tried to start a booking but the record could not be created.",
    })
    return NextResponse.json({ error: error.message || "Failed to create record" }, { status: 500 })
  }
}
