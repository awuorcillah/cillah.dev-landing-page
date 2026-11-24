import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  resolveMarketingAuth,
  getServiceRoleClient,
  isMissingTableError,
} from '@/lib/marketing-auth'

const upsertRoleSchema = z.object({
  organization_slug: z.string().default('cillah-dev'),
  user_email: z.string().email('Enter a valid team member email'),
  full_name: z.string().optional().default(''),
  marketing_role: z.enum(['marketing_admin', 'publisher', 'content_creator', 'analyst']),
  allowed_channels: z.array(z.string()).optional(),
  is_active: z.boolean().optional().default(true),
})

export async function GET(request: NextRequest) {
  const orgSlug = request.nextUrl.searchParams.get('org') || 'cillah-dev'
  const { context, supabase, error, status } = await resolveMarketingAuth(orgSlug)

  if (!context) {
    return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 })
  }

  const db = getServiceRoleClient() || supabase
  const { data: assignments, error: dbError } = await db
    .from('marketing_role_assignments')
    .select('*')
    .eq('organization_slug', orgSlug)
    .order('created_at', { ascending: true })

  if (dbError) {
    if (isMissingTableError(dbError)) {
      return NextResponse.json({
        currentUser: context,
        assignments: [],
        schema_pending: true,
      })
    }
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({
    currentUser: context,
    assignments: assignments || [],
    schema_pending: false,
  })
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json()
    const parsed = upsertRoleSchema.safeParse(rawBody)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid role assignment' },
        { status: 400 }
      )
    }

    const input = parsed.data
    const { context, supabase, error, status } = await resolveMarketingAuth(input.organization_slug)

    if (!context) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 })
    }

    if (!context.permissions.canManageRoles) {
      return NextResponse.json(
        { error: 'Only Marketing Admins or Platform Admins can manage team role tiers.' },
        { status: 403 }
      )
    }

    const db = getServiceRoleClient() || supabase
    const emailClean = input.user_email.toLowerCase().trim()

    const payload = {
      organization_slug: input.organization_slug,
      user_email: emailClean,
      full_name: input.full_name?.trim() || emailClean.split('@')[0],
      marketing_role: input.marketing_role,
      allowed_channels:
        input.allowed_channels && input.allowed_channels.length > 0
          ? input.allowed_channels
          : [
              'instagram',
              'facebook',
              'tiktok',
              'linkedin',
              'whatsapp_status',
              'youtube',
              'website_articles',
              'website_use_cases',
            ],
      is_active: input.is_active,
      assigned_by: context.email,
      updated_at: new Date().toISOString(),
    }

    const { data, error: upsertError } = await db
      .from('marketing_role_assignments')
      .upsert(payload, { onConflict: 'organization_slug,user_email' })
      .select('*')
      .single()

    if (upsertError) {
      if (isMissingTableError(upsertError)) {
        return NextResponse.json(
          {
            error:
              'Run supabase/marketing_hub_schema.sql in Supabase SQL Editor to enable persistent role management.',
            schema_pending: true,
          },
          { status: 503 }
        )
      }
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({ assignment: data })
  } catch (err: any) {
    console.error('[Marketing Roles Upsert Error]:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to save role assignment.' },
      { status: 500 }
    )
  }
}
