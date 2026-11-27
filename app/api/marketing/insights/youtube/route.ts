import { NextRequest, NextResponse } from 'next/server'
import {
  resolveMarketingAuth,
  getServiceRoleClient,
  isMissingTableError,
} from '@/lib/marketing-auth'
import {
  refreshYouTubeAccessToken,
  type SocialConnectionRow,
} from '@/lib/social-publishers'

interface YouTubeDailyRow {
  date: string
  views: number
  estimatedMinutesWatched: number
  averageViewDurationSec: number
  likes: number
  comments: number
  shares: number
  subscribersGained: number
  subscribersLost: number
  engagements: number
}

function getDateWindow(range: string): { startDate: string; endDate: string } {
  const end = new Date()
  const start = new Date(end)
  if (range === '7d') {
    start.setDate(end.getDate() - 7)
  } else if (range === '90d') {
    start.setDate(end.getDate() - 90)
  } else if (range === 'all') {
    start.setDate(end.getDate() - 365)
  } else {
    start.setDate(end.getDate() - 30)
  }
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

async function fetchLiveYouTubeAnalytics(
  orgSlug: string,
  range: string,
  persistToMetrics: boolean
) {
  const { context, supabase, error, status } = await resolveMarketingAuth(orgSlug)
  if (!context) {
    return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 })
  }

  const db = getServiceRoleClient() || supabase
  const { data: conn, error: connError } = await db
    .from('marketing_social_connections')
    .select('*')
    .eq('organization_slug', orgSlug)
    .eq('channel', 'youtube')
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
      message: 'Connect a YouTube channel in Connected Accounts to stream live YouTube Analytics.',
    })
  }

  const accessToken = await refreshYouTubeAccessToken(conn as SocialConnectionRow, db)
  if (!accessToken) {
    return NextResponse.json(
      {
        connected: true,
        analytics: null,
        error: 'YouTube OAuth token expired or unreadable. Please reconnect YouTube in Connected Accounts.',
      },
      { status: 401 }
    )
  }

  const { startDate, endDate } = getDateWindow(range)

  const analyticsUrl = new URL('https://youtubeanalytics.googleapis.com/v2/reports')
  analyticsUrl.searchParams.set('ids', 'channel==MINE')
  analyticsUrl.searchParams.set('startDate', startDate)
  analyticsUrl.searchParams.set('endDate', endDate)
  analyticsUrl.searchParams.set(
    'metrics',
    'views,estimatedMinutesWatched,averageViewDuration,likes,comments,shares,subscribersGained,subscribersLost'
  )
  analyticsUrl.searchParams.set('dimensions', 'day')
  analyticsUrl.searchParams.set('sort', 'day')

  const channelUrl =
    'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true'

  const [analyticsRes, channelRes] = await Promise.all([
    fetch(analyticsUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    }),
    fetch(channelUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    }),
  ])

  const [analyticsJson, channelJson] = await Promise.all([
    analyticsRes.json().catch(() => ({})),
    channelRes.json().catch(() => ({})),
  ])

  const ytChannel = channelJson?.items?.[0]
  const channelSummary = {
    id: ytChannel?.id || conn.account_id,
    title: ytChannel?.snippet?.title || conn.account_name,
    handle: ytChannel?.snippet?.customUrl || conn.account_handle || null,
    avatarUrl: ytChannel?.snippet?.thumbnails?.default?.url || conn.account_avatar_url || null,
    subscriberCount: Number(ytChannel?.statistics?.subscriberCount || 0),
    totalViews: Number(ytChannel?.statistics?.viewCount || 0),
    videoCount: Number(ytChannel?.statistics?.videoCount || 0),
  }

  if (!analyticsRes.ok || analyticsJson?.error) {
    const apiMessage =
      analyticsJson?.error?.message ||
      `YouTube Analytics API returned HTTP ${analyticsRes.status}.`
    return NextResponse.json({
      connected: true,
      channel: channelSummary,
      analytics: null,
      error: apiMessage,
      range,
      startDate,
      endDate,
    })
  }

  const headers: string[] = Array.isArray(analyticsJson.columnHeaders)
    ? analyticsJson.columnHeaders.map((h: any) => String(h.name || ''))
    : []
  const rawRows: any[][] = Array.isArray(analyticsJson.rows) ? analyticsJson.rows : []

  const idx = (name: string) => headers.indexOf(name)
  const daily: YouTubeDailyRow[] = rawRows
    .map((r) => {
      const date = String(r[idx('day')] || '')
      const views = Number(r[idx('views')] || 0)
      const estimatedMinutesWatched = Number(r[idx('estimatedMinutesWatched')] || 0)
      const averageViewDurationSec = Number(r[idx('averageViewDuration')] || 0)
      const likes = Number(r[idx('likes')] || 0)
      const comments = Number(r[idx('comments')] || 0)
      const shares = Number(r[idx('shares')] || 0)
      const subscribersGained = Number(r[idx('subscribersGained')] || 0)
      const subscribersLost = Number(r[idx('subscribersLost')] || 0)
      return {
        date,
        views,
        estimatedMinutesWatched,
        averageViewDurationSec,
        likes,
        comments,
        shares,
        subscribersGained,
        subscribersLost,
        engagements: Math.max(0, likes + comments + shares),
      }
    })
    .filter((row) => Boolean(row.date))

  const totals = daily.reduce(
    (acc, row) => {
      acc.views += row.views
      acc.estimatedMinutesWatched += row.estimatedMinutesWatched
      acc.likes += row.likes
      acc.comments += row.comments
      acc.shares += row.shares
      acc.subscribersGained += row.subscribersGained
      acc.subscribersLost += row.subscribersLost
      acc.engagements += row.engagements
      if (row.views > 0) {
        acc.weightedDurationSum += row.averageViewDurationSec * row.views
        acc.durationWeight += row.views
      }
      return acc
    },
    {
      views: 0,
      estimatedMinutesWatched: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      subscribersGained: 0,
      subscribersLost: 0,
      engagements: 0,
      weightedDurationSum: 0,
      durationWeight: 0,
    }
  )

  const averageViewDurationSec =
    totals.durationWeight > 0
      ? Math.round(totals.weightedDurationSum / totals.durationWeight)
      : 0

  let syncedDays = 0
  if (persistToMetrics && daily.length > 0) {
    const dates = daily.map((d) => d.date)
    const minDate = dates[0]
    const maxDate = dates[dates.length - 1]
    const nowIso = new Date().toISOString()

    // Replace existing automated daily YouTube snapshots in this window cleanly (preserving post-linked rows)
    await db
      .from('marketing_channel_metrics')
      .delete()
      .eq('organization_slug', orgSlug)
      .eq('channel', 'youtube')
      .is('post_id', null)
      .gte('metric_date', minDate)
      .lte('metric_date', maxDate)

    const insertRows = daily.map((row) => ({
      organization_slug: orgSlug,
      channel: 'youtube',
      metric_date: row.date,
      post_id: null,
      impressions: row.views,
      reach: row.views,
      engagements: row.engagements,
      clicks: 0,
      leads_generated: 0,
      conversions: 0,
      spend_kes: 0,
      updated_at: nowIso,
    }))

    const { error: insertErr } = await db
      .from('marketing_channel_metrics')
      .insert(insertRows)

    if (!insertErr) {
      syncedDays = insertRows.length
    }
  }

  return NextResponse.json({
    connected: true,
    range,
    startDate,
    endDate,
    syncedAt: new Date().toISOString(),
    syncedDays,
    channel: channelSummary,
    analytics: {
      views: totals.views,
      estimatedMinutesWatched: Math.round(totals.estimatedMinutesWatched),
      averageViewDurationSec,
      likes: totals.likes,
      comments: totals.comments,
      shares: totals.shares,
      subscribersGained: totals.subscribersGained,
      subscribersLost: totals.subscribersLost,
      netSubscribers: totals.subscribersGained - totals.subscribersLost,
      engagements: totals.engagements,
      daily,
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const orgSlug = request.nextUrl.searchParams.get('org') || 'cillah-dev'
    const range = request.nextUrl.searchParams.get('range') || '30d'
    const sync = request.nextUrl.searchParams.get('sync') === 'true'
    return await fetchLiveYouTubeAnalytics(orgSlug, range, sync)
  } catch (err: any) {
    console.error('[YouTube Analytics GET Error]:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch YouTube Analytics.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const orgSlug = String(body.organization_slug || 'cillah-dev')
    const range = String(body.range || '30d')
    return await fetchLiveYouTubeAnalytics(orgSlug, range, true)
  } catch (err: any) {
    console.error('[YouTube Analytics Sync Error]:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to sync YouTube Analytics.' },
      { status: 500 }
    )
  }
}
