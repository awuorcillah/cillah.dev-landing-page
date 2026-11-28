import { NextRequest, NextResponse } from 'next/server'
import { resolveMarketingAuth, getServiceRoleClient } from '@/lib/marketing-auth'
import { dispatchInboxReply, type InboxThreadRecord } from '@/lib/social-inbox'

export async function POST(
  request: NextRequest,
  routeContext: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await routeContext.params
    const body = await request.json().catch(() => ({}))
    const orgSlug = String(body.organization_slug || 'cillah-dev')
    const replyText = String(body.text || '').trim()

    if (!replyText) {
      return NextResponse.json({ error: 'Message text cannot be empty.' }, { status: 400 })
    }

    const { context, supabase, error, status } = await resolveMarketingAuth(orgSlug)
    if (!context) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 })
    }

    if (!context.permissions.canUploadAndDraft) {
      return NextResponse.json(
        { error: 'Read-only Analysts cannot send social replies.' },
        { status: 403 }
      )
    }

    const db = getServiceRoleClient() || supabase
    const { data: thread, error: threadErr } = await db
      .from('marketing_inbox_threads')
      .select('*')
      .eq('id', threadId)
      .eq('organization_slug', orgSlug)
      .maybeSingle()

    if (threadErr || !thread) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 })
    }

    const dispatch = await dispatchInboxReply(db, thread as InboxThreadRecord, replyText)
    const nowIso = new Date().toISOString()

    const { data: savedMsg, error: insertErr } = await db
      .from('marketing_inbox_messages')
      .insert({
        thread_id: thread.id,
        organization_slug: orgSlug,
        channel: thread.channel,
        external_message_id: dispatch.externalMessageId,
        direction: 'outbound',
        sender_name: context.fullName || context.email.split('@')[0],
        sender_id: context.userId,
        body: replyText,
        sent_at: nowIso,
        sent_by_email: context.email,
        delivery_status: dispatch.deliveryStatus,
        error_message: dispatch.errorMessage || null,
      })
      .select('*')
      .single()

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    await db
      .from('marketing_inbox_threads')
      .update({
        last_message_preview: replyText.slice(0, 280),
        last_message_at: nowIso,
        unread_count: 0,
        updated_at: nowIso,
      })
      .eq('id', thread.id)

    return NextResponse.json({
      message: savedMsg,
      deliveryStatus: dispatch.deliveryStatus,
      warning: dispatch.errorMessage || null,
    })
  } catch (err: any) {
    console.error('[Marketing Inbox Reply Error]:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to send reply.' },
      { status: 500 }
    )
  }
}
