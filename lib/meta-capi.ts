import crypto from "crypto"

const META_GRAPH_VERSION = "v21.0"

function sha256Normalized(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex")
}

function normalizeEmail(raw?: string | null): string | undefined {
  if (!raw) return undefined
  const clean = raw.trim().toLowerCase()
  return clean ? sha256Normalized(clean) : undefined
}

function normalizePhone(raw?: string | null): string | undefined {
  if (!raw) return undefined
  const digits = raw.replace(/\D/g, "")
  return digits.length >= 7 ? sha256Normalized(digits) : undefined
}

function normalizeNamePart(raw?: string | null): string | undefined {
  if (!raw) return undefined
  const clean = raw.trim().toLowerCase().replace(/[^a-z]/g, "")
  return clean ? sha256Normalized(clean) : undefined
}

function splitFullName(fullName?: string | null): { firstName?: string; lastName?: string } {
  if (!fullName) return {}
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return {}
  if (parts.length === 1) return { firstName: parts[0] }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  }
}

export function extractMetaCookies(cookieHeader: string | null): { fbp?: string; fbc?: string } {
  if (!cookieHeader) return {}
  const out: { fbp?: string; fbc?: string } = {}
  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=")
    const val = rest.join("=").trim()
    if (rawKey === "_fbp" && val) out.fbp = val
    if (rawKey === "_fbc" && val) out.fbc = val
  }
  return out
}

export interface MetaCapiEventInput {
  eventName: "Lead" | "Schedule" | "Purchase" | "InitiateCheckout" | "CompleteRegistration" | "PageView"
  eventId?: string
  eventSourceUrl?: string
  email?: string | null
  phone?: string | null
  fullName?: string | null
  clientIpAddress?: string | null
  clientUserAgent?: string | null
  fbp?: string
  fbc?: string
  externalId?: string | null
  customData?: Record<string, unknown>
}

/**
 * Sends a server-side event to Meta Conversions API (Dataset ID + Secret Access Token).
 * Safely no-ops if NEXT_PUBLIC_META_PIXEL_ID or META_CAPI_ACCESS_TOKEN is not configured,
 * and never throws so upstream payment/lead routes are never disrupted.
 */
export async function sendMetaCapiEvent(input: MetaCapiEventInput): Promise<boolean> {
  const datasetId = (process.env.META_DATASET_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || "").trim()
  const accessToken = (process.env.META_CAPI_ACCESS_TOKEN || "").trim()

  if (!datasetId || !accessToken) {
    return false
  }

  const { firstName, lastName } = splitFullName(input.fullName)

  const userData: Record<string, unknown> = {}
  const em = normalizeEmail(input.email)
  const ph = normalizePhone(input.phone)
  const fn = normalizeNamePart(firstName)
  const ln = normalizeNamePart(lastName)

  if (em) userData.em = [em]
  if (ph) userData.ph = [ph]
  if (fn) userData.fn = [fn]
  if (ln) userData.ln = [ln]
  if (input.externalId) userData.external_id = [sha256Normalized(String(input.externalId).trim())]
  if (input.clientIpAddress) userData.client_ip_address = input.clientIpAddress
  if (input.clientUserAgent) userData.client_user_agent = input.clientUserAgent
  if (input.fbp) userData.fbp = input.fbp
  if (input.fbc) userData.fbc = input.fbc

  const payload = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        event_id: input.eventId || crypto.randomUUID(),
        event_source_url: input.eventSourceUrl || "https://www.cillah.dev",
        user_data: userData,
        ...(input.customData ? { custom_data: input.customData } : {}),
      },
    ],
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4500)

    const res = await fetch(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(datasetId)}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
    )

    clearTimeout(timeout)

    if (!res.ok) {
      const errBody = await res.text().catch(() => "")
      console.warn(`[Meta CAPI] ${input.eventName} HTTP ${res.status}:`, errBody.slice(0, 300))
      return false
    }

    console.log(`[Meta CAPI] Sent ${input.eventName} (event_id=${payload.data[0].event_id})`)
    return true
  } catch (err: any) {
    console.warn(`[Meta CAPI] ${input.eventName} failed:`, err?.message || err)
    return false
  }
}
