import { NextResponse } from "next/server";
import { getBusySlotsForRange } from "@/lib/google-calendar";
import { notifyOwnerOfError } from "@/lib/error-notify";

export async function GET(request: Request) {
  try {
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

    // Generate next 30 days starting from tomorrow
    const datesToQuery = [];
    let current = new Date();
    current.setDate(current.getDate() + 1); // Start tomorrow

    while (datesToQuery.length < 30) {
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

    // Fetch busy slots from Google Calendar — DO NOT silently ignore errors
    let busyIntervals: { start: string; end: string }[] = [];
    let calendarError: string | null = null;

    try {
      console.log(`[Calendar Slots] Fetching busy slots from Google Calendar for range ${startDate} to ${endDate}...`);
      busyIntervals = await getBusySlotsForRange(startDate, endDate);
      console.log(`[Calendar Slots] Successfully retrieved ${busyIntervals.length} busy interval(s) from Google Calendar.`);
      if (busyIntervals.length > 0) {
        console.log(`[Calendar Slots] Busy intervals:`, JSON.stringify(busyIntervals));
      }
    } catch (e: any) {
      // DO NOT default to all slots available — propagate the error
      calendarError = e.message || "Unknown Google Calendar API error";
      console.error("[Calendar Slots] CRITICAL: Google Calendar FreeBusy API failed:", calendarError);
      // Notify owner via email
      await notifyOwnerOfError({
        source: "Calendar Slots — FreeBusy API",
        errorMessage: calendarError,
        extraDetails: `The booking page cannot load available slots. Clients are seeing an error. Range: ${startDate} to ${endDate}.`,
      });
      return NextResponse.json({
        success: false,
        error: `Google Calendar sync failed: ${calendarError}`,
        hint: "Check your GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_CALENDAR_ID environment variables. Visit /api/calendar/test for diagnostics."
      }, { status: 502 });
    }

    const now = new Date();
    const minAdvanceTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    const daysWithAvailability = datesToQuery.map(({ value: dateStr, label }) => {
      const slots = timeSlots.map((time) => {
        // Parse hour and minute relative to Nairobi (EAT / UTC+3)
        const [timeVal, modifier] = time.split(" ");
        let [hours, minutes] = timeVal.split(":");
        let hr = parseInt(hours);
        if (modifier === "PM" && hr < 12) hr += 12;
        if (modifier === "AM" && hr === 12) hr = 0;

        const slotStart = new Date(`${dateStr}T${String(hr).padStart(2, "0")}:${minutes}:00+03:00`);
        const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000); // 1 hour duration

        // 1. Enforce 24-hour advance booking rule
        if (slotStart < minAdvanceTime) {
          return { time, available: false };
        }

        // 2. Expand slot by 15-minute buffer on both ends (before and after)
        const expandedStart = new Date(slotStart.getTime() - 15 * 60 * 1000); // 15 mins before
        const expandedEnd = new Date(slotEnd.getTime() + 15 * 60 * 1000);    // 15 mins after

        // 3. Check overlap: expandedStart < busyEnd AND expandedEnd > busyStart
        const isBusy = busyIntervals.some((b) => {
          const bStart = new Date(b.start);
          const bEnd = new Date(b.end);
          return expandedStart < bEnd && expandedEnd > bStart;
        });

        return {
          time,
          available: !isBusy
        };
      });

      // Check if there is at least one available slot for this date
      const hasAvailableSlots = slots.some((s) => s.available);

      return {
        value: dateStr,
        label,
        slots,
        hasAvailableSlots
      };
    });

    // Filter to keep only the days that actually have at least one available slot
    const filteredDays = daysWithAvailability.filter((d) => d.hasAvailableSlots);

    // Keep only the first 7 available days to show to the client
    const finalDaysList = filteredDays.slice(0, 7);

    return NextResponse.json({
      success: true,
      calendarSynced: true,
      busyIntervalsCount: busyIntervals.length,
      days: finalDaysList
    });
  } catch (error: any) {
    console.error("Error retrieving calendar slots:", error);
    await notifyOwnerOfError({
      source: "Calendar Slots — Unexpected Error",
      errorMessage: error.message || "Unknown error in slots endpoint",
    });
    return NextResponse.json({ error: error.message || "Failed to retrieve slots" }, { status: 500 });
  }
}
