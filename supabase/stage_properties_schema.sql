-- ==============================================================================
-- STAGE PROPERTIES BROKERS L.L.C & MULTI-TENANT SCHEMA MIGRATION
-- ==============================================================================

-- 1. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    website VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Organizations
INSERT INTO public.organizations (id, name, slug, website)
VALUES 
    ('a1b2c3d4-e5f6-7890-abcd-111111111111', 'Stage Properties Brokers L.L.C', 'stage-properties', 'https://stageproperties.com'),
    ('a1b2c3d4-e5f6-7890-abcd-222222222222', 'cillah.dev', 'cillah-dev', 'https://cillah.dev')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, website = EXCLUDED.website;

-- 2. Add org_id & columns to staff_members table
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS last_assigned_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Upsert Staff Members (Ador for Stage Properties & Cillah for cillah.dev)
INSERT INTO public.staff_members (crm_id, email, full_name, phone_number, role, status, is_active, org_id)
VALUES 
    ('STAGE-AGT-001', 'ador.ai815@gmail.com', 'Ador', '0794357912', 'sales', 'user', true, 'a1b2c3d4-e5f6-7890-abcd-111111111111'),
    ('CRM-CEO-001', 'awuorcillah@gmail.com', 'Cillah Awuor (CEO)', '+254794357912', 'ceo', 'admin', true, 'a1b2c3d4-e5f6-7890-abcd-222222222222')
ON CONFLICT (email) DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    phone_number = EXCLUDED.phone_number,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    is_active = EXCLUDED.is_active,
    org_id = EXCLUDED.org_id,
    updated_at = NOW();

-- 4. Properties Inventory Table (For AI Knowledge Base)
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    keyword VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    property_type VARCHAR(100) DEFAULT 'offplan',
    starting_price VARCHAR(100),
    availability_status VARCHAR(50) DEFAULT 'available',
    description TEXT,
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Stage Properties Listings
INSERT INTO public.properties (org_id, keyword, title, location, property_type, starting_price, availability_status, description, url)
VALUES
    (
        'a1b2c3d4-e5f6-7890-abcd-111111111111',
        'hartland',
        'Sobha Hartland / Hartland Waterfront Estates',
        'Sobha Hartland, MBR City, Dubai',
        'offplan',
        'AED 1,500,000 (~$408,000 USD)',
        'available',
        'Luxury 1, 2 & 3 Bedroom Waterfront Apartments & Canal Villas in MBR City, Dubai. Handover Q4 2026. Flexible 60/40 payment plan.',
        'https://stageproperties.com/offplan'
    ),
    (
        'a1b2c3d4-e5f6-7890-abcd-111111111111',
        'dubai_hills_villa',
        'Dubai Hills Estate Luxury Villa',
        'Dubai Hills Estate, Dubai',
        'residential',
        'AED 8,900,000 (~$2,420,000 USD)',
        'available',
        'Exclusive 5-Bedroom Golf Course Villa with private pool and skyline view.',
        'https://stageproperties.com/buy/residential/properties-for-sale'
    ),
    (
        'a1b2c3d4-e5f6-7890-abcd-111111111111',
        'binghatti_penthouse',
        'Binghatti Skyrise Penthouse',
        'Business Bay, Dubai',
        'offplan',
        'AED 4,200,000 (~$1,143,000 USD)',
        'sold_out',
        'Ultra-luxury penthouse with private jacuzzi overlooking Burj Khalifa. (Currently Sold Out - Inquire for resale units).',
        'https://stageproperties.com/offplan'
    )
ON CONFLICT (keyword) DO UPDATE SET
    title = EXCLUDED.title,
    location = EXCLUDED.location,
    property_type = EXCLUDED.property_type,
    starting_price = EXCLUDED.starting_price,
    availability_status = EXCLUDED.availability_status,
    description = EXCLUDED.description,
    url = EXCLUDED.url,
    updated_at = NOW();

-- 5. Stage Leads / CRM Pipeline Table
CREATE TABLE IF NOT EXISTS public.stage_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    ig_username VARCHAR(100),
    ig_user_id VARCHAR(100),
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(100) NOT NULL,
    property_interest VARCHAR(255) DEFAULT 'hartland',
    intent VARCHAR(50) DEFAULT 'BUY',
    assigned_agent_id UUID REFERENCES public.staff_members(id) ON DELETE SET NULL,
    assigned_agent_name VARCHAR(255),
    assigned_agent_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'new_inquiry',
    chat_history JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read organizations" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "Allow public read properties" ON public.properties FOR SELECT USING (true);
CREATE POLICY "Allow public read stage_leads" ON public.stage_leads FOR SELECT USING (true);
CREATE POLICY "Allow public insert stage_leads" ON public.stage_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update stage_leads" ON public.stage_leads FOR UPDATE USING (true);

-- Enable Realtime
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.stage_leads;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;
