-- ==============================================================================
-- CILLAH.DEV ORGANIZATIONS, SALES CRM & MARKETING OMNICHANNEL SCHEMA
-- Run this in your Supabase SQL Editor: https://app.supabase.com -> SQL Editor
-- ==============================================================================

-- 1. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Organization 'cillah.dev'
INSERT INTO public.organizations (slug, name)
VALUES ('cillah-dev', 'cillah.dev Real Estate & Automation')
ON CONFLICT (slug) DO NOTHING;

-- 2. Update Profiles Table to include Department & Role permissions
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS department VARCHAR(50) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS dept_role VARCHAR(50) DEFAULT 'member',
ADD COLUMN IF NOT EXISTS client_type VARCHAR(50) DEFAULT 'none';

-- 3. Sales Leads Table (Sales Department CRM Pipeline)
CREATE TABLE IF NOT EXISTS public.sales_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_slug VARCHAR(100) DEFAULT 'cillah-dev' REFERENCES public.organizations(slug) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    property_interest VARCHAR(255),
    purchase_timeline VARCHAR(100),
    source VARCHAR(100) DEFAULT 'Website Enquiry',
    assigned_agent VARCHAR(255) DEFAULT 'Unassigned',
    assigned_agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    temperature VARCHAR(20) DEFAULT 'hot', -- 'hot', 'warm', 'cold'
    initial_note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Historical Lead Notes Table (Continuous Customer Journey Tracking)
CREATE TABLE IF NOT EXISTS public.lead_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.sales_leads(id) ON DELETE CASCADE,
    agent_name VARCHAR(255) NOT NULL,
    agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    note_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Marketing Omnichannel Messages Table
CREATE TABLE IF NOT EXISTS public.marketing_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_slug VARCHAR(100) DEFAULT 'cillah-dev' REFERENCES public.organizations(slug) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'whatsapp', 'instagram', 'facebook', 'website', 'tiktok'
    sender_name VARCHAR(255) NOT NULL,
    sender_handle_phone VARCHAR(255) NOT NULL,
    message_text TEXT NOT NULL,
    lead_quality VARCHAR(50) DEFAULT 'Qualified', -- 'Hot Lead', 'Qualified', 'General Enquiry'
    assigned_marketer VARCHAR(255) DEFAULT 'Marketing Bot',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read organizations" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read sales leads" ON public.sales_leads FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert sales leads" ON public.sales_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update sales leads" ON public.sales_leads FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated read lead notes" ON public.lead_notes FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert lead notes" ON public.lead_notes FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated read marketing messages" ON public.marketing_messages FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert marketing messages" ON public.marketing_messages FOR INSERT WITH CHECK (true);
