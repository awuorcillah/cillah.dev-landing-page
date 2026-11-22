export const DEFAULT_CONSULTATION_PRICE_KES = 5000
export const DEFAULT_CONSULTATION_PRICE_USD = 40

function parsePositiveWholeNumber(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback
  const trimmed = raw.trim()
  if (!/^\d+$/.test(trimmed)) return fallback
  const parsed = Number.parseInt(trimmed, 10)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return fallback
  return parsed
}

export const CONSULTATION_PRICE_KES = parsePositiveWholeNumber(
  process.env.NEXT_PUBLIC_CONSULTATION_PRICE_KES,
  DEFAULT_CONSULTATION_PRICE_KES
)

export const CONSULTATION_PRICE_USD = parsePositiveWholeNumber(
  process.env.NEXT_PUBLIC_CONSULTATION_PRICE_USD,
  DEFAULT_CONSULTATION_PRICE_USD
)

export const CONSULTATION_PRICE_KES_FORMATTED = `KES ${CONSULTATION_PRICE_KES.toLocaleString("en-US")}`
export const CONSULTATION_PRICE_USD_FORMATTED = `$${CONSULTATION_PRICE_USD.toLocaleString("en-US")} USD`
export const CONSULTATION_PRICE_USD_DECIMAL = `$${CONSULTATION_PRICE_USD.toLocaleString("en-US")}.00 USD`
export const CONSULTATION_PRICE_DISPLAY = `${CONSULTATION_PRICE_KES_FORMATTED} / ${CONSULTATION_PRICE_USD_FORMATTED}`
