import { NextRequest, NextResponse } from 'next/server'
import {
  resolveMarketingAuth,
  getServiceRoleClient,
  isMissingTableError,
} from '@/lib/marketing-auth'
import { syncOrganizationInbox } from '@/lib/social-inbox'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const orgSlug = String(body.organization_slug || 'cillah-dev').trim()

    const { context, supabase, error, status } = await resolveMarketingAuth(orgSlug)
    if (!context) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 })
    }

    const db = getServiceRoleClient() || supabase

    // Quick existence check so we return a clean schema_pending message if SQL hasn't run
    const { error: probeErr } = await db
      .from('marketing_inbox_threads')
      .select('id')
      .limit(1)

    if (probeErr && isMissingTableError(probeErr)) {
      return NextResponse.json(
        {
          error:
            'Run supabase/marketing_unified_inbox_schema.sql in Supabase SQL Editor first.',
          schema_pending: true,
        },
        { status: 503 }
      )
    }

    const result = await syncOrganizationInbox(db, orgSlug)

    return NextResponse.json({
      success: true,
      syncedAt: new Date().toISOString(),
      ...result,
    })
  } catch (err: any) {
    console.error('[Marketing Inbox Sync Error]:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to sync social chats.' },
      { status: 500 }
    )
  }
}
