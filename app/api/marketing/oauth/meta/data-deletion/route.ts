import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getServiceRoleClient } from '@/lib/marketing-auth'

function parseMetaSignedRequest(signedRequest: string, appSecret: string): any | null {
  const parts = signedRequest.split('.')
  if (parts.length !== 2) return null

  const [encodedSig, encodedPayload] = parts
  const expectedSig = crypto
    .createHmac('sha256', appSecret)
    .update(encodedPayload)
    .digest()

  const actualSig = Buffer.from(
    encodedSig.replace(/-/g, '+').replace(/_/g, '/'),
    'base64'
  )

  if (
    actualSig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(actualSig, expectedSig)
  ) {
    return null
  }

  try {
    const jsonStr = Buffer.from(
      encodedPayload.replace(/-/g, '+').replace(/_/g, '/'),
      'base64'
    ).toString('utf8')
    return JSON.parse(jsonStr)
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const appSecret = process.env.META_APP_SECRET
    const contentType = request.headers.get('content-type') || ''
    let signedRequest = ''

    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      signedRequest = String(formData.get('signed_request') || '')
    } else {
      const body = await request.json().catch(() => ({}))
      signedRequest = String(body.signed_request || '')
    }

    if (!signedRequest || !appSecret) {
      return NextResponse.json(
        { error: 'Missing signed_request or META_APP_SECRET' },
        { status: 400 }
      )
    }

    const payload = parseMetaSignedRequest(signedRequest, appSecret)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid signed_request signature' }, { status: 400 })
    }

    const metaUserId = String(payload.user_id || '')
    const confirmationCode = `cillah_del_${crypto.randomBytes(6).toString('hex')}`

    const db = getServiceRoleClient()
    if (db && metaUserId) {
      // Remove any Meta OAuth tokens associated with this Meta account_id or metadata
      await db
        .from('marketing_social_connections')
        .delete()
        .eq('provider', 'meta')
        .or(`account_id.eq.${metaUserId},metadata->>fb_page_id.eq.${metaUserId},metadata->>ig_user_id.eq.${metaUserId}`)
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://cillah.dev'
    return NextResponse.json({
      url: `${origin.replace(/\/$/, '')}/privacy-policy#data-deletion`,
      confirmation_code: confirmationCode,
    })
  } catch (err: any) {
    console.error('[Meta Data Deletion Callback Error]:', err)
    return NextResponse.json({ error: 'Failed to process deletion request' }, { status: 500 })
  }
}

export async function GET() {
  const origin = (process.env.NEXT_PUBLIC_APP_URL || 'https://cillah.dev').replace(/\/$/, '')
  return NextResponse.json({
    status: 'active',
    instructions_url: `${origin}/privacy-policy#data-deletion`,
  })
}
