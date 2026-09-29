import { getGoogleAccessToken } from "@/lib/google-calendar";

/**
 * Sends an error notification to the site owner by creating a short
 * Google Calendar event titled "⚠️ API Error". Google Calendar
 * automatically emails the calendar owner when a new event is created.
 *
 * This uses the EXISTING Google Calendar credentials — no new API keys needed.
 */
export async function notifyOwnerOfError(context: {
  source: string;       // e.g. "Slots API", "Finalize Booking", "Payment"
  errorMessage: string;
  clientName?: string;
  clientEmail?: string;
  extraDetails?: string;
}) {
  const ownerEmail = "awuorcillah@gmail.com";

  try {
    const token = await getGoogleAccessToken();
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!token || !calendarId) {
      console.error("[Error Notify] Cannot send notification — missing Google Calendar credentials");
      return;
    }

    const now = new Date();
    const end = new Date(now.getTime() + 15 * 60 * 1000); // 15-minute event

    const description = [
      `🚨 An API error occurred on cillah.dev`,
      ``,
      `Source: ${context.source}`,
      `Error: ${context.errorMessage}`,
      context.clientName ? `Client: ${context.clientName}` : null,
      context.clientEmail ? `Client Email: ${context.clientEmail}` : null,
      context.extraDetails ? `Details: ${context.extraDetails}` : null,
      ``,
      `Timestamp: ${now.toISOString()}`,
      ``,
      `Please check your Vercel logs for more information.`,
    ].filter(Boolean).join("\n");

    const payload = {
      summary: `⚠️ CILLAH.DEV — ${context.source} Error`,
      description,
      start: {
        dateTime: now.toISOString(),
        timeZone: "Africa/Nairobi",
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: "Africa/Nairobi",
      },
      attendees: [
        { email: ownerEmail },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 0 },
          { method: "popup", minutes: 0 },
        ],
      },
      colorId: "11", // Red color in Google Calendar
    };

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Error Notify] Failed to create notification event:", errText);
    } else {
      console.log(`[Error Notify] Alert sent to ${ownerEmail} via Google Calendar event`);
    }
  } catch (e: any) {
    // Don't throw — notification failure should never block the main flow
    console.error("[Error Notify] Could not send error notification:", e.message);
  }
}
