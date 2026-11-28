import type { SupabaseClient } from '@supabase/supabase-js'
import { decryptToken } from '@/lib/social-crypto'
import { refreshYouTubeAccessToken, type SocialConnectionRow } from '@/lib/social-publishers'
import { sendWhatsAppTextMessage } from '@/lib/whatsapp'

export type InboxChannel = 'instagram' | 'facebook' | 'whatsapp' | 'youtube' | 'tiktok' | 'linkedin'

export interface InboxThreadRecord {
  id: string
  organization_slug: string
  channel: InboxChannel
  thread_type: 'dm' | 'comment'
  external_thread_id: string
  external_account_id: string | null
  contact_id: string | null
  contact_name: string
  contact_handle: string | null
  contact_avatar_url: string | null
  post_reference_title: string | null
  post_reference_url: string | null
  last_message_preview: string
  last_message_at: string
  unread_count: number
  status: 'open' | 'resolved' | 'archived'
  assigned_to_email: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface InboxMessageRecord {
  id: string
  thread_id: string
  organization_slug: string
  channel: InboxChannel
  external_message_id: string
  direction: 'inbound' | 'outbound'
  sender_name: string
  sender_id: string | null
  body: string
  media_url: string | null
  sent_at: string
  sent_by_email: string | null
  delivery_status: 'sent' | 'delivered' | 'failed' | 'local_only'
  error_message: string | null
  created_at: string
}

export interface ChannelSyncSummary {
  channel: InboxChannel
  accountName: string
  syncedThreads: number
  syncedMessages: number
  note?: string
}

async function upsertThreadWithMessages(
  db: SupabaseClient,
  threadInput: {
    organization_slug: string
    channel: InboxChannel
    thread_type: 'dm' | 'comment'
    external_thread_id: string
    external_account_id?: string | null
    contact_id?: string | null
    contact_name: string
    contact_handle?: string | null
    contact_avatar_url?: string | null
    post_reference_title?: string | null
    post_reference_url?: string | null
    metadata?: Record<string, any>
  },
  messages: Array<{
    external_message_id: string
    direction: 'inbound' | 'outbound'
    sender_name: string
    sender_id?: string | null
    body: string
    media_url?: string | null
    sent_at: string
  }>
): Promise<{ threadId: string | null; insertedMessages: number }> {
  if (messages.length === 0) return { threadId: null, insertedMessages: 0 }

  const sorted = [...messages].sort(
    (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
  )
  const latest = sorted[sorted.length - 1]
  const nowIso = new Date().toISOString()

  const { data: existingThread } = await db
    .from('marketing_inbox_threads')
    .select('id, unread_count, last_message_at, metadata')
    .eq('organization_slug', threadInput.organization_slug)
    .eq('channel', threadInput.channel)
    .eq('external_thread_id', threadInput.external_thread_id)
    .maybeSingle()

  const hasNewInbound =
    latest.direction === 'inbound' &&
    (!existingThread ||
      new Date(latest.sent_at).getTime() > new Date(existingThread.last_message_at).getTime())

  const nextUnread = existingThread
    ? hasNewInbound
      ? Number(existingThread.unread_count || 0) + 1
      : Number(existingThread.unread_count || 0)
    : latest.direction === 'inbound'
    ? 1
    : 0

  // Preserve existing AI/Human handler metadata; default new chats to AI-first ('ai'),
  // and immediately flag 'request_human' if the latest inbound message asks for a human!
  const existingMeta = ((existingThread as any)?.metadata || {}) as Record<string, any>
  const currentHandlerMode = String(existingMeta.handler_mode || 'ai')
  const asksForHuman =
    latest.direction === 'inbound' &&
    /\b(speak|talk|chat|connect|transfer)\s+(to|with)\s+(a\s+)?(human|person|agent|rep|representative|someone|staff|manager|owner|real\s+person)\b|\b(real\s+person|live\s+agent|human\s+agent|human\s+please|need\s+a\s+human|want\s+a\s+human|customer\s+care|call\s+me|not\s+a\s+bot)\b/i.test(
      latest.body
    )

  const mergedMetadata: Record<string, any> = {
    ...existingMeta,
    ...(threadInput.metadata || {}),
    handler_mode:
      currentHandlerMode === 'human'
        ? 'human'
        : asksForHuman
        ? 'request_human'
        : currentHandlerMode || 'ai',
    ...(asksForHuman && currentHandlerMode !== 'human'
      ? { human_requested_reason: 'Client requested a human agent.' }
      : {}),
  }

  const { data: savedThread, error: threadErr } = await db
    .from('marketing_inbox_threads')
    .upsert(
      {
        organization_slug: threadInput.organization_slug,
        channel: threadInput.channel,
        thread_type: threadInput.thread_type,
        external_thread_id: threadInput.external_thread_id,
        external_account_id: threadInput.external_account_id || null,
        contact_id: threadInput.contact_id || null,
        contact_name: threadInput.contact_name || 'Social User',
        contact_handle: threadInput.contact_handle || null,
        contact_avatar_url: threadInput.contact_avatar_url || null,
        post_reference_title: threadInput.post_reference_title || null,
        post_reference_url: threadInput.post_reference_url || null,
        last_message_preview: latest.body.slice(0, 280),
        last_message_at: latest.sent_at,
        unread_count: nextUnread,
        metadata: mergedMetadata,
        updated_at: nowIso,
      },
      { onConflict: 'organization_slug,channel,external_thread_id' }
    )
    .select('id')
    .single()

  if (threadErr || !savedThread?.id) {
    console.warn('[Social Inbox] Thread upsert failed:', threadErr?.message)
    return { threadId: null, insertedMessages: 0 }
  }

  const rows = sorted.map((m) => ({
    thread_id: savedThread.id,
    organization_slug: threadInput.organization_slug,
    channel: threadInput.channel,
    external_message_id: m.external_message_id,
    direction: m.direction,
    sender_name: m.sender_name || 'User',
    sender_id: m.sender_id || null,
    body: m.body,
    media_url: m.media_url || null,
    sent_at: m.sent_at,
    delivery_status: 'delivered',
  }))

  const { error: msgErr } = await db
    .from('marketing_inbox_messages')
    .upsert(rows, {
      onConflict: 'organization_slug,channel,external_message_id',
      ignoreDuplicates: true,
    })

  if (msgErr) {
    console.warn('[Social Inbox] Messages upsert warning:', msgErr.message)
  }

  return { threadId: savedThread.id, insertedMessages: rows.length }
}

/**
 * Syncs live comments & DMs from connected Facebook, Instagram, and YouTube channels.
 */
export async function syncOrganizationInbox(
  db: SupabaseClient,
  orgSlug: string
): Promise<{
  syncedThreads: number
  syncedMessages: number
  channelResults: ChannelSyncSummary[]
}> {
  const { data: connections } = await db
    .from('marketing_social_connections')
    .select('*')
    .eq('organization_slug', orgSlug)
    .eq('status', 'connected')

  const activeConns = (connections || []) as SocialConnectionRow[]
  const channelResults: ChannelSyncSummary[] = []
  let totalThreads = 0
  let totalMessages = 0

  // 1. FACEBOOK PAGE (DMs + Post Comments)
  const fbConn = activeConns.find((c) => c.channel === 'facebook')
  if (fbConn) {
    const summary: ChannelSyncSummary = {
      channel: 'facebook',
      accountName: fbConn.account_name,
      syncedThreads: 0,
      syncedMessages: 0,
    }
    const notes: string[] = []
    try {
      const pageToken = decryptToken(fbConn.access_token_enc)
      if (!pageToken) {
        throw new Error('Reconnect Facebook in Connected Accounts to refresh access token.')
      }
      const pageId = fbConn.account_id

      // 1a. Facebook Page Messenger Conversations (requires pages_messaging)
      const dmRes = await fetch(
        `https://graph.facebook.com/v21.0/${encodeURIComponent(
          pageId
        )}/conversations?fields=id,updated_time,participants,messages.limit(15){id,message,from,created_time}&limit=15&access_token=${encodeURIComponent(
          pageToken
        )}`,
        { cache: 'no-store' }
      )
      const dmJson = await dmRes.json().catch(() => ({}))
      if (dmRes.ok && Array.isArray(dmJson.data)) {
        for (const conv of dmJson.data) {
          const participants: any[] = conv?.participants?.data || []
          const other = participants.find((p) => String(p.id) !== String(pageId)) || participants[0]
          const rawMsgs: any[] = conv?.messages?.data || []
          const parsedMsgs = rawMsgs
            .filter((m) => Boolean(m.message))
            .map((m) => ({
              external_message_id: String(m.id),
              direction: (String(m?.from?.id) === String(pageId) ? 'outbound' : 'inbound') as
                | 'inbound'
                | 'outbound',
              sender_name: String(m?.from?.name || other?.name || 'Facebook User'),
              sender_id: m?.from?.id ? String(m.from.id) : null,
              body: String(m.message),
              sent_at: m.created_time || conv.updated_time || new Date().toISOString(),
            }))

          if (parsedMsgs.length > 0) {
            const res = await upsertThreadWithMessages(
              db,
              {
                organization_slug: orgSlug,
                channel: 'facebook',
                thread_type: 'dm',
                external_thread_id: `fb-dm-${conv.id}`,
                external_account_id: pageId,
                contact_id: other?.id ? String(other.id) : null,
                contact_name: String(other?.name || 'Messenger Contact'),
                metadata: { conversation_id: conv.id, page_id: pageId },
              },
              parsedMsgs
            )
            if (res.threadId) {
              summary.syncedThreads += 1
              summary.syncedMessages += res.insertedMessages
            }
          }
        }
      } else if (dmJson?.error?.message) {
        notes.push('Messenger DMs need pages_messaging permission in Meta App Review')
      }

      // 1b. Facebook Page Post Comments (works with pages_read_engagement!)
      const postsRes = await fetch(
        `https://graph.facebook.com/v21.0/${encodeURIComponent(
          pageId
        )}/posts?fields=id,message,permalink_url,comments.limit(15){id,message,from,created_time,comments.limit(10){id,message,from,created_time}}&limit=10&access_token=${encodeURIComponent(
          pageToken
        )}`,
        { cache: 'no-store' }
      )
      const postsJson = await postsRes.json().catch(() => ({}))
      if (postsRes.ok && Array.isArray(postsJson.data)) {
        for (const post of postsJson.data) {
          const comments: any[] = post?.comments?.data || []
          for (const comment of comments) {
            if (!comment.message) continue
            const msgs = [
              {
                external_message_id: String(comment.id),
                direction: (String(comment?.from?.id) === String(pageId)
                  ? 'outbound'
                  : 'inbound') as 'inbound' | 'outbound',
                sender_name: String(comment?.from?.name || 'Facebook Follower'),
                sender_id: comment?.from?.id ? String(comment.from.id) : null,
                body: String(comment.message),
                sent_at: comment.created_time || new Date().toISOString(),
              },
              ...((comment?.comments?.data || []) as any[])
                .filter((r) => Boolean(r.message))
                .map((r) => ({
                  external_message_id: String(r.id),
                  direction: (String(r?.from?.id) === String(pageId)
                    ? 'outbound'
                    : 'inbound') as 'inbound' | 'outbound',
                  sender_name: String(r?.from?.name || 'Facebook User'),
                  sender_id: r?.from?.id ? String(r.from.id) : null,
                  body: String(r.message),
                  sent_at: r.created_time || new Date().toISOString(),
                })),
            ]

            const res = await upsertThreadWithMessages(
              db,
              {
                organization_slug: orgSlug,
                channel: 'facebook',
                thread_type: 'comment',
                external_thread_id: `fb-comment-${comment.id}`,
                external_account_id: pageId,
                contact_id: comment?.from?.id ? String(comment.from.id) : null,
                contact_name: String(comment?.from?.name || 'Facebook Follower'),
                post_reference_title: String(post.message || 'Facebook Post').slice(0, 120),
                post_reference_url: post.permalink_url || null,
                metadata: { comment_id: comment.id, post_id: post.id, page_id: pageId },
              },
              msgs
            )
            if (res.threadId) {
              summary.syncedThreads += 1
              summary.syncedMessages += res.insertedMessages
            }
          }
        }
      }
    } catch (err: any) {
      notes.push(err?.message || 'Could not sync Facebook Page')
    }
    if (notes.length > 0) summary.note = notes.join(' · ')
    totalThreads += summary.syncedThreads
    totalMessages += summary.syncedMessages
    channelResults.push(summary)
  }

  // 2. INSTAGRAM BUSINESS (DMs + Post/Reel Comments)
  const igConn = activeConns.find((c) => c.channel === 'instagram')
  if (igConn) {
    const summary: ChannelSyncSummary = {
      channel: 'instagram',
      accountName: igConn.account_name,
      syncedThreads: 0,
      syncedMessages: 0,
    }
    const notes: string[] = []
    try {
      const token = decryptToken(igConn.access_token_enc)
      if (!token) {
        throw new Error('Reconnect Instagram in Connected Accounts to refresh access token.')
      }
      const igId = igConn.account_id
      const linkedPageId =
        String((igConn.metadata as any)?.page_id || fbConn?.account_id || '').trim()

      // 2a. Instagram DMs via linked Facebook Page
      if (linkedPageId) {
        const igDmRes = await fetch(
          `https://graph.facebook.com/v21.0/${encodeURIComponent(
            linkedPageId
          )}/conversations?platform=instagram&fields=id,updated_time,participants,messages.limit(15){id,message,from,created_time}&limit=15&access_token=${encodeURIComponent(
            token
          )}`,
          { cache: 'no-store' }
        )
        const igDmJson = await igDmRes.json().catch(() => ({}))
        if (igDmRes.ok && Array.isArray(igDmJson.data)) {
          for (const conv of igDmJson.data) {
            const participants: any[] = conv?.participants?.data || []
            const other =
              participants.find(
                (p) => String(p.id) !== String(igId) && String(p.id) !== String(linkedPageId)
              ) || participants[0]
            const rawMsgs: any[] = conv?.messages?.data || []
            const parsedMsgs = rawMsgs
              .filter((m) => Boolean(m.message))
              .map((m) => ({
                external_message_id: String(m.id),
                direction: (String(m?.from?.id) === String(igId) ||
                String(m?.from?.id) === String(linkedPageId)
                  ? 'outbound'
                  : 'inbound') as 'inbound' | 'outbound',
                sender_name: String(
                  m?.from?.username || m?.from?.name || other?.username || 'Instagram User'
                ),
                sender_id: m?.from?.id ? String(m.from.id) : null,
                body: String(m.message),
                sent_at: m.created_time || conv.updated_time || new Date().toISOString(),
              }))

            if (parsedMsgs.length > 0) {
              const res = await upsertThreadWithMessages(
                db,
                {
                  organization_slug: orgSlug,
                  channel: 'instagram',
                  thread_type: 'dm',
                  external_thread_id: `ig-dm-${conv.id}`,
                  external_account_id: igId,
                  contact_id: other?.id ? String(other.id) : null,
                  contact_name: String(other?.name || other?.username || 'Instagram Contact'),
                  contact_handle: other?.username ? `@${other.username}` : null,
                  metadata: { conversation_id: conv.id, ig_id: igId, page_id: linkedPageId },
                },
                parsedMsgs
              )
              if (res.threadId) {
                summary.syncedThreads += 1
                summary.syncedMessages += res.insertedMessages
              }
            }
          }
        } else if (igDmJson?.error?.message) {
          notes.push('Instagram DMs activate once instagram_manage_messages is approved in Meta')
        }
      }

      // 2b. Instagram Media Comments
      const mediaRes = await fetch(
        `https://graph.facebook.com/v21.0/${encodeURIComponent(
          igId
        )}/media?fields=id,caption,permalink,comments.limit(15){id,text,username,timestamp,replies.limit(10){id,text,username,timestamp}}&limit=10&access_token=${encodeURIComponent(
          token
        )}`,
        { cache: 'no-store' }
      )
      const mediaJson = await mediaRes.json().catch(() => ({}))
      if (mediaRes.ok && Array.isArray(mediaJson.data)) {
        const ownHandle = (igConn.account_handle || '').replace(/^@/, '').toLowerCase()
        for (const item of mediaJson.data) {
          const comments: any[] = item?.comments?.data || []
          for (const c of comments) {
            if (!c.text) continue
            const authorUser = String(c.username || 'instagram_user')
            const msgs = [
              {
                external_message_id: String(c.id),
                direction: (ownHandle && authorUser.toLowerCase() === ownHandle
                  ? 'outbound'
                  : 'inbound') as 'inbound' | 'outbound',
                sender_name: `@${authorUser}`,
                sender_id: authorUser,
                body: String(c.text),
                sent_at: c.timestamp || new Date().toISOString(),
              },
              ...((c?.replies?.data || []) as any[])
                .filter((r) => Boolean(r.text))
                .map((r) => {
                  const rUser = String(r.username || 'instagram_user')
                  return {
                    external_message_id: String(r.id),
                    direction: (ownHandle && rUser.toLowerCase() === ownHandle
                      ? 'outbound'
                      : 'inbound') as 'inbound' | 'outbound',
                    sender_name: `@${rUser}`,
                    sender_id: rUser,
                    body: String(r.text),
                    sent_at: r.timestamp || new Date().toISOString(),
                  }
                }),
            ]

            const res = await upsertThreadWithMessages(
              db,
              {
                organization_slug: orgSlug,
                channel: 'instagram',
                thread_type: 'comment',
                external_thread_id: `ig-comment-${c.id}`,
                external_account_id: igId,
                contact_id: authorUser,
                contact_name: `@${authorUser}`,
                contact_handle: `@${authorUser}`,
                post_reference_title: String(item.caption || 'Instagram Post').slice(0, 120),
                post_reference_url: item.permalink || null,
                metadata: { comment_id: c.id, media_id: item.id, ig_id: igId },
              },
              msgs
            )
            if (res.threadId) {
              summary.syncedThreads += 1
              summary.syncedMessages += res.insertedMessages
            }
          }
        }
      } else if (mediaJson?.error?.message) {
        notes.push('Instagram Comments need instagram_manage_comments permission')
      }
    } catch (err: any) {
      notes.push(err?.message || 'Could not sync Instagram')
    }
    if (notes.length > 0) summary.note = notes.join(' · ')
    totalThreads += summary.syncedThreads
    totalMessages += summary.syncedMessages
    channelResults.push(summary)
  }

  // 3. YOUTUBE CHANNEL VIDEO COMMENTS (Works right away with youtube.readonly!)
  const ytConn = activeConns.find((c) => c.channel === 'youtube')
  if (ytConn) {
    const summary: ChannelSyncSummary = {
      channel: 'youtube',
      accountName: ytConn.account_name,
      syncedThreads: 0,
      syncedMessages: 0,
    }
    try {
      const accessToken = await refreshYouTubeAccessToken(ytConn, db)
      if (!accessToken) {
        summary.note = 'Reconnect YouTube in Connected Accounts to refresh token.'
      } else {
        const ytUrl = new URL('https://www.googleapis.com/youtube/v3/commentThreads')
        ytUrl.searchParams.set('part', 'snippet,replies')
        ytUrl.searchParams.set('allThreadsRelatedToChannelId', ytConn.account_id)
        ytUrl.searchParams.set('maxResults', '25')
        ytUrl.searchParams.set('textFormat', 'plainText')

        const ytRes = await fetch(ytUrl.toString(), {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: 'no-store',
        })
        const ytJson = await ytRes.json().catch(() => ({}))
        if (ytRes.ok && Array.isArray(ytJson.items)) {
          for (const item of ytJson.items) {
            const top = item?.snippet?.topLevelComment
            const topSnippet = top?.snippet
            if (!top?.id || !topSnippet?.textDisplay) continue

            const videoId = String(item?.snippet?.videoId || topSnippet.videoId || '')
            const msgs = [
              {
                external_message_id: String(top.id),
                direction: (String(topSnippet?.authorChannelId?.value || '') ===
                String(ytConn.account_id)
                  ? 'outbound'
                  : 'inbound') as 'inbound' | 'outbound',
                sender_name: String(topSnippet.authorDisplayName || 'YouTube Viewer'),
                sender_id: topSnippet?.authorChannelId?.value || null,
                body: String(topSnippet.textDisplay),
                sent_at: topSnippet.publishedAt || new Date().toISOString(),
              },
              ...((item?.replies?.comments || []) as any[])
                .filter((r) => Boolean(r?.snippet?.textDisplay))
                .map((r) => ({
                  external_message_id: String(r.id),
                  direction: (String(r?.snippet?.authorChannelId?.value || '') ===
                  String(ytConn.account_id)
                    ? 'outbound'
                    : 'inbound') as 'inbound' | 'outbound',
                  sender_name: String(r.snippet.authorDisplayName || 'YouTube User'),
                  sender_id: r?.snippet?.authorChannelId?.value || null,
                  body: String(r.snippet.textDisplay),
                  sent_at: r.snippet.publishedAt || new Date().toISOString(),
                })),
            ]

            const res = await upsertThreadWithMessages(
              db,
              {
                organization_slug: orgSlug,
                channel: 'youtube',
                thread_type: 'comment',
                external_thread_id: `yt-thread-${item.id}`,
                external_account_id: ytConn.account_id,
                contact_id: topSnippet?.authorChannelId?.value || null,
                contact_name: String(topSnippet.authorDisplayName || 'YouTube Viewer'),
                contact_avatar_url: topSnippet.authorProfileImageUrl || null,
                post_reference_title: videoId ? `YouTube Video (${videoId})` : 'YouTube Video',
                post_reference_url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : null,
                metadata: {
                  parent_comment_id: top.id,
                  video_id: videoId,
                  channel_id: ytConn.account_id,
                },
              },
              msgs
            )
            if (res.threadId) {
              summary.syncedThreads += 1
              summary.syncedMessages += res.insertedMessages
            }
          }
        } else if (ytJson?.error?.message) {
          summary.note = ytJson.error.message
        }
      }
    } catch (err: any) {
      summary.note = err?.message || 'Could not sync YouTube comments'
    }
    totalThreads += summary.syncedThreads
    totalMessages += summary.syncedMessages
    channelResults.push(summary)
  }

  return {
    syncedThreads: totalThreads,
    syncedMessages: totalMessages,
    channelResults,
  }
}

/**
 * Dispatches an outbound reply to the originating social platform API and returns delivery status.
 */
export async function dispatchInboxReply(
  db: SupabaseClient,
  thread: InboxThreadRecord,
  replyText: string
): Promise<{
  externalMessageId: string
  deliveryStatus: 'sent' | 'delivered' | 'failed' | 'local_only'
  errorMessage?: string
}> {
  const fallbackId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  // 1. WhatsApp Cloud API
  if (thread.channel === 'whatsapp') {
    const recipient = (thread.contact_id || '').trim()
    if (!recipient) {
      return {
        externalMessageId: fallbackId,
        deliveryStatus: 'failed',
        errorMessage: 'No recipient phone number on this WhatsApp thread.',
      }
    }
    const res = await sendWhatsAppTextMessage({ to: recipient, text: replyText })
    if (res.success) {
      return {
        externalMessageId: String(res.data?.messages?.[0]?.id || fallbackId),
        deliveryStatus: 'sent',
      }
    }
    return {
      externalMessageId: fallbackId,
      deliveryStatus: 'failed',
      errorMessage:
        typeof res.error === 'string'
          ? res.error
          : 'WhatsApp API could not deliver reply (check WHATSAPP_ACCESS_TOKEN).',
    }
  }

  // Look up active social connection for this org + channel
  const { data: conn } = await db
    .from('marketing_social_connections')
    .select('*')
    .eq('organization_slug', thread.organization_slug)
    .eq('channel', thread.channel)
    .eq('status', 'connected')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!conn) {
    return {
      externalMessageId: fallbackId,
      deliveryStatus: 'local_only',
      errorMessage: `Connect ${thread.channel} in Connected Accounts to send live replies.`,
    }
  }

  const socialConn = conn as SocialConnectionRow

  // 2. Facebook Page (DM or Comment)
  if (thread.channel === 'facebook') {
    const token = decryptToken(socialConn.access_token_enc)
    if (!token) {
      return {
        externalMessageId: fallbackId,
        deliveryStatus: 'failed',
        errorMessage: 'Facebook token expired. Reconnect Meta in Connected Accounts.',
      }
    }
    if (thread.thread_type === 'comment' && thread.metadata?.comment_id) {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${encodeURIComponent(
          String(thread.metadata.comment_id)
        )}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: replyText, access_token: token }),
        }
      )
      const json = await res.json().catch(() => ({}))
      if (res.ok && json.id) {
        return { externalMessageId: String(json.id), deliveryStatus: 'sent' }
      }
      return {
        externalMessageId: fallbackId,
        deliveryStatus: 'failed',
        errorMessage: json?.error?.message || 'Facebook rejected the comment reply.',
      }
    }

    if (thread.contact_id) {
      const pageId = String(thread.metadata?.page_id || socialConn.account_id)
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${encodeURIComponent(pageId)}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { id: thread.contact_id },
            messaging_type: 'RESPONSE',
            message: { text: replyText },
            access_token: token,
          }),
        }
      )
      const json = await res.json().catch(() => ({}))
      if (res.ok && json.message_id) {
        return { externalMessageId: String(json.message_id), deliveryStatus: 'sent' }
      }
      return {
        externalMessageId: fallbackId,
        deliveryStatus: 'failed',
        errorMessage: json?.error?.message || 'Facebook Messenger rejected the reply.',
      }
    }
  }

  // 3. Instagram Business (DM or Comment)
  if (thread.channel === 'instagram') {
    const token = decryptToken(socialConn.access_token_enc)
    if (!token) {
      return {
        externalMessageId: fallbackId,
        deliveryStatus: 'failed',
        errorMessage: 'Instagram token expired. Reconnect Meta in Connected Accounts.',
      }
    }
    if (thread.thread_type === 'comment' && thread.metadata?.comment_id) {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${encodeURIComponent(
          String(thread.metadata.comment_id)
        )}/replies`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: replyText, access_token: token }),
        }
      )
      const json = await res.json().catch(() => ({}))
      if (res.ok && json.id) {
        return { externalMessageId: String(json.id), deliveryStatus: 'sent' }
      }
      return {
        externalMessageId: fallbackId,
        deliveryStatus: 'failed',
        errorMessage: json?.error?.message || 'Instagram rejected the comment reply.',
      }
    }

    if (thread.contact_id && thread.metadata?.page_id) {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${encodeURIComponent(
          String(thread.metadata.page_id)
        )}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { id: thread.contact_id },
            message: { text: replyText },
            access_token: token,
          }),
        }
      )
      const json = await res.json().catch(() => ({}))
      if (res.ok && json.message_id) {
        return { externalMessageId: String(json.message_id), deliveryStatus: 'sent' }
      }
      return {
        externalMessageId: fallbackId,
        deliveryStatus: 'failed',
        errorMessage: json?.error?.message || 'Instagram DM API rejected the reply.',
      }
    }
  }

  // 4. YouTube Comment Reply
  if (thread.channel === 'youtube' && thread.metadata?.parent_comment_id) {
    const accessToken = await refreshYouTubeAccessToken(socialConn, db)
    if (!accessToken) {
      return {
        externalMessageId: fallbackId,
        deliveryStatus: 'failed',
        errorMessage: 'YouTube token expired. Reconnect YouTube in Connected Accounts.',
      }
    }
    const res = await fetch(
      'https://www.googleapis.com/youtube/v3/comments?part=snippet',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: {
            parentId: String(thread.metadata.parent_comment_id),
            textOriginal: replyText,
          },
        }),
      }
    )
    const json = await res.json().catch(() => ({}))
    if (res.ok && json.id) {
      return { externalMessageId: String(json.id), deliveryStatus: 'sent' }
    }
    return {
      externalMessageId: fallbackId,
      deliveryStatus: 'failed',
      errorMessage:
        json?.error?.message ||
        'YouTube comment replies require the youtube.force-ssl scope.',
    }
  }

  return {
    externalMessageId: fallbackId,
    deliveryStatus: 'local_only',
    errorMessage: 'Saved internally; live reply API not yet enabled for this channel.',
  }
}
