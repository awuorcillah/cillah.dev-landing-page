-- ==============================================================================
-- NATIVE MULTI-TENANT SOCIAL OAUTH CONNECTIONS (META, LINKEDIN, YOUTUBE, TIKTOK, WHATSAPP)
-- Execute this script in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.marketing_social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_slug TEXT NOT NULL DEFAULT 'cillah-dev',
  provider TEXT NOT NULL
    CHECK (provider IN ('meta', 'linkedin', 'youtube', 'tiktok', 'whatsapp')),
  channel TEXT NOT NULL
    CHECK (channel IN ('instagram', 'facebook', 'linkedin', 'youtube', 'tiktok', 'whatsapp_status')),
  account_id TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_handle TEXT,
  account_avatar_url TEXT,
  -- Encrypted at rest with AES-256-GCM by server API (never returned to clients)
  access_token_enc TEXT NOT NULL,
  refresh_token_enc TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  connected_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'connected'
    CHECK (status IN ('connected', 'expired', 'disconnected', 'error')),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_slug, channel, account_id)
);

CREATE INDEX IF NOT EXISTS idx_social_connections_org_channel
  ON public.marketing_social_connections (organization_slug, channel, status);

-- Enable Row Level Security
ALTER TABLE public.marketing_social_connections ENABLE ROW LEVEL SECURITY;

-- Note: OAuth tokens are handled exclusively through authenticated server API routes.
-- Restrict direct Data API access to authenticated Platform Admins & Marketing Admins only.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_social_connections TO authenticated;

DROP POLICY IF EXISTS "social_connections_admin_read" ON public.marketing_social_connections;
CREATE POLICY "social_connections_admin_read"
  ON public.marketing_social_connections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND lower(p.role::text) = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.staff_members s
      WHERE lower(s.email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
        AND s.is_active = true
        AND (lower(s.role) LIKE '%marketing%' OR lower(s.role) LIKE '%ceo%' OR lower(s.status) = 'admin')
    )
  );

DROP POLICY IF EXISTS "social_connections_admin_manage" ON public.marketing_social_connections;
CREATE POLICY "social_connections_admin_manage"
  ON public.marketing_social_connections
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND lower(p.role::text) = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.marketing_role_assignments mra
      WHERE lower(mra.user_email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
        AND mra.marketing_role IN ('marketing_admin', 'publisher')
        AND mra.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND lower(p.role::text) = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.marketing_role_assignments mra
      WHERE lower(mra.user_email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
        AND mra.marketing_role IN ('marketing_admin', 'publisher')
        AND mra.is_active = true
    )
  );
