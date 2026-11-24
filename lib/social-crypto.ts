import crypto from 'crypto'

const ALGO = 'aes-256-gcm'

function getEncryptionKey(): Buffer {
  const secret =
    process.env.MARKETING_TOKEN_ENCRYPTION_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'cillah-dev-local-fallback-key-change-in-production'

  return crypto.createHash('sha256').update(secret).digest()
}

/**
 * Encrypts sensitive OAuth access/refresh tokens with AES-256-GCM before storing in Postgres.
 */
export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('base64url')}.${authTag.toString('base64url')}.${encrypted.toString('base64url')}`
}

/**
 * Decrypts an AES-256-GCM token stored in Postgres.
 */
export function decryptToken(payload?: string | null): string | null {
  if (!payload) return null
  const parts = payload.split('.')
  if (parts.length !== 3) return null

  try {
    const key = getEncryptionKey()
    const iv = Buffer.from(parts[0], 'base64url')
    const authTag = Buffer.from(parts[1], 'base64url')
    const ciphertext = Buffer.from(parts[2], 'base64url')
    const decipher = crypto.createDecipheriv(ALGO, key, iv)
    decipher.setAuthTag(authTag)
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
    return decrypted.toString('utf8')
  } catch {
    return null
  }
}

export interface OAuthStatePayload {
  provider: string
  org: string
  userId: string
  email: string
  returnTo: string
  codeVerifier?: string
  exp: number
}

/**
 * Creates an HMAC-SHA256 signed OAuth `state` parameter to prevent CSRF & cross-tenant attacks.
 */
export function signOAuthState(payload: Omit<OAuthStatePayload, 'exp'>): string {
  const fullPayload: OAuthStatePayload = {
    ...payload,
    exp: Date.now() + 15 * 60 * 1000, // 15 minutes
  }
  const encoded = Buffer.from(JSON.stringify(fullPayload), 'utf8').toString('base64url')
  const sig = crypto
    .createHmac('sha256', getEncryptionKey())
    .update(encoded)
    .digest('base64url')
  return `${encoded}.${sig}`
}

/**
 * Verifies the HMAC signature and expiration of an incoming OAuth `state` parameter.
 */
export function verifyOAuthState(stateParam: string | null): OAuthStatePayload | null {
  if (!stateParam) return null
  const parts = stateParam.split('.')
  if (parts.length !== 2) return null

  const [encoded, sig] = parts
  const expectedSig = crypto
    .createHmac('sha256', getEncryptionKey())
    .update(encoded)
    .digest('base64url')

  const sigBuf = Buffer.from(sig)
  const expectedBuf = Buffer.from(expectedSig)
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as OAuthStatePayload
    if (!parsed.exp || Date.now() > parsed.exp) return null
    return parsed
  } catch {
    return null
  }
}

/**
 * Generates PKCE code_verifier & S256 code_challenge (required by TikTok OAuth v2).
 */
export function generatePkcePair() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url')
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')
  return { codeVerifier, codeChallenge }
}
