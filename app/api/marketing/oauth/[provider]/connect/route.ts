import { NextRequest, NextResponse } from 'next/server'
import { resolveMarketingAuth } from '@/lib/marketing-auth'
import { generatePkcePair, signOAuthState } from '@/lib/social-crypto'

type SupportedProvider = 'meta' | 'linkedin' | 'youtube' | 'tiktok'

function resolveOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  if (process.env.NODE_ENV === 'production' && forwardedHost) {
    return `https://${forwardedHost}`
  }
  return new URL(request.url).origin
}

function redirectWithError(origin: string, returnTo: string, message: string) {
  const safePath = returnTo.startsWith('/') ? returnTo : '/user/dashboard'
  const url = new URL(safePath, origin)
  url.searchParams.set('marketing_tab', 'connections')
  url.searchParams.set('oauth_error', message)
  return NextResponse.redirect(url.toString())
}

export async function GET(
  request: NextRequest,
  routeContext: { params: Promise<{ provider: string }> }
) {
  const { provider: rawProvider } = await routeContext.params
  const provider = rawProvider.toLowerCase() as SupportedProvider
  const origin = resolveOrigin(request)
  const org = request.nextUrl.searchParams.get('org') || 'cillah-dev'
  const returnTo = request.nextUrl.searchParams.get('returnTo') || '/user/dashboard'

  if (!['meta', 'linkedin', 'youtube', 'tiktok'].includes(provider)) {
    return redirectWithError(origin, returnTo, `Unsupported social provider: ${rawProvider}`)
  }

  const { context } = await resolveMarketingAuth(org)
  if (!context) {
    return NextResponse.redirect(`${origin}/login`)
  }

  if (!context.permissions.canPublishDirectly) {
    return redirectWithError(
      origin,
      returnTo,
      'Only Marketing Admins or Publishers can connect organization social accounts.'
    )
  }

  const callbackUrl = `${origin}/api/marketing/oauth/${provider}/callback`

  if (provider === 'meta') {
    const appId = process.env.META_APP_ID
    const appSecret = process.env.META_APP_SECRET
    if (!appId || !appSecret) {
      return redirectWithError(
        origin,
        returnTo,
        'Add META_APP_ID and META_APP_SECRET in your Vercel Environment Variables first.'
      )
    }

    const state = signOAuthState({
      provider,
      org,
      userId: context.userId,
      email: context.email,
      returnTo,
    })

    const includeMessaging = request.nextUrl.searchParams.get('includeMessaging') === 'true'
    const baseScopes = [
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
      'instagram_basic',
      'instagram_content_publish',
      'instagram_manage_insights',
      'business_management',
    ]
    const messagingScopes = [
      'pages_messaging',
      'instagram_manage_messages',
      'instagram_manage_comments',
    ]
    const scopes = (includeMessaging ? [...baseScopes, ...messagingScopes] : baseScopes).join(',')

    const authUrl = new URL('https://www.facebook.com/v21.0/dialog/oauth')
    authUrl.searchParams.set('client_id', appId)
    authUrl.searchParams.set('redirect_uri', callbackUrl)
    authUrl.searchParams.set('scope', scopes)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('auth_type', 'rerequest')
    authUrl.searchParams.set('state', state)

    return NextResponse.redirect(authUrl.toString())
  }

  if (provider === 'linkedin') {
    const clientId = process.env.LINKEDIN_CLIENT_ID
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      return redirectWithError(
        origin,
        returnTo,
        'Add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in your Vercel Environment Variables first.'
      )
    }

    const state = signOAuthState({
      provider,
      org,
      userId: context.userId,
      email: context.email,
      returnTo,
    })

    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', callbackUrl)
    authUrl.searchParams.set('scope', 'openid profile email w_member_social')
    authUrl.searchParams.set('state', state)

    return NextResponse.redirect(authUrl.toString())
  }

  if (provider === 'youtube') {
    const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      return redirectWithError(
        origin,
        returnTo,
        'Add YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET in your Vercel Environment Variables first.'
      )
    }

    const state = signOAuthState({
      provider,
      org,
      userId: context.userId,
      email: context.email,
      returnTo,
    })

    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/yt-analytics.readonly',
    ].join(' ')

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', callbackUrl)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', scopes)
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')
    authUrl.searchParams.set('state', state)

    return NextResponse.redirect(authUrl.toString())
  }

  if (provider === 'tiktok') {
    const clientKey = process.env.TIKTOK_CLIENT_KEY?.trim()
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET?.trim()
    if (!clientKey || !clientSecret) {
      return redirectWithError(
        origin,
        returnTo,
        'Add TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET in your Vercel Environment Variables first.'
      )
    }

    const { codeVerifier, codeChallenge } = generatePkcePair()
    const state = signOAuthState({
      provider,
      org,
      userId: context.userId,
      email: context.email,
      returnTo,
      codeVerifier,
    })

    const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/')
    authUrl.searchParams.set('client_key', clientKey)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set(
      'scope',
      'user.info.basic,user.info.stats,video.list,video.upload,video.publish'
    )
    authUrl.searchParams.set('redirect_uri', callbackUrl)
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('code_challenge', codeChallenge)
    authUrl.searchParams.set('code_challenge_method', 'S256')

    return NextResponse.redirect(authUrl.toString())
  }

  return redirectWithError(origin, returnTo, 'Unknown provider')
}
