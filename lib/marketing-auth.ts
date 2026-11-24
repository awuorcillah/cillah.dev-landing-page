import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { isAdminAccount } from '@/lib/auth-roles'
import {
  getRolePermissions,
  type MarketingChannelId,
  type MarketingRoleTier,
  type RoleTierPermissions,
} from '@/lib/marketing-config'

export interface MarketingAuthContext {
  userId: string
  email: string
  fullName: string
  isPlatformAdmin: boolean
  marketingRole: MarketingRoleTier
  permissions: RoleTierPermissions
  allowedChannels: MarketingChannelId[]
  organizationSlug: string
}

const ALL_DEFAULT_CHANNELS: MarketingChannelId[] = [
  'instagram',
  'facebook',
  'tiktok',
  'linkedin',
  'whatsapp_status',
  'youtube',
  'website_articles',
  'website_use_cases',
]

export function getServiceRoleClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '')
    .replace(/\/rest\/v1\/?$/, '')
    .replace(/\/$/, '')
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  return createSupabaseAdmin(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function resolveMarketingAuth(
  organizationSlug = 'cillah-dev'
): Promise<{
  context: MarketingAuthContext | null
  supabase: Awaited<ReturnType<typeof createServerSupabase>>
  error?: string
  status?: number
}> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user || !user.email) {
    return { context: null, supabase, error: 'Authentication required', status: 401 }
  }

  const email = user.email.toLowerCase().trim()

  const [{ data: profile }, { data: staff }, roleResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('staff_members')
      .select('full_name, role, status, is_active')
      .ilike('email', email)
      .maybeSingle(),
    supabase
      .from('marketing_role_assignments')
      .select('marketing_role, allowed_channels, is_active, full_name')
      .eq('organization_slug', organizationSlug)
      .ilike('user_email', email)
      .maybeSingle(),
  ])

  const isPlatformAdmin = isAdminAccount(email, profile?.role)
  const fullName =
    roleResult.data?.full_name ||
    staff?.full_name ||
    profile?.full_name ||
    user.user_metadata?.full_name ||
    email.split('@')[0]

  // Determine effective marketing role tier
  let marketingRole: MarketingRoleTier = 'analyst'

  if (isPlatformAdmin) {
    marketingRole = 'marketing_admin'
  } else if (roleResult.data?.is_active && roleResult.data.marketing_role) {
    marketingRole = roleResult.data.marketing_role as MarketingRoleTier
  } else if (email === 'atulah@cillah.dev') {
    marketingRole = 'marketing_admin'
  } else if (staff?.is_active) {
    const staffRoles = (staff.role || '').toLowerCase()
    if (staffRoles.includes('ceo') || staff.status === 'admin') {
      marketingRole = 'marketing_admin'
    } else if (staffRoles.includes('marketing')) {
      marketingRole = 'publisher'
    } else {
      marketingRole = 'analyst'
    }
  }

  const allowedChannels =
    Array.isArray(roleResult.data?.allowed_channels) && roleResult.data.allowed_channels.length > 0
      ? (roleResult.data.allowed_channels as MarketingChannelId[])
      : ALL_DEFAULT_CHANNELS

  return {
    supabase,
    context: {
      userId: user.id,
      email,
      fullName,
      isPlatformAdmin,
      marketingRole,
      permissions: getRolePermissions(marketingRole),
      allowedChannels,
      organizationSlug,
    },
  }
}

export function isMissingTableError(error: any): boolean {
  if (!error) return false
  const msg = String(error.message || error.details || '').toLowerCase()
  const code = String(error.code || '')
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    msg.includes('does not exist') ||
    msg.includes('could not find the table') ||
    msg.includes('schema cache')
  )
}
