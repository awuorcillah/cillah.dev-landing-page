import { NextRequest, NextResponse } from 'next/server'
import {
  resolveMarketingAuth,
  getServiceRoleClient,
  isMissingTableError,
} from '@/lib/marketing-auth'

export async function GET(request: NextRequest) {
  const orgSlug = request.nextUrl.searchParams.get('org') || 'cillah-dev'
  const channelFilter = (request.nextUrl.searchParams.get('channel') || 'all').toLowerCase()
  const statusFilter = (request.nextUrl.searchParams.get('status') || 'open').toLowerCase()
  const searchQuery = (request.nextUrl.searchParams.get('q') || '').trim().toLowerCase()

  const { context, supabase, error, status } = await resolveMarketingAuth(orgSlug)
  if (!context) {
    return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 })
  }

  const db = getServiceRoleClient() || supabase

  const [{ data: allThreads, error: threadsErr }, { data: connRows }] = await Promise.all([
    db
      .from('marketing_inbox_threads')
      .select('*')
      .eq('organization_slug', orgSlug)
      .order('last_message_at', { ascending: false })
      .limit(150),
    db
      .from('marketing_social_connections')
      .select('channel, account_name, status')
      .eq('organization_slug', orgSlug)
      .eq('status', 'connected'),
  ])

  if (threadsErr) {
    if (isMissingTableError(threadsErr)) {
      return NextResponse.json({
        threads: [],
        channelCounts: { all: 0, instagram: 0, facebook: 0, whatsapp: 0, youtube: 0 },
        unreadTotal: 0,
        connectedChannels: (connRows || []).map((c: any) => c.channel),
        schema_pending: true,
      })
    }
    return NextResponse.json({ error: threadsErr.message }, { status: 500 })
  }

  const rawThreads = allThreads || []
  const channelCounts: Record<string, number> = {
    all: 0,
    instagram: 0,
    facebook: 0,
    whatsapp: 0,
    youtube: 0,
  }
  let unreadTotal = 0

  for (const t of rawThreads) {
    if (statusFilter === 'all' || t.status === statusFilter) {
      channelCounts.all += 1
      if (channelCounts[t.channel] !== undefined) {
        channelCounts[t.channel] += 1
      }
    }
    if (t.status === 'open') {
      unreadTotal += Number(t.unread_count || 0)
    }
  }

  const filtered = rawThreads.filter((t: any) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (channelFilter !== 'all' && t.channel !== channelFilter) return false
    if (searchQuery) {
      const hay = `${t.contact_name || ''} ${t.contact_handle || ''} ${
        t.last_message_preview || ''
      } ${t.post_reference_title || ''}`.toLowerCase()
      if (!hay.includes(searchQuery)) return false
    }
    return true
  })

  return NextResponse.json({
    threads: filtered,
    channelCounts,
    unreadTotal,
    connectedChannels: (connRows || []).map((c: any) => c.channel),
    schema_pending: false,
  })
}
