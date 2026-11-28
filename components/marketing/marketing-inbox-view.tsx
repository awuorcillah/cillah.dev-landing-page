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
} from 'lucide-react'
import type { getRolePermissions } from '@/lib/marketing-config'
import type {
  ChannelSyncSummary,
  InboxChannel,
  InboxMessageRecord,
  InboxThreadRecord,
} from '@/lib/social-inbox'

interface MarketingInboxViewProps {
  organizationSlug: string
  permissions: ReturnType<typeof getRolePermissions>
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

export default function MarketingInboxView({
  organizationSlug,
  permissions,
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
  const [connectedChannels, setConnectedChannels] = useState<string[]>([])
  const [schemaPending, setSchemaPending] = useState(false)
  const [loadingThreads, setLoadingThreads] = useState(true)

  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'open' | 'resolved' | 'all'>('open')
  const [searchQuery, setSearchQuery] = useState('')

  const [activeThread, setActiveThread] = useState<InboxThreadRecord | null>(null)
  const [messages, setMessages] = useState<InboxMessageRecord[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
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
        setConnectedChannels(json.connectedChannels || [])
        setSchemaPending(Boolean(json.schema_pending))
      }
    } catch {
      toast.error('Could not load unified inbox.')
    } finally {
      setLoadingThreads(false)
    }
  }, [organizationSlug, channelFilter, statusFilter, searchQuery])

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
          // Clear unread dot in list
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

      if (json.message) {
        setMessages((prev) => [...prev, json.message])
        setThreads((prev) =>
          prev.map((t) =>
            t.id === activeThread.id
              ? {
                  ...t,
                  last_message_preview: replyText.trim(),
                  last_message_at: json.message.sent_at,
                }
              : t
          )
        )
      }
      setReplyText('')

      if (json.deliveryStatus === 'sent') {
        toast.success(`Reply sent to ${CHANNEL_META[activeThread.channel]?.label || activeThread.channel}!`)
      } else if (json.warning) {
        toast.warning(json.warning)
      }
    } catch {
      toast.error('Network error sending reply.')
    } finally {
      setSendingReply(false)
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

      {/* Top Controls: Platform Pills + Sync Button */}
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

          <div className="flex items-center gap-2">
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
                placeholder="Search name, @handle, or message..."
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
                  <p className="text-xs font-bold text-white">No conversations yet</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Click <span className="text-[#E5C687] font-semibold">Sync Live Chats</span> above
                    to pull comments and messages from your connected YouTube, Facebook, Instagram,
                    and WhatsApp channels.
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

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-white truncate">
                          {thread.contact_name}
                        </p>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {formatShortTime(thread.last_message_at)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${meta.badge}`}
                        >
                          {meta.shortLabel} {thread.thread_type === 'comment' ? 'Comment' : 'DM'}
                        </span>
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
          {!activeThread ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#0F1422] border border-[#C9A66B]/30 flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-[#C9A66B]" />
              </div>
              <div className="max-w-sm space-y-1">
                <h3 className="text-sm font-black text-white">
                  Unified Multi-Platform Social Inbox
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Select any conversation on the left to read the full thread and reply directly to
                  Instagram, Facebook, WhatsApp, or YouTube without switching apps.
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
                    <div className="flex items-center gap-2">
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

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[430px]">
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
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                            isOutbound
                              ? 'bg-[#C9A66B]/20 border border-[#C9A66B]/45 text-white rounded-br-sm'
                              : 'bg-[#0F1422] border border-white/10 text-slate-100 rounded-bl-sm'
                          }`}
                        >
                          <p className="text-[10px] font-bold text-[#E5C687] mb-1">
                            {msg.sender_name}
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
              <form
                onSubmit={handleSendReply}
                className="p-3 border-t border-white/[0.08] bg-[#0F1422]/80 flex items-end gap-2"
              >
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}
