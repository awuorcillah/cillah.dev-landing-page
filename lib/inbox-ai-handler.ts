import type { SupabaseClient } from '@supabase/supabase-js'
import { dispatchInboxReply, type InboxMessageRecord, type InboxThreadRecord } from '@/lib/social-inbox'

export type InboxHandlerMode = 'ai' | 'request_human' | 'human'

export interface ThreadHandlerInfo {
  mode: InboxHandlerMode
  assignedToEmail: string | null
  assignedToName: string | null
  lastHandledByEmail: string | null
  lastHandledByName: string | null
  humanRequestedReason: string | null
}

/**
 * Extracts normalized AI / Request Human / Human handler state from a thread row.
 * Uses existing `assigned_to_email` + `metadata` JSONB so zero extra SQL migration is required.
 */
export function getThreadHandlerInfo(thread: Partial<InboxThreadRecord>): ThreadHandlerInfo {
  const meta = (thread.metadata || {}) as Record<string, any>
  const rawMode = String(meta.handler_mode || '').toLowerCase()
  const assignedEmail = thread.assigned_to_email || null
  const assignedName =
    (typeof meta.assigned_to_name === 'string' && meta.assigned_to_name.trim()) ||
    (assignedEmail ? assignedEmail.split('@')[0] : null)

  let mode: InboxHandlerMode = 'ai'
  if (rawMode === 'request_human') {
    mode = 'request_human'
  } else if (rawMode === 'human' || (rawMode !== 'ai' && Boolean(assignedEmail))) {
    mode = 'human'
  }

  return {
    mode,
    assignedToEmail: mode === 'human' ? assignedEmail : null,
    assignedToName: mode === 'human' ? assignedName : null,
    lastHandledByEmail:
      (typeof meta.last_handled_by_email === 'string' && meta.last_handled_by_email) ||
      assignedEmail ||
      null,
    lastHandledByName:
      (typeof meta.last_handled_by_name === 'string' && meta.last_handled_by_name) ||
      assignedName ||
      null,
    humanRequestedReason:
      mode === 'request_human' && typeof meta.human_requested_reason === 'string'
        ? meta.human_requested_reason
        : null,
  }
}

const HUMAN_REQUEST_PATTERNS: RegExp[] = [
  /\b(speak|talk|chat|connect|transfer)\s+(to|with)\s+(a\s+)?(human|person|agent|rep|representative|someone|staff|manager|owner|real\s+person)\b/i,
  /\b(real\s+person|live\s+agent|human\s+agent|human\s+please|need\s+a\s+human|want\s+a\s+human|customer\s+care|call\s+me)\b/i,
  /\bnot\s+a\s+bot\b/i,
  /\bstop\s+bot\b/i,
]

export function detectExplicitHumanRequest(text: string): boolean {
  const clean = text.trim()
  if (!clean) return false
  return HUMAN_REQUEST_PATTERNS.some((re) => re.test(clean))
}

/**
 * Evaluates an AI-mode chat thread:
 * - If the client explicitly asks for a human OR AI senses it cannot help further -> marks `request_human`.
 * - Otherwise generates a concise helpful reply, sends it via the channel API, and keeps `handler_mode = 'ai'`.
 */
export async function evaluateAndHandleInboxWithAI(params: {
  db: SupabaseClient
  thread: InboxThreadRecord
  recentMessages: InboxMessageRecord[]
  organizationName?: string
}): Promise<{
  action: 'replied' | 'escalated_human' | 'skipped'
  reason?: string
  message?: InboxMessageRecord
  thread: InboxThreadRecord
}> {
  const { db, thread, recentMessages, organizationName } = params
  const info = getThreadHandlerInfo(thread)

  // Never override a human who has already taken over this conversation
  if (info.mode === 'human') {
    return { action: 'skipped', reason: 'Handled by human agent', thread }
  }

  const latestInbound = [...recentMessages]
    .reverse()
    .find((m) => m.direction === 'inbound')

  const latestText = latestInbound?.body || thread.last_message_preview || ''
  const nowIso = new Date().toISOString()

  const escalateToHuman = async (reason: string) => {
    const nextMeta = {
      ...(thread.metadata || {}),
      handler_mode: 'request_human' as InboxHandlerMode,
      assigned_to_name: null,
      human_requested_reason: reason,
    }
    const { data: updated } = await db
      .from('marketing_inbox_threads')
      .update({
        assigned_to_email: null,
        metadata: nextMeta,
        updated_at: nowIso,
      })
      .eq('id', thread.id)
      .select('*')
      .single()

    return {
      action: 'escalated_human' as const,
      reason,
      thread: (updated as InboxThreadRecord) || { ...thread, assigned_to_email: null, metadata: nextMeta },
    }
  }

  // 1. Instant deterministic escalation if the client explicitly asks for a human
  if (detectExplicitHumanRequest(latestText)) {
    return await escalateToHuman('Client requested to speak with a human agent.')
  }

  // 2. Ask OpenAI to either answer helpfully OR escalate to a human if uncertain/complex
  const openaiKey = process.env.OPENAI_API_KEY
  const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const orgLabel = organizationName || thread.organization_slug

  let canHandle = true
  let aiReplyText = ''
  let escalationReason = ''

  if (openaiKey) {
    try {
      const transcript = recentMessages
        .slice(-10)
        .map((m) => `${m.direction === 'inbound' ? 'Client' : m.sender_name}: ${m.body}`)
        .join('\n')

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: openaiModel,
          temperature: 0.4,
          max_tokens: 350,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `You are the first-line AI Marketing & Customer Support Assistant for "${orgLabel}" responding on ${thread.channel} (${thread.thread_type}).
Return strict JSON with keys:
- "canHandle": boolean (set false if the client wants a human/agent, has a billing dispute, angry complaint, complex custom quote, sensitive personal/account request, or asks specific facts you do not know)
- "reply": string (short, warm, natural 1-3 sentence response if canHandle is true; empty string if false)
- "escalationReason": string (short reason why a human should step in if canHandle is false; empty string if true)`,
            },
            {
              role: 'user',
              content: `Contact: ${thread.contact_name}\n${
                thread.post_reference_title ? `Post/Video: ${thread.post_reference_title}\n` : ''
              }Recent conversation:\n${transcript || latestText}`,
            },
          ],
        }),
      })

      const json = await res.json().catch(() => ({}))
      const content = json?.choices?.[0]?.message?.content || '{}'
      const parsed = JSON.parse(content)
      canHandle = Boolean(parsed.canHandle)
      aiReplyText = String(parsed.reply || '').trim()
      escalationReason = String(parsed.escalationReason || '').trim()
    } catch (err) {
      console.warn('[Inbox AI Handler] OpenAI evaluation error:', err)
      return await escalateToHuman('AI could not safely evaluate this message — delegated to human.')
    }
  } else {
    // Without OPENAI_API_KEY configured, escalate gracefully rather than sending a generic robotic reply
    return await escalateToHuman('AI auto-reply key not configured — delegated to human.')
  }

  if (!canHandle || !aiReplyText) {
    return await escalateToHuman(
      escalationReason || 'AI sensed this conversation needs a human team member.'
    )
  }

  // 3. Dispatch AI reply to the originating channel & persist with bot identity
  const dispatch = await dispatchInboxReply(db, thread, aiReplyText)
  const { data: savedMsg } = await db
    .from('marketing_inbox_messages')
    .insert({
      thread_id: thread.id,
      organization_slug: thread.organization_slug,
      channel: thread.channel,
      external_message_id: dispatch.externalMessageId,
      direction: 'outbound',
      sender_name: 'AI Bot',
      sender_id: 'ai-bot',
      body: aiReplyText,
      sent_at: nowIso,
      sent_by_email: 'ai-bot@cillah.dev',
      delivery_status: dispatch.deliveryStatus,
      error_message: dispatch.errorMessage || null,
    })
    .select('*')
    .single()

  const nextMeta = {
    ...(thread.metadata || {}),
    handler_mode: 'ai' as InboxHandlerMode,
    assigned_to_name: null,
    human_requested_reason: null,
  }

  const { data: updatedThread } = await db
    .from('marketing_inbox_threads')
    .update({
      assigned_to_email: null,
      last_message_preview: aiReplyText.slice(0, 280),
      last_message_at: nowIso,
      unread_count: 0,
      metadata: nextMeta,
      updated_at: nowIso,
    })
    .eq('id', thread.id)
    .select('*')
    .single()

  return {
    action: 'replied',
    message: savedMsg as InboxMessageRecord,
    thread: (updatedThread as InboxThreadRecord) || thread,
  }
}
