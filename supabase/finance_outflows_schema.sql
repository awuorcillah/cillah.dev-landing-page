-- ==============================================================================
-- FINANCE OUTFLOWS TABLE (SUBSCRIPTIONS, SALARY, EXPENSES)
-- Execute once in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- Safe & idempotent: tracks monthly subscriptions, salaries & expenses per org.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.finance_outflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  org_slug TEXT NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('subscription', 'salary', 'expense')),
  title TEXT NOT NULL,
  vendor_or_person TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  amount_kes NUMERIC(12, 2) NOT NULL CHECK (amount_kes >= 0),
  billing_cycle TEXT NOT NULL DEFAULT 'one_time', -- 'monthly' | 'yearly' | 'one_time'
  status TEXT NOT NULL DEFAULT 'paid',            -- 'paid' | 'pending' | 'active' | 'paused'
  occurred_on DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'mpesa',   -- 'mpesa' | 'card' | 'bank' | 'cash'
  notes TEXT,
  is_demo_seed BOOLEAN NOT NULL DEFAULT false,
  created_by_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_outflows_org_type_date
  ON public.finance_outflows (org_id, entry_type, occurred_on DESC);

ALTER TABLE public.finance_outflows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org staff or Super Admin manage finance_outflows" ON public.finance_outflows;
CREATE POLICY "Org staff or Super Admin manage finance_outflows"
  ON public.finance_outflows
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND lower(p.role::text) = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.staff_members sm
      WHERE lower(sm.email) = lower((SELECT auth.jwt()) ->> 'email')
        AND sm.is_active = true
        AND sm.org_id = finance_outflows.org_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND lower(p.role::text) = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.staff_members sm
      WHERE lower(sm.email) = lower((SELECT auth.jwt()) ->> 'email')
        AND sm.is_active = true
        AND sm.org_id = finance_outflows.org_id
    )
  );

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.finance_outflows;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seed Demo Subscriptions, Salaries & Expenses STRICTLY for Rosy Realtors Nairobi (NEVER touches cillah.dev!)
DO $$
DECLARE
  v_rosy_org UUID := 'a1b2c3d4-e5f6-7890-abcd-555555555555';
BEGIN
  IF EXISTS (SELECT 1 FROM public.finance_outflows WHERE org_id = v_rosy_org AND is_demo_seed = true) THEN
    RETURN;
  END IF;

  INSERT INTO public.finance_outflows (
    org_id, org_slug, entry_type, title, vendor_or_person, category,
    amount_kes, billing_cycle, status, occurred_on, payment_method, notes, is_demo_seed, created_by_email
  ) VALUES
    -- Demo Subscriptions
    (v_rosy_org, 'rosy-realtors', 'subscription', 'Property24 Featured Listings', 'Property24 Kenya', 'Marketing', 28000, 'monthly', 'active', CURRENT_DATE - 3, 'card', 'Monthly Nairobi luxury listing pack', true, 'cherrylatulah@gmail.com'),
    (v_rosy_org, 'rosy-realtors', 'subscription', 'Google Workspace Business', 'Google', 'Software', 6500, 'monthly', 'active', CURRENT_DATE - 5, 'card', '5 team email seats', true, 'cherrylatulah@gmail.com'),
    -- Demo Salaries
    (v_rosy_org, 'rosy-realtors', 'salary', 'Kevin Mwangi — Base + Viewing Allowance', 'Kevin Mwangi', 'Payroll', 65000, 'monthly', 'paid', CURRENT_DATE - 2, 'bank', 'Monthly retainer + transport', true, 'cherrylatulah@gmail.com'),
    (v_rosy_org, 'rosy-realtors', 'salary', 'Brenda Akoth — Base + Commission Advance', 'Brenda Akoth', 'Payroll', 70000, 'monthly', 'paid', CURRENT_DATE - 2, 'bank', 'Monthly payroll', true, 'cherrylatulah@gmail.com'),
    -- Demo Expenses
    (v_rosy_org, 'rosy-realtors', 'expense', 'Meta Instagram & Facebook Lead Ads', 'Meta', 'Marketing', 35000, 'one_time', 'paid', CURRENT_DATE - 1, 'card', 'Kilimani & Runda buyer campaigns', true, 'cherrylatulah@gmail.com'),
    (v_rosy_org, 'rosy-realtors', 'expense', 'Client Site Viewing Fuel & Refreshments', 'Operations', 'Transport', 8500, 'one_time', 'paid', CURRENT_DATE, 'mpesa', 'Karen & Runda weekend tours', true, 'cherrylatulah@gmail.com');
END $$;
