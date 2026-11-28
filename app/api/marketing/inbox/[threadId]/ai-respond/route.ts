import { NextRequest, NextResponse } from 'next/server'
import { resolveMarketingAuth, getServiceRoleClient } from '@/lib/marketing-auth'
import { evaluateAndHandleInboxWithAI } from '@/lib/inbox-ai-handler'
import type { InboxMessageRecord, InboxThreadRecord } from '@/lib/social-inbox'

export async function POST(
  request: NextRequest,
  routeContext: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await routeContext.params
    const body = await request.json().catch(() => ({}))
    const orgSlug = String(body.organization_slug || 'cillah-dev')

    const { context, supabase, error, status } = await resolveMarketingAuth(orgSlug)
    if (!context) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 })
    }

    const db = getServiceRoleClient() || supabase
    const [{ data: thread }, { data: messages }, { data: orgRow }] = await Promise.all([
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
      db.from('organizations').select('name').eq('slug', orgSlug).maybeSingle(),
    ])

    if (!thread) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 })
    }

    const result = await evaluateAndHandleInboxWithAI({
      db,
      thread: thread as InboxThreadRecord,
      recentMessages: (messages || []) as InboxMessageRecord[],
      organizationName: orgRow?.name || orgSlug,
    })

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('[Marketing Inbox AI Respond Error]:', err)
    return NextResponse.json(
      { error: err?.message || 'AI handler failed.' },
      { status: 500 }
    )
  }
}
