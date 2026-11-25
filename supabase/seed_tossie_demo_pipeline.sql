-- ==============================================================================
-- DEMO SALES AGENT "TOSSIE" (cherrylatulah2000@gmail.com)
-- ADVISORY / MICROSOFT 365 EMAIL / EVENTS / TENDERS PIPELINE SEED
-- Execute in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- Safe & non-destructive: updates cherrylatulah2000@gmail.com to Sales Agent "Tossie"
-- and seeds 10 realistic Advisory/Tax/Audit/Tender demo leads.
-- ==============================================================================

-- 1. Remove any placeholder tossie@cillah.dev rows if an earlier draft was run
DELETE FROM public.lead_notes WHERE lower(author_email) = 'tossie@cillah.dev';
DELETE FROM public.sales_leads WHERE lower(assigned_agent_email) = 'tossie@cillah.dev';
DELETE FROM public.staff_members WHERE lower(email) = 'tossie@cillah.dev';

-- 2. Ensure cherrylatulah2000@gmail.com logs straight into /user/dashboard as "Tossie"
UPDATE public.profiles
SET
  full_name = 'Tossie',
  role = 'user'
WHERE lower(email) = 'cherrylatulah2000@gmail.com';

-- 3. Update staff_members for cherrylatulah2000@gmail.com as Sales Agent "Tossie"
INSERT INTO public.staff_members (
  crm_id,
  email,
  full_name,
  phone_number,
  role,
  status,
  is_active,
  org_id
)
VALUES (
  'CRM-SAGT-003',
  'cherrylatulah2000@gmail.com',
  'Tossie',
  '+254711223344',
  'sales',
  'user',
  true,
  'a1b2c3d4-e5f6-7890-abcd-222222222222'
)
ON CONFLICT (email) DO UPDATE SET
  full_name = 'Tossie',
  role = 'sales',
  status = 'user',
  is_active = true,
  org_id = 'a1b2c3d4-e5f6-7890-abcd-222222222222',
  updated_at = NOW();

-- 4. Seed 10 Realistic Advisory / Audit / Tax / Legal / Tender Leads for Tossie
DO $$
DECLARE
  v_tossie_id UUID;
  v_lead_id UUID;
BEGIN
  SELECT id INTO v_tossie_id
  FROM public.staff_members
  WHERE lower(email) = 'cherrylatulah2000@gmail.com'
  LIMIT 1;

  -- Skip duplicate seeding if Tossie already has demo leads
  IF EXISTS (
    SELECT 1 FROM public.sales_leads
    WHERE lower(assigned_agent_email) = 'cherrylatulah2000@gmail.com'
  ) THEN
    RETURN;
  END IF;

  -- 1. NEW INQUIRY — Microsoft 365 Email (Audit & Tax Health Check)
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Mercy Wambui', 'm.wambui@savannahagro.co.ke', '+254722410882',
    'Savannah Agro Exports Ltd', 'microsoft_365_email', 'new_lead',
    'cherrylatulah2000@gmail.com', v_tossie_id, true, 850000,
    'active', NOW() + INTERVAL '4 hours', 'Send Audit Scope & SLA Response',
    'Outlook inquiry to info@: Seeking FY 2026 statutory audit & KRA tax health check across 2 branches.',
    NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '25 minutes'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (
    v_lead_id, 'cherrylatulah2000@gmail.com', 'Tossie', 'microsoft_365_email',
    'Auto-captured from Microsoft 365 Outlook inbox (info@). Routed to Audit & Tax Lead with 2-hour SLA reminder.'
  );

  -- 2. NEW INQUIRY — Tender / RFP (Public Sector External Audit)
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'David Ochieng', 'procurement@maritimelogistics.go.ke', '+254733908114',
    'Kenya Maritime Logistics Authority', 'tender_rfp', 'new_lead',
    'cherrylatulah2000@gmail.com', v_tossie_id, true, 4200000,
    'active', NOW() + INTERVAL '2 days', 'Tender Submission Deadline — RFP #KMLA/2026/14',
    'Public Sector External Audit RFP captured via Tender Alert email. Mandatory compliance docs due in 6 days.',
    NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (
    v_lead_id, 'cherrylatulah2000@gmail.com', 'Tossie', 'tender_rfp',
    'RFP #KMLA/2026/14 logged automatically. Teams alert sent to Public Sector Audit desk for bid/no-bid approval.'
  );

  -- 3. REPEAT INQUIRY — Microsoft 365 Email (NGO Donor Compliance Audit)
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Dr. Grace Mutua', 'gmutua@riftvalleyhealth.org', '+254720556190',
    'Rift Valley Health Foundation (NGO)', 'microsoft_365_email', 'repeat_lead',
    'cherrylatulah2000@gmail.com', v_tossie_id, true, 1850000,
    'active', NOW() + INTERVAL '1 day', 'Follow-Up Before Finance Committee Meets',
    'Second Outlook email requesting donor grant compliance audit proposal before Board sits Tuesday.',
    NOW() - INTERVAL '5 hours', NOW() - INTERVAL '3 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (
    v_lead_id, 'cherrylatulah2000@gmail.com', 'Tossie', 'microsoft_365_email',
    'Repeat inquiry detected automatically from Outlook — flagged high priority for Partner review.'
  );

  -- 4. HOT LEAD — Tax Breakfast Forum (Transfer Pricing & VAT Retainer)
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Eng. Benson Kamau', 'bkamau@kilimaniurban.co.ke', '+254722889301',
    'Kilimani Urban Developers Ltd', 'event_forum', 'hot_lead',
    'cherrylatulah2000@gmail.com', v_tossie_id, true, 1400000,
    'active', NOW() + INTERVAL '18 hours', 'Send Tax Retainer Engagement Letter',
    'Met at Lavington Tax Breakfast Forum. Wants monthly VAT & Transfer Pricing advisory across 3 developments.',
    NOW() - INTERVAL '3 hours', NOW() - INTERVAL '4 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (
    v_lead_id, 'cherrylatulah2000@gmail.com', 'Tossie', 'event_forum',
    'Imported from Tax Breakfast Forum attendee sheet. Automatic 48-hour follow-up triggered call with CFO.'
  );

  -- 5. HOT LEAD — Tender / RFP (Shortlisted Forensic & Systems Audit)
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Beatrice Njoki', 'bnjoki@earenewables.org', '+254719442018',
    'East Africa Renewable Energy Trust', 'tender_rfp', 'hot_lead',
    'cherrylatulah2000@gmail.com', v_tossie_id, true, 3600000,
    'active', NOW() + INTERVAL '1 day', 'Submit Final Financial Proposal — 2:00 PM Cutoff',
    'Shortlisted for Forensic & Internal Systems Vulnerability Audit. Technical score passed; financial bid due tomorrow.',
    NOW() - INTERVAL '1 hour', NOW() - INTERVAL '9 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (
    v_lead_id, 'cherrylatulah2000@gmail.com', 'Tossie', 'tender_rfp',
    'Managing Partner notified via Outlook reminder 24 hours before submission cutoff.'
  );

  -- 6. WARM LEAD — Compliance Forum (Annual Tax Compliance Retainer)
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Samuel Kipchoge', 'skipchoge@highlandtea.co.ke', '+254721667342',
    'Highland Tea Processors Ltd', 'event_forum', 'warm_lead',
    'cherrylatulah2000@gmail.com', v_tossie_id, true, 950000,
    'active', NOW() + INTERVAL '5 days', '7-Day Forum Check-In Call',
    'Attended Q4 Compliance Forum. Comparing annual tax compliance retainer quotes for Q1 board approval.',
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '6 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (
    v_lead_id, 'cherrylatulah2000@gmail.com', 'Tossie', 'event_forum',
    'Sent Compliance Forum summary deck via Outlook. Automated 7-day check-in scheduled.'
  );

  -- 7. WARM LEAD — Microsoft 365 Email (Cross-Border Kenya & Uganda Advisory)
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Amina Hassan', 'ahassan@mombasafreight.co.ke', '+254724331098',
    'Mombasa Freight & Clearing LLP', 'microsoft_365_email', 'warm_lead',
    'cherrylatulah2000@gmail.com', v_tossie_id, true, 1100000,
    'active', NOW() + INTERVAL '3 days', 'Share Kenya-Uganda Tax Structuring Brief',
    'Outlook inquiry regarding cross-border corporate restructuring & employment tax advisory (Nairobi & Kampala).',
    NOW() - INTERVAL '2 days', NOW() - INTERVAL '7 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (
    v_lead_id, 'cherrylatulah2000@gmail.com', 'Tossie', 'microsoft_365_email',
    'Email auto-routed to Advisory & Kampala partner desk for joint scoping.'
  );

  -- 8. BOOKED CONSULTATION — Microsoft 365 Email (Corporate Finance & Feasibility Study)
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, viewing_date, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Peter Njoroge', 'pnjoroge@nairobifintech.co.ke', '+254728900412',
    'Nairobi FinTech Holdings', 'microsoft_365_email', 'viewing',
    'cherrylatulah2000@gmail.com', v_tossie_id, true, 2200000,
    'active', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day', 'Partner Strategy Session (Teams)',
    'Booked Partner Consultation via email thread — Series A feasibility study, business case & investment advisory.',
    NOW() - INTERVAL '4 hours', NOW() - INTERVAL '5 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (
    v_lead_id, 'cherrylatulah2000@gmail.com', 'Tossie', 'consultation_scheduled',
    'Microsoft Teams invite locked with Managing Partner & Corporate Finance Lead for tomorrow 11:00 AM.'
  );

  -- 9. WON DEAL — Tax Breakfast Forum (Annual Statutory Audit + Tax Retainer)
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Faith Muthoni', 'fmuthoni@apexmanufacturing.co.ke', '+254722771204',
    'Apex Manufacturing Kenya Ltd', 'event_forum', 'closed_won',
    'cherrylatulah2000@gmail.com', v_tossie_id, true, 1650000,
    'completed', 'Engagement Signed',
    'Signed Annual Statutory Audit & Tax Compliance Retainer following structured Tax Breakfast Forum follow-up.',
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '14 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (
    v_lead_id, 'cherrylatulah2000@gmail.com', 'Tossie', 'sales_agent',
    'Engagement letter signed (KES 1.65M/yr). Full audit trail preserved from initial Event capture to Win.'
  );

  -- 10. WON DEAL — Tender / RFP (2-Year Public Sector Assurance Award)
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Hon. James Otieno', 'director@lakebasinwater.go.ke', '+254733519088',
    'Lake Basin Water Project (Public Sector)', 'tender_rfp', 'closed_won',
    'cherrylatulah2000@gmail.com', v_tossie_id, true, 5400000,
    'completed', 'Tender Awarded',
    'Awarded 2-year Public Sector Assurance Engagement — tracked from initial RFP intake through deadline alerts to contract award.',
    NOW() - INTERVAL '2 days', NOW() - INTERVAL '21 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (
    v_lead_id, 'cherrylatulah2000@gmail.com', 'Tossie', 'tender_rfp',
    'Award notification received (KES 5.4M). Zero missed submission milestones.'
  );
END $$;
