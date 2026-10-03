-- ==============================================================================
-- CILLAH.DEV ORGANIZATIONS, TEAMS, ROLES & CRM SCHEMA
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

-- Insert Default Organization 'cillah-dev'
INSERT INTO public.organizations (slug, name)
VALUES ('cillah-dev', 'cillah.dev AI Automations & Software Agency')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- 2. Organization Teams / Departments Table (Sales, Marketing, Finance, Operations)
CREATE TABLE IF NOT EXISTS public.organization_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_slug VARCHAR(100) DEFAULT 'cillah-dev' REFERENCES public.organizations(slug) ON DELETE CASCADE,
    team_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Teams for cillah.dev
INSERT INTO public.organization_teams (org_slug, team_name, description)
VALUES 
    ('cillah-dev', 'Sales', 'Sales pipeline, CRM leads, phone calls & closing deals'),
    ('cillah-dev', 'Marketing', 'Omnichannel messaging (WhatsApp, IG, FB, TikTok, Website live chat)'),
    ('cillah-dev', 'Finance', 'Invoicing, payment reconciliations & retainer billing'),
    ('cillah-dev', 'Operations', 'System deployment, client onboarding & support SLAs'),
    ('cillah-dev', 'Engineering', 'Custom AI workflows, server management & API integrations')
ON CONFLICT DO NOTHING;

-- 3. Update Profiles Table to include Department, Role Title & Client Type
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS department VARCHAR(50) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS dept_role VARCHAR(50) DEFAULT 'member',
ADD COLUMN IF NOT EXISTS role_title VARCHAR(100) DEFAULT 'Team Specialist',
ADD COLUMN IF NOT EXISTS client_type VARCHAR(50) DEFAULT 'none';

-- 4. Granular Team Members Assignment Table
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_slug VARCHAR(100) DEFAULT 'cillah-dev' REFERENCES public.organizations(slug) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    team_name VARCHAR(100) NOT NULL, -- 'Sales', 'Marketing', 'Finance', 'Operations'
    role_title VARCHAR(100) DEFAULT 'Specialist', -- e.g. 'Head of Sales', 'Finance Director', 'Operations Manager'
    is_dept_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Sales Leads Table (Sales Department CRM Pipeline)
CREATE TABLE IF NOT EXISTS public.sales_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_slug VARCHAR(100) DEFAULT 'cillah-dev' REFERENCES public.organizations(slug) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    property_interest VARCHAR(255), -- Service / Product interest
    purchase_timeline VARCHAR(100),
    source VARCHAR(100) DEFAULT 'Website Enquiry',
    assigned_agent VARCHAR(255) DEFAULT 'Unassigned',
    assigned_agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    temperature VARCHAR(20) DEFAULT 'hot', -- 'hot', 'warm', 'cold'
    initial_note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Historical Lead Notes Table (Continuous Customer Journey Tracking)
CREATE TABLE IF NOT EXISTS public.lead_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.sales_leads(id) ON DELETE CASCADE,
    agent_name VARCHAR(255) NOT NULL,
    agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    note_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Marketing Omnichannel Messages Table
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
ALTER TABLE public.organization_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read organizations" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "Allow public read organization_teams" ON public.organization_teams FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read team_members" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert team_members" ON public.team_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update team_members" ON public.team_members FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated read sales leads" ON public.sales_leads FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert sales leads" ON public.sales_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update sales leads" ON public.sales_leads FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated read lead notes" ON public.lead_notes FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert lead notes" ON public.lead_notes FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated read marketing messages" ON public.marketing_messages FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert marketing messages" ON public.marketing_messages FOR INSERT WITH CHECK (true);
