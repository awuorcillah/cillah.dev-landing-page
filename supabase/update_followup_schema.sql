-- Add Follow-up closure, custom date, and follow-up title columns to sales_leads
ALTER TABLE public.sales_leads
ADD COLUMN IF NOT EXISTS followup_status VARCHAR(50) DEFAULT 'active', -- 'active', 'closed_1_month', 'closed_3_months', 'closed_1_year', 'closed_forever', 'custom_date'
ADD COLUMN IF NOT EXISTS next_followup_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS followup_title VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_sales_leads_followup_status ON public.sales_leads(followup_status);
CREATE INDEX IF NOT EXISTS idx_sales_leads_next_followup ON public.sales_leads(next_followup_at);
