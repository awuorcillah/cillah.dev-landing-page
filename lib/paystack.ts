import crypto from "crypto"

const PAYSTACK_BASE_URL = "https://api.paystack.co"

export type PaystackChannel = "card" | "mobile_money" | "apple_pay" | "bank" | "bank_transfer"

export function getPaystackSecretKey(): string {
  return (process.env.PAYSTACK_SECRET_KEY || "").trim()
}

export function getPaystackPublicKey(): string {
  return (process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "").trim()
}

export function isPaystackConfigured(): boolean {
  return Boolean(getPaystackSecretKey())
}

export function isPaystackLiveMode(): boolean {
  return getPaystackSecretKey().startsWith("sk_live_")
}

export interface PaystackInitParams {
  email: string
  amountMajor: number // e.g., 5000 for KES 5,000 or 40 for $40 USD
  currency?: "KES" | "USD"
  reference: string
  callbackUrl: string
  channels?: PaystackChannel[]
  metadata?: Record<string, any>
}

export interface PaystackInitResult {
  authorization_url: string
  access_code: string
  reference: string
}

export async function initializePaystackTransaction(
  params: PaystackInitParams
): Promise<PaystackInitResult> {
  const secretKey = getPaystackSecretKey()
  if (!secretKey) {
    throw new Error(
      "Paystack is not configured yet. Please add PAYSTACK_SECRET_KEY to your environment variables."
    )
  }

  const currency = params.currency || "KES"
  // Paystack requires amounts in subunits (kobo/cents): multiply by 100 and round to integer
  const amountSubunit = Math.round(Number(params.amountMajor) * 100)
  if (!Number.isFinite(amountSubunit) || amountSubunit <= 0) {
    throw new Error("Invalid payment amount")
  }

  const payload: Record<string, any> = {
    email: params.email.trim().toLowerCase(),
    amount: amountSubunit,
    currency,
    reference: params.reference,
    callback_url: params.callbackUrl,
    metadata: params.metadata || {},
  }

  if (params.channels && params.channels.length > 0) {
    payload.channels = params.channels
  }

  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data?.status || !data?.data?.authorization_url) {
    const errMsg =
      data?.message ||
      `Paystack rejected transaction initialization (HTTP ${res.status})`
    throw new Error(errMsg)
  }

  return {
    authorization_url: data.data.authorization_url,
    access_code: data.data.access_code,
    reference: data.data.reference,
  }
}

export interface PaystackVerifyData {
  id: number
  status: string // 'success' | 'failed' | 'abandoned' | 'pending'
  reference: string
  amount: number // in subunits
  currency: string
  channel: string // 'card' | 'mobile_money' | 'apple_pay' | ...
  paid_at: string | null
  gateway_response: string | null
  customer?: {
    email?: string
    phone?: string | null
  }
  metadata?: Record<string, any>
}

export async function verifyPaystackTransaction(
  reference: string
): Promise<PaystackVerifyData> {
  const secretKey = getPaystackSecretKey()
  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured on the server.")
  }

  const cleanRef = encodeURIComponent(reference.trim())
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${cleanRef}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data?.status || !data?.data) {
    throw new Error(data?.message || `Failed to verify Paystack transaction (HTTP ${res.status})`)
  }

  return data.data as PaystackVerifyData
}

export function verifyPaystackWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secretKey = getPaystackSecretKey()
  if (!secretKey || !signatureHeader) return false
  const hash = crypto
    .createHmac("sha512", secretKey)
    .update(rawBody)
    .digest("hex")
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hash, "utf8"),
      Buffer.from(signatureHeader.trim(), "utf8")
    )
  } catch {
    return false
  }
}

export function generatePaymentReference(prefix: string): string {
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase()
  return `${prefix}-${Date.now()}-${rand}`
}

export function generatePublicInvoiceToken(): string {
  return crypto.randomBytes(12).toString("hex")
}
