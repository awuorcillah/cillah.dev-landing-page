'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Eye,
  HeartHandshake,
  MousePointerClick,
  Users,
  Send,
  Sparkles,
  RefreshCw,
  Plus,
  X,
  TrendingUp,
  Layers,
  Loader2,
  Youtube,
  Clock,
  ThumbsUp,
  UserPlus,
  AlertCircle,
  Film,
  MessageSquare,
  Share2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  ACTIVE_MARKETING_CHANNELS,
  type MarketingChannelId,
  type RoleTierPermissions,
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

interface InsightsResponse {
  range: string
  channelFilter: string
  schema_pending: boolean
  summary: {
    impressions: number
    reach: number
    engagements: number
    clicks: number
    leads: number
    conversions: number
    spendKes: number
    postsPublished: number
    postsScheduled: number
    avgEngagementRate: number
    totalUniquePosts: number
    pendingApprovalCount: number
  }
  channels: ChannelInsightRow[]
  filteredChannels: ChannelInsightRow[]
  trendSeries: {
    date: string
    reach: number
    engagements: number
    clicks: number
    leads: number
  }[]
  executiveTakeaways: {
    label: string
    headline: string
    detail: string
    tone: 'gold' | 'emerald' | 'sky'
  }[]
}

interface MarketingInsightsViewProps {
  organizationSlug: string
  permissions: RoleTierPermissions
}

interface YouTubeAnalyticsResponse {
  connected: boolean
  range?: string
  startDate?: string
  endDate?: string
  syncedAt?: string
  syncedDays?: number
  error?: string
  message?: string
  channel?: {
    id: string
    title: string
    handle?: string | null
    avatarUrl?: string | null
    subscriberCount: number
    totalViews: number
    videoCount: number
  } | null
  analytics?: {
    views: number
    estimatedMinutesWatched: number
    averageViewDurationSec: number
    likes: number
    comments: number
    shares: number
    subscribersGained: number
    subscribersLost: number
    netSubscribers: number
    engagements: number
  } | null
}

function formatDurationSec(seconds: number): string {
  const s = Math.max(0, Math.round(seconds || 0))
  const mins = Math.floor(s / 60)
  const rem = s % 60
  return mins > 0 ? `${mins}m ${rem}s` : `${rem}s`
}

function formatWatchMinutes(minutes: number): string {
  const m = Math.max(0, Math.round(minutes || 0))
  if (m >= 60) {
    return `${(m / 60).toFixed(1)} hrs`
  }
  return `${m.toLocaleString()} min`
}

interface TikTokInsightsResponse {
  connected: boolean
  syncedAt?: string
  syncedDays?: number
  error?: string
  warning?: string | null
  message?: string
  profile?: {
    openId: string
    displayName: string
    username?: string | null
    avatarUrl?: string | null
    followerCount: number
    followingCount: number
    lifetimeLikes: number
    videoCount: number
  } | null
  analytics?: {
    views: number
    likes: number
    comments: number
    shares: number
    engagements: number
    videosAnalyzed: number
  } | null
}

export default function MarketingInsightsView({
  organizationSlug,
  permissions,
}: MarketingInsightsViewProps) {
  const [selectedChannel, setSelectedChannel] = useState<'all' | MarketingChannelId>('all')
  const [range, setRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [data, setData] = useState<InsightsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [ytData, setYtData] = useState<YouTubeAnalyticsResponse | null>(null)
  const [loadingYt, setLoadingYt] = useState(false)
  const [syncingYt, setSyncingYt] = useState(false)
  const [ttData, setTtData] = useState<TikTokInsightsResponse | null>(null)
  const [loadingTt, setLoadingTt] = useState(false)
  const [syncingTt, setSyncingTt] = useState(false)

  // Quick Metric Snapshot Modal
  const [logModalOpen, setLogModalOpen] = useState(false)
  const [savingMetric, setSavingMetric] = useState(false)
  const [metricForm, setMetricForm] = useState({
    channel: 'instagram' as MarketingChannelId,
    metric_date: new Date().toISOString().split('T')[0],
    impressions: '',
    reach: '',
    engagements: '',
    clicks: '',
    leads_generated: '',
    conversions: '',
    spend_kes: '',
  })

  const fetchInsights = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/marketing/insights?org=${encodeURIComponent(organizationSlug)}&channel=${encodeURIComponent(selectedChannel)}&range=${encodeURIComponent(range)}`
      )
      const json = await res.json()
      if (res.ok) {
        setData(json)
      } else {
        toast.error(json.error || 'Could not load insights.')
      }
    } catch {
      toast.error('Failed to connect to Insights API.')
    } finally {
      setLoading(false)
    }
  }, [organizationSlug, selectedChannel, range])

  const fetchYouTubeAnalytics = useCallback(async () => {
    setLoadingYt(true)
    try {
      const res = await fetch(
        `/api/marketing/insights/youtube?org=${encodeURIComponent(organizationSlug)}&range=${encodeURIComponent(range)}`
      )
      const json = await res.json()
      if (res.ok || json.connected) {
        setYtData(json)
      }
    } catch {
      // keep main insights resilient
    } finally {
      setLoadingYt(false)
    }
  }, [organizationSlug, range])

  const handleSyncYouTubeAnalytics = async () => {
    setSyncingYt(true)
    try {
      const res = await fetch('/api/marketing/insights/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_slug: organizationSlug, range }),
      })
      const json: YouTubeAnalyticsResponse = await res.json()
      setYtData(json)
      if (!res.ok || json.error) {
        toast.error(json.error || 'Could not sync YouTube Analytics.')
        return
      }
      if (!json.connected) {
        toast.info('Connect YouTube in Connected Accounts first.')
        return
      }
      toast.success(
        `Synced YouTube Analytics (${json.syncedDays || 0} days · ${(json.analytics?.views || 0).toLocaleString()} views)`
      )
      fetchInsights()
    } catch {
      toast.error('Failed to sync YouTube Analytics.')
    } finally {
      setSyncingYt(false)
    }
  }

  const fetchTikTokInsights = useCallback(async () => {
    setLoadingTt(true)
    try {
      const res = await fetch(
        `/api/marketing/insights/tiktok?org=${encodeURIComponent(organizationSlug)}`
      )
      const json = await res.json()
      if (res.ok || json.connected) {
        setTtData(json)
      }
    } catch {
      // keep main insights resilient
    } finally {
      setLoadingTt(false)
    }
  }, [organizationSlug])

  const handleSyncTikTokInsights = async () => {
    setSyncingTt(true)
    try {
      const res = await fetch('/api/marketing/insights/tiktok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_slug: organizationSlug }),
      })
      const json: TikTokInsightsResponse = await res.json()
      setTtData(json)
      if (!res.ok || json.error) {
        toast.error(json.error || 'Could not sync TikTok Insights.')
        return
      }
      if (!json.connected) {
        toast.info('Connect TikTok in Connected Accounts first.')
        return
      }
      toast.success(
        `Synced TikTok Insights (${(json.analytics?.views || 0).toLocaleString()} video views · ${(json.profile?.followerCount || 0).toLocaleString()} followers)`
      )
      fetchInsights()
    } catch {
      toast.error('Failed to sync TikTok Insights.')
    } finally {
      setSyncingTt(false)
    }
  }

  useEffect(() => {
    fetchInsights()
    fetchYouTubeAnalytics()
    fetchTikTokInsights()
  }, [fetchInsights, fetchYouTubeAnalytics, fetchTikTokInsights])

  const handleSaveMetric = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingMetric(true)
    try {
      const res = await fetch('/api/marketing/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_slug: organizationSlug,
          ...metricForm,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Could not save metric.')
        return
      }
      toast.success('Channel performance snapshot saved!')
      setLogModalOpen(false)
      setMetricForm({
        channel: 'instagram',
        metric_date: new Date().toISOString().split('T')[0],
        impressions: '',
        reach: '',
        engagements: '',
        clicks: '',
        leads_generated: '',
        conversions: '',
        spend_kes: '',
      })
      fetchInsights()
    } catch {
      toast.error('Network error saving metrics.')
    } finally {
      setSavingMetric(false)
    }
  }

  const summary = data?.summary
  const channelRows = data?.channels || []
  const activeChannelLabel =
    selectedChannel === 'all'
      ? 'All Marketing Channels Combined'
      : ACTIVE_MARKETING_CHANNELS.find((c) => c.id === selectedChannel)?.label || selectedChannel

  return (
    <div className="space-y-6">
      {/* TOP CONTROL BAR: COMBINED VS PER-CHANNEL + DATE RANGE */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#C9A66B] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> One-Stop Performance Read
            </p>
            <h3 className="text-lg font-extrabold text-white mt-0.5">{activeChannelLabel}</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Date Range Pills */}
            <div className="inline-flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
              {(
                [
                  ['7d', '7D'],
                  ['30d', '30D'],
                  ['90d', '90D'],
                  ['all', 'All'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRange(key)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    range === key
                      ? 'bg-[#C9A66B] text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {ytData?.connected && (
              <button
                type="button"
                onClick={handleSyncYouTubeAnalytics}
                disabled={syncingYt}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/35 text-red-200 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                <Youtube className={`w-3.5 h-3.5 text-red-400 ${syncingYt ? 'animate-pulse' : ''}`} />
                <span>{syncingYt ? 'Syncing...' : 'Sync YouTube'}</span>
              </button>
            )}

            {ttData?.connected && (
              <button
                type="button"
                onClick={handleSyncTikTokInsights}
                disabled={syncingTt}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/35 text-cyan-200 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                <Film className={`w-3.5 h-3.5 text-cyan-300 ${syncingTt ? 'animate-pulse' : ''}`} />
                <span>{syncingTt ? 'Syncing...' : 'Sync TikTok'}</span>
              </button>
            )}

            {permissions.canPublishDirectly && (
              <button
                type="button"
                onClick={() => setLogModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#C9A66B]/15 hover:bg-[#C9A66B]/25 border border-[#C9A66B]/40 text-[#E5C992] text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Log Metrics
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                fetchInsights()
                fetchYouTubeAnalytics()
                fetchTikTokInsights()
              }}
              disabled={loading || loadingYt || loadingTt}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading || loadingYt || loadingTt ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Channel Filter Selector: Combined vs Individual Channel */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setSelectedChannel('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
              selectedChannel === 'all'
                ? 'bg-[#C9A66B] text-slate-950 border-[#C9A66B] shadow-md shadow-[#C9A66B]/20'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
            }`}
          >
            All Channels Combined
          </button>

          {ACTIVE_MARKETING_CHANNELS.map((ch) => {
            const active = selectedChannel === ch.id
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => setSelectedChannel(ch.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  active
                    ? ch.selectedCardClass + ' text-white'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: ch.accentHex }}
                />
                <span>{ch.shortLabel}</span>
              </button>
            )
          })}
        </div>
      </div>

      {loading && !data ? (
        <div className="py-16 flex items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-[#C9A66B]" /> Analyzing marketing channels...
        </div>
      ) : (
        <>
          {/* EXECUTIVE ONE-STOP TAKEAWAYS */}
          {data?.executiveTakeaways && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.executiveTakeaways.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-2xl p-5 border ${
                    item.tone === 'emerald'
                      ? 'bg-emerald-500/5 border-emerald-500/25'
                      : item.tone === 'gold'
                      ? 'bg-[#C9A66B]/5 border-[#C9A66B]/25'
                      : 'bg-sky-500/5 border-sky-500/25'
                  }`}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C9A66B]" />
                    {item.label}
                  </p>
                  <p className="text-base font-extrabold text-white mt-1.5">{item.headline}</p>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>
          )}

          {/* LIVE YOUTUBE ANALYTICS API PANEL (yt-analytics.readonly + youtube.readonly) */}
          {(selectedChannel === 'all' || selectedChannel === 'youtube') && ytData?.connected && (
            <div className="rounded-2xl bg-slate-900/80 border border-red-500/25 p-5 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {ytData.channel?.avatarUrl ? (
                    <img
                      src={ytData.channel.avatarUrl}
                      alt={ytData.channel.title}
                      className="w-10 h-10 rounded-full border border-red-500/40 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
                      <Youtube className="w-5 h-5 text-red-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-extrabold text-white truncate">
                        {ytData.channel?.title || 'YouTube Channel'} — Live Analytics
                      </h4>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-300 border border-red-500/30">
                        YouTube Analytics API
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {(ytData.channel?.subscriberCount || 0).toLocaleString()} subscribers &bull;{' '}
                      {(ytData.channel?.videoCount || 0).toLocaleString()} videos &bull;{' '}
                      {(ytData.channel?.totalViews || 0).toLocaleString()} lifetime views
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSyncYouTubeAnalytics}
                  disabled={syncingYt}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/35 text-red-200 text-xs font-bold transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingYt ? 'animate-spin' : ''}`} />
                  <span>{syncingYt ? 'Syncing to Scorecard...' : 'Sync to Scorecard'}</span>
                </button>
              </div>

              {ytData.error ? (
                <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-3.5 flex items-start gap-2.5 text-xs text-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">YouTube Analytics API Notice</p>
                    <p className="text-amber-100/80 mt-0.5">{ytData.error}</p>
                  </div>
                </div>
              ) : ytData.analytics ? (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <span>Period Views</span>
                      <Eye className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <p className="text-xl font-black text-white mt-1.5">
                      {ytData.analytics.views.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {ytData.startDate} → {ytData.endDate}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <span>Watch Time</span>
                      <Clock className="w-3.5 h-3.5 text-[#C9A66B]" />
                    </div>
                    <p className="text-xl font-black text-white mt-1.5">
                      {formatWatchMinutes(ytData.analytics.estimatedMinutesWatched)}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {ytData.analytics.estimatedMinutesWatched.toLocaleString()} est. mins
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <span>Avg Duration</span>
                      <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                    </div>
                    <p className="text-xl font-black text-white mt-1.5">
                      {formatDurationSec(ytData.analytics.averageViewDurationSec)}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Per view retention</p>
                  </div>

                  <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <span>YT Engagements</span>
                      <ThumbsUp className="w-3.5 h-3.5 text-pink-400" />
                    </div>
                    <p className="text-xl font-black text-white mt-1.5">
                      {ytData.analytics.engagements.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {ytData.analytics.likes} likes · {ytData.analytics.comments} cmts · {ytData.analytics.shares} shares
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3.5 col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <span>Net Subscribers</span>
                      <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p
                      className={`text-xl font-black mt-1.5 ${
                        ytData.analytics.netSubscribers >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {ytData.analytics.netSubscribers >= 0 ? '+' : ''}
                      {ytData.analytics.netSubscribers.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      +{ytData.analytics.subscribersGained} gained / -{ytData.analytics.subscribersLost} lost
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* LIVE TIKTOK INSIGHTS PANEL (Display API: user.info.stats + video.list) */}
          {(selectedChannel === 'all' || selectedChannel === 'tiktok') && ttData?.connected && (
            <div className="rounded-2xl bg-slate-900/80 border border-cyan-400/25 p-5 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {ttData.profile?.avatarUrl ? (
                    <img
                      src={ttData.profile.avatarUrl}
                      alt={ttData.profile.displayName}
                      className="w-10 h-10 rounded-full border border-cyan-400/40 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center shrink-0">
                      <Film className="w-5 h-5 text-cyan-300" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-extrabold text-white truncate">
                        {ttData.profile?.displayName || 'TikTok Account'} — Live Insights
                      </h4>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                        TikTok Display API
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {(ttData.profile?.followerCount || 0).toLocaleString()} followers &bull;{' '}
                      {(ttData.profile?.videoCount || 0).toLocaleString()} videos &bull;{' '}
                      {(ttData.profile?.lifetimeLikes || 0).toLocaleString()} lifetime likes
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSyncTikTokInsights}
                  disabled={syncingTt}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/35 text-cyan-200 text-xs font-bold transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingTt ? 'animate-spin' : ''}`} />
                  <span>{syncingTt ? 'Syncing to Scorecard...' : 'Sync to Scorecard'}</span>
                </button>
              </div>

              {ttData.error ? (
                <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-3.5 flex items-start gap-2.5 text-xs text-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">TikTok Display API Notice</p>
                    <p className="text-amber-100/80 mt-0.5">{ttData.error}</p>
                  </div>
                </div>
              ) : ttData.analytics ? (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <span>Video Views</span>
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <p className="text-xl font-black text-white mt-1.5">
                      {ttData.analytics.views.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Across {ttData.analytics.videosAnalyzed} recent videos
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <span>Video Likes</span>
                      <ThumbsUp className="w-3.5 h-3.5 text-pink-400" />
                    </div>
                    <p className="text-xl font-black text-white mt-1.5">
                      {ttData.analytics.likes.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {(ttData.profile?.lifetimeLikes || 0).toLocaleString()} total account likes
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <span>Comments</span>
                      <MessageSquare className="w-3.5 h-3.5 text-[#C9A66B]" />
                    </div>
                    <p className="text-xl font-black text-white mt-1.5">
                      {ttData.analytics.comments.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Recent video replies</p>
                  </div>

                  <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <span>Shares</span>
                      <Share2 className="w-3.5 h-3.5 text-sky-400" />
                    </div>
                    <p className="text-xl font-black text-white mt-1.5">
                      {ttData.analytics.shares.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Organic reshares</p>
                  </div>

                  <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3.5 col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <span>Followers</span>
                      <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-xl font-black text-emerald-400 mt-1.5">
                      {(ttData.profile?.followerCount || 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {(ttData.profile?.followingCount || 0).toLocaleString()} following
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* CORE KPI SUMMARY STRIP */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Total Reach</span>
                <Eye className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-black text-white mt-2">
                {(summary?.reach || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {(summary?.impressions || 0).toLocaleString()} impressions
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Engagement</span>
                <HeartHandshake className="w-4 h-4 text-pink-400" />
              </div>
              <p className="text-2xl font-black text-white mt-2">
                {(summary?.engagements || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                {summary?.avgEngagementRate || 0}% avg rate
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Link Clicks</span>
                <MousePointerClick className="w-4 h-4 text-[#C9A66B]" />
              </div>
              <p className="text-2xl font-black text-white mt-2">
                {(summary?.clicks || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Campaign &amp; bio traffic</p>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>CRM Leads</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400 mt-2">
                {(summary?.leads || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {summary?.conversions || 0} won deals
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Campaign Output</span>
                <Send className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-black text-white mt-2">
                {summary?.postsPublished || 0}
              </p>
              <p className="text-[11px] text-sky-400 mt-0.5">
                {summary?.postsScheduled || 0} scheduled next
              </p>
            </div>
          </div>

          {/* VISUAL CHARTS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart: Channel Comparison */}
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#C9A66B]" /> Channel Comparison
                  </h4>
                  <p className="text-xs text-slate-400">
                    Reach, Clicks &amp; Leads across each connected platform
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(selectedChannel === 'all' ? channelRows : data?.filteredChannels || []).map(
                      (c) => ({
                        name: c.shortLabel,
                        Reach: c.reach,
                        Clicks: c.clicks,
                        Leads: c.leads,
                        Posts: c.postsPublished,
                      })
                    )}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#f8fafc',
                      }}
                    />
                    <Bar dataKey="Reach" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Clicks" fill="#C9A66B" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Leads" fill="#34d399" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Area Chart: Performance Trend */}
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
              <div className="mb-4">
                <h4 className="text-sm font-bold text-white">Growth &amp; Engagement Trend</h4>
                <p className="text-xs text-slate-400">
                  Daily performance timeline for {activeChannelLabel}
                </p>
              </div>

              {data?.trendSeries && data.trendSeries.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.trendSeries}>
                      <defs>
                        <linearGradient id="mktGoldGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C9A66B" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#C9A66B" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="mktEmeraldGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#34d399" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: '#f8fafc',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="reach"
                        name="Reach"
                        stroke="#C9A66B"
                        fill="url(#mktGoldGrad)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="engagements"
                        name="Engagements"
                        stroke="#34d399"
                        fill="url(#mktEmeraldGrad)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center px-6 border border-dashed border-slate-800 rounded-xl bg-slate-950/50">
                  <Sparkles className="w-7 h-7 text-[#C9A66B] mb-2" />
                  <p className="text-sm font-semibold text-slate-200">
                    Waiting for Daily Channel Snapshots
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Use &ldquo;Log Metrics&rdquo; above or connect your n8n social analytics webhook to stream daily Instagram, TikTok, YouTube, and LinkedIn insights here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ONE-STOP CHANNEL SCORECARD TABLE */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Channel-by-Channel Scorecard</h4>
                <p className="text-xs text-slate-400">
                  Click any channel row to isolate its metrics above.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Channel</th>
                    <th className="py-3.5 px-4 text-right">Published</th>
                    <th className="py-3.5 px-4 text-right">Scheduled</th>
                    <th className="py-3.5 px-4 text-right">Reach</th>
                    <th className="py-3.5 px-4 text-right">Engagements</th>
                    <th className="py-3.5 px-4 text-right">Eng. Rate</th>
                    <th className="py-3.5 px-4 text-right">Clicks</th>
                    <th className="py-3.5 px-4 text-right">CRM Leads</th>
                    <th className="py-3.5 px-4 text-right">Spend (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {(selectedChannel === 'all' ? channelRows : data?.filteredChannels || []).map(
                    (row) => (
                      <tr
                        key={row.channel}
                        onClick={() =>
                          setSelectedChannel(selectedChannel === row.channel ? 'all' : row.channel)
                        }
                        className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: row.accentHex }}
                            />
                            <span>{row.label}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold">{row.postsPublished}</td>
                        <td className="py-3.5 px-4 text-right text-sky-400">{row.postsScheduled}</td>
                        <td className="py-3.5 px-4 text-right">{row.reach.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right">{row.engagements.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right text-emerald-400 font-semibold">
                          {row.engagementRate}%
                        </td>
                        <td className="py-3.5 px-4 text-right text-[#E5C992]">
                          {row.clicks.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-300">
                          {row.leads}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-400">
                          KES {row.spendKes.toLocaleString()}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* LOG CHANNEL METRIC SNAPSHOT MODAL */}
      {logModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Log Channel Performance Snapshot</h3>
                <p className="text-xs text-slate-400">
                  Record campaign numbers for instant combined &amp; per-channel analysis.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLogModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMetric} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Channel</label>
                  <select
                    value={metricForm.channel}
                    onChange={(e) =>
                      setMetricForm({
                        ...metricForm,
                        channel: e.target.value as MarketingChannelId,
                      })
                    }
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                  >
                    {ACTIVE_MARKETING_CHANNELS.map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-900">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={metricForm.metric_date}
                    onChange={(e) => setMetricForm({ ...metricForm, metric_date: e.target.value })}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Impressions</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={metricForm.impressions}
                    onChange={(e) => setMetricForm({ ...metricForm, impressions: e.target.value })}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Reach</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={metricForm.reach}
                    onChange={(e) => setMetricForm({ ...metricForm, reach: e.target.value })}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Engagements</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={metricForm.engagements}
                    onChange={(e) => setMetricForm({ ...metricForm, engagements: e.target.value })}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Clicks</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={metricForm.clicks}
                    onChange={(e) => setMetricForm({ ...metricForm, clicks: e.target.value })}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Leads</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={metricForm.leads_generated}
                    onChange={(e) =>
                      setMetricForm({ ...metricForm, leads_generated: e.target.value })
                    }
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ad Spend (KES)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={metricForm.spend_kes}
                    onChange={(e) => setMetricForm({ ...metricForm, spend_kes: e.target.value })}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setLogModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMetric}
                  className="px-4 py-2 rounded-lg bg-[#C9A66B] hover:bg-[#d8b87d] text-slate-950 font-bold cursor-pointer"
                >
                  {savingMetric ? 'Saving...' : 'Save Snapshot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
