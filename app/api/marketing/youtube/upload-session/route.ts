import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  resolveMarketingAuth,
  getServiceRoleClient,
} from '@/lib/marketing-auth'
import {
  refreshYouTubeAccessToken,
  type SocialConnectionRow,
} from '@/lib/social-publishers'

const createSessionSchema = z.object({
  organization_slug: z.string().default('cillah-dev'),
  title: z.string().trim().min(1, 'Video title is required').max(100),
  description: z.string().optional().default(''),
  hashtags: z.string().optional().default(''),
  cta_url: z.string().optional().default(''),
  mime_type: z.string().min(1).default('video/mp4'),
  size_bytes: z.number().positive('Video file size must be greater than 0'),
  publish_mode: z.enum(['now', 'schedule']).default('now'),
  scheduled_at: z.string().nullable().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json()
    const parsed = createSessionSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid upload session request.' },
        { status: 400 }
      )
    }

    const input = parsed.data
    const { context, supabase, error, status } = await resolveMarketingAuth(input.organization_slug)
    if (!context) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 })
    }

    if (input.publish_mode === 'now' && !context.permissions.canPublishDirectly) {
      return NextResponse.json(
        { error: 'Only Marketing Admins or Publishers can upload directly to YouTube.' },
        { status: 403 }
      )
    }
    if (input.publish_mode === 'schedule' && !context.permissions.canSchedule) {
      return NextResponse.json(
        { error: 'Only Marketing Admins or Publishers can schedule YouTube uploads.' },
        { status: 403 }
      )
    }

    const db = getServiceRoleClient() || supabase
    const { data: conn, error: connErr } = await db
      .from('marketing_social_connections')
      .select('*')
      .eq('organization_slug', input.organization_slug)
      .eq('channel', 'youtube')
      .eq('status', 'connected')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (connErr) {
      return NextResponse.json({ error: connErr.message }, { status: 500 })
    }
    if (!conn) {
      return NextResponse.json(
        { error: 'YouTube is not connected yet. Open Connected Accounts to link your YouTube channel.' },
        { status: 400 }
      )
    }

    const accessToken = await refreshYouTubeAccessToken(conn as SocialConnectionRow, db)
    if (!accessToken) {
      return NextResponse.json(
        { error: 'YouTube OAuth token expired. Please reconnect YouTube in Connected Accounts.' },
        { status: 401 }
      )
    }

    const descParts = [input.description.trim()]
    if (input.hashtags.trim()) descParts.push(input.hashtags.trim())
    if (input.cta_url.trim()) descParts.push(input.cta_url.trim())
    const fullDescription = descParts.filter(Boolean).join('\n\n').slice(0, 5000)

    const tags = input.hashtags
      .split(/[\s,#]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 15)

    const scheduledDate = input.scheduled_at ? new Date(input.scheduled_at) : null
    const isNativeScheduled =
      input.publish_mode === 'schedule' &&
      scheduledDate !== null &&
      !Number.isNaN(scheduledDate.getTime()) &&
      scheduledDate.getTime() > Date.now() + 60_000

    const metadata = {
      snippet: {
        title: input.title.slice(0, 100),
        description: fullDescription,
        tags,
      },
      status: isNativeScheduled
        ? {
            privacyStatus: 'private',
            publishAt: scheduledDate!.toISOString(),
          }
        : {
            privacyStatus: 'public',
          },
    }

    // Pass the browser's Origin header so Google attaches CORS headers to the returned resumable upload URL
    const requestOrigin =
      request.headers.get('origin') ||
      (request.headers.get('x-forwarded-host')
        ? `https://${request.headers.get('x-forwarded-host')}`
        : new URL(request.url).origin)

    const initRes = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          Origin: requestOrigin,
          'X-Upload-Content-Length': String(Math.round(input.size_bytes)),
          'X-Upload-Content-Type': input.mime_type,
        },
        body: JSON.stringify(metadata),
      }
    )

    const uploadUrl = initRes.headers.get('location')
    if (!initRes.ok || !uploadUrl) {
      const errJson = await initRes.json().catch(() => ({}))
      return NextResponse.json(
        {
          error:
            errJson?.error?.message ||
            `Could not start YouTube upload session (HTTP ${initRes.status}).`,
        },
        { status: initRes.status >= 400 ? initRes.status : 502 }
      )
    }

    return NextResponse.json({
      uploadUrl,
      channelName: conn.account_name,
      scheduled: isNativeScheduled,
      publishAt: isNativeScheduled ? scheduledDate!.toISOString() : null,
    })
  } catch (err: any) {
    console.error('[YouTube Upload Session Error]:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to initialize YouTube resumable upload.' },
      { status: 500 }
    )
  }
}
