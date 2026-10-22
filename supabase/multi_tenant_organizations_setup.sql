-- ==============================================================================
-- CILLAH AI AUTOMATION: MULTI-TENANT ORGANIZATIONS & DEPARTMENTS SETUP
-- Safe, additive migration: Leaves existing sales_leads and stage_leads 100% intact!
-- Project ID: hastygfosgyxrxzrzrur
-- ==============================================================================

-- 1. Ensure Organizations Table Exists
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    website TEXT,
    industry TEXT,
    logo_url TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed / Upsert the 4 Primary Organizations
INSERT INTO public.organizations (id, name, slug, website, industry, status)
VALUES
    ('a1b2c3d4-e5f6-7890-abcd-111111111111', 'Stage Properties Brokers L.L.C', 'stage-properties', 'https://stageproperties.com', 'Real Estate', 'active'),
    ('a1b2c3d4-e5f6-7890-abcd-222222222222', 'cillah.dev', 'cillah-dev', 'https://cillah.dev', 'AI Automation & SaaS', 'active'),
    ('a1b2c3d4-e5f6-7890-abcd-333333333333', 'Chetu Healthcare Clinic', 'chetu-healthcare', 'https://chetuhealthcare.com', 'Healthcare & Clinical Services', 'active'),
    ('a1b2c3d4-e5f6-7890-abcd-444444444444', 'Dendri Africa', 'dendri-africa', 'https://dendri.africa', 'Agri-Tech & Logistics', 'active')
ON CONFLICT (slug) DO UPDATE
SET 
    name = EXCLUDED.name,
    website = EXCLUDED.website,
    industry = EXCLUDED.industry,
    updated_at = NOW();

-- 2. Departments Table (Rooms inside each organization)
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, slug)
);

-- Seed Default Departments for each organization
INSERT INTO public.departments (organization_id, name, slug, description)
VALUES
    -- Cillah.dev Departments
    ('a1b2c3d4-e5f6-7890-abcd-222222222222', 'Sales Department', 'sales', 'Inbound consultation pipeline and deal closing'),
    ('a1b2c3d4-e5f6-7890-abcd-222222222222', 'Marketing Department', 'marketing', 'Content creation, ads, and outbound campaigns'),
    ('a1b2c3d4-e5f6-7890-abcd-222222222222', 'Finance Department', 'finance', 'Invoices, M-Pesa tracking, and retainers'),

    -- Stage Properties Departments
    ('a1b2c3d4-e5f6-7890-abcd-111111111111', 'Sales & Offplan Pipeline', 'sales', 'Instagram AI leads, villa viewings, broker closings'),
    ('a1b2c3d4-e5f6-7890-abcd-111111111111', 'Marketing Campaign', 'marketing', 'Social media, property promotions, and ad campaigns'),
    ('a1b2c3d4-e5f6-7890-abcd-111111111111', 'Property Inventory', 'inventory', 'Dubai offplan and luxury residential properties'),

    -- Chetu Healthcare Clinic Departments
    ('a1b2c3d4-e5f6-7890-abcd-333333333333', 'Patient Care & Triage', 'triage', 'Inbound patient inquiries and symptom triage'),
    ('a1b2c3d4-e5f6-7890-abcd-333333333333', 'Clinical Appointments', 'appointments', 'Doctor schedules, consultation bookings, and follow-ups'),
    ('a1b2c3d4-e5f6-7890-abcd-333333333333', 'Medical Administration', 'administration', 'Patient medical records and clinic management'),

    -- Dendri Africa Departments
    ('a1b2c3d4-e5f6-7890-abcd-444444444444', 'Operations & Logistics', 'operations', 'Supply chain and logistics management'),
    ('a1b2c3d4-e5f6-7890-abcd-444444444444', 'Partnerships & Sales', 'sales', 'Commercial deals and distribution partners')
ON CONFLICT (organization_id, slug) DO NOTHING;

-- 3. Organization Memberships (Assigning users by email to Org + Department + Role)
CREATE TABLE IF NOT EXISTS public.organization_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    user_email TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    role TEXT NOT NULL DEFAULT 'member', -- 'org_super_admin', 'department_admin', 'agent', 'member', 'viewer'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_email, department_id)
);

CREATE INDEX IF NOT EXISTS idx_org_memberships_email ON public.organization_memberships(user_email);
CREATE INDEX IF NOT EXISTS idx_org_memberships_org ON public.organization_memberships(organization_id);

-- Seed Initial Super Admin & Sales Roles
-- 1. awuorcillah@gmail.com is Org Super Admin across all organizations
INSERT INTO public.organization_memberships (organization_id, user_email, role)
SELECT id, 'awuorcillah@gmail.com', 'org_super_admin'
FROM public.organizations
ON CONFLICT (organization_id, user_email, department_id) DO NOTHING;

-- 2. atulah@cillah.dev is Sales Admin in cillah.dev
INSERT INTO public.organization_memberships (organization_id, department_id, user_email, role)
SELECT 
    'a1b2c3d4-e5f6-7890-abcd-222222222222',
    d.id,
    'atulah@cillah.dev',
    'department_admin'
FROM public.departments d
WHERE d.organization_id = 'a1b2c3d4-e5f6-7890-abcd-222222222222' AND d.slug = 'sales'
ON CONFLICT (organization_id, user_email, department_id) DO NOTHING;

-- 3. ador.ai815@gmail.com is Agent in Stage Properties Sales
INSERT INTO public.organization_memberships (organization_id, department_id, user_email, role)
SELECT 
    'a1b2c3d4-e5f6-7890-abcd-111111111111',
    d.id,
    'ador.ai815@gmail.com',
    'agent'
FROM public.departments d
WHERE d.organization_id = 'a1b2c3d4-e5f6-7890-abcd-111111111111' AND d.slug = 'sales'
ON CONFLICT (organization_id, user_email, department_id) DO NOTHING;


-- ==============================================================================
-- 4. DEDICATED HEALTHCARE CLINIC TABLES (Chetu Healthcare)
-- ==============================================================================

-- A. Chetu Patients
CREATE TABLE IF NOT EXISTS public.chetu_patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    email TEXT,
    date_of_birth DATE,
    gender TEXT,
    emergency_contact TEXT,
    blood_group TEXT,
    medical_allergies TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'discharged', 'archived'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- B. Chetu Clinic Appointments
CREATE TABLE IF NOT EXISTS public.chetu_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.chetu_patients(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    phone_number TEXT,
    doctor_assigned TEXT NOT NULL DEFAULT 'Dr. Chetu',
    department TEXT NOT NULL DEFAULT 'General Consultation',
    appointment_date DATE NOT NULL,
    appointment_time TEXT NOT NULL,
    consultation_type TEXT NOT NULL DEFAULT 'in_person', -- 'in_person', 'telemedicine', 'home_visit'
    chief_complaint TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'in_consultation', 'completed', 'cancelled'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- C. Chetu Inbound Triage Leads (from WhatsApp / Website / Phone)
CREATE TABLE IF NOT EXISTS public.chetu_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'whatsapp', -- 'whatsapp', 'website', 'call', 'referral'
    symptoms_or_inquiry TEXT,
    triage_priority TEXT NOT NULL DEFAULT 'routine', -- 'emergency', 'urgent', 'routine'
    status TEXT NOT NULL DEFAULT 'new', -- 'new', 'triaged', 'appointment_booked', 'closed'
    assigned_nurse TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==============================================================================
-- 5. DEDICATED DENDRI AFRICA TABLES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.dendri_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    company_name TEXT,
    email TEXT,
    phone_number TEXT,
    service_interest TEXT,
    estimated_value NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'new', -- 'new', 'qualifying', 'proposal_sent', 'won', 'lost'
    assigned_to TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chetu_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chetu_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chetu_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dendri_leads ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users & public
CREATE POLICY "Organizations are viewable by authenticated users" 
ON public.organizations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Departments are viewable by authenticated users" 
ON public.departments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Memberships viewable by assigned user or super admin" 
ON public.organization_memberships FOR SELECT TO authenticated 
USING (
    user_email = (auth.jwt() ->> 'email')
    OR (auth.jwt() ->> 'email') = 'awuorcillah@gmail.com'
    OR auth.role() = 'service_role'
);

-- Chetu Healthcare Table Policies
CREATE POLICY "Chetu patients accessible by service role and staff"
ON public.chetu_patients FOR ALL TO authenticated 
USING (
    (auth.jwt() ->> 'email') = 'awuorcillah@gmail.com'
    OR EXISTS (
        SELECT 1 FROM public.organization_memberships m
        WHERE m.user_email = (auth.jwt() ->> 'email')
        AND m.organization_id = 'a1b2c3d4-e5f6-7890-abcd-333333333333'
    )
    OR auth.role() = 'service_role'
);

CREATE POLICY "Chetu appointments accessible by service role and staff"
ON public.chetu_appointments FOR ALL TO authenticated 
USING (
    (auth.jwt() ->> 'email') = 'awuorcillah@gmail.com'
    OR EXISTS (
        SELECT 1 FROM public.organization_memberships m
        WHERE m.user_email = (auth.jwt() ->> 'email')
        AND m.organization_id = 'a1b2c3d4-e5f6-7890-abcd-333333333333'
    )
    OR auth.role() = 'service_role'
);

CREATE POLICY "Chetu leads accessible by service role and staff"
ON public.chetu_leads FOR ALL TO authenticated 
USING (
    (auth.jwt() ->> 'email') = 'awuorcillah@gmail.com'
    OR EXISTS (
        SELECT 1 FROM public.organization_memberships m
        WHERE m.user_email = (auth.jwt() ->> 'email')
        AND m.organization_id = 'a1b2c3d4-e5f6-7890-abcd-333333333333'
    )
    OR auth.role() = 'service_role'
);

-- Dendri Africa Table Policies
CREATE POLICY "Dendri leads accessible by service role and staff"
ON public.dendri_leads FOR ALL TO authenticated 
USING (
    (auth.jwt() ->> 'email') = 'awuorcillah@gmail.com'
    OR EXISTS (
        SELECT 1 FROM public.organization_memberships m
        WHERE m.user_email = (auth.jwt() ->> 'email')
        AND m.organization_id = 'a1b2c3d4-e5f6-7890-abcd-444444444444'
    )
    OR auth.role() = 'service_role'
);
