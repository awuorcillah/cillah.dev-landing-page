-- ==============================================================================
-- VERIFIED M-PESA CONSULTATION PAYMENTS TABLE
-- Run once in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- Project ID: hastygfosgyxrxzrzrur
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.consultation_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checkout_request_id TEXT UNIQUE,
    merchant_request_id TEXT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    mpesa_phone TEXT NOT NULL,
    agency_name TEXT DEFAULT '',
    website_url TEXT DEFAULT 'N/A',
    bottlenecks TEXT DEFAULT '',
    scheduled_at TIMESTAMPTZ NOT NULL,
    amount_kes INTEGER NOT NULL,
    amount_usd INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_payment', -- 'pending_payment' | 'paid' | 'failed' | 'cancelled'
    mpesa_receipt TEXT,
    mpesa_result_code INTEGER,
    mpesa_result_desc TEXT,
    paid_at TIMESTAMPTZ,
    google_meet_url TEXT,
    calendar_event_url TEXT,
    lead_id UUID,
    webhook_sent BOOLEAN DEFAULT false,
    webhook_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultation_payments_checkout_id
    ON public.consultation_payments(checkout_request_id);

CREATE INDEX IF NOT EXISTS idx_consultation_payments_status
    ON public.consultation_payments(status);

-- Strict RLS: NO public anon policies. Only server-side routes using SUPABASE_SERVICE_ROLE_KEY can read/write.
ALTER TABLE public.consultation_payments ENABLE ROW LEVEL SECURITY;
