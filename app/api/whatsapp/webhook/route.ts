import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWhatsAppTextMessage } from '@/lib/whatsapp'
import {
  evaluateAndHandleInboxWithAI,
  getThreadHandlerInfo,
} from '@/lib/inbox-ai-handler'
import type { InboxMessageRecord, InboxThreadRecord } from '@/lib/social-inbox'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hastygfosgyxrxzrzrur.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * GET Handler for Meta Webhook Verification
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'cillah_whatsapp_token_2026'

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WhatsApp Webhook] Webhook verified successfully!')
    return new Response(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

/**
 * POST Handler for Meta Webhook Events (Button clicks from clients on WhatsApp)
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const body = await request.json()

    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const message = value?.messages?.[0]
    const contact = value?.contacts?.[0]

    // Capture every inbound WhatsApp message into the Unified Marketing Inbox (non-blocking)
    if (message && message.from) {
      try {
        const fromPhone = String(message.from).trim()
        const contactName = String(contact?.profile?.name || fromPhone)
        const textBody =
          message.text?.body ||
          message.interactive?.button_reply?.title ||
          message.button?.text ||
          (message.type ? `[${message.type} message]` : '')

        if (textBody) {
          const sentAtIso = message.timestamp
            ? new Date(Number(message.timestamp) * 1000).toISOString()
            : new Date().toISOString()
          const nowIso = new Date().toISOString()
          const extThreadId = `wa-${fromPhone}`

          const { data: existingThread } = await supabase
            .from('marketing_inbox_threads')
            .select('id, unread_count')
            .eq('organization_slug', 'cillah-dev')
            .eq('channel', 'whatsapp')
            .eq('external_thread_id', extThreadId)
            .maybeSingle()

          const { data: savedThread } = await supabase
            .from('marketing_inbox_threads')
            .upsert(
              {
                organization_slug: 'cillah-dev',
                channel: 'whatsapp',
                thread_type: 'dm',
                external_thread_id: extThreadId,
                external_account_id: value?.metadata?.phone_number_id || null,
                contact_id: fromPhone,
                contact_name: contactName,
                contact_handle: `+${fromPhone.replace(/^\+/, '')}`,
                last_message_preview: textBody.slice(0, 280),
                last_message_at: sentAtIso,
                unread_count: Number(existingThread?.unread_count || 0) + 1,
                status: 'open',
                updated_at: nowIso,
              },
              { onConflict: 'organization_slug,channel,external_thread_id' }
            )
            .select('*')
            .single()

          if (savedThread?.id) {
            await supabase.from('marketing_inbox_messages').upsert(
              {
                thread_id: savedThread.id,
                organization_slug: 'cillah-dev',
                channel: 'whatsapp',
                external_message_id: String(message.id || `wa-msg-${Date.now()}`),
                direction: 'inbound',
                sender_name: contactName,
                sender_id: fromPhone,
                body: textBody,
                sent_at: sentAtIso,
                delivery_status: 'delivered',
              },
              {
                onConflict: 'organization_slug,channel,external_message_id',
                ignoreDuplicates: true,
              }
            )

            // AI-first handling for regular text messages (never override a human agent!)
            const handlerInfo = getThreadHandlerInfo(savedThread as InboxThreadRecord)
            if (message.type === 'text' && handlerInfo.mode === 'ai') {
              const { data: recentMsgs } = await supabase
                .from('marketing_inbox_messages')
                .select('*')
                .eq('thread_id', savedThread.id)
                .order('sent_at', { ascending: true })
                .limit(12)

              await evaluateAndHandleInboxWithAI({
                db: supabase,
                thread: savedThread as InboxThreadRecord,
                recentMessages: (recentMsgs || []) as InboxMessageRecord[],
                organizationName: 'cillah.dev',
              })
            }
          }
        }
      } catch (inboxErr) {
        console.warn('[WhatsApp Webhook] Unified inbox capture skipped:', inboxErr)
      }
    }

    if (message && message.type === 'interactive' && message.interactive?.button_reply) {
      const buttonId = message.interactive.button_reply.id // e.g. "proceed_BK-123" or "cancel_BK-123"
      const fromPhone = message.from // Client's WhatsApp number

      console.log(`[WhatsApp Webhook] Received button reply: ${buttonId} from ${fromPhone}`)

      if (buttonId.startsWith('proceed_')) {
        const bookingId = buttonId.replace('proceed_', '')

        // Update booking in Supabase
        await supabase
          .from('bookings')
          .update({
            status: 'confirmed',
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingId)

        // Send confirmation reply on WhatsApp
        await sendWhatsAppTextMessage({
          to: fromPhone,
          text: `🎉 Thank you! Your AI Automation consultation meeting has been confirmed. We look forward to speaking with you!`
        })
      } else if (buttonId.startsWith('cancel_')) {
        const bookingId = buttonId.replace('cancel_', '')

        // Update booking in Supabase
        await supabase
          .from('bookings')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingId)

        // Send cancellation reply on WhatsApp
        await sendWhatsAppTextMessage({
          to: fromPhone,
          text: `👍 Your appointment has been cancelled and the time slot is now opened for others. Thank you for letting us know!`
        })
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (err: any) {
    console.error('[WhatsApp Webhook Error]:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
