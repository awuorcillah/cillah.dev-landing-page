-- ==============================================================================
-- CILLAH.DEV FINANCE DEPARTMENT, PAYSTACK CARD & M-PESA BILLING, AND LEAD DOCUMENTS
-- Execute once in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- Safe & idempotent: preserves all existing cillah.dev & Rosy Realtors data.
-- ==============================================================================

-- 1. Extend consultation_payments for Paystack Card checkout alongside M-Pesa STK Push
ALTER TABLE public.consultation_payments
  ADD COLUMN IF NOT EXISTS payment_provider TEXT NOT NULL DEFAULT 'mpesa',
  ADD COLUMN IF NOT EXISTS paystack_reference TEXT,
  ADD COLUMN IF NOT EXISTS paystack_channel TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'KES';

CREATE UNIQUE INDEX IF NOT EXISTS idx_consultation_payments_paystack_ref
  ON public.consultation_payments (paystack_reference)
  WHERE paystack_reference IS NOT NULL;

-- 2. Ensure atulah@cillah.dev is the ONLY non-admin active user in cillah.dev
--    and has access to Sales, Marketing, and Finance workspaces
UPDATE public.staff_members
SET
  org_id = 'a1b2c3d4-e5f6-7890-abcd-222222222222',
  role = 'sales,marketing,finance',
  status = 'user',
  is_active = true,
  updated_at = NOW()
WHERE lower(email) = 'atulah@cillah.dev';

UPDATE public.staff_members
SET
  org_id = 'a1b2c3d4-e5f6-7890-abcd-222222222222',
  role = 'ceo',
  status = 'admin',
  is_active = true,
  updated_at = NOW()
WHERE lower(email) = 'awuorcillah@gmail.com';

-- 3. Finance Invoices & Payment Links Table (Strictly Multi-Tenant by org_id)
CREATE TABLE IF NOT EXISTS public.finance_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  org_slug TEXT NOT NULL,
  lead_id UUID REFERENCES public.sales_leads(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  public_token TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_company TEXT,
  title TEXT NOT NULL,
  description TEXT,
  invoice_type TEXT NOT NULL DEFAULT 'deposit',
  -- 'deposit' | 'milestone' | 'final_balance' | 'full_payment' | 'retainer'
  amount_kes NUMERIC(12, 2) NOT NULL CHECK (amount_kes > 0),
  currency TEXT NOT NULL DEFAULT 'KES',
  allowed_methods TEXT[] NOT NULL DEFAULT ARRAY['mpesa', 'card']::TEXT[],
  contract_document_id UUID,
  contract_url TEXT,
  contract_name TEXT,
  contract_notes TEXT,
  status TEXT NOT NULL DEFAULT 'unpaid',
  -- 'draft' | 'unpaid' | 'sent' | 'payment_made' | 'cancelled'
  payment_method TEXT,
  -- 'mpesa' | 'card' | 'paystack_mpesa' | 'paystack_card'
  payment_reference TEXT,
  mpesa_checkout_request_id TEXT,
  paid_amount NUMERIC(12, 2),
  paid_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  sent_via TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  sent_at TIMESTAMPTZ,
  is_demo_seed BOOLEAN NOT NULL DEFAULT false,
  created_by_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_invoices_org_created
  ON public.finance_invoices (org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_finance_invoices_lead
  ON public.finance_invoices (lead_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_finance_invoices_status
  ON public.finance_invoices (org_id, status);

CREATE INDEX IF NOT EXISTS idx_finance_invoices_checkout_req
  ON public.finance_invoices (mpesa_checkout_request_id)
  WHERE mpesa_checkout_request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_finance_invoices_payment_ref
  ON public.finance_invoices (payment_reference)
  WHERE payment_reference IS NOT NULL;

ALTER TABLE public.finance_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org staff or Super Admin read finance_invoices" ON public.finance_invoices;
CREATE POLICY "Org staff or Super Admin read finance_invoices"
  ON public.finance_invoices
  FOR SELECT
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
        AND sm.org_id = finance_invoices.org_id
    )
  );

DROP POLICY IF EXISTS "Org staff or Super Admin manage finance_invoices" ON public.finance_invoices;
CREATE POLICY "Org staff or Super Admin manage finance_invoices"
  ON public.finance_invoices
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
        AND sm.org_id = finance_invoices.org_id
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
        AND sm.org_id = finance_invoices.org_id
    )
  );

-- 4. Lead Documents Table (Contracts, Proposals, Invoices, Payment Receipts)
CREATE TABLE IF NOT EXISTS public.lead_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.sales_leads(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,
  invoice_id UUID REFERENCES public.finance_invoices(id) ON DELETE SET NULL,
  doc_type TEXT NOT NULL DEFAULT 'contract',
  -- 'contract' | 'proposal' | 'invoice' | 'agreement' | 'receipt' | 'other'
  title TEXT NOT NULL,
  file_name TEXT,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type TEXT,
  notes TEXT,
  uploaded_by_email TEXT NOT NULL,
  uploaded_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_documents_lead_created
  ON public.lead_documents (lead_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_documents_org_created
  ON public.lead_documents (org_id, created_at DESC);

ALTER TABLE public.lead_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org staff or Super Admin read lead_documents" ON public.lead_documents;
CREATE POLICY "Org staff or Super Admin read lead_documents"
  ON public.lead_documents
  FOR SELECT
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
        AND sm.org_id = lead_documents.org_id
    )
  );

DROP POLICY IF EXISTS "Org staff or Super Admin manage lead_documents" ON public.lead_documents;
CREATE POLICY "Org staff or Super Admin manage lead_documents"
  ON public.lead_documents
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
        AND sm.org_id = lead_documents.org_id
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
        AND sm.org_id = lead_documents.org_id
    )
  );

-- 5. Supabase Storage Bucket for Contracts, Proposals & Client Documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-documents', 'client-documents', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read client-documents" ON storage.objects;
CREATE POLICY "Public read client-documents"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'client-documents');

DROP POLICY IF EXISTS "Authenticated upload client-documents" ON storage.objects;
CREATE POLICY "Authenticated upload client-documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'client-documents');

-- Enable realtime on finance_invoices and lead_documents
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.finance_invoices;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_documents;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. Seed Realistic DEMO Finance Data STRICTLY for Rosy Realtors Nairobi (NEVER touches cillah.dev!)
DO $$
DECLARE
  v_rosy_org UUID := 'a1b2c3d4-e5f6-7890-abcd-555555555555';
  v_faith_id UUID;
  v_benson_id UUID;
  v_george_id UUID;
  v_beatrice_id UUID;
BEGIN
  -- Idempotent guard: only seed if no Rosy demo invoices exist yet
  IF EXISTS (SELECT 1 FROM public.finance_invoices WHERE org_id = v_rosy_org AND is_demo_seed = true) THEN
    RETURN;
  END IF;

  SELECT id INTO v_faith_id    FROM public.sales_leads WHERE lower(email) = 'fmuthoni@apexlogistics.co.ke' LIMIT 1;
  SELECT id INTO v_benson_id   FROM public.sales_leads WHERE lower(email) = 'bkamau@riftinvest.co.ke' LIMIT 1;
  SELECT id INTO v_george_id   FROM public.sales_leads WHERE lower(email) = 'gomondi@kisumupolymers.co.ke' LIMIT 1;
  SELECT id INTO v_beatrice_id FROM public.sales_leads WHERE lower(email) = 'bnjoki@earenewables.org' LIMIT 1;

  INSERT INTO public.finance_invoices (
    org_id, org_slug, lead_id, invoice_number, public_token,
    client_name, client_email, client_phone, client_company,
    title, description, invoice_type, amount_kes, currency, allowed_methods,
    contract_name, contract_notes, status, payment_method, payment_reference,
    paid_amount, paid_at, due_date, sent_via, sent_at, is_demo_seed, created_by_email
  ) VALUES
    (
      v_rosy_org, 'rosy-realtors', v_faith_id, 'ROSY-2026-0101', 'demo-rosy-faith-kilimani-101',
      'Faith Muthoni', 'fmuthoni@apexlogistics.co.ke', '+254722771204', 'Kilimani 2BR Furnished Residence',
      'Agency Commission & Closing Balance — Kilimani Unit 4B',
      'Full agency facilitation & closing fee for Denis Pritt Rd 2BR furnished residence.',
      'full_payment', 414000, 'KES', ARRAY['mpesa', 'card'],
      'Sale_Agreement_Kilimani_Unit_4B.pdf',
      'Signed Sale Agreement (KES 13.8M). 3% agency commission settled in full.',
      'payment_made', 'paystack_card', 'PSK-DEMO-892411',
      414000, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', ARRAY['email', 'whatsapp'], NOW() - INTERVAL '4 days', true, 'cherrylatulah@gmail.com'
    ),
    (
      v_rosy_org, 'rosy-realtors', v_benson_id, 'ROSY-2026-0102', 'demo-rosy-benson-kileleshwa-102',
      'Eng. Benson Kamau', 'bkamau@riftinvest.co.ke', '+254722889301', 'Kileleshwa 2x 2BR Off-Plan Units',
      'Reservation Commitment Fee — Units 8B & 9B',
      'Initial off-plan booking deposit to lock Units 8B & 9B along Othaya Road.',
      'deposit', 120000, 'KES', ARRAY['mpesa', 'card'],
      'Letter_of_Offer_Kileleshwa_8B_9B.pdf',
      '24-month 0% developer installment schedule attached. Deposit refundable subject to title verification.',
      'sent', NULL, NULL,
      NULL, NULL, NOW() + INTERVAL '5 days', ARRAY['whatsapp', 'email'], NOW() - INTERVAL '6 hours', true, 'cherrylatulah@gmail.com'
    ),
    (
      v_rosy_org, 'rosy-realtors', v_george_id, 'ROSY-2026-0103', 'demo-rosy-george-lavington-103',
      'George Omondi', 'gomondi@kisumupolymers.co.ke', '+254722300918', 'Lavington 4BR Corner Townhouse',
      'Legal & Escrow Retainer — Lavington Corner Townhouse',
      'Initial deposit milestone for James Gichuru Rd 4BR townhouse.',
      'deposit', 145000, 'KES', ARRAY['mpesa', 'card'],
      'Townhouse_Offer_Lavington_Corner.pdf',
      'Includes conveyancing kickoff and valuation confirmation.',
      'payment_made', 'mpesa', 'SLK982041DEMO',
      145000, NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days', ARRAY['email'], NOW() - INTERVAL '7 days', true, 'kevin@rosyrealtors.co.ke'
    ),
    (
      v_rosy_org, 'rosy-realtors', v_beatrice_id, 'ROSY-2026-0104', 'demo-rosy-beatrice-gtc-104',
      'Beatrice Njoki', 'bnjoki@earenewables.org', '+254719442018', 'Westlands GTC 2BR Serviced Suite',
      'Reservation Deposit — GTC Westlands 18th Floor',
      'Corporate serviced apartment reservation & contract lock.',
      'deposit', 95000, 'KES', ARRAY['mpesa', 'card'],
      'GTC_Westlands_Reservation_Form.pdf',
      'Locks 18th floor suite for 14 days pending corporate RTGS.',
      'unpaid', NULL, NULL,
      NULL, NULL, NOW() + INTERVAL '3 days', ARRAY['whatsapp'], NOW() - INTERVAL '1 day', true, 'brenda@rosyrealtors.co.ke'
    );

  -- Attach matching demo contract documents inside Rosy Realtors lead drawers
  IF v_benson_id IS NOT NULL THEN
    INSERT INTO public.lead_documents (lead_id, org_id, doc_type, title, file_name, file_url, notes, uploaded_by_email, uploaded_by_name)
    VALUES (
      v_benson_id, v_rosy_org, 'contract',
      'Letter of Offer — Kileleshwa Units 8B & 9B',
      'Letter_of_Offer_Kileleshwa_8B_9B.pdf',
      'https://www.cillah.dev/pay/demo-rosy-benson-kileleshwa-102',
      'Sent via WhatsApp & Email with Pay Now link for KES 120,000 commitment fee.',
      'cherrylatulah@gmail.com', 'Tossie'
    );
  END IF;

  IF v_faith_id IS NOT NULL THEN
    INSERT INTO public.lead_documents (lead_id, org_id, doc_type, title, file_name, file_url, notes, uploaded_by_email, uploaded_by_name)
    VALUES (
      v_faith_id, v_rosy_org, 'contract',
      'Executed Sale Agreement — Kilimani Unit 4B',
      'Sale_Agreement_Kilimani_Unit_4B.pdf',
      'https://www.cillah.dev/pay/demo-rosy-faith-kilimani-101',
      'Signed agreement + KES 414,000 paid via Paystack Card.',
      'cherrylatulah@gmail.com', 'Tossie'
    );
  END IF;
END $$;
