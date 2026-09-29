import { NextResponse } from "next/server"
import { getConsultationRecord, updateConsultationRecord } from "@/lib/airtable"
import { createCalendarEvent } from "@/lib/google-calendar"
import { notifyOwnerOfError } from "@/lib/error-notify"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { recordId, appointmentDate, name, email, company } = body

    if (!recordId) {
      return NextResponse.json({ error: "Record ID is required" }, { status: 400 })
    }

    if (!appointmentDate) {
      return NextResponse.json({ error: "Appointment date and time are required" }, { status: 400 })
    }

    // Retrieve current record
    let record
    try {
      record = await getConsultationRecord(recordId)
    } catch (airtableErr: any) {
      console.error("[Finalize Booking] Airtable read error:", airtableErr)
      // Notify owner via email
      await notifyOwnerOfError({
        source: "Finalize Booking — Airtable Read",
        errorMessage: airtableErr.message || "Could not retrieve consultation record",
        clientName: name,
        clientEmail: email,
        extraDetails: `Record ID: ${recordId}`,
      })
      return NextResponse.json({
        error: "We encountered a system error retrieving your record. Our team has been notified and will follow up shortly."
      }, { status: 500 })
    }

    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    // REQUIRE PAYMENT before creating calendar event
    if (record.paymentStatus !== "Paid") {
      return NextResponse.json({ error: "Payment is required before booking a slot" }, { status: 400 })
    }

    // Use record data or fallback to provided data
    const clientName = record.name || name || "Client"
    const clientEmail = record.email || email || ""
    const clientCompany = record.company || company || "N/A"

    // Update Airtable with selected date/time
    try {
      await updateConsultationRecord(recordId, { appointmentDate })
      console.log(`[Finalize Booking] Record ${recordId} updated with slot: ${appointmentDate}`)
    } catch (updateErr: any) {
      console.error("[Finalize Booking] Airtable update error:", updateErr)
      await notifyOwnerOfError({
        source: "Finalize Booking — Airtable Update",
        errorMessage: updateErr.message || "Could not update appointment date in Airtable",
        clientName,
        clientEmail,
        extraDetails: `Record ID: ${recordId}, Slot: ${appointmentDate}`,
      })
      return NextResponse.json({
        error: "We could not save your appointment. Our team has been notified and will follow up shortly."
      }, { status: 500 })
    }

    // Google Calendar Integration — Create real event + send invites
    let calendarEventUrl = null
    let calendarIntegrated = false

    if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_CALENDAR_ID) {
      try {
        console.log(`[Google Calendar] Creating event for ${clientEmail} at ${appointmentDate}...`)
        const eventTitle = `AI Consultation — ${clientName} (${clientCompany})`
        const eventDetails = [
          `Client: ${clientName}`,
          `Email: ${clientEmail}`,
          `Company/Agency: ${clientCompany}`,
          ``,
          `Payment Status: Paid`,
          `M-PESA Receipt: ${record.mpesaReceipt || "N/A"}`,
          ``,
          `This consultation was booked via cillah.dev`,
        ].join("\n")
        
        calendarEventUrl = await createCalendarEvent({
          summary: eventTitle,
          description: eventDetails,
          startDateTime: appointmentDate,
          guestEmail: clientEmail
        })
        calendarIntegrated = true
        console.log(`[Google Calendar] Event successfully created: ${calendarEventUrl}`)
      } catch (calError: any) {
        console.error("[Google Calendar] API error:", calError.message || calError)
        // Notify owner about calendar API failure
        await notifyOwnerOfError({
          source: "Finalize Booking — Google Calendar Event Creation",
          errorMessage: calError.message || "Calendar event creation failed",
          clientName,
          clientEmail,
          extraDetails: `Record ID: ${recordId}, Slot: ${appointmentDate}, Receipt: ${record.mpesaReceipt || "N/A"}. PAYMENT WAS RECEIVED but calendar event could not be created.`,
        })
        return NextResponse.json({
          success: false,
          error: `Calendar event could not be created. Our team has been notified and will confirm your booking manually. Error: ${calError.message}`
        }, { status: 502 })
      }
    } else {
      console.warn("[Google Calendar] Missing environment variables — cannot create calendar event")
      await notifyOwnerOfError({
        source: "Finalize Booking — Missing Google Credentials",
        errorMessage: "GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, or GOOGLE_CALENDAR_ID not configured",
        clientName,
        clientEmail,
        extraDetails: `Record ID: ${recordId}, Slot: ${appointmentDate}. Client has PAID but calendar env vars are missing.`,
      })
    }

    // Fallback: Generate a pre-filled Google Calendar Template link (if API creation failed or not configured)
    if (!calendarEventUrl) {
      const eventTitle = encodeURIComponent(`AI Consultation — ${clientName} (${clientCompany})`)
      const eventDetails = encodeURIComponent(
        `Client: ${clientName}\nEmail: ${clientEmail}\nCompany/Agency: ${clientCompany}\n\nBooked via cillah.dev`
      )
      
      const startDt = new Date(appointmentDate)
      const endDt = new Date(startDt.getTime() + 60 * 60 * 1000)
      
      const formatCalDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
      }
      
      const datesParam = `${formatCalDate(startDt)}/${formatCalDate(endDt)}`
      calendarEventUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${datesParam}&details=${eventDetails}&add=${encodeURIComponent(clientEmail)}`
    }

    return NextResponse.json({
      success: true,
      recordId,
      name: clientName,
      email: clientEmail,
      appointmentDate,
      calendarEventUrl,
      calendarIntegrated
    })
  } catch (error: any) {
    console.error("Error finalizing booking:", error)
    // Catch-all notification for unexpected errors
    await notifyOwnerOfError({
      source: "Finalize Booking — Unexpected Error",
      errorMessage: error.message || "Unknown error",
      extraDetails: `This is an unhandled error in the finalize-booking route.`,
    })
    return NextResponse.json({
      error: "An unexpected error occurred. Our team has been notified."
    }, { status: 500 })
  }
}
