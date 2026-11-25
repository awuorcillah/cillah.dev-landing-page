import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getServiceRoleClient } from '@/lib/marketing-auth'
import { dispatchToConnectedSocialChannels } from '@/lib/social-publishers'

function isAuthorizedCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const authHeader = request.headers.get('authorization') || ''
  return authHeader === `Bearer ${secret}`
}

async function runScheduledPublisher() {
  const db = getServiceRoleClient()
  if (!db) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY is required for scheduled publishing.' },
      { status: 500 }
    )
  }

  const nowIso = new Date().toISOString()
  const { data: duePosts, error } = await db
    .from('marketing_posts')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', nowIso)
    .order('scheduled_at', { ascending: true })
    .limit(25)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!duePosts || duePosts.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No due scheduled posts.' })
  }

  const results: { postId: string; org: string; status: string }[] = []

  for (const post of duePosts) {
    const channels: string[] = Array.isArray(post.channels) ? post.channels : []
    const socialStatuses = await dispatchToConnectedSocialChannels(
      db,
      post.organization_slug || 'cillah-dev',
      channels,
      {
        title: post.title,
        caption: post.caption,
        hashtags: post.hashtags,
        cta_url: post.cta_url,
        media_files: post.media_files || [],
      }
    )

    const mergedStatuses: Record<string, any> = {
      ...(post.channel_statuses || {}),
      ...socialStatuses,
    }

    if (channels.includes('website_articles') && post.website_slug) {
      mergedStatuses.website_articles = {
        state: 'live',
        url: `/articles/${post.website_slug}`,
        note: 'Published live to /articles',
        updated_at: nowIso,
      }
    }
    if (channels.includes('website_use_cases') && post.website_slug) {
      mergedStatuses.website_use_cases = {
        state: 'live',
        url: `/use-cases/${post.website_slug}`,
        note: 'Published live to /use-cases',
        updated_at: nowIso,
      }
    }

    await db
      .from('marketing_posts')
      .update({
        status: 'published',
        published_at: nowIso,
        channel_statuses: mergedStatuses,
        updated_at: nowIso,
      })
      .eq('id', post.id)

    if (channels.includes('website_articles')) {
      revalidatePath('/articles')
      if (post.website_slug) revalidatePath(`/articles/${post.website_slug}`)
    }
    if (channels.includes('website_use_cases')) {
      revalidatePath('/use-cases')
      if (post.website_slug) revalidatePath(`/use-cases/${post.website_slug}`)
    }

    results.push({
      postId: post.id,
      org: post.organization_slug,
      status: 'published',
    })
  }

  return NextResponse.json({
    processed: results.length,
    results,
  })
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runScheduledPublisher()
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runScheduledPublisher()
}
