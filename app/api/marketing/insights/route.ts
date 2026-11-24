import { NextRequest, NextResponse } from 'next/server'
import {
  resolveMarketingAuth,
  getServiceRoleClient,
  isMissingTableError,
} from '@/lib/marketing-auth'
import {
  ACTIVE_MARKETING_CHANNELS,
  normalizeLeadSourceToChannel,
  type MarketingChannelId,
} from '@/lib/marketing-config'

interface ChannelInsightRow {
  channel: MarketingChannelId
  label: string
  shortLabel: string
  accentHex: string
  postsPublished: number
  postsScheduled: number
  impressions: number
  reach: number
  engagements: number
  engagementRate: number
  clicks: number
  leads: number
  conversions: number
  spendKes: number
}

function getRangeCutoff(range: string): Date | null {
  const now = new Date()
  if (range === '7d') {
    now.setDate(now.getDate() - 7)
    return now
  }
  if (range === '30d') {
    now.setDate(now.getDate() - 30)
    return now
  }
  if (range === '90d') {
    now.setDate(now.getDate() - 90)
    return now
  }
  return null
}

export async function GET(request: NextRequest) {
  const orgSlug = request.nextUrl.searchParams.get('org') || 'cillah-dev'
  const channelFilter = request.nextUrl.searchParams.get('channel') || 'all'
  const range = request.nextUrl.searchParams.get('range') || '30d'

  const { context, supabase, error, status } = await resolveMarketingAuth(orgSlug)
  if (!context) {
    return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 })
  }

  const db = getServiceRoleClient() || supabase
  const cutoff = getRangeCutoff(range)
  const cutoffIso = cutoff ? cutoff.toISOString() : null
  const cutoffDate = cutoff ? cutoff.toISOString().split('T')[0] : null

  const [postsRes, metricsRes, leadsRes, clicksRes] = await Promise.all([
    (() => {
      let q = db
        .from('marketing_posts')
        .select('id, title, channels, status, published_at, scheduled_at, created_at')
        .eq('organization_slug', orgSlug)
        .order('created_at', { ascending: false })
      if (cutoffIso) q = q.gte('created_at', cutoffIso)
      return q
    })(),
    (() => {
      let q = db
        .from('marketing_channel_metrics')
        .select('*')
        .eq('organization_slug', orgSlug)
        .order('metric_date', { ascending: true })
      if (cutoffDate) q = q.gte('metric_date', cutoffDate)
      return q
    })(),
    (() => {
      let q = db
        .from('sales_leads')
        .select('id, source, stage, created_at')
        .order('created_at', { ascending: false })
      if (cutoffIso) q = q.gte('created_at', cutoffIso)
      return q
    })(),
    (() => {
      let q = db
        .from('campaign_clicks')
        .select('id, source, campaign_name, clicked_at')
        .order('clicked_at', { ascending: false })
      if (cutoffIso) q = q.gte('clicked_at', cutoffIso)
      return q
    })(),
  ])

  const schemaPending =
    isMissingTableError(postsRes.error) || isMissingTableError(metricsRes.error)

  const posts = postsRes.error ? [] : postsRes.data || []
  const metrics = metricsRes.error ? [] : metricsRes.data || []
  const leads = leadsRes.error ? [] : leadsRes.data || []
  const clicks = clicksRes.error ? [] : clicksRes.data || []

  // Initialize per-channel map for all 8 active channels
  const channelMap = new Map<MarketingChannelId, ChannelInsightRow>()
  for (const ch of ACTIVE_MARKETING_CHANNELS) {
    channelMap.set(ch.id, {
      channel: ch.id,
      label: ch.label,
      shortLabel: ch.shortLabel,
      accentHex: ch.accentHex,
      postsPublished: 0,
      postsScheduled: 0,
      impressions: 0,
      reach: 0,
      engagements: 0,
      engagementRate: 0,
      clicks: 0,
      leads: 0,
      conversions: 0,
      spendKes: 0,
    })
  }

  // 1. Fold posts into channel counts
  for (const post of posts) {
    const postChannels: string[] = Array.isArray(post.channels) ? post.channels : []
    for (const chId of postChannels) {
      const row = channelMap.get(chId as MarketingChannelId)
      if (!row) continue
      if (post.status === 'published') row.postsPublished += 1
      if (post.status === 'scheduled') row.postsScheduled += 1
    }
  }

  // 2. Fold recorded marketing_channel_metrics
  const trendByDate = new Map<
    string,
    { date: string; reach: number; engagements: number; clicks: number; leads: number }
  >()

  for (const m of metrics) {
    const chId = m.channel as MarketingChannelId
    const row = channelMap.get(chId)
    if (row) {
      row.impressions += Number(m.impressions || 0)
      row.reach += Number(m.reach || 0)
      row.engagements += Number(m.engagements || 0)
      row.clicks += Number(m.clicks || 0)
      row.leads += Number(m.leads_generated || 0)
      row.conversions += Number(m.conversions || 0)
      row.spendKes += Number(m.spend_kes || 0)
    }

    if (channelFilter === 'all' || channelFilter === chId) {
      const day = String(m.metric_date || '').slice(0, 10)
      if (day) {
        const current = trendByDate.get(day) || {
          date: day,
          reach: 0,
          engagements: 0,
          clicks: 0,
          leads: 0,
        }
        current.reach += Number(m.reach || 0)
        current.engagements += Number(m.engagements || 0)
        current.clicks += Number(m.clicks || 0)
        current.leads += Number(m.leads_generated || 0)
        trendByDate.set(day, current)
      }
    }
  }

  // 3. Fold live CRM sales_leads attributed to each marketing channel
  for (const lead of leads) {
    const mapped = normalizeLeadSourceToChannel(lead.source)
    if (!mapped) continue
    const row = channelMap.get(mapped)
    if (row) {
      row.leads += 1
      if (lead.stage === 'closed_won') row.conversions += 1
    }
    if (channelFilter === 'all' || channelFilter === mapped) {
      const day = String(lead.created_at || '').slice(0, 10)
      if (day) {
        const current = trendByDate.get(day) || {
          date: day,
          reach: 0,
          engagements: 0,
          clicks: 0,
          leads: 0,
        }
        current.leads += 1
        trendByDate.set(day, current)
      }
    }
  }

  // 4. Fold live campaign_clicks
  for (const click of clicks) {
    const mapped = normalizeLeadSourceToChannel(click.source)
    if (!mapped) continue
    const row = channelMap.get(mapped)
    if (row) row.clicks += 1

    if (channelFilter === 'all' || channelFilter === mapped) {
      const day = String(click.clicked_at || '').slice(0, 10)
      if (day) {
        const current = trendByDate.get(day) || {
          date: day,
          reach: 0,
          engagements: 0,
          clicks: 0,
          leads: 0,
        }
        current.clicks += 1
        trendByDate.set(day, current)
      }
    }
  }

  // Compute engagement rates
  const allChannelsBreakdown = Array.from(channelMap.values()).map((r) => ({
    ...r,
    engagementRate:
      r.reach > 0
        ? Number(((r.engagements / r.reach) * 100).toFixed(1))
        : r.impressions > 0
        ? Number(((r.engagements / r.impressions) * 100).toFixed(1))
        : 0,
  }))

  const filteredChannels =
    channelFilter === 'all'
      ? allChannelsBreakdown
      : allChannelsBreakdown.filter((c) => c.channel === channelFilter)

  // Summary totals for the active view (all combined or single channel)
  const totals = filteredChannels.reduce(
    (acc, item) => ({
      impressions: acc.impressions + item.impressions,
      reach: acc.reach + item.reach,
      engagements: acc.engagements + item.engagements,
      clicks: acc.clicks + item.clicks,
      leads: acc.leads + item.leads,
      conversions: acc.conversions + item.conversions,
      spendKes: acc.spendKes + item.spendKes,
      postsPublished: acc.postsPublished + item.postsPublished,
      postsScheduled: acc.postsScheduled + item.postsScheduled,
    }),
    {
      impressions: 0,
      reach: 0,
      engagements: 0,
      clicks: 0,
      leads: 0,
      conversions: 0,
      spendKes: 0,
      postsPublished: 0,
      postsScheduled: 0,
    }
  )

  const avgEngagementRate =
    totals.reach > 0
      ? Number(((totals.engagements / totals.reach) * 100).toFixed(1))
      : totals.impressions > 0
      ? Number(((totals.engagements / totals.impressions) * 100).toFixed(1))
      : 0

  // Build trend points (ensure at least last 7 days skeleton so chart always renders cleanly)
  const trendSeries = Array.from(trendByDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  )

  // Build plain-English One-Stop Executive Takeaways
  const topLeadChannel = [...allChannelsBreakdown].sort((a, b) => b.leads - a.leads)[0]
  const topActiveChannel = [...allChannelsBreakdown].sort(
    (a, b) => b.postsPublished + b.reach - (a.postsPublished + a.reach)
  )[0]
  const pendingApprovalCount = posts.filter((p) => p.status === 'pending_approval').length
  const totalUniquePosts = posts.length

  const executiveTakeaways: { label: string; headline: string; detail: string; tone: 'gold' | 'emerald' | 'sky' }[] = [
    {
      label: 'Top Lead Generator',
      headline:
        topLeadChannel && topLeadChannel.leads > 0
          ? `${topLeadChannel.label} (${topLeadChannel.leads} leads)`
          : 'Ready for Live Attribution',
      detail:
        topLeadChannel && topLeadChannel.leads > 0
          ? `${topLeadChannel.label} is driving the highest number of attributed leads into your Sales CRM pipeline.`
          : 'As leads come in via WhatsApp, Instagram, YouTube, TikTok, or Website forms, their source appears here automatically.',
      tone: 'emerald',
    },
    {
      label: 'Most Active Channel',
      headline:
        topActiveChannel && (topActiveChannel.postsPublished > 0 || topActiveChannel.reach > 0)
          ? `${topActiveChannel.label} (${topActiveChannel.postsPublished} published)`
          : 'Publish Your First Multi-Channel Campaign',
      detail:
        topActiveChannel && topActiveChannel.postsPublished > 0
          ? `${topActiveChannel.label} leads your publishing cadence with ${topActiveChannel.postsScheduled} more scheduled.`
          : 'Switch to "Post" to upload media or documents and distribute to up to 8 channels simultaneously.',
      tone: 'gold',
    },
    {
      label: 'Publishing Pipeline Health',
      headline:
        pendingApprovalCount > 0
          ? `${pendingApprovalCount} Post${pendingApprovalCount === 1 ? '' : 's'} Awaiting Approval`
          : `${totals.postsScheduled} Scheduled • ${totals.postsPublished} Channel Deliveries`,
      detail:
        pendingApprovalCount > 0
          ? 'Marketing Admins can review and approve creator submissions in one click from the Queue.'
          : `${totalUniquePosts} total campaign${totalUniquePosts === 1 ? '' : 's'} tracked in this date window across ${ACTIVE_MARKETING_CHANNELS.length} connected channels.`,
      tone: 'sky',
    },
  ]

  return NextResponse.json({
    range,
    channelFilter,
    schema_pending: schemaPending,
    summary: {
      ...totals,
      avgEngagementRate,
      totalUniquePosts,
      pendingApprovalCount,
    },
    channels: allChannelsBreakdown,
    filteredChannels,
    trendSeries,
    executiveTakeaways,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const orgSlug = body.organization_slug || 'cillah-dev'
    const { context, supabase, error, status } = await resolveMarketingAuth(orgSlug)

    if (!context) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 })
    }

    if (!context.permissions.canPublishDirectly) {
      return NextResponse.json(
        { error: 'Only Marketing Admins and Publishers can log channel metrics.' },
        { status: 403 }
      )
    }

    const channel = String(body.channel || '').trim()
    const validIds = ACTIVE_MARKETING_CHANNELS.map((c) => c.id)
    if (!validIds.includes(channel as MarketingChannelId)) {
      return NextResponse.json({ error: 'Invalid marketing channel.' }, { status: 400 })
    }

    const db = getServiceRoleClient() || supabase
    const { data, error: insertError } = await db
      .from('marketing_channel_metrics')
      .insert({
        organization_slug: orgSlug,
        channel,
        metric_date: body.metric_date || new Date().toISOString().split('T')[0],
        impressions: Math.max(0, Number(body.impressions || 0)),
        reach: Math.max(0, Number(body.reach || 0)),
        engagements: Math.max(0, Number(body.engagements || 0)),
        clicks: Math.max(0, Number(body.clicks || 0)),
        leads_generated: Math.max(0, Number(body.leads_generated || 0)),
        conversions: Math.max(0, Number(body.conversions || 0)),
        spend_kes: Math.max(0, Number(body.spend_kes || 0)),
      })
      .select('*')
      .single()

    if (insertError) {
      if (isMissingTableError(insertError)) {
        return NextResponse.json(
          {
            error: 'Run supabase/marketing_hub_schema.sql in Supabase SQL Editor first.',
            schema_pending: true,
          },
          { status: 503 }
        )
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ metric: data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to record metrics.' },
      { status: 500 }
    )
  }
}
