'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import {
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Link2,
  Inbox,
  Check,
  AlertCircle,
  Bot,
  User,
  Hand,
  Sparkles,
  MessagesSquare,
} from 'lucide-react'
import type { getRolePermissions } from '@/lib/marketing-config'
import type {
  ChannelSyncSummary,
  InboxMessageRecord,
  InboxThreadRecord,
} from '@/lib/social-inbox'
import { getThreadHandlerInfo, type InboxHandlerMode } from '@/lib/inbox-ai-handler'

interface MarketingInboxViewProps {
  organizationSlug: string
  permissions: ReturnType<typeof getRolePermissions>
  selectedAgentFilter?: string
  onOpenConnections?: () => void
}

const CHANNEL_META: Record<
  string,
  { label: string; shortLabel: string; dot: string; badge: string }
> = {
  all: {
    label: 'All Channels',
    shortLabel: 'All',
    dot: 'bg-[#C9A66B]',
    badge: 'bg-[#C9A66B]/15 text-[#E5C687] border-[#C9A66B]/35',
  },
  instagram: {
    label: 'Instagram',
    shortLabel: 'IG',
    dot: 'bg-pink-500',
    badge: 'bg-pink-500/15 text-pink-300 border-pink-500/35',
  },
  facebook: {
    label: 'Facebook',
    shortLabel: 'FB',
    dot: 'bg-blue-500',
    badge: 'bg-blue-500/15 text-blue-300 border-blue-500/35',
  },
  whatsapp: {
    label: 'WhatsApp',
    shortLabel: 'WA',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
  },
  youtube: {
    label: 'YouTube',
    shortLabel: 'YT',
    dot: 'bg-red-500',
    badge: 'bg-red-500/15 text-red-300 border-red-500/35',
  },
  tiktok: {
    label: 'TikTok',
    shortLabel: 'TT',
    dot: 'bg-cyan-400',
    badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35',
  },
  linkedin: {
    label: 'LinkedIn',
    shortLabel: 'IN',
    dot: 'bg-sky-500',
    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/35',
  },
}

function formatShortTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const diffMs = Date.now() - date.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Renders the crisp handler tag on every chat:
 * - AI mode -> Bot symbol only (🤖)
 * - Escalated -> "Request Human" badge
 * - Claimed by a Marketing user -> User's exact name badge
 */
function HandlerTagBadge({
  thread,
  compact = false,
}: {
  thread: InboxThreadRecord
  compact?: boolean
}) {
  const info = getThreadHandlerInfo(thread)

  if (info.mode === 'request_human') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-200 text-[10px] font-black tracking-wide shrink-0 animate-pulse"
        title={info.humanRequestedReason || 'Delegated to a human team member'}
      >
        <Hand className="w-3 h-3 text-amber-300 shrink-0" />
        <span>Request Human</span>
      </span>
    )
  }

  if (info.mode === 'human' && info.assignedToName) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/45 text-emerald-200 text-[10px] font-bold max-w-[140px] shrink-0"
        title={`Handled by ${info.assignedToName} (${info.assignedToEmail || ''})`}
      >
        <User className="w-3 h-3 text-emerald-300 shrink-0" />
        <span className="truncate">{info.assignedToName}</span>
      </span>
    )
  }

  // AI-handled -> clean Bot symbol
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-cyan-500/15 border border-cyan-400/45 text-cyan-300 shrink-0 ${
        compact ? 'w-5 h-5' : 'px-2 py-0.5 gap-1'
      }`}
      title={
        info.lastHandledByName
          ? `Handled by AI Bot (last human: ${info.lastHandledByName})`
          : 'Handled by AI Bot'
      }
      aria-label="Handled by AI Bot"
    >
      <Bot className="w-3.5 h-3.5" />
    </span>
  )
}

export default function MarketingInboxView({
  organizationSlug,
  permissions,
  selectedAgentFilter = 'all',
  onOpenConnections,
}: MarketingInboxViewProps) {
  const [threads, setThreads] = useState<InboxThreadRecord[]>([])
  const [channelCounts, setChannelCounts] = useState<Record<string, number>>({
    all: 0,
    instagram: 0,
    facebook: 0,
    whatsapp: 0,
    youtube: 0,
  })
  const [handlerCounts, setHandlerCounts] = useState({
    all: 0,
    ai: 0,
    request_human: 0,
    human: 0,
  })
  const [connectedChannels, setConnectedChannels] = useState<string[]>([])
  const [schemaPending, setSchemaPending] = useState(false)
  const [loadingThreads, setLoadingThreads] = useState(true)

  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [handlerFilter, setHandlerFilter] = useState<'all' | InboxHandlerMode>('all')
  const [statusFilter, setStatusFilter] = useState<'open' | 'resolved' | 'all'>('open')
  const [searchQuery, setSearchQuery] = useState('')

  const [activeThread, setActiveThread] = useState<InboxThreadRecord | null>(null)
  const [messages, setMessages] = useState<InboxMessageRecord[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [runningAi, setRunningAi] = useState(false)
  const [updatingMode, setUpdatingMode] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncNotes, setSyncNotes] = useState<ChannelSyncSummary[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchThreads = useCallback(async () => {
    setLoadingThreads(true)
    try {
      const params = new URLSearchParams({
        org: organizationSlug,
        channel: channelFilter,
        status: statusFilter,
        handler: handlerFilter,
        agent: selectedAgentFilter || 'all',
      })
      if (searchQuery.trim()) params.set('q', searchQuery.trim())

      const res = await fetch(`/api/marketing/inbox?${params.toString()}`, {
        cache: 'no-store',
      })
      const json = await res.json()
      if (res.ok) {
        setThreads(json.threads || [])
        setChannelCounts(
          json.channelCounts || { all: 0, instagram: 0, facebook: 0, whatsapp: 0, youtube: 0 }
        )
        setHandlerCounts(
          json.handlerCounts || { all: 0, ai: 0, request_human: 0, human: 0 }
        )
        setConnectedChannels(json.connectedChannels || [])
        setSchemaPending(Boolean(json.schema_pending))
      }
    } catch {
      toast.error('Could not load unified inbox.')
    } finally {
      setLoadingThreads(false)
    }
  }, [organizationSlug, channelFilter, statusFilter, handlerFilter, selectedAgentFilter, searchQuery])

  useEffect(() => {
    fetchThreads()
  }, [fetchThreads])

  const openThread = useCallback(
    async (thread: InboxThreadRecord) => {
      setActiveThread(thread)
      setLoadingMessages(true)
      try {
        const res = await fetch(
          `/api/marketing/inbox/${encodeURIComponent(thread.id)}?org=${encodeURIComponent(
            organizationSlug
          )}`,
          { cache: 'no-store' }
        )
        const json = await res.json()
        if (res.ok) {
          setMessages(json.messages || [])
          if (json.thread) setActiveThread(json.thread)
          setThreads((prev) =>
            prev.map((t) => (t.id === thread.id ? { ...t, unread_count: 0 } : t))
          )
        }
      } catch {
        toast.error('Could not load conversation messages.')
      } finally {
        setLoadingMessages(false)
      }
    },
    [organizationSlug]
  )

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleConnectMetaDMs = () => {
    const returnTo =
      typeof window !== 'undefined'
        ? `${window.location.pathname}?marketing_tab=inbox`
        : '/admin/marketing?marketing_tab=inbox'
    window.location.href = `/api/marketing/oauth/meta/connect?org=${encodeURIComponent(
      organizationSlug
    )}&includeMessaging=true&returnTo=${encodeURIComponent(returnTo)}`
  }

  const handleSyncLive = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/marketing/inbox/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_slug: organizationSlug }),
      })
      const json = await res.json()
      if (!res.ok) {
        if (json.schema_pending) setSchemaPending(true)
        toast.error(json.error || 'Could not sync chats.')
        return
      }

      setSyncNotes(json.channelResults || [])
      if (json.syncedThreads > 0) {
        toast.success(
          `Synced ${json.syncedThreads} conversation${json.syncedThreads === 1 ? '' : 's'} across connected platforms.`
        )
      } else {
        toast.success('Sync complete — no new conversations found yet.')
      }
      await fetchThreads()
      if (activeThread) {
        openThread(activeThread)
      }
    } catch {
      toast.error('Network error while syncing chats.')
    } finally {
      setSyncing(false)
    }
  }

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeThread || !replyText.trim() || sendingReply) return

    setSendingReply(true)
    try {
      const res = await fetch(
        `/api/marketing/inbox/${encodeURIComponent(activeThread.id)}/reply`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization_slug: organizationSlug,
            text: replyText.trim(),
          }),
        }
      )
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Failed to send reply.')
        return
      }

      const updatedThread: InboxThreadRecord = json.thread || {
        ...activeThread,
        last_message_preview: replyText.trim(),
        last_message_at: json.message?.sent_at || new Date().toISOString(),
      }

      if (json.message) {
        setMessages((prev) => [...prev, json.message])
      }
      setActiveThread(updatedThread)
      setThreads((prev) =>
        prev.map((t) => (t.id === activeThread.id ? updatedThread : t))
      )
      setReplyText('')

      const hInfo = getThreadHandlerInfo(updatedThread)
      if (json.deliveryStatus === 'sent') {
        toast.success(
          `Reply sent! Chat is now tagged to ${hInfo.assignedToName || 'you'}.`
        )
      } else if (json.warning) {
        toast.warning(
          `${json.warning} (Chat tagged to ${hInfo.assignedToName || 'you'}).`
        )
      }
      fetchThreads()
    } catch {
      toast.error('Network error sending reply.')
    } finally {
      setSendingReply(false)
    }
  }

  const handleSwitchHandlerMode = async (nextMode: InboxHandlerMode) => {
    if (!activeThread || updatingMode) return
    setUpdatingMode(true)
    try {
      const res = await fetch(
        `/api/marketing/inbox/${encodeURIComponent(activeThread.id)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization_slug: organizationSlug,
            handler_mode: nextMode,
          }),
        }
      )
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Could not update chat handler.')
        return
      }
      setActiveThread(json.thread)
      setThreads((prev) =>
        prev.map((t) => (t.id === activeThread.id ? json.thread : t))
      )
      if (nextMode === 'ai') {
        toast.success('Handed back to AI Bot.')
      } else if (nextMode === 'request_human') {
        toast.success('Flagged as Request Human.')
      }
      fetchThreads()
    } catch {
      toast.error('Failed to update chat handler.')
    } finally {
      setUpdatingMode(false)
    }
  }

  const handleRunAiReply = async () => {
    if (!activeThread || runningAi) return
    setRunningAi(true)
    try {
      const res = await fetch(
        `/api/marketing/inbox/${encodeURIComponent(activeThread.id)}/ai-respond`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ organization_slug: organizationSlug }),
        }
      )
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'AI could not respond.')
        return
      }
      if (json.thread) {
        setActiveThread(json.thread)
        setThreads((prev) =>
          prev.map((t) => (t.id === activeThread.id ? json.thread : t))
        )
      }
      if (json.message) {
        setMessages((prev) => [...prev, json.message])
      }
      if (json.action === 'escalated_human') {
        toast.warning(json.reason || 'AI delegated this chat — tagged Request Human.')
      } else if (json.action === 'replied') {
        toast.success('AI Bot replied to the client.')
      } else {
        toast.info(json.reason || 'Chat is currently handled by a human.')
      }
      fetchThreads()
    } catch {
      toast.error('Network error calling AI Bot.')
    } finally {
      setRunningAi(false)
    }
  }

  const handleToggleResolve = async () => {
    if (!activeThread) return
    const nextStatus = activeThread.status === 'resolved' ? 'open' : 'resolved'
    try {
      const res = await fetch(
        `/api/marketing/inbox/${encodeURIComponent(activeThread.id)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization_slug: organizationSlug,
            status: nextStatus,
          }),
        }
      )
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Could not update conversation status.')
        return
      }
      setActiveThread(json.thread)
      toast.success(
        nextStatus === 'resolved' ? 'Conversation marked resolved.' : 'Conversation reopened.'
      )
      fetchThreads()
    } catch {
      toast.error('Failed to update conversation status.')
    }
  }

  const filterChannels = ['all', 'instagram', 'facebook', 'whatsapp', 'youtube']
  const activeHandler = activeThread ? getThreadHandlerInfo(activeThread) : null

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Schema Pending Notice */}
      {schemaPending && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-200">
              One-Time Database Setup for Unified Chats Inbox
            </p>
            <p className="text-slate-300 leading-relaxed">
              Run{' '}
              <code className="px-1.5 py-0.5 rounded bg-slate-950 text-[#E5C992]">
                supabase/marketing_unified_inbox_schema.sql
              </code>{' '}
              in your Supabase SQL Editor to activate multi-platform chats and comments storage.
            </p>
          </div>
        </div>
      )}

      {/* Top Controls: Platform Pills + Connect DMs + Sync Live Chats */}
      <div className="rounded-2xl bg-[#0F1422] border border-white/10 p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {filterChannels.map((ch) => {
              const meta = CHANNEL_META[ch]
              const selected = channelFilter === ch
              const count = channelCounts[ch] || 0
              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannelFilter(ch)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    selected
                      ? 'bg-[#C9A66B]/15 border-[#C9A66B]/60 text-[#E5C687]'
                      : 'bg-[#090B12] border-white/10 text-slate-300 hover:border-white/25'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                  <span>{meta.label}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.06] text-slate-300">
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {permissions.canPublishDirectly && (
              <button
                type="button"
                onClick={handleConnectMetaDMs}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/35 text-xs font-bold text-pink-200 transition-colors cursor-pointer"
                title="Authorize Instagram & Facebook Messenger DM permissions"
              >
                <MessagesSquare className="w-3.5 h-3.5 text-pink-400" />
                <span>Connect IG &amp; FB DMs</span>
              </button>
            )}
            {onOpenConnections && (
              <button
                type="button"
                onClick={onOpenConnections}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5 text-[#C9A66B]" />
                <span className="hidden sm:inline">Channels ({connectedChannels.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleSyncLive}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#C9A66B] to-[#E5C687] hover:opacity-95 text-[#090B12] text-xs font-black transition-all shadow-md shadow-[#C9A66B]/15 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Sync Live Chats'}</span>
            </button>
          </div>
        </div>

        {/* Handler Queue Filter Strip: All | Bot (AI) | Request Human | Human Agents */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-white/[0.06]">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setHandlerFilter('all')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                handlerFilter === 'all'
                  ? 'bg-white/10 border-white/25 text-white'
                  : 'bg-[#090B12] border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <span>All Handlers</span>
              <span className="text-[10px] opacity-75">({handlerCounts.all})</span>
            </button>

            <button
              type="button"
              onClick={() => setHandlerFilter('ai')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                handlerFilter === 'ai'
                  ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200'
                  : 'bg-[#090B12] border-white/10 text-slate-400 hover:text-cyan-200'
              }`}
              title="Chats currently handled by AI Bot"
            >
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] opacity-80">({handlerCounts.ai})</span>
            </button>

            <button
              type="button"
              onClick={() => setHandlerFilter('request_human')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                handlerFilter === 'request_human'
                  ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                  : 'bg-[#090B12] border-white/10 text-slate-400 hover:text-amber-200'
              }`}
            >
              <Hand className="w-3 h-3 text-amber-400" />
              <span>Request Human</span>
              <span className="text-[10px] opacity-80">({handlerCounts.request_human})</span>
            </button>

            <button
              type="button"
              onClick={() => setHandlerFilter('human')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                handlerFilter === 'human'
                  ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
                  : 'bg-[#090B12] border-white/10 text-slate-400 hover:text-emerald-200'
              }`}
            >
              <User className="w-3 h-3 text-emerald-400" />
              <span>Human Taken Over</span>
              <span className="text-[10px] opacity-80">({handlerCounts.human})</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-500">
            AI handles first &rarr; escalates to <strong className="text-amber-300">Request Human</strong> &rarr; replying tags you
          </span>
        </div>

        {/* Optional Per-Channel Sync Notes */}
        {syncNotes.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.06]">
            {syncNotes.map((s) => {
              const meta = CHANNEL_META[s.channel] || CHANNEL_META.all
              return (
                <div
                  key={`${s.channel}-${s.accountName}`}
                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#090B12] border border-white/10 text-[11px] text-slate-300"
                >
                  <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                  <span className="font-bold text-white">{meta.label}:</span>
                  <span>{s.syncedThreads} synced</span>
                  {s.note && <span className="text-amber-300/90">&bull; {s.note}</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Main 2-Pane Unified Inbox */}
      <div className="rounded-3xl bg-[#0F1422] border border-white/10 overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12 min-h-[540px]">
        {/* LEFT PANE: Conversations List */}
        <div
          className={`lg:col-span-4 border-b lg:border-b-0 lg:border-r border-white/[0.08] flex flex-col ${
            activeThread ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Search & Open/Resolved Filter */}
          <div className="p-3 border-b border-white/[0.08] space-y-2.5 bg-[#090B12]/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search client, agent, or message..."
                className="w-full h-9 pl-8 pr-3 rounded-xl bg-[#090B12] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A66B]"
              />
            </div>

            <div className="grid grid-cols-3 gap-1 bg-[#090B12] p-1 rounded-xl border border-white/[0.06]">
              {(['open', 'resolved', 'all'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`py-1 rounded-lg text-[11px] font-bold capitalize transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#C9A66B]/20 text-[#E5C687]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Thread List Body */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.06] max-h-[560px]">
            {loadingThreads ? (
              <div className="py-16 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-[#C9A66B]" />
                <span>Loading chats...</span>
              </div>
            ) : threads.length === 0 ? (
              <div className="py-14 px-5 text-center space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-[#090B12] border border-white/10 flex items-center justify-center mx-auto">
                  <Inbox className="w-5 h-5 text-[#C9A66B]" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">No matching conversations</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Click <span className="text-[#E5C687] font-semibold">Sync Live Chats</span> or{' '}
                    <span className="text-pink-300 font-semibold">Connect IG &amp; FB DMs</span>{' '}
                    above to pull messages from your connected platforms.
                  </p>
                </div>
              </div>
            ) : (
              threads.map((thread) => {
                const meta = CHANNEL_META[thread.channel] || CHANNEL_META.all
                const isSelected = activeThread?.id === thread.id
                const unread = Number(thread.unread_count || 0) > 0
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => openThread(thread)}
                    className={`w-full p-3.5 text-left transition-colors cursor-pointer flex items-start gap-3 ${
                      isSelected ? 'bg-[#C9A66B]/12' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="relative shrink-0">
                      {thread.contact_avatar_url ? (
                        <img
                          src={thread.contact_avatar_url}
                          alt={thread.contact_name}
                          className="w-10 h-10 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#090B12] border border-white/10 flex items-center justify-center text-xs font-black text-[#E5C687]">
                          {(thread.contact_name || '?').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span
                        className={`w-3 h-3 rounded-full ${meta.dot} border-2 border-[#0F1422] absolute -bottom-0.5 -right-0.5`}
                        title={meta.label}
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-white truncate">
                          {thread.contact_name}
                        </p>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {formatShortTime(thread.last_message_at)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${meta.badge}`}
                        >
                          {meta.shortLabel} {thread.thread_type === 'comment' ? 'Comment' : 'DM'}
                        </span>

                        {/* Live Bot / Request Human / Assigned Marketing User tag */}
                        <HandlerTagBadge thread={thread} compact={true} />

                        {unread && (
                          <span className="px-1.5 py-0.2 rounded-full bg-[#C9A66B] text-[#090B12] text-[9px] font-black">
                            {thread.unread_count}
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-[11px] truncate ${
                          unread ? 'text-slate-100 font-semibold' : 'text-slate-400'
                        }`}
                      >
                        {thread.last_message_preview || 'No preview'}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: Active Conversation & Reply Box */}
        <div
          className={`lg:col-span-8 flex flex-col bg-[#090B12]/40 ${
            activeThread ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {!activeThread || !activeHandler ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#0F1422] border border-[#C9A66B]/30 flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-[#C9A66B]" />
              </div>
              <div className="max-w-sm space-y-1">
                <h3 className="text-sm font-black text-white">
                  Unified Multi-Platform Social Inbox
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  AI handles incoming chats first (<Bot className="w-3.5 h-3.5 inline text-cyan-400" />
                  ). When escalated to <strong className="text-amber-300">Request Human</strong> or
                  when any Marketing user replies, the chat automatically tags that user until
                  handed back to <Bot className="w-3.5 h-3.5 inline text-cyan-400" />.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Conversation Header */}
              <div className="px-4 py-3 border-b border-white/[0.08] bg-[#0F1422]/90 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setActiveThread(null)}
                    className="lg:hidden p-1.5 rounded-lg bg-white/[0.05] text-slate-300 hover:text-white cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black text-white truncate">
                        {activeThread.contact_name}
                      </p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          (CHANNEL_META[activeThread.channel] || CHANNEL_META.all).badge
                        }`}
                      >
                        {(CHANNEL_META[activeThread.channel] || CHANNEL_META.all).label}{' '}
                        {activeThread.thread_type === 'comment' ? 'Comment' : 'DM'}
                      </span>
                      <HandlerTagBadge thread={activeThread} />
                    </div>
                    {activeThread.post_reference_title && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 truncate">
                        <span className="truncate max-w-[260px] sm:max-w-[380px]">
                          On: {activeThread.post_reference_title}
                        </span>
                        {activeThread.post_reference_url && (
                          <a
                            href={activeThread.post_reference_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-0.5 text-[#E5C687] hover:underline shrink-0"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons: Hand Back to Bot / Let AI Reply / Resolve */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {activeHandler.mode !== 'ai' ? (
                    <button
                      type="button"
                      disabled={updatingMode}
                      onClick={() => handleSwitchHandlerMode('ai')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/45 text-cyan-200 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                      title="Hand this conversation back to AI Bot"
                    >
                      {updatingMode ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Bot className="w-3.5 h-3.5 text-cyan-300" />
                      )}
                      <span>Hand Back to AI</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={runningAi}
                      onClick={handleRunAiReply}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/45 text-cyan-200 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                      title="Ask AI Bot to evaluate & respond (or escalate to Request Human)"
                    >
                      {runningAi ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                      )}
                      <span>{runningAi ? 'AI Thinking...' : 'AI Reply'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleToggleResolve}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                      activeThread.status === 'resolved'
                        ? 'bg-amber-500/15 border-amber-500/35 text-amber-300 hover:bg-amber-500/25'
                        : 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/25'
                    }`}
                  >
                    {activeThread.status === 'resolved' ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" /> Reopen
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Escalation Banner when Request Human is active */}
              {activeHandler.mode === 'request_human' && (
                <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/30 flex items-center justify-between gap-2 text-xs text-amber-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <Hand className="w-4 h-4 text-amber-300 shrink-0" />
                    <span className="truncate">
                      <strong>Request Human:</strong>{' '}
                      {activeHandler.humanRequestedReason ||
                        'AI delegated this chat for a human team member.'}
                    </span>
                  </div>
                  <span className="text-[11px] text-amber-300/90 shrink-0 hidden sm:inline">
                    Reply below to claim
                  </span>
                </div>
              )}

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[410px]">
                {loadingMessages ? (
                  <div className="py-16 flex items-center justify-center gap-2 text-xs text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin text-[#C9A66B]" />
                    <span>Loading messages...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-12">
                    No messages in this thread yet.
                  </p>
                ) : (
                  messages.map((msg) => {
                    const isOutbound = msg.direction === 'outbound'
                    const isBotMsg =
                      msg.sender_id === 'ai-bot' || msg.sent_by_email === 'ai-bot@cillah.dev'
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                            isOutbound
                              ? isBotMsg
                                ? 'bg-cyan-500/15 border border-cyan-400/40 text-white rounded-br-sm'
                                : 'bg-[#C9A66B]/20 border border-[#C9A66B]/45 text-white rounded-br-sm'
                              : 'bg-[#0F1422] border border-white/10 text-slate-100 rounded-bl-sm'
                          }`}
                        >
                          <p
                            className={`text-[10px] font-bold mb-1 inline-flex items-center gap-1 ${
                              isBotMsg ? 'text-cyan-300' : 'text-[#E5C687]'
                            }`}
                          >
                            {isBotMsg ? <Bot className="w-3 h-3" /> : null}
                            <span>{msg.sender_name}</span>
                          </p>
                          <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                        </div>

                        <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-slate-500">
                          <span>{formatShortTime(msg.sent_at)}</span>
                          {isOutbound && msg.delivery_status === 'sent' && (
                            <span className="inline-flex items-center gap-0.5 text-emerald-400">
                              <Check className="w-3 h-3" /> Sent
                            </span>
                          )}
                          {isOutbound && msg.delivery_status === 'failed' && (
                            <span
                              className="inline-flex items-center gap-0.5 text-rose-400"
                              title={msg.error_message || 'Delivery failed'}
                            >
                              <AlertCircle className="w-3 h-3" />{' '}
                              {msg.error_message || 'Not delivered'}
                            </span>
                          )}
                          {isOutbound && msg.delivery_status === 'local_only' && (
                            <span className="text-amber-400">Saved locally</span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Composer */}
              <div className="border-t border-white/[0.08] bg-[#0F1422]/80 p-3 space-y-1.5">
                {activeHandler.mode !== 'human' && permissions.canUploadAndDraft && (
                  <p className="text-[10px] text-slate-400 px-1">
                    Sending a message will automatically take over from{' '}
                    {activeHandler.mode === 'request_human' ? 'Request Human' : 'AI Bot'} and tag
                    this chat to <strong className="text-emerald-300">your name</strong>.
                  </p>
                )}
                <form onSubmit={handleSendReply} className="flex items-end gap-2">
                  <textarea
                    rows={2}
                    disabled={!permissions.canUploadAndDraft || sendingReply}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendReply(e)
                      }
                    }}
                    placeholder={
                      permissions.canUploadAndDraft
                        ? `Reply to ${activeThread.contact_name} on ${
                            (CHANNEL_META[activeThread.channel] || CHANNEL_META.all).label
                          }... (Enter to send)`
                        : 'Read-only Analyst mode — replying is disabled.'
                    }
                    className="flex-1 resize-none rounded-xl bg-[#090B12] border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A66B] disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!permissions.canUploadAndDraft || !replyText.trim() || sendingReply}
                    className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#C9A66B] to-[#E5C687] hover:opacity-95 text-[#090B12] font-black text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 shrink-0"
                  >
                    {sendingReply ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
