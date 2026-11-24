import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  resolveMarketingAuth,
  getServiceRoleClient,
  isMissingTableError,
} from '@/lib/marketing-auth'
import { encryptToken } from '@/lib/social-crypto'

const whatsappConnectSchema = z.object({
  organization_slug: z.string().default('cillah-dev'),
  account_name: z.string().trim().min(2, 'Enter a WhatsApp Business label'),
  phone_number: z.string().trim().min(7, 'Enter your WhatsApp phone number'),
  gateway_url: z.string().url('Enter a valid gateway URL').optional().or(z.literal('')),
  gateway_token: z.string().optional().default(''),
})

function resolveOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  if (process.env.NODE_ENV === 'production' && forwardedHost) {
    return `https://${forwardedHost}`
  }
  return new URL(request.url).origin
}

export async function GET(request: NextRequest) {
  const orgSlug = request.nextUrl.searchParams.get('org') || 'cillah-dev'
  const { context, supabase, error, status } = await resolveMarketingAuth(orgSlug)

  if (!context) {
    return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 })
  }

  const origin = resolveOrigin(request)
  const providerConfig = {
    meta: {
      configured: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
      callbackUrl: `${origin}/api/marketing/oauth/meta/callback`,
      requiredEnv: ['META_APP_ID', 'META_APP_SECRET'],
      portalUrl: 'https://developers.facebook.com/apps/',
    },
    linkedin: {
      configured: Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
      callbackUrl: `${origin}/api/marketing/oauth/linkedin/callback`,
      requiredEnv: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'],
      portalUrl: 'https://www.linkedin.com/developers/apps',
    },
    youtube: {
      configured: Boolean(
        (process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID) &&
          (process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET)
      ),
      callbackUrl: `${origin}/api/marketing/oauth/youtube/callback`,
      requiredEnv: ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET'],
      portalUrl: 'https://console.cloud.google.com/apis/credentials',
    },
    tiktok: {
      configured: Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET),
      callbackUrl: `${origin}/api/marketing/oauth/tiktok/callback`,
      requiredEnv: ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET'],
      portalUrl: 'https://developers.tiktok.com/apps/',
    },
  }

  const db = getServiceRoleClient() || supabase
  const { data, error: dbError } = await db
    .from('marketing_social_connections')
    .select(
      'id, organization_slug, provider, channel, account_id, account_name, account_handle, account_avatar_url, token_expires_at, scopes, connected_by, status, last_error, created_at, updated_at'
    )
    .eq('organization_slug', orgSlug)
    .order('created_at', { ascending: false })

  if (dbError) {
    if (isMissingTableError(dbError)) {
      return NextResponse.json({
        connections: [],
        providerConfig,
        schema_pending: true,
      })
    }
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({
    connections: data || [],
    providerConfig,
    schema_pending: false,
  })
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json()
    const parsed = whatsappConnectSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid WhatsApp connection details' },
        { status: 400 }
      )
    }

    const input = parsed.data
    const { context, supabase, error, status } = await resolveMarketingAuth(
      input.organization_slug
    )
    if (!context) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 })
    }
    if (!context.permissions.canPublishDirectly) {
      return NextResponse.json(
        { error: 'Only Marketing Admins or Publishers can connect channels.' },
        { status: 403 }
      )
    }

    const db = getServiceRoleClient() || supabase
    const { data, error: upsertError } = await db
      .from('marketing_social_connections')
      .upsert(
        {
          organization_slug: input.organization_slug,
          provider: 'whatsapp',
          channel: 'whatsapp_status',
          account_id: input.phone_number.replace(/\s+/g, ''),
          account_name: input.account_name,
          account_handle: input.phone_number,
          access_token_enc: encryptToken(input.gateway_token || 'mobile_share_mode'),
          scopes: input.gateway_url ? ['status_gateway_api'] : ['mobile_share_ready'],
          metadata: {
            gateway_url: input.gateway_url || null,
            mode: input.gateway_url ? 'gateway' : 'mobile_share',
          },
          connected_by: context.email,
          status: 'connected',
          last_error: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'organization_slug,channel,account_id' }
      )
      .select(
        'id, organization_slug, provider, channel, account_id, account_name, account_handle, status, updated_at'
      )
      .single()

    if (upsertError) {
      if (isMissingTableError(upsertError)) {
        return NextResponse.json(
          {
            error:
              'Run supabase/marketing_social_connections.sql in Supabase SQL Editor first.',
            schema_pending: true,
          },
          { status: 503 }
        )
      }
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({ connection: data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to save WhatsApp connection.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  const orgSlug = request.nextUrl.searchParams.get('org') || 'cillah-dev'

  if (!id) {
    return NextResponse.json({ error: 'Connection id is required.' }, { status: 400 })
  }

  const { context, supabase, error, status } = await resolveMarketingAuth(orgSlug)
  if (!context) {
    return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 })
  }

  if (!context.permissions.canPublishDirectly) {
    return NextResponse.json(
      { error: 'Only Marketing Admins or Publishers can disconnect social accounts.' },
      { status: 403 }
    )
  }

  const db = getServiceRoleClient() || supabase
  const { error: delErr } = await db
    .from('marketing_social_connections')
    .delete()
    .eq('id', id)
    .eq('organization_slug', orgSlug)

  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 })
  }

  return NextResponse.json({ deleted: true, id })
}
