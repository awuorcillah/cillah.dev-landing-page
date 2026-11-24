import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  resolveMarketingAuth,
  getServiceRoleClient,
  isMissingTableError,
} from '@/lib/marketing-auth'
import {
  ACTIVE_MARKETING_CHANNELS,
  slugifyTitle,
  type ChannelDeliveryStatus,
  type MarketingChannelId,
  type MarketingPostStatus,
} from '@/lib/marketing-config'
import { dispatchToConnectedSocialChannels } from '@/lib/social-publishers'

const validChannelIds = ACTIVE_MARKETING_CHANNELS.map((c) => c.id)

const mediaFileSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  path: z.string().min(1),
  mime_type: z.string().min(1),
  size_bytes: z.number().nonnegative(),
  kind: z.enum(['image', 'video', 'document']),
})

const createPostSchema = z.object({
  organization_slug: z.string().default('cillah-dev'),
  title: z.string().trim().min(2, 'Please provide a post title or headline').max(220),
  caption: z.string().trim().min(3, 'Please write your caption or article content'),
  hashtags: z.string().optional().default(''),
  cta_url: z.string().optional().default(''),
  channels: z
    .array(z.string())
    .min(1, 'Select at least one publishing channel')
    .refine(
      (list) => list.every((ch) => validChannelIds.includes(ch as MarketingChannelId)),
      'One or more selected channels are not supported'
    ),
  media_files: z.array(mediaFileSchema).optional().default([]),
  publish_mode: z.enum(['now', 'schedule', 'draft']).default('now'),
  scheduled_at: z.string().nullable().optional(),
  website_slug: z.string().optional().default(''),
  website_teaser: z.string().optional().default(''),
  website_category: z.string().optional().default('Marketing & Automation'),
  website_read_time: z.string().optional().default('4 min read'),
  website_featured: z.boolean().optional().default(false),
})

const patchPostSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(['approve_and_publish', 'approve_and_schedule', 'publish_now', 'move_to_draft']),
  scheduled_at: z.string().nullable().optional(),
})

function buildChannelStatuses(
  channels: string[],
  finalStatus: MarketingPostStatus,
  websiteSlug: string | null,
  webhookConfigured: boolean
): Record<string, ChannelDeliveryStatus> {
  const now = new Date().toISOString()
  const statuses: Record<string, ChannelDeliveryStatus> = {}

  for (const channel of channels) {
    const isWebsiteArticle = channel === 'website_articles'
    const isWebsiteUseCase = channel === 'website_use_cases'

    if (finalStatus === 'draft') {
      statuses[channel] = { state: 'draft', note: 'Saved as draft', updated_at: now }
    } else if (finalStatus === 'pending_approval') {
      statuses[channel] = {
        state: 'pending_approval',
        note: 'Awaiting Marketing Admin approval',
        updated_at: now,
      }
    } else if (finalStatus === 'scheduled') {
      statuses[channel] = {
        state: 'scheduled',
        url: isWebsiteArticle && websiteSlug
          ? `/articles/${websiteSlug}`
          : isWebsiteUseCase && websiteSlug
          ? `/use-cases/${websiteSlug}`
          : undefined,
        note: 'Scheduled in publishing queue',
        updated_at: now,
      }
    } else if (finalStatus === 'published') {
      if (isWebsiteArticle && websiteSlug) {
        statuses[channel] = {
          state: 'live',
          url: `/articles/${websiteSlug}`,
          note: 'Published live to /articles',
          updated_at: now,
        }
      } else if (isWebsiteUseCase && websiteSlug) {
        statuses[channel] = {
          state: 'live',
          url: `/use-cases/${websiteSlug}`,
          note: 'Published live to /use-cases',
          updated_at: now,
        }
      } else {
        statuses[channel] = {
          state: webhookConfigured ? 'dispatched' : 'queued_webhook',
          note: webhookConfigured
            ? 'Dispatched to connected n8n social publisher'
            : 'Saved & ready — connect n8n social webhook to auto-push live',
          updated_at: now,
        }
      }
    }
  }

  return statuses
}

async function dispatchSocialWebhookIfConfigured(post: any) {
  const webhookUrl = process.env.MARKETING_PUBLISH_WEBHOOK_URL
  if (!webhookUrl) return false

  const socialChannels = (post.channels || []).filter(
    (c: string) => c !== 'website_articles' && c !== 'website_use_cases'
  )
  if (socialChannels.length === 0) return false

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'marketing_post.publish',
        post_id: post.id,
        organization_slug: post.organization_slug,
        title: post.title,
        caption: post.caption,
        hashtags: post.hashtags,
        cta_url: post.cta_url,
        channels: socialChannels,
        media_files: post.media_files,
        status: post.status,
        scheduled_at: post.scheduled_at,
        author_email: post.author_email,
        published_at: post.published_at,
      }),
    })
    return true
  } catch (err) {
    console.error('[Marketing Webhook Dispatch Error]:', err)
    return false
  }
}

export async function GET(request: NextRequest) {
  const orgSlug = request.nextUrl.searchParams.get('org') || 'cillah-dev'
  const statusFilter = request.nextUrl.searchParams.get('status') || 'all'
  const channelFilter = request.nextUrl.searchParams.get('channel') || 'all'

  const { context, supabase, error, status } = await resolveMarketingAuth(orgSlug)
  if (!context) {
    return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 })
  }

  const db = getServiceRoleClient() || supabase
  let query = db
    .from('marketing_posts')
    .select('*')
    .eq('organization_slug', orgSlug)
    .order('created_at', { ascending: false })
    .limit(100)

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }
  if (channelFilter !== 'all') {
    query = query.contains('channels', [channelFilter])
  }

  const { data: posts, error: dbError } = await query

  if (dbError) {
    if (isMissingTableError(dbError)) {
      return NextResponse.json({
        posts: [],
        roleContext: context,
        schema_pending: true,
        message: 'Run supabase/marketing_hub_schema.sql in Supabase SQL Editor to activate persistent posts.',
      })
    }
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({
    posts: posts || [],
    roleContext: context,
    schema_pending: false,
  })
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json()
    const parsed = createPostSchema.safeParse(rawBody)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid post payload' },
        { status: 400 }
      )
    }

    const input = parsed.data
    const { context, supabase, error, status } = await resolveMarketingAuth(input.organization_slug)

    if (!context) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 })
    }

    if (!context.permissions.canUploadAndDraft) {
      return NextResponse.json(
        {
          error: `Role "${context.permissions.label}" is read-only (Insights only) and cannot create or publish posts.`,
        },
        { status: 403 }
      )
    }

    if (input.publish_mode === 'schedule' && !input.scheduled_at) {
      return NextResponse.json(
        { error: 'Please select a date and time for your scheduled post.' },
        { status: 400 }
      )
    }

    // Server-side RBAC enforcement:
    // Content Creators cannot directly publish or schedule — automatically routed to pending_approval
    let finalStatus: MarketingPostStatus = 'draft'
    let roleNotice: string | null = null

    if (input.publish_mode === 'draft') {
      finalStatus = 'draft'
    } else if (input.publish_mode === 'now') {
      if (context.permissions.canPublishDirectly) {
        finalStatus = 'published'
      } else {
        finalStatus = 'pending_approval'
        roleNotice = 'Submitted for Marketing Admin approval (Content Creator tier).'
      }
    } else if (input.publish_mode === 'schedule') {
      if (context.permissions.canSchedule) {
        finalStatus = 'scheduled'
      } else {
        finalStatus = 'pending_approval'
        roleNotice = 'Scheduled draft submitted for Marketing Admin approval.'
      }
    }

    const includesWebsite =
      input.channels.includes('website_articles') ||
      input.channels.includes('website_use_cases')

    const websiteSlug = includesWebsite
      ? slugifyTitle(input.website_slug || input.title)
      : null

    const webhookConfigured = Boolean(process.env.MARKETING_PUBLISH_WEBHOOK_URL)
    const nowIso = new Date().toISOString()
    const channelStatuses = buildChannelStatuses(
      input.channels,
      finalStatus,
      websiteSlug,
      webhookConfigured
    )

    const db = getServiceRoleClient() || supabase
    const insertPayload = {
      organization_slug: input.organization_slug,
      author_id: context.userId,
      author_email: context.email,
      author_name: context.fullName,
      title: input.title,
      caption: input.caption,
      hashtags: input.hashtags || null,
      cta_url: input.cta_url || null,
      channels: input.channels,
      media_files: input.media_files,
      status: finalStatus,
      publish_mode: input.publish_mode,
      scheduled_at: input.scheduled_at ? new Date(input.scheduled_at).toISOString() : null,
      published_at: finalStatus === 'published' ? nowIso : null,
      approved_by: finalStatus === 'published' || finalStatus === 'scheduled' ? context.email : null,
      approved_at: finalStatus === 'published' || finalStatus === 'scheduled' ? nowIso : null,
      website_slug: websiteSlug,
      website_teaser:
        input.website_teaser ||
        (includesWebsite ? input.caption.slice(0, 180) : null),
      website_category: input.website_category || 'Marketing & Automation',
      website_read_time: input.website_read_time || '4 min read',
      website_featured: Boolean(input.website_featured),
      channel_statuses: channelStatuses,
      updated_at: nowIso,
    }

    const { data: created, error: insertError } = await db
      .from('marketing_posts')
      .insert(insertPayload)
      .select('*')
      .single()

    if (insertError) {
      if (isMissingTableError(insertError)) {
        return NextResponse.json(
          {
            error:
              'Marketing database tables are not created yet. Run supabase/marketing_hub_schema.sql in your Supabase SQL Editor first.',
            schema_pending: true,
          },
          { status: 503 }
        )
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    let finalPost = created
    if (finalStatus === 'published') {
      const [socialResults] = await Promise.all([
        dispatchToConnectedSocialChannels(db, input.organization_slug, input.channels, {
          title: created.title,
          caption: created.caption,
          hashtags: created.hashtags,
          cta_url: created.cta_url,
          media_files: created.media_files || [],
        }),
        dispatchSocialWebhookIfConfigured(created),
      ])

      if (Object.keys(socialResults).length > 0) {
        const mergedStatuses = {
          ...(created.channel_statuses || {}),
          ...socialResults,
        }
        const { data: synced } = await db
          .from('marketing_posts')
          .update({ channel_statuses: mergedStatuses, updated_at: new Date().toISOString() })
          .eq('id', created.id)
          .select('*')
          .single()
        if (synced) finalPost = synced
      }

      if (input.channels.includes('website_articles')) {
        revalidatePath('/articles')
        if (websiteSlug) revalidatePath(`/articles/${websiteSlug}`)
      }
      if (input.channels.includes('website_use_cases')) {
        revalidatePath('/use-cases')
        if (websiteSlug) revalidatePath(`/use-cases/${websiteSlug}`)
      }
    }

    return NextResponse.json(
      {
        post: finalPost,
        roleNotice,
      },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('[Marketing Create Post Error]:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to save marketing post.' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const rawBody = await request.json()
    const parsed = patchPostSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid update payload' },
        { status: 400 }
      )
    }

    const orgSlug = request.nextUrl.searchParams.get('org') || 'cillah-dev'
    const { context, supabase, error, status } = await resolveMarketingAuth(orgSlug)
    if (!context) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 })
    }

    const { id, action, scheduled_at } = parsed.data
    const db = getServiceRoleClient() || supabase

    const { data: existing, error: fetchError } = await db
      .from('marketing_posts')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
    }

    if (
      (action === 'approve_and_publish' || action === 'approve_and_schedule') &&
      !context.permissions.canApprove
    ) {
      return NextResponse.json(
        { error: 'Only Marketing Admins can approve pending posts.' },
        { status: 403 }
      )
    }

    if (action === 'publish_now' && !context.permissions.canPublishDirectly) {
      return NextResponse.json(
        { error: 'Only Marketing Admins or Publishers can publish directly.' },
        { status: 403 }
      )
    }

    const nowIso = new Date().toISOString()
    let nextStatus: MarketingPostStatus = existing.status
    const updates: Record<string, any> = { updated_at: nowIso }

    if (action === 'approve_and_publish' || action === 'publish_now') {
      nextStatus = 'published'
      updates.status = 'published'
      updates.published_at = nowIso
      updates.approved_by = context.email
      updates.approved_at = nowIso
    } else if (action === 'approve_and_schedule') {
      nextStatus = 'scheduled'
      updates.status = 'scheduled'
      updates.scheduled_at = scheduled_at
        ? new Date(scheduled_at).toISOString()
        : existing.scheduled_at || nowIso
      updates.approved_by = context.email
      updates.approved_at = nowIso
    } else if (action === 'move_to_draft') {
      nextStatus = 'draft'
      updates.status = 'draft'
    }

    updates.channel_statuses = buildChannelStatuses(
      existing.channels || [],
      nextStatus,
      existing.website_slug,
      Boolean(process.env.MARKETING_PUBLISH_WEBHOOK_URL)
    )

    const { data: updated, error: updateError } = await db
      .from('marketing_posts')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    let finalUpdated = updated
    if (nextStatus === 'published') {
      const [socialResults] = await Promise.all([
        dispatchToConnectedSocialChannels(
          db,
          updated.organization_slug || orgSlug,
          updated.channels || [],
          {
            title: updated.title,
            caption: updated.caption,
            hashtags: updated.hashtags,
            cta_url: updated.cta_url,
            media_files: updated.media_files || [],
          }
        ),
        dispatchSocialWebhookIfConfigured(updated),
      ])

      if (Object.keys(socialResults).length > 0) {
        const mergedStatuses = {
          ...(updated.channel_statuses || {}),
          ...socialResults,
        }
        const { data: synced } = await db
          .from('marketing_posts')
          .update({ channel_statuses: mergedStatuses, updated_at: new Date().toISOString() })
          .eq('id', updated.id)
          .select('*')
          .single()
        if (synced) finalUpdated = synced
      }

      if ((updated.channels || []).includes('website_articles')) {
        revalidatePath('/articles')
        if (updated.website_slug) revalidatePath(`/articles/${updated.website_slug}`)
      }
      if ((updated.channels || []).includes('website_use_cases')) {
        revalidatePath('/use-cases')
        if (updated.website_slug) revalidatePath(`/use-cases/${updated.website_slug}`)
      }
    }

    return NextResponse.json({ post: finalUpdated })
  } catch (err: any) {
    console.error('[Marketing Patch Post Error]:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to update post.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  const orgSlug = request.nextUrl.searchParams.get('org') || 'cillah-dev'

  if (!id) {
    return NextResponse.json({ error: 'Post id is required.' }, { status: 400 })
  }

  const { context, supabase, error, status } = await resolveMarketingAuth(orgSlug)
  if (!context) {
    return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 })
  }

  const db = getServiceRoleClient() || supabase
  const { data: existing } = await db
    .from('marketing_posts')
    .select('id, author_email, channels, website_slug')
    .eq('id', id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
  }

  const isOwner = existing.author_email?.toLowerCase() === context.email
  if (!isOwner && !context.permissions.canManageRoles) {
    return NextResponse.json(
      { error: 'Only the post author or a Marketing Admin can delete this post.' },
      { status: 403 }
    )
  }

  const { error: deleteError } = await db.from('marketing_posts').delete().eq('id', id)
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  if ((existing.channels || []).includes('website_articles')) revalidatePath('/articles')
  if ((existing.channels || []).includes('website_use_cases')) revalidatePath('/use-cases')

  return NextResponse.json({ deleted: true, id })
}
