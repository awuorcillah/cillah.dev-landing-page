-- Add initial_note column directly to sales_leads table for single-request ingestion
ALTER TABLE public.sales_leads
ADD COLUMN IF NOT EXISTS initial_note TEXT;
