import { NextResponse } from "next/server";
import { getBusySlots } from "@/lib/google-calendar";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeSlots = [
      "08:00 AM",
      "09:30 AM",
      "11:00 AM",
      "12:30 PM",
      "02:00 PM",
      "03:30 PM",
      "05:00 PM",
      "06:30 PM",
      "08:00 PM"
    ];

    // Generate next 10 days starting from tomorrow
    const datesToQuery = [];
    let current = new Date();
    current.setDate(current.getDate() + 1); // Start tomorrow

    while (datesToQuery.length < 10) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, "0");
      const dateStr = String(current.getDate()).padStart(2, "0");
      const value = `${year}-${month}-${dateStr}`;
      
      const label = current.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      
      datesToQuery.push({ value, label });
      current.setDate(current.getDate() + 1);
    }

    const startDate = datesToQuery[0].value;
    const endDate = datesToQuery[datesToQuery.length - 1].value;

    // Fetch busy slots from Google Calendar for the entire 10-day range in one single API request
    let busyIntervals: { start: string; end: string }[] = [];
    let calendarError = null;

    try {
      const token = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY;
      if (token) {
        // Query Google Calendar FreeBusy API over the full range
        const calendarId = process.env.GOOGLE_CALENDAR_ID;
        if (calendarId) {
          const timeMin = `${startDate}T00:00:00+03:00`;
          const timeMax = `${endDate}T23:59:59+03:00`;

          const gTokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
              assertion: require("@/lib/google-calendar").getGoogleAccessToken // wait: we'll call helper getBusySlots directly!
            })
          }); // Wait, let's keep it simple: call getBusySlots using range!
        }
      }
    } catch (e: any) {
      calendarError = e.message;
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
