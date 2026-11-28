import { NextRequest, NextResponse } from 'next/server'
import {
  resolveMarketingAuth,
  getServiceRoleClient,
  isMissingTableError,
} from '@/lib/marketing-auth'
import {
  refreshTikTokAccessToken,
  type SocialConnectionRow,
} from '@/lib/social-publishers'

interface TikTokVideoSummary {
  id: string
  title: string
  createTime: string
  shareUrl?: string | null
  views: number
  likes: number
  comments: number
  shares: number
  engagements: number
}

async function fetchLiveTikTokInsights(orgSlug: string, persistToMetrics: boolean) {
  const { context, supabase, error, status } = await resolveMarketingAuth(orgSlug)
  if (!context) {
    return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 })
  }

  const db = getServiceRoleClient() || supabase
  const { data: conn, error: connError } = await db
    .from('marketing_social_connections')
    .select('*')
    .eq('organization_slug', orgSlug)
    .eq('channel', 'tiktok')
    .eq('status', 'connected')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (connError) {
    if (isMissingTableError(connError)) {
      return NextResponse.json({ connected: false, analytics: null, schema_pending: true })
    }
    return NextResponse.json({ error: connError.message }, { status: 500 })
  }

  if (!conn) {
    return NextResponse.json({
      connected: false,
      analytics: null,
      message: 'Connect a TikTok account in Connected Accounts to stream live TikTok Insights.',
    })
  }

  const accessToken = await refreshTikTokAccessToken(conn as SocialConnectionRow, db)
  if (!accessToken) {
    return NextResponse.json(
      {
        connected: true,
        analytics: null,
        error: 'TikTok OAuth token expired or unreadable. Please reconnect TikTok in Connected Accounts.',
      },
      { status: 401 }
    )
  }

  const [userRes, videosRes] = await Promise.all([
    fetch(
      'https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url,username,follower_count,following_count,likes_count,video_count',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      }
    ),
    fetch(
      'https://open.tiktokapis.com/v2/video/list/?fields=id,title,create_time,cover_image_url,share_url,view_count,like_count,comment_count,share_count',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ max_count: 20 }),
        cache: 'no-store',
      }
    ),
  ])

  const [userJson, videosJson] = await Promise.all([
    userRes.json().catch(() => ({})),
    videosRes.json().catch(() => ({})),
  ])

  const user = userJson?.data?.user || {}
  const profile = {
    openId: user.open_id || conn.account_id,
    displayName: user.display_name || conn.account_name,
    username: user.username ? `@${user.username}` : conn.account_handle || null,
    avatarUrl: user.avatar_url || conn.account_avatar_url || null,
    followerCount: Number(user.follower_count || 0),
    followingCount: Number(user.following_count || 0),
    lifetimeLikes: Number(user.likes_count || 0),
    videoCount: Number(user.video_count || 0),
  }

  const userErr = userJson?.error && userJson.error.code !== 'ok' ? userJson.error.message : null
  const videoErr =
    videosJson?.error && videosJson.error.code !== 'ok' ? videosJson.error.message : null

  if (!userRes.ok && !videosRes.ok) {
    return NextResponse.json({
      connected: true,
      profile,
      analytics: null,
      error:
        userErr ||
        videoErr ||
        'TikTok Display API scopes (user.info.stats, video.list) are not authorized yet. Add Display API in TikTok Developer Portal and reconnect TikTok.',
    })
  }

  const rawVideos: any[] = Array.isArray(videosJson?.data?.videos) ? videosJson.data.videos : []
  const videos: TikTokVideoSummary[] = rawVideos.map((v) => {
    const views = Number(v.view_count || 0)
    const likes = Number(v.like_count || 0)
    const comments = Number(v.comment_count || 0)
    const shares = Number(v.share_count || 0)
    const ts = v.create_time ? new Date(Number(v.create_time) * 1000).toISOString() : new Date().toISOString()
    return {
      id: String(v.id || ''),
      title: String(v.title || 'TikTok Video'),
      createTime: ts,
      shareUrl: v.share_url || null,
      views,
      likes,
      comments,
      shares,
      engagements: likes + comments + shares,
    }
  })

  const totals = videos.reduce(
    (acc, v) => {
      acc.views += v.views
      acc.likes += v.likes
      acc.comments += v.comments
      acc.shares += v.shares
      acc.engagements += v.engagements
      return acc
    },
    { views: 0, likes: 0, comments: 0, shares: 0, engagements: 0 }
  )

  let syncedDays = 0
  if (persistToMetrics) {
    const today = new Date().toISOString().slice(0, 10)
    const nowIso = new Date().toISOString()

    // Group video stats by publish date, or record today's aggregate snapshot if no videos returned yet
    const byDate = new Map<string, { views: number; engagements: number }>()
    for (const v of videos) {
      const day = v.createTime.slice(0, 10)
      const cur = byDate.get(day) || { views: 0, engagements: 0 }
      cur.views += v.views
      cur.engagements += v.engagements
      byDate.set(day, cur)
    }

    if (byDate.size === 0 && (profile.lifetimeLikes > 0 || profile.followerCount > 0)) {
      byDate.set(today, { views: totals.views, engagements: profile.lifetimeLikes })
    }

    const dates = Array.from(byDate.keys()).sort()
    if (dates.length > 0) {
      await db
        .from('marketing_channel_metrics')
        .delete()
        .eq('organization_slug', orgSlug)
        .eq('channel', 'tiktok')
        .is('post_id', null)
        .gte('metric_date', dates[0])
        .lte('metric_date', dates[dates.length - 1])

      const rows = dates.map((day) => {
        const stats = byDate.get(day)!
        return {
          organization_slug: orgSlug,
          channel: 'tiktok',
          metric_date: day,
          post_id: null,
          impressions: stats.views,
          reach: stats.views,
          engagements: stats.engagements,
          clicks: 0,
          leads_generated: 0,
          conversions: 0,
          spend_kes: 0,
          updated_at: nowIso,
        }
      })

      const { error: insertErr } = await db.from('marketing_channel_metrics').insert(rows)
      if (!insertErr) syncedDays = rows.length
    }
  }

  return NextResponse.json({
    connected: true,
    syncedAt: new Date().toISOString(),
    syncedDays,
    profile,
    warning: videoErr || userErr || null,
    analytics: {
      views: totals.views,
      likes: totals.likes,
      comments: totals.comments,
      shares: totals.shares,
      engagements: totals.engagements,
      videosAnalyzed: videos.length,
      recentVideos: videos.slice(0, 5),
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const orgSlug = request.nextUrl.searchParams.get('org') || 'cillah-dev'
    const sync = request.nextUrl.searchParams.get('sync') === 'true'
    return await fetchLiveTikTokInsights(orgSlug, sync)
  } catch (err: any) {
    console.error('[TikTok Insights GET Error]:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch TikTok Insights.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const orgSlug = String(body.organization_slug || 'cillah-dev')
    return await fetchLiveTikTokInsights(orgSlug, true)
  } catch (err: any) {
    console.error('[TikTok Insights Sync Error]:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to sync TikTok Insights.' },
      { status: 500 }
    )
  }
}
