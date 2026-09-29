import { NextResponse } from "next/server"
import { createCalendarEvent } from "@/lib/google-calendar"

/**
 * POST /api/calendar/book
 * Creates a Google Calendar event directly with the user's booking details
 * and sends calendar invites to both the business owner and the client.
 *
 * Body: { name, email, company, appointmentDate }
 * appointmentDate format: "2026-08-08T08:00:00+03:00" (ISO with EAT offset)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, company, appointmentDate } = body

    if (!name || !email || !appointmentDate) {
      return NextResponse.json(
        { error: "Name, email, and appointmentDate are required" },
        { status: 400 }
      )
    }

    // Verify Google Calendar credentials are present
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_CALENDAR_ID) {
      console.error("[Calendar Book] Missing Google Calendar environment variables")
      return NextResponse.json(
        { error: "Google Calendar API is not configured on the server" },
        { status: 500 }
      )
    }

    const eventTitle = `AI Consultation — ${name} (${company || "N/A"})`
    const eventDescription = [
      `Client: ${name}`,
      `Email: ${email}`,
      `Company/Agency: ${company || "N/A"}`,
      ``,
      `This consultation was booked via cillah.dev`,
      `Booked at: ${new Date().toISOString()}`,
    ].join("\n")

    console.log(`[Calendar Book] Creating Google Calendar event for ${email} at ${appointmentDate}...`)

    const calendarEventUrl = await createCalendarEvent({
      summary: eventTitle,
      description: eventDescription,
      startDateTime: appointmentDate,
      guestEmail: email,
    })

    console.log(`[Calendar Book] Event created successfully: ${calendarEventUrl}`)

    return NextResponse.json({
      success: true,
      calendarEventUrl,
      message: "Calendar event created and invites sent."
    })
  } catch (error: any) {
    console.error("[Calendar Book] Error creating calendar event:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create calendar event" },
      { status: 500 }
    )
  }
}
