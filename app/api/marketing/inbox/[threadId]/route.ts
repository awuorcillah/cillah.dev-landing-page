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

  if (!['open', 'resolved', 'archived'].includes(nextStatus)) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
  }

  const { context, supabase, error, status } = await resolveMarketingAuth(orgSlug)
  if (!context) {
    return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 })
  }

  const db = getServiceRoleClient() || supabase
  const { data, error: updateErr } = await db
    .from('marketing_inbox_threads')
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq('id', threadId)
    .eq('organization_slug', orgSlug)
    .select('*')
    .single()

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({ thread: data })
}
