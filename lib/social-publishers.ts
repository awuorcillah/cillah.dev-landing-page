import { decryptToken, encryptToken } from '@/lib/social-crypto'
import type {
  ChannelDeliveryStatus,
  MarketingMediaFile,
} from '@/lib/marketing-config'

export interface SocialConnectionRow {
  id: string
  organization_slug: string
  provider: 'meta' | 'linkedin' | 'youtube' | 'tiktok' | 'whatsapp'
  channel: 'instagram' | 'facebook' | 'linkedin' | 'youtube' | 'tiktok' | 'whatsapp_status'
  account_id: string
  account_name: string
  account_handle?: string | null
  account_avatar_url?: string | null
  access_token_enc: string
  refresh_token_enc?: string | null
  token_expires_at?: string | null
  metadata?: Record<string, any> | null
  status: string
}

export interface PublishPostInput {
  title: string
  caption: string
  hashtags?: string | null
  cta_url?: string | null
  media_files: MarketingMediaFile[]
}

function buildFullCopy(post: PublishPostInput): string {
  const parts = [post.caption.trim()]
  if (post.hashtags?.trim()) parts.push(post.hashtags.trim())
  if (post.cta_url?.trim()) parts.push(post.cta_url.trim())
  return parts.filter(Boolean).join('\n\n')
}

export async function refreshYouTubeAccessToken(
  conn: SocialConnectionRow,
  db: any
): Promise<string | null> {
  const current = decryptToken(conn.access_token_enc)
  const expiresAt = conn.token_expires_at ? new Date(conn.token_expires_at).getTime() : 0
  if (current && (!expiresAt || expiresAt > Date.now() + 60_000)) {
    return current
  }

  const refreshToken = decryptToken(conn.refresh_token_enc)
  const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET
  if (!refreshToken || !clientId || !clientSecret) return current

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  if (!res.ok || !data.access_token) return current

  const nextExpires = data.expires_in
    ? new Date(Date.now() + Number(data.expires_in) * 1000).toISOString()
    : null

  await db
    .from('marketing_social_connections')
    .update({
      access_token_enc: encryptToken(data.access_token),
      token_expires_at: nextExpires,
      status: 'connected',
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conn.id)

  return data.access_token
}

export async function refreshTikTokAccessToken(
  conn: SocialConnectionRow,
  db: any
): Promise<string | null> {
  const current = decryptToken(conn.access_token_enc)
  const expiresAt = conn.token_expires_at ? new Date(conn.token_expires_at).getTime() : 0
  if (current && (!expiresAt || expiresAt > Date.now() + 60_000)) {
    return current
  }

  const refreshToken = decryptToken(conn.refresh_token_enc)
  const clientKey = process.env.TIKTOK_CLIENT_KEY?.trim()
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET?.trim()
  if (!refreshToken || !clientKey || !clientSecret) return current

  const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  const data = await res.json()
  if (!res.ok || !data.access_token) return current

  const nextExpires = data.expires_in
    ? new Date(Date.now() + Number(data.expires_in) * 1000).toISOString()
    : null

  await db
    .from('marketing_social_connections')
    .update({
      access_token_enc: encryptToken(data.access_token),
      refresh_token_enc: data.refresh_token
        ? encryptToken(data.refresh_token)
        : conn.refresh_token_enc,
      token_expires_at: nextExpires,
      status: 'connected',
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conn.id)

  return data.access_token
}

async function publishToFacebook(
  conn: SocialConnectionRow,
  post: PublishPostInput
): Promise<ChannelDeliveryStatus> {
  const now = new Date().toISOString()
  const token = decryptToken(conn.access_token_enc)
  if (!token) {
    return { state: 'failed', note: 'Facebook Page token missing or unreadable.', updated_at: now }
  }

  const pageId = conn.account_id
  const message = buildFullCopy(post)
  const firstImage = post.media_files.find((f) => f.kind === 'image')
  const firstVideo = post.media_files.find((f) => f.kind === 'video')

  let endpoint = `https://graph.facebook.com/v21.0/${pageId}/feed`
  const payload: Record<string, string> = { access_token: token }

  if (firstVideo) {
    endpoint = `https://graph.facebook.com/v21.0/${pageId}/videos`
    payload.file_url = firstVideo.url
    payload.description = message
    payload.title = post.title
  } else if (firstImage) {
    endpoint = `https://graph.facebook.com/v21.0/${pageId}/photos`
    payload.url = firstImage.url
    payload.caption = message
  } else {
    payload.message = message
    if (post.cta_url) payload.link = post.cta_url
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()

  if (!res.ok || data.error) {
    return {
      state: 'failed',
      note: data?.error?.message || 'Facebook Graph API publish failed.',
      updated_at: now,
    }
  }

  const postId = data.post_id || data.id
  return {
    state: 'live',
    url: postId ? `https://www.facebook.com/${postId}` : undefined,
    note: `Published live to Facebook Page (${conn.account_name})`,
    updated_at: now,
  }
}

async function publishToInstagram(
  conn: SocialConnectionRow,
  post: PublishPostInput
): Promise<ChannelDeliveryStatus> {
  const now = new Date().toISOString()
  const token = decryptToken(conn.access_token_enc)
  if (!token) {
    return { state: 'failed', note: 'Instagram access token missing.', updated_at: now }
  }

  const firstVideo = post.media_files.find((f) => f.kind === 'video')
  const firstImage = post.media_files.find((f) => f.kind === 'image')

  if (!firstImage && !firstVideo) {
    return {
      state: 'failed',
      note: 'Instagram requires at least one uploaded image or video.',
      updated_at: now,
    }
  }

  const igUserId = conn.account_id
  const caption = buildFullCopy(post).slice(0, 2200)

  const containerBody: Record<string, string> = {
    caption,
    access_token: token,
  }
  if (firstVideo) {
    containerBody.media_type = 'REELS'
    containerBody.video_url = firstVideo.url
  } else if (firstImage) {
    containerBody.image_url = firstImage.url
  }

  // Step 1: Create media container
  const createRes = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(containerBody),
  })
  const createData = await createRes.json()

  if (!createRes.ok || !createData.id) {
    return {
      state: 'failed',
      note: createData?.error?.message || 'Instagram container creation failed.',
      updated_at: now,
    }
  }

  // Step 2: Publish container
  const publishRes = await fetch(
    `https://graph.facebook.com/v21.0/${igUserId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: createData.id,
        access_token: token,
      }),
    }
  )
  const publishData = await publishRes.json()

  if (!publishRes.ok || !publishData.id) {
    return {
      state: 'failed',
      note: publishData?.error?.message || 'Instagram media_publish failed.',
      updated_at: now,
    }
  }

  return {
    state: 'live',
    url: conn.account_handle
      ? `https://www.instagram.com/${conn.account_handle.replace(/^@/, '')}/`
      : undefined,
    note: `Published live to Instagram (${conn.account_handle || conn.account_name})`,
    updated_at: now,
  }
}

async function publishToLinkedIn(
  conn: SocialConnectionRow,
  post: PublishPostInput
): Promise<ChannelDeliveryStatus> {
  const now = new Date().toISOString()
  const token = decryptToken(conn.access_token_enc)
  if (!token) {
    return { state: 'failed', note: 'LinkedIn access token missing.', updated_at: now }
  }

  const authorUrn =
    conn.metadata?.linkedin_author_urn ||
    (conn.account_id.startsWith('urn:') ? conn.account_id : `urn:li:person:${conn.account_id}`)

  const text = `${post.title}\n\n${buildFullCopy(post)}`.slice(0, 3000)

  const shareContent: Record<string, any> = {
    shareCommentary: { text },
    shareMediaCategory: post.cta_url ? 'ARTICLE' : 'NONE',
  }

  if (post.cta_url) {
    shareContent.media = [
      {
        status: 'READY',
        originalUrl: post.cta_url,
        title: { text: post.title },
      },
    ]
  }

  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': shareContent,
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    }),
  })

  if (!res.ok) {
    const errBody = await res.text()
    return {
      state: 'failed',
      note: `LinkedIn API error (${res.status}): ${errBody.slice(0, 180)}`,
      updated_at: now,
    }
  }

  const postUrn = res.headers.get('x-restli-id') || ''
  return {
    state: 'live',
    url: postUrn ? `https://www.linkedin.com/feed/update/${postUrn}/` : undefined,
    note: `Published live to LinkedIn (${conn.account_name})`,
    updated_at: now,
  }
}

async function publishToYouTube(
  conn: SocialConnectionRow,
  post: PublishPostInput,
  db: any
): Promise<ChannelDeliveryStatus> {
  const now = new Date().toISOString()
  const firstVideo = post.media_files.find((f) => f.kind === 'video')
  if (!firstVideo) {
    return {
      state: 'failed',
      note: 'YouTube requires an uploaded video file (MP4/MOV/WebM).',
      updated_at: now,
    }
  }

  const token = await refreshYouTubeAccessToken(conn, db)
  if (!token) {
    return { state: 'failed', note: 'YouTube OAuth token missing or expired.', updated_at: now }
  }

  const videoRes = await fetch(firstVideo.url)
  if (!videoRes.ok) {
    return { state: 'failed', note: 'Could not download uploaded video for YouTube.', updated_at: now }
  }
  const videoBytes = await videoRes.arrayBuffer()
  const mimeType = firstVideo.mime_type || 'video/mp4'

  const metadata = {
    snippet: {
      title: post.title.slice(0, 100),
      description: buildFullCopy(post).slice(0, 5000),
      tags: (post.hashtags || '')
        .split(/[\s,#]+/)
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 15),
    },
    status: {
      privacyStatus: 'public',
    },
  }

  // Step 1: Initialize a YouTube Resumable Upload session (reliable for videos up to 50 MB+)
  const initRes = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Length': String(videoBytes.byteLength),
        'X-Upload-Content-Type': mimeType,
      },
      body: JSON.stringify(metadata),
    }
  )

  const uploadLocation = initRes.headers.get('location')
  if (!initRes.ok || !uploadLocation) {
    const errJson = await initRes.json().catch(() => ({}))
    return {
      state: 'failed',
      note: errJson?.error?.message || `YouTube upload init failed (HTTP ${initRes.status}).`,
      updated_at: now,
    }
  }

  // Step 2: Upload the raw video bytes directly to Google's resumable upload URI
  const uploadRes = await fetch(uploadLocation, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': mimeType,
      'Content-Length': String(videoBytes.byteLength),
    },
    body: videoBytes,
  })

  const data = await uploadRes.json().catch(() => ({}))
  if (!uploadRes.ok || !data.id) {
    return {
      state: 'failed',
      note: data?.error?.message || `YouTube video upload failed (HTTP ${uploadRes.status}).`,
      updated_at: now,
    }
  }

  return {
    state: 'live',
    url: `https://youtu.be/${data.id}`,
    note: `Uploaded live to YouTube (${conn.account_name})`,
    updated_at: now,
  }
}

async function publishToTikTok(
  conn: SocialConnectionRow,
  post: PublishPostInput,
  db: any
): Promise<ChannelDeliveryStatus> {
  const now = new Date().toISOString()
  const firstVideo = post.media_files.find((f) => f.kind === 'video')
  if (!firstVideo) {
    return {
      state: 'failed',
      note: 'TikTok requires an uploaded vertical video (MP4/MOV).',
      updated_at: now,
    }
  }

  const token = await refreshTikTokAccessToken(conn, db)
  if (!token) {
    return { state: 'failed', note: 'TikTok OAuth token missing or expired.', updated_at: now }
  }

  // Download uploaded video bytes and stream via TikTok FILE_UPLOAD (avoids URL ownership verification issues)
  const videoRes = await fetch(firstVideo.url)
  if (!videoRes.ok) {
    return {
      state: 'failed',
      note: 'Could not download uploaded video for TikTok.',
      updated_at: now,
    }
  }
  const videoBytes = await videoRes.arrayBuffer()
  const videoSize = videoBytes.byteLength
  const mimeType = firstVideo.mime_type || 'video/mp4'

  // Use TikTok Inbox/Drafts FILE_UPLOAD (or Direct Post once TIKTOK_DIRECT_POST_APPROVED=true)
  const useDirectPost = process.env.TIKTOK_DIRECT_POST_APPROVED === 'true'
  const endpoint = useDirectPost
    ? 'https://open.tiktokapis.com/v2/post/publish/video/init/'
    : 'https://open.tiktokapis.com/v2/post/publish/inbox/video/init/'

  const sourceInfo = {
    source: 'FILE_UPLOAD',
    video_size: videoSize,
    chunk_size: videoSize,
    total_chunk_count: 1,
  }

  const payload = useDirectPost
    ? {
        post_info: {
          title: `${post.title} ${post.hashtags || ''}`.trim().slice(0, 2200),
          privacy_level: 'SELF_ONLY',
        },
        source_info: sourceInfo,
      }
    : {
        source_info: sourceInfo,
      }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))

  if (!res.ok || (data.error && data.error.code !== 'ok') || !data.data?.upload_url) {
    return {
      state: 'failed',
      note: data?.error?.message || `TikTok Content Posting API init failed (HTTP ${res.status}).`,
      updated_at: now,
    }
  }

  // Step 2: PUT the video binary directly to TikTok's signed upload_url
  const putRes = await fetch(data.data.upload_url, {
    method: 'PUT',
    headers: {
      'Content-Type': mimeType,
      'Content-Length': String(videoSize),
      'Content-Range': `bytes 0-${videoSize - 1}/${videoSize}`,
    },
    body: videoBytes,
  })

  if (!putRes.ok) {
    return {
      state: 'failed',
      note: `TikTok binary video upload failed (HTTP ${putRes.status}).`,
      updated_at: now,
    }
  }

  return {
    state: useDirectPost ? 'live' : 'dispatched',
    url: conn.account_handle
      ? `https://www.tiktok.com/${conn.account_handle.startsWith('@') ? conn.account_handle : `@${conn.account_handle}`}`
      : undefined,
    note: useDirectPost
      ? `Uploaded directly to TikTok (${conn.account_name})`
      : `Sent to TikTok Inbox/Drafts (${conn.account_name}) — open TikTok app notifications to publish`,
    updated_at: now,
  }
}

async function publishToWhatsAppStatus(
  conn: SocialConnectionRow,
  post: PublishPostInput
): Promise<ChannelDeliveryStatus> {
  const now = new Date().toISOString()
  const gatewayUrl = conn.metadata?.gateway_url
  const token = decryptToken(conn.access_token_enc)

  if (!gatewayUrl || !token) {
    return {
      state: 'dispatched',
      note: 'Ready for WhatsApp Status share (connect Whapi/Evolution gateway for auto-post).',
      updated_at: now,
    }
  }

  const firstMedia = post.media_files.find((f) => f.kind === 'image' || f.kind === 'video')
  const res = await fetch(gatewayUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      caption: buildFullCopy(post).slice(0, 700),
      media: firstMedia?.url,
      media_type: firstMedia?.kind || 'text',
    }),
  })

  if (!res.ok) {
    return {
      state: 'failed',
      note: `WhatsApp Status gateway error (${res.status}).`,
      updated_at: now,
    }
  }

  return {
    state: 'live',
    note: `Posted to WhatsApp Status (${conn.account_name})`,
    updated_at: now,
  }
}

/**
 * Publishes to every connected social channel for an organization and returns per-channel status updates.
 */
export async function dispatchToConnectedSocialChannels(
  db: any,
  organizationSlug: string,
  channels: string[],
  post: PublishPostInput
): Promise<Record<string, ChannelDeliveryStatus>> {
  const socialChannels = channels.filter(
    (c) => c !== 'website_articles' && c !== 'website_use_cases'
  )
  const results: Record<string, ChannelDeliveryStatus> = {}
  if (socialChannels.length === 0) return results

  const { data: connections, error } = await db
    .from('marketing_social_connections')
    .select('*')
    .eq('organization_slug', organizationSlug)
    .eq('status', 'connected')
    .in('channel', socialChannels)

  const now = new Date().toISOString()
  const connByChannel = new Map<string, SocialConnectionRow>()
  if (!error && Array.isArray(connections)) {
    for (const c of connections) {
      if (!connByChannel.has(c.channel)) connByChannel.set(c.channel, c)
    }
  }

  await Promise.all(
    socialChannels.map(async (channel) => {
      const conn = connByChannel.get(channel)
      if (!conn) {
        results[channel] = {
          state: 'queued_webhook',
          note: 'Account not connected yet — open Connected Accounts to link OAuth.',
          updated_at: now,
        }
        return
      }

      try {
        if (channel === 'facebook') {
          results[channel] = await publishToFacebook(conn, post)
        } else if (channel === 'instagram') {
          results[channel] = await publishToInstagram(conn, post)
        } else if (channel === 'linkedin') {
          results[channel] = await publishToLinkedIn(conn, post)
        } else if (channel === 'youtube') {
          results[channel] = await publishToYouTube(conn, post, db)
        } else if (channel === 'tiktok') {
          results[channel] = await publishToTikTok(conn, post, db)
        } else if (channel === 'whatsapp_status') {
          results[channel] = await publishToWhatsAppStatus(conn, post)
        }
      } catch (err: any) {
        results[channel] = {
          state: 'failed',
          note: err?.message || `Unexpected error publishing to ${channel}.`,
          updated_at: new Date().toISOString(),
        }
      }
    })
  )

  return results
}
