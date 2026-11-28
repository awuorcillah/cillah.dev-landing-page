import crypto from 'crypto'

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest()
}

function sha256Hex(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex')
}

function encodeRfc3986(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  )
}

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID?.trim() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim() &&
      process.env.R2_BUCKET_NAME?.trim() &&
      process.env.R2_PUBLIC_URL?.trim()
  )
}

export function getR2PublicBaseUrl(): string | null {
  const base = process.env.R2_PUBLIC_URL?.trim()
  if (!base) return null
  return base.replace(/\/+$/, '')
}

/**
 * Generates an AWS Signature Version 4 presigned PUT URL for direct browser-to-Cloudflare-R2 uploads
 * (supports multi-GB videos up to 5 GB with zero Vercel bandwidth and zero SDK bloat).
 */
export function createR2PresignedPutUrl(
  objectKey: string,
  expiresInSeconds = 3600
): { signedUrl: string; publicUrl: string } {
  const accountId = process.env.R2_ACCOUNT_ID!.trim()
  const accessKeyId = process.env.R2_ACCESS_KEY_ID!.trim()
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!.trim()
  const bucketName = process.env.R2_BUCKET_NAME!.trim()
  const publicBase = getR2PublicBaseUrl()!

  const host = `${accountId}.r2.cloudflarestorage.com`
  const region = 'auto'
  const service = 's3'

  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '') // YYYYMMDDTHHMMSSZ
  const dateStamp = amzDate.slice(0, 8) // YYYYMMDD

  const cleanKey = objectKey.replace(/^\/+/, '')
  const encodedKeyPath = cleanKey.split('/').map(encodeRfc3986).join('/')
  const canonicalUri = `/${encodeRfc3986(bucketName)}/${encodedKeyPath}`

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  const queryParams: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${accessKeyId}/${credentialScope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresInSeconds),
    'X-Amz-SignedHeaders': 'host',
  }

  const canonicalQueryString = Object.keys(queryParams)
    .sort()
    .map((k) => `${encodeRfc3986(k)}=${encodeRfc3986(queryParams[k])}`)
    .join('&')

  const canonicalHeaders = `host:${host}\n`
  const signedHeaders = 'host'
  const payloadHash = 'UNSIGNED-PAYLOAD'

  const canonicalRequest = [
    'PUT',
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n')

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n')

  const kDate = hmacSha256(`AWS4${secretAccessKey}`, dateStamp)
  const kRegion = hmacSha256(kDate, region)
  const kService = hmacSha256(kRegion, service)
  const kSigning = hmacSha256(kService, 'aws4_request')
  const signature = crypto
    .createHmac('sha256', kSigning)
    .update(stringToSign, 'utf8')
    .digest('hex')

  const signedUrl = `https://${host}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`
  const publicUrl = `${publicBase}/${encodedKeyPath}`

  return { signedUrl, publicUrl }
}
