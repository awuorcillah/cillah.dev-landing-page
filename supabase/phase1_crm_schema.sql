-- ==============================================================================
-- PHASE 1: SUPABASE CRM DATABASE SCHEMA, STAFF SEEDING & RLS POLICIES
-- Execute this script in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Create Staff Members Table
CREATE TABLE IF NOT EXISTS public.staff_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crm_id VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'sales', -- 'ceo', 'sales', 'marketing', 'operations'
    status VARCHAR(50) NOT NULL DEFAULT 'user', -- 'admin' (sees all), 'user' (sees assigned only)
    is_active BOOLEAN DEFAULT true,
    last_assigned_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Pre-seed Staff Members
INSERT INTO public.staff_members (crm_id, email, full_name, phone_number, role, status, is_active)
VALUES 
    ('CRM-CEO-001', 'awuorcillah@gmail.com', 'Cillah Awuor (CEO)', '+254700000001', 'ceo', 'admin', true),
    ('CRM-SADM-002', 'atulah@cillah.dev', 'Atulah (Sales Admin)', '+254700000002', 'sales', 'admin', true),
    ('CRM-SAGT-003', 'cherrylatulah2000@gmail.com', 'Cherryl Atulah (Sales Agent)', '+254700000003', 'sales', 'user', true)
ON CONFLICT (email) DO UPDATE SET 
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

-- 3. Sales Leads Table
CREATE TABLE IF NOT EXISTS public.sales_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone_number VARCHAR(100),
    company_name VARCHAR(255),
    source VARCHAR(100) NOT NULL DEFAULT 'email_campaign', 
    -- sources: 'email_campaign', 'whatsapp', 'instagram_dm', 'instagram_comment', 'facebook_messenger', 'facebook_comment', 'website_appointment', 'youtube_link'
    stage VARCHAR(50) NOT NULL DEFAULT 'new_lead',
    -- stages: 'new_lead', 'hot_lead', 'warm_lead', 'cold_lead', 'spam', 'closed_won', 'closed_lost'
    assigned_agent_email VARCHAR(255) REFERENCES public.staff_members(email) ON DELETE SET NULL ON UPDATE CASCADE,
    assigned_agent_id UUID REFERENCES public.staff_members(id) ON DELETE SET NULL,
    is_qualified BOOLEAN DEFAULT false,
    estimated_value NUMERIC(12, 2) DEFAULT 0,
    last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for fast filtering & search
CREATE INDEX IF NOT EXISTS idx_sales_leads_assigned_agent ON public.sales_leads(assigned_agent_email);
CREATE INDEX IF NOT EXISTS idx_sales_leads_stage ON public.sales_leads(stage);
CREATE INDEX IF NOT EXISTS idx_sales_leads_source ON public.sales_leads(source);

-- 4. Lead Notes Table (Multi-source interactions & date tracking)
CREATE TABLE IF NOT EXISTS public.lead_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.sales_leads(id) ON DELETE CASCADE,
    author_email VARCHAR(255) NOT NULL,
    author_name VARCHAR(255),
    source VARCHAR(100) NOT NULL DEFAULT 'sales_agent',
    -- sources: 'sales_agent', 'whatsapp_dm', 'email_reply', 'system_bot', 'instagram_dm'
    note_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON public.lead_notes(lead_id);

-- 5. Appointments Table (Upcoming meetings & schedule)
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.sales_leads(id) ON DELETE CASCADE,
    assigned_agent_email VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INT DEFAULT 30,
    status VARCHAR(50) DEFAULT 'upcoming', -- 'upcoming', 'completed', 'cancelled', 'no_show'
    meeting_link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_agent ON public.appointments(assigned_agent_email);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON public.appointments(scheduled_at);

-- 6. Campaign Clicks Table (YouTube & Marketing Link Attribution)
CREATE TABLE IF NOT EXISTS public.campaign_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(100) NOT NULL, -- 'youtube', 'email_campaign', 'instagram_bio'
    campaign_name VARCHAR(255),
    destination_url TEXT NOT NULL,
    ip_address VARCHAR(100),
    user_agent TEXT,
    clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_clicks ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS Policies
-- Allow Service Role / Public API full access for webhooks & backend operations
CREATE POLICY "Allow public read staff_members" ON public.staff_members FOR SELECT USING (true);
CREATE POLICY "Allow authenticated service staff_members" ON public.staff_members FOR ALL USING (true);

-- Sales Leads Access Rules
CREATE POLICY "Allow public read sales_leads" ON public.sales_leads FOR SELECT USING (true);
CREATE POLICY "Allow public insert sales_leads" ON public.sales_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update sales_leads" ON public.sales_leads FOR UPDATE USING (true);
CREATE POLICY "Allow public delete sales_leads" ON public.sales_leads FOR DELETE USING (true);

-- Lead Notes Access Rules
CREATE POLICY "Allow public read lead_notes" ON public.lead_notes FOR SELECT USING (true);
CREATE POLICY "Allow public insert lead_notes" ON public.lead_notes FOR INSERT WITH CHECK (true);

-- Appointments Access Rules
CREATE POLICY "Allow public read appointments" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Allow public insert appointments" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update appointments" ON public.appointments FOR UPDATE USING (true);

-- Campaign Clicks Access Rules
CREATE POLICY "Allow public read campaign_clicks" ON public.campaign_clicks FOR SELECT USING (true);
CREATE POLICY "Allow public insert campaign_clicks" ON public.campaign_clicks FOR INSERT WITH CHECK (true);

-- Realtime publication enablement
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
