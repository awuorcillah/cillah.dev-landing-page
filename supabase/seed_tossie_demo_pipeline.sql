-- ==============================================================================
-- NDAKALA ADVISORY LLP — ISOLATED CEO & MULTI-AGENT DEMO PIPELINE SEED
-- Execute in Supabase Dashboard -> SQL Editor -> New Query -> Run
--
-- What this script does (100% safe — leaves atulah@cillah.dev untouched!):
-- 1. Creates isolated Organization: "Ndakala Advisory LLP"
-- 2. Enforces Admin-only DELETE RLS policy on public.sales_leads
-- 3. Sets up 3 Demo Sales Agents strictly inside Ndakala Advisory LLP:
--      - Tossie (cherrylatulah@gmail.com) -> Advisory & Tax Desk (real login)
--      - Kevin Mwangi (kevin@ndakala-demo.co.ke) -> Audit & Assurance Desk
--      - Brenda Akoth (brenda@ndakala-demo.co.ke) -> Tenders & Public Sector Desk
-- 4. Seeds 18 realistic Nairobi fake demo leads across Email (Microsoft 365),
--    WhatsApp, Facebook, Events & Forums, Tenders & RFPs, and Website.
-- ==============================================================================

-- 1. Create dedicated Client Organization for Ndakala Advisory LLP
INSERT INTO public.organizations (id, name, slug, website)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-555555555555',
  'Ndakala Advisory LLP',
  'ndakala-advisory',
  'https://ndakalaadvisory.co.ke'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  website = EXCLUDED.website;

-- 2. Enforce Database-Level RBAC: ONLY Admins can permanently DELETE leads
DROP POLICY IF EXISTS "Allow public delete sales_leads" ON public.sales_leads;
DROP POLICY IF EXISTS "Admins only can delete sales_leads" ON public.sales_leads;
CREATE POLICY "Admins only can delete sales_leads"
  ON public.sales_leads
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND lower(p.role::text) = 'admin'
    )
  );

-- 3. Clean up any prior placeholder demo rows (leaves atulah@cillah.dev 100% untouched!)
DELETE FROM public.lead_notes
WHERE lower(author_email) IN (
  'tossie@cillah.dev',
  'cherrylatulah@gmail.com',
  'kevin@ndakala-demo.co.ke',
  'brenda@ndakala-demo.co.ke'
);

DELETE FROM public.sales_leads
WHERE lower(assigned_agent_email) IN (
  'tossie@cillah.dev',
  'cherrylatulah@gmail.com',
  'kevin@ndakala-demo.co.ke',
  'brenda@ndakala-demo.co.ke'
);

DELETE FROM public.staff_members
WHERE lower(email) = 'tossie@cillah.dev';

-- 4. Ensure cherrylatulah@gmail.com logs straight into /user/dashboard as Sales Agent "Tossie"
UPDATE public.profiles
SET
  full_name = 'Tossie',
  role = 'user'
WHERE lower(email) = 'cherrylatulah@gmail.com';

-- 5. Upsert the 3 Ndakala Advisory Sales Agents strictly under Ndakala Advisory org
INSERT INTO public.staff_members (crm_id, email, full_name, phone_number, role, status, is_active, org_id)
VALUES
  ('NDA-AGT-001', 'cherrylatulah@gmail.com', 'Tossie', '+254711223344', 'sales', 'user', true, 'a1b2c3d4-e5f6-7890-abcd-555555555555'),
  ('NDA-AGT-002', 'kevin@ndakala-demo.co.ke', 'Kevin Mwangi', '+254722104590', 'sales', 'user', true, 'a1b2c3d4-e5f6-7890-abcd-555555555555'),
  ('NDA-AGT-003', 'brenda@ndakala-demo.co.ke', 'Brenda Akoth', '+254733890122', 'sales', 'user', true, 'a1b2c3d4-e5f6-7890-abcd-555555555555')
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = 'sales',
  status = 'user',
  is_active = true,
  org_id = 'a1b2c3d4-e5f6-7890-abcd-555555555555',
  updated_at = NOW();

-- 6. Seed 18 Realistic Omnichannel Demo Leads across the 3 Sales Agents
DO $$
DECLARE
  v_tossie_id UUID;
  v_kevin_id UUID;
  v_brenda_id UUID;
  v_lead_id UUID;
BEGIN
  SELECT id INTO v_tossie_id FROM public.staff_members WHERE lower(email) = 'cherrylatulah@gmail.com' LIMIT 1;
  SELECT id INTO v_kevin_id  FROM public.staff_members WHERE lower(email) = 'kevin@ndakala-demo.co.ke' LIMIT 1;
  SELECT id INTO v_brenda_id FROM public.staff_members WHERE lower(email) = 'brenda@ndakala-demo.co.ke' LIMIT 1;

  -- ==========================================================================
  -- AGENT 1: TOSSIE (cherrylatulah@gmail.com) — 8 Demo Leads
  -- ==========================================================================

  -- T1: NEW INQUIRY — Microsoft 365 Email
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Mercy Wambui', 'm.wambui@savannahagro.co.ke', '+254722410882',
    'Savannah Agro Exports Ltd', 'microsoft_365_email', 'new_lead',
    'cherrylatulah@gmail.com', v_tossie_id, true, 850000,
    'active', NOW() + INTERVAL '4 hours', 'Send Tax Health Check Scope',
    'Outlook email to info@: Seeking FY 2026 statutory audit & KRA tax health check across 2 branches.',
    NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '25 minutes'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'cherrylatulah@gmail.com', 'Tossie', 'microsoft_365_email',
    'Auto-captured from Microsoft 365 Outlook inbox (info@). Assigned to Tossie with 2-hour SLA alert.');

  -- T2: NEW INQUIRY — WhatsApp Inbound
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Catherine Mwangi', 'cmwangi@westlandsmed.co.ke', '+254722619044',
    'Westlands Diagnostic Centre', 'whatsapp', 'new_lead',
    'cherrylatulah@gmail.com', v_tossie_id, true, 780000,
    'active', NOW() + INTERVAL '3 hours', 'Reply on WhatsApp with Tax Retainer Quote',
    'Messaged firm WhatsApp asking for urgent KRA VAT assessment support & monthly payroll tax retainer.',
    NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '45 minutes'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'cherrylatulah@gmail.com', 'Tossie', 'whatsapp',
    'Captured from Business WhatsApp channel and routed to Tossie automatically.');

  -- T3: REPEAT INQUIRY — Microsoft 365 Email
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Dr. Grace Mutua', 'gmutua@riftvalleyhealth.org', '+254720556190',
    'Rift Valley Health Foundation (NGO)', 'microsoft_365_email', 'repeat_lead',
    'cherrylatulah@gmail.com', v_tossie_id, true, 1850000,
    'active', NOW() + INTERVAL '1 day', 'Follow-Up Before Finance Committee Meets',
    'Second Outlook email requesting donor grant compliance audit proposal before Board sits Tuesday.',
    NOW() - INTERVAL '5 hours', NOW() - INTERVAL '3 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'cherrylatulah@gmail.com', 'Tossie', 'microsoft_365_email',
    'Repeat inquiry detected automatically from Outlook — flagged high priority.');

  -- T4: HOT LEAD — Event / Tax Breakfast Forum
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Eng. Benson Kamau', 'bkamau@kilimaniurban.co.ke', '+254722889301',
    'Kilimani Urban Developers Ltd', 'event_forum', 'hot_lead',
    'cherrylatulah@gmail.com', v_tossie_id, true, 1400000,
    'active', NOW() + INTERVAL '18 hours', 'Send Tax Retainer Engagement Letter',
    'Met at Lavington Tax Breakfast Forum. Wants monthly VAT & Transfer Pricing advisory across 3 developments.',
    NOW() - INTERVAL '3 hours', NOW() - INTERVAL '4 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'cherrylatulah@gmail.com', 'Tossie', 'event_forum',
    'Imported from Tax Breakfast Forum attendee list. 48-hour follow-up call completed with CFO.');

  -- T5: HOT LEAD — WhatsApp Inbound
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Brian Kiprop', 'bkiprop@eldoretmilling.co.ke', '+254723811402',
    'Eldoret Grain & Milling Co.', 'whatsapp', 'hot_lead',
    'cherrylatulah@gmail.com', v_tossie_id, true, 1250000,
    'active', NOW() + INTERVAL '12 hours', 'Confirm Engagement Fee with MD',
    'MD reached out via WhatsApp for corporate restructuring & pre-audit readiness ahead of bank facility.',
    NOW() - INTERVAL '2 hours', NOW() - INTERVAL '3 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'cherrylatulah@gmail.com', 'Tossie', 'whatsapp',
    'Scope call done — awaiting final fee sign-off.');

  -- T6: WARM LEAD — Facebook Lead Form
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Lilian Akinyi', 'lakinyi@kareninteriors.co.ke', '+254718309551',
    'Karen Luxury Interiors Ltd', 'facebook_ad', 'warm_lead',
    'cherrylatulah@gmail.com', v_tossie_id, true, 640000,
    'active', NOW() + INTERVAL '2 days', 'Send SME Retainer Comparison Sheet',
    'Submitted Facebook lead form for annual bookkeeping, eTIMS compliance & tax filing.',
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '4 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'cherrylatulah@gmail.com', 'Tossie', 'facebook_ad',
    'Auto-ingested from Facebook Page lead form. Follow-up scheduled.');

  -- T7: BOOKED CONSULTATION — Microsoft 365 Email
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, viewing_date, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Peter Njoroge', 'pnjoroge@nairobifintech.co.ke', '+254728900412',
    'Nairobi FinTech Holdings', 'microsoft_365_email', 'viewing',
    'cherrylatulah@gmail.com', v_tossie_id, true, 2200000,
    'active', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day', 'Partner Strategy Session (Teams)',
    'Booked Partner Consultation via email thread — Series A feasibility study & tax structuring.',
    NOW() - INTERVAL '4 hours', NOW() - INTERVAL '5 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'cherrylatulah@gmail.com', 'Tossie', 'consultation_scheduled',
    'Microsoft Teams invite locked with Managing Partner for tomorrow 11:00 AM.');

  -- T8: WON DEAL — Event / Tax Breakfast Forum
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Faith Muthoni', 'fmuthoni@apexmanufacturing.co.ke', '+254722771204',
    'Apex Manufacturing Kenya Ltd', 'event_forum', 'closed_won',
    'cherrylatulah@gmail.com', v_tossie_id, true, 1650000,
    'completed', 'Engagement Signed',
    'Signed Annual Statutory Audit & Tax Compliance Retainer following Tax Breakfast Forum follow-up.',
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '14 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'cherrylatulah@gmail.com', 'Tossie', 'sales_agent',
    'Engagement letter signed (KES 1.65M/yr). Full audit trail preserved.');

  -- ==========================================================================
  -- AGENT 2: KEVIN MWANGI (kevin@ndakala-demo.co.ke) — 5 Demo Leads
  -- ==========================================================================

  -- K1: NEW INQUIRY — Microsoft 365 Email
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Amina Hassan', 'ahassan@mombasafreight.co.ke', '+254724331098',
    'Mombasa Freight & Clearing LLP', 'microsoft_365_email', 'new_lead',
    'kevin@ndakala-demo.co.ke', v_kevin_id, true, 1100000,
    'active', NOW() + INTERVAL '5 hours', 'Scope Cross-Border Kenya & Uganda Audit',
    'Outlook inquiry regarding statutory audit across Nairobi & Kampala logistics subsidiaries.',
    NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'kevin@ndakala-demo.co.ke', 'Kevin Mwangi', 'microsoft_365_email',
    'Captured from Outlook inbox and routed to Audit & Assurance Desk.');

  -- K2: HOT LEAD — Website Contact Form
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Daniel Mutiso', 'dmutiso@machakossacco.co.ke', '+254721904411',
    'Eastern Highlands SACCO', 'website_enquiry', 'hot_lead',
    'kevin@ndakala-demo.co.ke', v_kevin_id, true, 1950000,
    'active', NOW() + INTERVAL '1 day', 'Present SASRA Compliance Audit Fee',
    'Submitted website "Book a Call" form requesting SASRA statutory external audit proposal.',
    NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'kevin@ndakala-demo.co.ke', 'Kevin Mwangi', 'website_enquiry',
    'Board chairman reviewed technical credentials; awaiting final commercial sign-off.');

  -- K3: WARM LEAD — Event / Compliance Forum
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Samuel Kipchoge', 'skipchoge@highlandtea.co.ke', '+254721667342',
    'Highland Tea Processors Ltd', 'event_forum', 'warm_lead',
    'kevin@ndakala-demo.co.ke', v_kevin_id, true, 950000,
    'active', NOW() + INTERVAL '4 days', '7-Day Forum Check-In Call',
    'Attended Q4 Compliance Forum. Reviewing internal audit co-sourcing quotes for Q1.',
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '6 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'kevin@ndakala-demo.co.ke', 'Kevin Mwangi', 'event_forum',
    'Sent Compliance Forum summary deck via Outlook.');

  -- K4: BOOKED CONSULTATION — Facebook Lead Form
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, viewing_date, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Joyce Wanjiku', 'jwanjiku@upperhillpharma.co.ke', '+254725118704',
    'Upper Hill Pharma Distributors', 'facebook_ad', 'viewing',
    'kevin@ndakala-demo.co.ke', v_kevin_id, true, 1300000,
    'active', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days', 'Audit Scoping Meeting (Lavington HQ)',
    'Facebook Business campaign inquiry for inventory control & internal audit review.',
    NOW() - INTERVAL '8 hours', NOW() - INTERVAL '4 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'kevin@ndakala-demo.co.ke', 'Kevin Mwangi', 'consultation_scheduled',
    'In-person scoping meeting confirmed at Lavington HQ.');

  -- K5: WON DEAL — Microsoft 365 Email
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'CPA George Omondi', 'gomondi@kisumupolymers.co.ke', '+254722300918',
    'Kisumu Industrial Polymers Ltd', 'microsoft_365_email', 'closed_won',
    'kevin@ndakala-demo.co.ke', v_kevin_id, true, 2100000,
    'completed', 'Statutory Audit Signed',
    'Signed 2-year external statutory audit & quarterly management review retainer.',
    NOW() - INTERVAL '2 days', NOW() - INTERVAL '16 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'kevin@ndakala-demo.co.ke', 'Kevin Mwangi', 'sales_agent',
    'Signed engagement letter uploaded (KES 2.1M).');

  -- ==========================================================================
  -- AGENT 3: BRENDA AKOTH (brenda@ndakala-demo.co.ke) — 5 Demo Leads
  -- ==========================================================================

  -- B1: NEW INQUIRY — Tender / RFP
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'David Ochieng', 'procurement@maritimelogistics.go.ke', '+254733908114',
    'Kenya Maritime Logistics Authority', 'tender_rfp', 'new_lead',
    'brenda@ndakala-demo.co.ke', v_brenda_id, true, 4200000,
    'active', NOW() + INTERVAL '2 days', 'Tender Submission Deadline — RFP #KMLA/2026/14',
    'Public Sector External Audit RFP captured via Tender Alert email. Compliance docs due in 6 days.',
    NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'brenda@ndakala-demo.co.ke', 'Brenda Akoth', 'tender_rfp',
    'RFP #KMLA/2026/14 logged automatically. Partner bid/no-bid review scheduled.');

  -- B2: HOT LEAD — Tender / RFP
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Beatrice Njoki', 'bnjoki@earenewables.org', '+254719442018',
    'East Africa Renewable Energy Trust', 'tender_rfp', 'hot_lead',
    'brenda@ndakala-demo.co.ke', v_brenda_id, true, 3600000,
    'active', NOW() + INTERVAL '1 day', 'Submit Final Financial Proposal — 2:00 PM Cutoff',
    'Shortlisted for Forensic & Systems Vulnerability Audit. Technical score passed; financial bid due tomorrow.',
    NOW() - INTERVAL '1 hour', NOW() - INTERVAL '9 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'brenda@ndakala-demo.co.ke', 'Brenda Akoth', 'tender_rfp',
    'Managing Partner notified 24h before submission cutoff.');

  -- B3: WARM LEAD — WhatsApp Inbound
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Hassan Abdullahi', 'habdullahi@northriftwater.org', '+254720884321',
    'North Rift Community Water Trust', 'whatsapp', 'warm_lead',
    'brenda@ndakala-demo.co.ke', v_brenda_id, true, 1450000,
    'active', NOW() + INTERVAL '3 days', 'Share PBO Compliance Checklist',
    'WhatsApp inquiry from Programme Director requesting PBO donor fund audit quote.',
    NOW() - INTERVAL '12 hours', NOW() - INTERVAL '5 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'brenda@ndakala-demo.co.ke', 'Brenda Akoth', 'whatsapp',
    'Sent NGO/PBO audit credentials deck via WhatsApp & Outlook.');

  -- B4: REPEAT INQUIRY — Website Contact Form
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Esther Chebet', 'echebet@nakuruagrihub.org', '+254712650933',
    'Nakuru Agri-Business Hub (Donor Project)', 'website_enquiry', 'repeat_lead',
    'brenda@ndakala-demo.co.ke', v_brenda_id, true, 1700000,
    'active', NOW() + INTERVAL '1 day', 'Send Revised Multi-Year Bid',
    'Returned to website portal asking for Phase 2 grant verification audit scope.',
    NOW() - INTERVAL '6 hours', NOW() - INTERVAL '8 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'brenda@ndakala-demo.co.ke', 'Brenda Akoth', 'website_enquiry',
    'Repeat inquiry flagged automatically under Brenda Akoth.');

  -- B5: WON DEAL — Tender / RFP
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Hon. James Otieno', 'director@lakebasinwater.go.ke', '+254733519088',
    'Lake Basin Water Project (Public Sector)', 'tender_rfp', 'closed_won',
    'brenda@ndakala-demo.co.ke', v_brenda_id, true, 5400000,
    'completed', 'Tender Awarded',
    'Awarded 2-year Public Sector Assurance Engagement — tracked from RFP intake to contract award.',
    NOW() - INTERVAL '2 days', NOW() - INTERVAL '21 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'brenda@ndakala-demo.co.ke', 'Brenda Akoth', 'tender_rfp',
    'Award notification received (KES 5.4M). Zero missed submission milestones.');
END $$;
