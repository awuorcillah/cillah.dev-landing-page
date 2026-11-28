import { NextRequest, NextResponse } from 'next/server'
import { resolveMarketingAuth, getServiceRoleClient } from '@/lib/marketing-auth'

export async function GET(
  request: NextRequest,
  routeContext: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await routeContext.params
  const orgSlug = request.nextUrl.searchParams.get('org') || 'cillah-dev'

  const { context, supabase, error, status } = await resolveMarketingAuth(orgSlug)
  if (!context) {
    return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 })
  }

  const db = getServiceRoleClient() || supabase

  const [{ data: thread, error: threadErr }, { data: messages, error: msgErr }] = await Promise.all([
    db
      .from('marketing_inbox_threads')
      .select('*')
      .eq('id', threadId)
      .eq('organization_slug', orgSlug)
      .maybeSingle(),
    db
      .from('marketing_inbox_messages')
      .select('*')
      .eq('thread_id', threadId)
      .eq('organization_slug', orgSlug)
      .order('sent_at', { ascending: true }),
  ])

  if (threadErr || msgErr) {
    return NextResponse.json(
      { error: threadErr?.message || msgErr?.message || 'Failed to load messages' },
      { status: 500 }
    )
  }

  if (!thread) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  // Mark thread as read on open
  if (Number(thread.unread_count || 0) > 0) {
    await db
      .from('marketing_inbox_threads')
      .update({ unread_count: 0, updated_at: new Date().toISOString() })
      .eq('id', threadId)
      .eq('organization_slug', orgSlug)
  }

  return NextResponse.json({
    thread: { ...thread, unread_count: 0 },
    messages: messages || [],
  })
}

export async function PATCH(
  request: NextRequest,
  routeContext: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await routeContext.params
  const body = await request.json().catch(() => ({}))
  const orgSlug = String(body.organization_slug || 'cillah-dev')
  const nextStatus = body.status
  const nextHandlerMode = body.handler_mode as 'ai' | 'request_human' | 'human' | undefined

  if (nextStatus && !['open', 'resolved', 'archived'].includes(nextStatus)) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
  }
  if (nextHandlerMode && !['ai', 'request_human', 'human'].includes(nextHandlerMode)) {
    return NextResponse.json({ error: 'Invalid handler_mode value' }, { status: 400 })
  }
  if (!nextStatus && !nextHandlerMode) {
    return NextResponse.json({ error: 'Provide status or handler_mode to update' }, { status: 400 })
  }

  const { context, supabase, error, status } = await resolveMarketingAuth(orgSlug)
  if (!context) {
    return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 })
  }

  const db = getServiceRoleClient() || supabase
  const { data: existing } = await db
    .from('marketing_inbox_threads')
    .select('*')
    .eq('id', threadId)
    .eq('organization_slug', orgSlug)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }

  if (nextStatus) {
    updatePayload.status = nextStatus
  }

  if (nextHandlerMode) {
    const existingMeta = (existing.metadata || {}) as Record<string, any>
    const actorName = context.fullName || context.email.split('@')[0]

    if (nextHandlerMode === 'ai') {
      // Hand back to AI Bot symbol while preserving last_handled_by audit trail
      updatePayload.assigned_to_email = null
      updatePayload.metadata = {
        ...existingMeta,
        handler_mode: 'ai',
        assigned_to_name: null,
        human_requested_reason: null,
        handed_back_to_ai_by: context.email,
        handed_back_to_ai_at: new Date().toISOString(),
      }
    } else if (nextHandlerMode === 'request_human') {
      updatePayload.assigned_to_email = null
      updatePayload.metadata = {
        ...existingMeta,
        handler_mode: 'request_human',
        assigned_to_name: null,
        human_requested_reason:
          String(body.reason || '').trim() || 'Escalated for human attention.',
      }
    } else if (nextHandlerMode === 'human') {
      updatePayload.assigned_to_email = context.email
      updatePayload.metadata = {
        ...existingMeta,
        handler_mode: 'human',
        assigned_to_name: actorName,
        last_handled_by_email: context.email,
        last_handled_by_name: actorName,
        human_requested_reason: null,
      }
    }
  }

  const { data, error: updateErr } = await db
    .from('marketing_inbox_threads')
    .update(updatePayload)
    .eq('id', threadId)
    .eq('organization_slug', orgSlug)
    .select('*')
    .single()

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({ thread: data })
}
