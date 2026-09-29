import { NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/lib/google-calendar";

/**
 * Diagnostic endpoint to test Google Calendar API connectivity.
 * GET /api/calendar/test
 *
 * Returns detailed diagnostics about:
 * 1. Whether env vars are set
 * 2. Whether access token generation works
 * 3. Whether FreeBusy API returns data
 * 4. Whether event creation permissions work
 */
export async function GET() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    envVars: {},
    auth: {},
    freeBusy: {},
    permissions: {},
  };

  // 1. Check environment variables
  const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  diagnostics.envVars = {
    GOOGLE_SERVICE_ACCOUNT_EMAIL: serviceEmail ? `SET (${serviceEmail})` : "MISSING",
    GOOGLE_PRIVATE_KEY: privateKey
      ? `SET (starts with: ${privateKey.substring(0, 30)}..., length: ${privateKey.length})`
      : "MISSING",
    GOOGLE_CALENDAR_ID: calendarId ? `SET (${calendarId})` : "MISSING",
  };

  if (!serviceEmail || !privateKey || !calendarId) {
    diagnostics.summary = "FAIL: Missing one or more required environment variables.";
    return NextResponse.json(diagnostics, { status: 500 });
  }

  // 2. Test access token generation
  let accessToken: string | null = null;
  try {
    accessToken = await getGoogleAccessToken();
    diagnostics.auth = {
      status: "SUCCESS",
      tokenPreview: accessToken.substring(0, 20) + "...",
    };
  } catch (err: any) {
    diagnostics.auth = {
      status: "FAIL",
      error: err.message,
    };
    diagnostics.summary = "FAIL: Could not obtain Google access token. Check GOOGLE_PRIVATE_KEY format.";
    return NextResponse.json(diagnostics, { status: 500 });
  }

  // 3. Test FreeBusy API
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const endOfRange = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const timeMin = now.toISOString();
    const timeMax = endOfRange.toISOString();

    const freeBusyResponse = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeMin,
        timeMax,
        items: [{ id: calendarId }],
      }),
    });

    const freeBusyData = await freeBusyResponse.json();

    if (!freeBusyResponse.ok) {
      diagnostics.freeBusy = {
        status: "FAIL",
        httpStatus: freeBusyResponse.status,
        error: freeBusyData,
      };
    } else {
      const calendarErrors = freeBusyData.calendars?.[calendarId]?.errors;
      const busySlots = freeBusyData.calendars?.[calendarId]?.busy || [];
      
      diagnostics.freeBusy = {
        status: calendarErrors ? "FAIL - Calendar errors present" : "SUCCESS",
        calendarId: calendarId,
        busySlotsFound: busySlots.length,
        busySlots: busySlots,
        calendarErrors: calendarErrors || null,
        rawCalendarsKeys: Object.keys(freeBusyData.calendars || {}),
        fullResponse: freeBusyData,
      };
    }
  } catch (err: any) {
    diagnostics.freeBusy = {
      status: "FAIL",
      error: err.message,
    };
  }

  // 4. Test calendar list access (verify service account can see the calendar)
  try {
    const calListResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const calListData = await calListResponse.json();

    if (!calListResponse.ok) {
      diagnostics.permissions = {
        status: "FAIL",
        httpStatus: calListResponse.status,
        error: calListData,
        hint: "The service account may not have access to this calendar. Share the calendar with the service account email.",
      };
    } else {
      diagnostics.permissions = {
        status: "SUCCESS",
        calendarSummary: calListData.summary,
        calendarTimeZone: calListData.timeZone,
        accessRole: calListData.accessRole,
      };
    }
  } catch (err: any) {
    diagnostics.permissions = {
      status: "FAIL",
      error: err.message,
    };
  }

  // Summary
  const allPassed =
    diagnostics.auth.status === "SUCCESS" &&
    diagnostics.freeBusy.status === "SUCCESS" &&
    diagnostics.permissions.status === "SUCCESS";

  diagnostics.summary = allPassed
    ? `ALL PASSED - Found ${diagnostics.freeBusy.busySlotsFound} busy slot(s) in next 7 days.`
    : "SOME CHECKS FAILED - See details above.";

  return NextResponse.json(diagnostics, { status: allPassed ? 200 : 500 });
}
