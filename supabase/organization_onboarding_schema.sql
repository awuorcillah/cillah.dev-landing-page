-- Self-Serve Organization Onboarding & Modular Department Subscriptions
-- Tracks pending/active organization checkouts via M-Pesa STK Push and Paystack.

CREATE TABLE IF NOT EXISTS public.organization_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL,
  owner_email text NOT NULL,
  owner_name text NOT NULL,
  owner_phone text,
  organization_name text NOT NULL,
  organization_slug text,
  organization_website text,
  departments text[] NOT NULL CHECK (cardinality(departments) > 0),
  billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  amount_kes integer NOT NULL CHECK (amount_kes > 0),
  amount_usd integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'KES',
  status text NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'active', 'past_due', 'cancelled', 'failed')),
  payment_provider text NOT NULL DEFAULT 'mpesa' CHECK (payment_provider IN ('mpesa', 'paystack_card', 'paystack_mpesa')),
  paystack_reference text UNIQUE,
  mpesa_checkout_request_id text UNIQUE,
  mpesa_merchant_request_id text,
  mpesa_phone text,
  payment_receipt text,
  result_desc text,
  paid_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_subs_organization_id
  ON public.organization_subscriptions (organization_id);

CREATE INDEX IF NOT EXISTS idx_org_subs_owner_user_id
  ON public.organization_subscriptions (owner_user_id);

CREATE INDEX IF NOT EXISTS idx_org_subs_owner_email_lower
  ON public.organization_subscriptions (lower(owner_email));

CREATE INDEX IF NOT EXISTS idx_org_subs_status
  ON public.organization_subscriptions (status);

ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own organization subscriptions" ON public.organization_subscriptions;
CREATE POLICY "Users can view own organization subscriptions"
  ON public.organization_subscriptions
  FOR SELECT
  TO authenticated
  USING (owner_user_id = (SELECT auth.uid()));
