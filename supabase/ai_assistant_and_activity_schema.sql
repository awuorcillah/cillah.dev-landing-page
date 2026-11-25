-- ==============================================================================
-- PERSONAL AI SALES ASSISTANT SETTINGS + AGENT ACTIVITY & CALL RECORDING LOGS
-- Execute in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- Safe & idempotent: adds agent_ai_settings and lead_activities with strict RBAC.
-- ==============================================================================

-- 1. Per-Agent AI Assistant Prompt Settings (System Prompt & User Prompt Template)
CREATE TABLE IF NOT EXISTS public.agent_ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_email TEXT NOT NULL UNIQUE,
  org_id UUID,
  assistant_name TEXT NOT NULL DEFAULT 'Personal Sales AI',
  system_prompt TEXT NOT NULL DEFAULT 'You are a concise, high-trust B2B sales and client advisory assistant. Draft polite, clear, human-sounding messages tailored to the client''s context and prior notes. Never sound robotic, keep messages brief and action-oriented, and always end with one clear next step.',
  user_prompt_template TEXT NOT NULL DEFAULT 'Using the client profile and previous notes below, write a personalized {{channel}} follow-up message from my point of view: {{instruction}}',
  preferred_tone TEXT NOT NULL DEFAULT 'executive',
  auto_scan_followups BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_ai_settings_email
  ON public.agent_ai_settings (lower(agent_email));

ALTER TABLE public.agent_ai_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agents manage own AI settings or Admins all" ON public.agent_ai_settings;
CREATE POLICY "Agents manage own AI settings or Admins all"
  ON public.agent_ai_settings
  FOR ALL
  TO authenticated
  USING (
    lower(agent_email) = lower(auth.jwt() ->> 'email')
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND lower(p.role::text) = 'admin'
    )
  )
  WITH CHECK (
    lower(agent_email) = lower(auth.jwt() ->> 'email')
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND lower(p.role::text) = 'admin'
    )
  );

-- 2. Timestamped Agent Follow-Up Activities & VoIP Call Recording Logs
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.sales_leads(id) ON DELETE CASCADE,
  org_id UUID,
  agent_email TEXT NOT NULL,
  agent_name TEXT,
  lead_name TEXT,
  activity_type TEXT NOT NULL,
  summary TEXT,
  duration_seconds INTEGER,
  recording_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_agent_created
  ON public.lead_activities (lower(agent_email), created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_activities_org_created
  ON public.lead_activities (org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_created
  ON public.lead_activities (lead_id, created_at DESC);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read own activities or Admin reads all" ON public.lead_activities;
CREATE POLICY "Read own activities or Admin reads all"
  ON public.lead_activities
  FOR SELECT
  TO authenticated
  USING (
    lower(agent_email) = lower(auth.jwt() ->> 'email')
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND lower(p.role::text) = 'admin'
    )
  );

DROP POLICY IF EXISTS "Authenticated users log activities" ON public.lead_activities;
CREATE POLICY "Authenticated users log activities"
  ON public.lead_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins only can delete activities" ON public.lead_activities;
CREATE POLICY "Admins only can delete activities"
  ON public.lead_activities
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND lower(p.role::text) = 'admin'
    )
  );

-- 3. Seed realistic demo activity logs for Ndakala Advisory LLP (idempotent)
DO $$
DECLARE
  v_org_id UUID := 'a1b2c3d4-e5f6-7890-abcd-555555555555';
  v_mercy UUID;
  v_benson UUID;
  v_david UUID;
  v_amina UUID;
  v_beatrice UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM public.lead_activities WHERE org_id = v_org_id) THEN
    RETURN;
  END IF;

  SELECT id INTO v_mercy    FROM public.sales_leads WHERE lower(email) = 'm.wambui@savannahagro.co.ke' LIMIT 1;
  SELECT id INTO v_benson   FROM public.sales_leads WHERE lower(email) = 'bkamau@kilimaniurban.co.ke' LIMIT 1;
  SELECT id INTO v_david    FROM public.sales_leads WHERE lower(email) = 'procurement@maritimelogistics.go.ke' LIMIT 1;
  SELECT id INTO v_amina    FROM public.sales_leads WHERE lower(email) = 'ahassan@mombasafreight.co.ke' LIMIT 1;
  SELECT id INTO v_beatrice FROM public.sales_leads WHERE lower(email) = 'bnjoki@earenewables.org' LIMIT 1;

  INSERT INTO public.lead_activities (lead_id, org_id, agent_email, agent_name, lead_name, activity_type, summary, duration_seconds, created_at)
  VALUES
    (v_mercy, v_org_id, 'cherrylatulah@gmail.com', 'Tossie', 'Mercy Wambui', 'email_click', 'Sent FY 2026 statutory audit scope reply via Outlook', NULL, NOW() - INTERVAL '18 minutes'),
    (v_benson, v_org_id, 'cherrylatulah@gmail.com', 'Tossie', 'Eng. Benson Kamau', 'call_logged', 'Discovery call with CFO on Transfer Pricing & VAT retainer', 412, NOW() - INTERVAL '1 hour'),
    (v_benson, v_org_id, 'cherrylatulah@gmail.com', 'Tossie', 'Eng. Benson Kamau', 'ai_draft', 'Drafted WhatsApp follow-up message using Personal AI', NULL, NOW() - INTERVAL '52 minutes'),
    (v_amina, v_org_id, 'kevin@ndakala-demo.co.ke', 'Kevin Mwangi', 'Amina Hassan', 'followup_scheduled', 'Scheduled Kenya-Uganda cross-border audit scoping call', NULL, NOW() - INTERVAL '40 minutes'),
    (v_david, v_org_id, 'brenda@ndakala-demo.co.ke', 'Brenda Akoth', 'David Ochieng', 'whatsapp_click', 'Confirmed tender RFP #KMLA/2026/14 mandatory compliance checklist', NULL, NOW() - INTERVAL '30 minutes'),
    (v_beatrice, v_org_id, 'brenda@ndakala-demo.co.ke', 'Brenda Akoth', 'Beatrice Njoki', 'call_logged', 'Clarified financial bid submission cutoff with procurement desk', 265, NOW() - INTERVAL '2 hours');
END $$;
