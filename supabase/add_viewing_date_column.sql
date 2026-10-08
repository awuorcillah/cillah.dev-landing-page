-- Add viewing_date column to sales_leads table
ALTER TABLE public.sales_leads 
ADD COLUMN IF NOT EXISTS viewing_date TIMESTAMPTZ;

-- Index viewing_date for fast querying
CREATE INDEX IF NOT EXISTS idx_sales_leads_viewing_date ON public.sales_leads(viewing_date);
