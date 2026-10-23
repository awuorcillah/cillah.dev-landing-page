-- ==============================================================================
-- CILLAH AI AUTOMATION: SCHEMA FOLDERS SETUP IN SUPABASE
-- Run this in your Supabase SQL Editor (SQL Editor -> New Query -> Run)
-- Click "Run without RLS" when prompted!
-- ==============================================================================

-- 1. Create the Schema Folders
CREATE SCHEMA IF NOT EXISTS cillah_dev;
CREATE SCHEMA IF NOT EXISTS stage_properties;
CREATE SCHEMA IF NOT EXISTS chetu_healthcare;
CREATE SCHEMA IF NOT EXISTS dendri_africa;

-- Grant permissions so the Table Editor and API can see them
GRANT USAGE ON SCHEMA cillah_dev TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA stage_properties TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA chetu_healthcare TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA dendri_africa TO anon, authenticated, service_role;


-- ==============================================================================
-- 2. FOLDER: cillah_dev (Internal Agency Organization for atulah@cillah.dev)
-- Connected directly to public tables so active n8n email campaigns NEVER break!
-- ==============================================================================
CREATE OR REPLACE VIEW cillah_dev.sales_pipeline AS 
SELECT * FROM public.sales_leads;

CREATE OR REPLACE VIEW cillah_dev.appointments AS 
SELECT * FROM public.appointments;

CREATE OR REPLACE VIEW cillah_dev.bookings AS 
SELECT * FROM public.bookings;

CREATE OR REPLACE VIEW cillah_dev.deliverables AS 
SELECT * FROM public.deliverables;

CREATE OR REPLACE VIEW cillah_dev.staff AS 
SELECT * FROM public.staff_members 
WHERE org_id = 'a1b2c3d4-e5f6-7890-abcd-222222222222';


-- ==============================================================================
-- 3. FOLDER: stage_properties (Real Estate Client Organization)
-- Safe views pointing to existing tables so n8n Instagram AI NEVER breaks!
-- ==============================================================================
CREATE OR REPLACE VIEW stage_properties.leads AS 
SELECT * FROM public.stage_leads;

CREATE OR REPLACE VIEW stage_properties.inventory AS 
SELECT * FROM public.properties;

CREATE OR REPLACE VIEW stage_properties.staff AS 
SELECT * FROM public.staff_members 
WHERE org_id = 'a1b2c3d4-e5f6-7890-abcd-111111111111';


-- ==============================================================================
-- 4. FOLDER: chetu_healthcare (Clinic Client Organization)
-- Dedicated clinical & patient care tables
-- ==============================================================================
CREATE TABLE IF NOT EXISTS chetu_healthcare.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    gender TEXT,
    age INT,
    blood_group TEXT,
    allergies TEXT,
    medical_notes TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chetu_healthcare.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_name TEXT NOT NULL,
    doctor_assigned TEXT DEFAULT 'Dr. Chetu',
    department TEXT DEFAULT 'General Consultation',
    appointment_date DATE NOT NULL,
    appointment_time TEXT NOT NULL,
    consultation_type TEXT DEFAULT 'In-Person',
    chief_complaint TEXT,
    status TEXT DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chetu_healthcare.triage_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    source TEXT DEFAULT 'WhatsApp',
    symptoms TEXT,
    urgency TEXT DEFAULT 'Routine', -- 'Emergency', 'Urgent', 'Routine'
    status TEXT DEFAULT 'new',
    assigned_nurse TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==============================================================================
-- 5. FOLDER: dendri_africa (Enterprise Agri-Tech & Supply Chain)
-- Dedicated wholesale commodities & supply chain tables
-- ==============================================================================
CREATE TABLE IF NOT EXISTS dendri_africa.wholesale_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_name TEXT NOT NULL,
    company TEXT,
    commodity TEXT,
    volume TEXT,
    destination TEXT,
    estimated_value TEXT,
    stage TEXT DEFAULT 'Inquiry',
    assigned_lead TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dendri_africa.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    container_number TEXT NOT NULL,
    commodity TEXT NOT NULL,
    origin TEXT DEFAULT 'Nairobi / Mombasa',
    destination TEXT NOT NULL,
    departure_date DATE,
    estimated_arrival DATE,
    status TEXT DEFAULT 'in_transit', -- 'in_transit', 'customs_cleared', 'delivered'
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==============================================================================
-- 6. Grant Access to All Schemas & Tables
-- ==============================================================================
GRANT ALL ON ALL TABLES IN SCHEMA cillah_dev TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA stage_properties TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA chetu_healthcare TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA dendri_africa TO anon, authenticated, service_role;

GRANT ALL ON ALL SEQUENCES IN SCHEMA cillah_dev TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA stage_properties TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA chetu_healthcare TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA dendri_africa TO anon, authenticated, service_role;
