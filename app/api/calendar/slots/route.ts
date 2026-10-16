import { NextResponse } from "next/server";
import { getBusySlotsForRange } from "@/lib/google-calendar";
import { notifyOwnerOfError } from "@/lib/error-notify";

export async function GET(request: Request) {
  try {
    // Only allow Wednesday (3), Friday (5), and Sunday (0)
    // Operating Hours: 8:00 AM - 9:00 PM EAT (each slot is 60 mins + 30 mins buffer)
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

    // Generate upcoming eligible days (Wednesdays, Fridays, Sundays only)
    const datesToQuery: { value: string; label: string }[] = [];
    let current = new Date();
    current.setDate(current.getDate() + 1); // Start tomorrow

    // Look ahead up to 60 days to gather upcoming eligible booking days
    let lookahead = 0;
    while (datesToQuery.length < 12 && lookahead < 60) {
      const dayOfWeek = current.getDay(); // 0 = Sun, 3 = Wed, 5 = Fri
      if (dayOfWeek === 0 || dayOfWeek === 3 || dayOfWeek === 5) {
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
      }
      current.setDate(current.getDate() + 1);
      lookahead++;
    }

    if (datesToQuery.length === 0) {
      return NextResponse.json({ success: true, days: [] });
    }

    const startDate = datesToQuery[0].value;
    const endDate = datesToQuery[datesToQuery.length - 1].value;

    // Fetch busy slots from Google Calendar if configured
    let busyIntervals: { start: string; end: string }[] = [];
    let calendarSynced = false;

    if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_CALENDAR_ID) {
      try {
        console.log(`[Calendar Slots] Fetching busy slots from Google Calendar for range ${startDate} to ${endDate}...`);
        busyIntervals = await getBusySlotsForRange(startDate, endDate);
        calendarSynced = true;
        console.log(`[Calendar Slots] Successfully retrieved ${busyIntervals.length} busy interval(s) from Google Calendar.`);
      } catch (e: any) {
        console.warn("[Calendar Slots] Google Calendar FreeBusy sync warning:", e.message);
      }
    } else {
      console.log("[Calendar Slots] Google Calendar credentials not configured in env, providing all standard slots.");
    }

    const now = new Date();
    const minAdvanceTime = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours minimum notice

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

        // 1. Enforce minimum notice rule
        if (slotStart < minAdvanceTime) {
          return { time, available: false, reason: "Too short notice" };
        }

        // 2. Expand slot with 30-minute buffer after meeting
        const expandedStart = slotStart;
        const expandedEnd = new Date(slotEnd.getTime() + 30 * 60 * 1000); // 30 mins buffer

        // 3. Check overlap with busy intervals from Google Calendar
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

    // Filter to keep only days with available slots
    const finalDaysList = daysWithAvailability.filter((d) => d.hasAvailableSlots);

    return NextResponse.json({
      success: true,
      calendarSynced,
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
