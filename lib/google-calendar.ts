import crypto from "crypto";

export interface ConsultationRecord {
  id: string;
  name: string;
  email: string;
  company: string;
  paymentStatus: 'Pending Payment' | 'Paid';
  phone?: string;
  mpesaReceipt?: string;
  appointmentDate?: string;
  createdAt: string;
}

function signJwt(payload: object, privateKey: string): string {
  const header = { alg: "RS256", typ: "JWT" };
  const base64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  
  const sign = crypto.createSign("RSA-SHA256");
  sign.write(`${base64Header}.${base64Payload}`);
  sign.end();
  
  const signature = sign.sign(privateKey, "base64url");
  return `${base64Header}.${base64Payload}.${signature}`;
}

export async function getGoogleAccessToken(): Promise<string> {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !rawPrivateKey) {
    throw new Error("Missing Google Service Account credentials (GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY)");
  }

  // Robustly reconstruct the PEM private key regardless of how Vercel stored it.
  // Strategy: strip everything down to raw base64, then re-chunk into strict 64-char lines.
  let privateKey = rawPrivateKey;

  // Step 1: If JSON-encoded (wrapped in quotes), decode it first
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    try { privateKey = JSON.parse(privateKey); } catch {}
  }

  // Step 2: Replace all literal \n escape sequences with real newlines
  privateKey = privateKey.replace(/\\n/g, "\n");

  // Step 3: Extract just the raw base64 body — strip headers, footers, and ALL whitespace
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const base64Body = privateKey
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\s+/g, ""); // remove ALL whitespace including \n, \r, spaces

  // Step 4: Re-chunk the base64 body into exactly 64-character lines (strict PEM format)
  const chunks: string[] = [];
  for (let i = 0; i < base64Body.length; i += 64) {
    chunks.push(base64Body.slice(i, i + 64));
  }

  // Step 5: Reassemble a valid PEM key
  privateKey = `${pemHeader}\n${chunks.join("\n")}\n${pemFooter}`;

  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/calendar",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  };

  const jwt = signJwt(jwtPayload, privateKey);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to obtain Google access token: ${response.statusText} - ${errText}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function getBusySlotsForRange(startDate: string, endDate: string): Promise<{ start: string; end: string }[]> {
  const token = await getGoogleAccessToken();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!calendarId) {
    throw new Error("Missing GOOGLE_CALENDAR_ID environment variable");
  }

  const timeMin = `${startDate}T00:00:00+03:00`;
  const timeMax = `${endDate}T23:59:59+03:00`;

  // STRATEGY: Query BOTH FreeBusy API AND Events API.
  // FreeBusy only returns events marked "Busy" — but Google sometimes defaults events to "Free".
  // The Events API returns ALL events regardless of their free/busy status.
  // We combine both to ensure nothing is ever missed.

  const results: { start: string; end: string }[] = [];

  // 1. FreeBusy API — catches events explicitly marked Busy
  try {
    const freeBusyResponse = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        timeMin,
        timeMax,
        items: [{ id: calendarId }]
      })
    });

    if (freeBusyResponse.ok) {
      const data = await freeBusyResponse.json();
      const busy = data.calendars?.[calendarId]?.busy || [];
      results.push(...busy);
      console.log(`[Calendar] FreeBusy returned ${busy.length} busy interval(s)`);
    } else {
      const errText = await freeBusyResponse.text();
      throw new Error(`Google FreeBusy API failed: ${freeBusyResponse.statusText} - ${errText}`);
    }
  } catch (err: any) {
    // FreeBusy is critical — throw so the slots route can handle it properly
    throw err;
  }

  // 2. Events API — catches ALL events (including Free, Tentative, or any imported ones)
  // This is critical because Google sometimes marks manually created events as "Free" by default
  try {
    const eventsUrl = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
    eventsUrl.searchParams.set("timeMin", new Date(timeMin).toISOString());
    eventsUrl.searchParams.set("timeMax", new Date(timeMax).toISOString());
    eventsUrl.searchParams.set("singleEvents", "true");
    eventsUrl.searchParams.set("orderBy", "startTime");
    eventsUrl.searchParams.set("maxResults", "250");

    const eventsResponse = await fetch(eventsUrl.toString(), {
      headers: {
        "Authorization": `Bearer ${token}`,
      }
    });

    if (eventsResponse.ok) {
      const data = await eventsResponse.json();
      const events = data.items || [];
      let eventsAdded = 0;

      for (const event of events) {
        // Skip cancelled events
        if (event.status === "cancelled") continue;
        // Skip all-day events (they have date, not dateTime)
        if (!event.start?.dateTime || !event.end?.dateTime) continue;

        results.push({
          start: event.start.dateTime,
          end: event.end.dateTime,
        });
        eventsAdded++;
      }
      console.log(`[Calendar] Events API returned ${eventsAdded} event(s) (including Free-status events)`);
    } else {
      const errText = await eventsResponse.text();
      // Non-critical — FreeBusy results are still valid as a fallback
      console.warn(`[Calendar] Events API failed (non-critical): ${eventsResponse.statusText} - ${errText}`);
    }
  } catch (eventsErr: any) {
    // Non-critical — log and continue with FreeBusy results
    console.warn("[Calendar] Events API error (non-critical):", eventsErr.message);
  }

  // Deduplicate by start+end (in case an event appears in both APIs)
  const seen = new Set<string>();
  const deduplicated = results.filter(({ start, end }) => {
    const key = `${start}|${end}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`[Calendar] Total unique blocked intervals: ${deduplicated.length}`);
  return deduplicated;
}

export async function createCalendarEvent(event: {
  summary: string;
  description: string;
  startDateTime: string; // ISO string with EAT offset, e.g. 2026-08-06T10:30:00+03:00
  guestEmail: string;
}): Promise<string> {
  const token = await getGoogleAccessToken();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!calendarId) {
    throw new Error("Missing GOOGLE_CALENDAR_ID environment variable");
  }

  const start = new Date(event.startDateTime);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration

  const payload = {
    summary: event.summary,
    description: event.description,
    status: "confirmed",
    transparency: "opaque", // Mark as "Busy" so FreeBusy picks it up
    start: {
      dateTime: start.toISOString(),
      timeZone: "Africa/Nairobi"
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: "Africa/Nairobi"
    },
    attendees: [
      { email: event.guestEmail }
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 60 },
        { method: "popup", minutes: 30 },
      ]
    }
  };

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Calendar Event creation failed: ${response.statusText} - ${errText}`);
  }

  const data = await response.json();
  return data.htmlLink || "";
}
