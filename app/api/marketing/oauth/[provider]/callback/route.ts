import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { getServiceRoleClient } from '@/lib/marketing-auth'
import { encryptToken, verifyOAuthState } from '@/lib/social-crypto'

function resolveOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  if (process.env.NODE_ENV === 'production' && forwardedHost) {
    return `https://${forwardedHost}`
  }
  return new URL(request.url).origin
}

function redirectBack(
  origin: string,
  returnTo: string,
  params: Record<string, string>
) {
  const safePath = returnTo.startsWith('/') ? returnTo : '/user/dashboard'
  const url = new URL(safePath, origin)
  url.searchParams.set('marketing_tab', 'connections')
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }
  return NextResponse.redirect(url.toString())
}

export async function GET(
  request: NextRequest,
  routeContext: { params: Promise<{ provider: string }> }
) {
  const { provider: rawProvider } = await routeContext.params
  const provider = rawProvider.toLowerCase()
  const origin = resolveOrigin(request)

  const code = request.nextUrl.searchParams.get('code')
  const stateParam = request.nextUrl.searchParams.get('state')
  const oauthError =
    request.nextUrl.searchParams.get('error_description') ||
    request.nextUrl.searchParams.get('error')

  const state = verifyOAuthState(stateParam)
  const returnTo = state?.returnTo || '/user/dashboard'

  if (oauthError) {
    return redirectBack(origin, returnTo, {
      oauth_error: `Provider denied access: ${oauthError}`,
    })
  }

  if (!state || state.provider !== provider || !code) {
    return redirectBack(origin, returnTo, {
      oauth_error: 'Invalid or expired OAuth session. Please try connecting again.',
    })
  }

  const supabase = await createServerSupabase()
  const db = getServiceRoleClient() || supabase
  const callbackUrl = `${origin}/api/marketing/oauth/${provider}/callback`
  const nowIso = new Date().toISOString()

  try {
    // ────────────────────────────────────────────────────────────────────────
    // 1. META (Facebook Pages + Linked Instagram Business/Creator Accounts)
    // ────────────────────────────────────────────────────────────────────────
    if (provider === 'meta') {
      const appId = process.env.META_APP_ID!
      const appSecret = process.env.META_APP_SECRET!

      const tokenUrl = new URL('https://graph.facebook.com/v21.0/oauth/access_token')
      tokenUrl.searchParams.set('client_id', appId)
      tokenUrl.searchParams.set('client_secret', appSecret)
      tokenUrl.searchParams.set('redirect_uri', callbackUrl)
      tokenUrl.searchParams.set('code', code)

      const shortRes = await fetch(tokenUrl.toString())
      const shortData = await shortRes.json()
      if (!shortRes.ok || !shortData.access_token) {
        throw new Error(shortData?.error?.message || 'Meta token exchange failed.')
      }

      // Exchange for 60-day long-lived token
      const longUrl = new URL('https://graph.facebook.com/v21.0/oauth/access_token')
      longUrl.searchParams.set('grant_type', 'fb_exchange_token')
      longUrl.searchParams.set('client_id', appId)
      longUrl.searchParams.set('client_secret', appSecret)
      longUrl.searchParams.set('fb_exchange_token', shortData.access_token)

      const longRes = await fetch(longUrl.toString())
      const longData = await longRes.json()
      const userAccessToken = longData.access_token || shortData.access_token
      const expiresAt = longData.expires_in
        ? new Date(Date.now() + Number(longData.expires_in) * 1000).toISOString()
        : null

      // Fetch managed Facebook Pages & their linked Instagram Business Accounts
      const pagesUrl = new URL('https://graph.facebook.com/v21.0/me/accounts')
      pagesUrl.searchParams.set(
        'fields',
        'id,name,access_token,picture{url},instagram_business_account{id,username,name,profile_picture_url}'
      )
      pagesUrl.searchParams.set('access_token', userAccessToken)

      const pagesRes = await fetch(pagesUrl.toString())
      const pagesData = await pagesRes.json()
      const pages = Array.isArray(pagesData.data) ? pagesData.data : []

      if (pages.length === 0) {
        return redirectBack(origin, returnTo, {
          oauth_error:
            'No Facebook Pages found on this Meta account. Create or select a Facebook Page (and link your Instagram Business account to it) and try again.',
        })
      }

      let connectedCount = 0
      for (const page of pages) {
        const pageToken = page.access_token || userAccessToken
        const { error: fbErr } = await db
          .from('marketing_social_connections')
          .upsert(
            {
              organization_slug: state.org,
              provider: 'meta',
              channel: 'facebook',
              account_id: String(page.id),
              account_name: page.name || 'Facebook Page',
              account_handle: page.name || null,
              account_avatar_url: page.picture?.data?.url || null,
              access_token_enc: encryptToken(pageToken),
              token_expires_at: expiresAt,
              scopes: ['pages_show_list', 'pages_manage_posts', 'pages_read_engagement'],
              metadata: { fb_page_id: String(page.id) },
              connected_by: state.email,
              status: 'connected',
              last_error: null,
              updated_at: nowIso,
            },
            { onConflict: 'organization_slug,channel,account_id' }
          )

        if (!fbErr) connectedCount += 1

        const ig = page.instagram_business_account
        if (ig?.id) {
          const { error: igErr } = await db
            .from('marketing_social_connections')
            .upsert(
              {
                organization_slug: state.org,
                provider: 'meta',
                channel: 'instagram',
                account_id: String(ig.id),
                account_name: ig.name || ig.username || 'Instagram Business',
                account_handle: ig.username ? `@${ig.username}` : null,
                account_avatar_url: ig.profile_picture_url || null,
                access_token_enc: encryptToken(pageToken),
                token_expires_at: expiresAt,
                scopes: [
                  'instagram_basic',
                  'instagram_content_publish',
                  'instagram_manage_insights',
                ],
                metadata: { ig_user_id: String(ig.id), linked_fb_page_id: String(page.id) },
                connected_by: state.email,
                status: 'connected',
                last_error: null,
                updated_at: nowIso,
              },
              { onConflict: 'organization_slug,channel,account_id' }
            )
          if (!igErr) connectedCount += 1
        }
      }

      return redirectBack(origin, returnTo, {
        oauth_success: `Meta connected (${connectedCount} Facebook/Instagram account${connectedCount === 1 ? '' : 's'})!`,
      })
    }

    // ────────────────────────────────────────────────────────────────────────
    // 2. LINKEDIN
    // ────────────────────────────────────────────────────────────────────────
    if (provider === 'linkedin') {
      const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: callbackUrl,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        }),
      })
      const tokenData = await tokenRes.json()
      if (!tokenRes.ok || !tokenData.access_token) {
        throw new Error(tokenData.error_description || 'LinkedIn token exchange failed.')
      }

      const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })
      const profile = await profileRes.json()
      const memberSub = profile.sub
      if (!memberSub) {
        throw new Error('Could not read LinkedIn profile identity (sub).')
      }

      const expiresAt = tokenData.expires_in
        ? new Date(Date.now() + Number(tokenData.expires_in) * 1000).toISOString()
        : null

      const { error: dbErr } = await db
        .from('marketing_social_connections')
        .upsert(
          {
            organization_slug: state.org,
            provider: 'linkedin',
            channel: 'linkedin',
            account_id: `urn:li:person:${memberSub}`,
            account_name: profile.name || profile.email || 'LinkedIn Profile',
            account_handle: profile.email || null,
            account_avatar_url: profile.picture || null,
            access_token_enc: encryptToken(tokenData.access_token),
            refresh_token_enc: tokenData.refresh_token
              ? encryptToken(tokenData.refresh_token)
              : null,
            token_expires_at: expiresAt,
            scopes: ['openid', 'profile', 'w_member_social'],
            metadata: { linkedin_author_urn: `urn:li:person:${memberSub}` },
            connected_by: state.email,
            status: 'connected',
            last_error: null,
            updated_at: nowIso,
          },
          { onConflict: 'organization_slug,channel,account_id' }
        )

      if (dbErr) throw new Error(dbErr.message)

      return redirectBack(origin, returnTo, {
        oauth_success: `LinkedIn connected (${profile.name || 'Profile'})!`,
      })
    }

    // ────────────────────────────────────────────────────────────────────────
    // 3. YOUTUBE (Google OAuth 2.0 + YouTube Data API v3)
    // ────────────────────────────────────────────────────────────────────────
    if (provider === 'youtube') {
      const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID!
      const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET!

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code',
        }),
      })
      const tokenData = await tokenRes.json()
      if (!tokenRes.ok || !tokenData.access_token) {
        throw new Error(tokenData.error_description || 'Google/YouTube token exchange failed.')
      }

      const chanRes = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
        { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
      )
      const chanData = await chanRes.json()
      const channel = chanData.items?.[0]
      if (!channel?.id) {
        throw new Error('No YouTube channel found on this Google account.')
      }

      const expiresAt = tokenData.expires_in
        ? new Date(Date.now() + Number(tokenData.expires_in) * 1000).toISOString()
        : null

      const { error: dbErr } = await db
        .from('marketing_social_connections')
        .upsert(
          {
            organization_slug: state.org,
            provider: 'youtube',
            channel: 'youtube',
            account_id: String(channel.id),
            account_name: channel.snippet?.title || 'YouTube Channel',
            account_handle: channel.snippet?.customUrl || null,
            account_avatar_url: channel.snippet?.thumbnails?.default?.url || null,
            access_token_enc: encryptToken(tokenData.access_token),
            refresh_token_enc: tokenData.refresh_token
              ? encryptToken(tokenData.refresh_token)
              : null,
            token_expires_at: expiresAt,
            scopes: ['youtube.upload', 'youtube.readonly', 'yt-analytics.readonly'],
            metadata: { youtube_channel_id: String(channel.id) },
            connected_by: state.email,
            status: 'connected',
            last_error: null,
            updated_at: nowIso,
          },
          { onConflict: 'organization_slug,channel,account_id' }
        )

      if (dbErr) throw new Error(dbErr.message)

      return redirectBack(origin, returnTo, {
        oauth_success: `YouTube connected (${channel.snippet?.title || 'Channel'})!`,
      })
    }

    // ────────────────────────────────────────────────────────────────────────
    // 4. TIKTOK (OAuth v2 + PKCE + Content Posting API)
    // ────────────────────────────────────────────────────────────────────────
    if (provider === 'tiktok') {
      const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY!,
          client_secret: process.env.TIKTOK_CLIENT_SECRET!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: callbackUrl,
          code_verifier: state.codeVerifier || '',
        }),
      })
      const tokenData = await tokenRes.json()
      if (!tokenRes.ok || !tokenData.access_token) {
        throw new Error(tokenData.error_description || tokenData.message || 'TikTok token exchange failed.')
      }

      const userRes = await fetch(
        'https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url,username',
        { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
      )
      const userJson = await userRes.json()
      const user = userJson.data?.user || {}
      const openId = user.open_id || tokenData.open_id || `tt_${Date.now()}`

      const expiresAt = tokenData.expires_in
        ? new Date(Date.now() + Number(tokenData.expires_in) * 1000).toISOString()
        : null

      const { error: dbErr } = await db
        .from('marketing_social_connections')
        .upsert(
          {
            organization_slug: state.org,
            provider: 'tiktok',
            channel: 'tiktok',
            account_id: String(openId),
            account_name: user.display_name || user.username || 'TikTok Account',
            account_handle: user.username ? `@${user.username}` : null,
            account_avatar_url: user.avatar_url || null,
            access_token_enc: encryptToken(tokenData.access_token),
            refresh_token_enc: tokenData.refresh_token
              ? encryptToken(tokenData.refresh_token)
              : null,
            token_expires_at: expiresAt,
            scopes: ['user.info.basic', 'video.upload', 'video.publish'],
            metadata: { tiktok_open_id: String(openId) },
            connected_by: state.email,
            status: 'connected',
            last_error: null,
            updated_at: nowIso,
          },
          { onConflict: 'organization_slug,channel,account_id' }
        )

      if (dbErr) throw new Error(dbErr.message)

      return redirectBack(origin, returnTo, {
        oauth_success: `TikTok connected (${user.display_name || user.username || 'Account'})!`,
      })
    }

    return redirectBack(origin, returnTo, { oauth_error: 'Unsupported provider' })
  } catch (err: any) {
    console.error(`[Social OAuth Callback Error - ${provider}]:`, err)
    return redirectBack(origin, returnTo, {
      oauth_error: err?.message || `Failed to connect ${provider}.`,
    })
  }
}
