-- ==============================================================================
-- ROSY REALTORS NAIROBI (ISOLATED DEMO ORG) + CILLAH.DEV PRODUCTION CLEANUP
-- Execute in Supabase Dashboard -> SQL Editor -> New Query -> Run
--
-- What this script does (100% safe — NEVER touches atulah@cillah.dev's real leads!):
-- 1. Removes the 10 leftover draft demo rows from cherrylatulah2000@gmail.com
--    and deactivates cherrylatulah2000@gmail.com in cillah.dev so atulah@cillah.dev
--    is the ONLY real sales agent in cillah.dev (plus awuorcillah@gmail.com Admin).
-- 2. Renames Demo Organization (a1b2c3d4-e5f6-7890-abcd-555555555555) to
--    "Rosy Realtors Nairobi" (slug: rosy-realtors).
-- 3. Sets up 3 Demo Sales Agents inside Rosy Realtors Nairobi:
--      - Tossie (cherrylatulah@gmail.com) -> 8 Nairobi real estate buyer leads
--      - Kevin Mwangi (kevin@rosyrealtors.co.ke) -> 5 Nairobi real estate buyer leads
--      - Brenda Akoth (brenda@rosyrealtors.co.ke) -> 5 Nairobi real estate buyer leads
-- 4. Seeds 18 realistic Nairobi Real Estate fake leads across Kilimani, Lavington,
--    Runda, Karen, Westlands, Kileleshwa, Riverside, Muthaiga & Gigiri + 6 live
--    follow-up activity logs.
-- ==============================================================================

-- 1. Clean cillah.dev so ONLY real production users & leads exist
DELETE FROM public.lead_notes
WHERE lead_id IN (
  SELECT id FROM public.sales_leads WHERE lower(assigned_agent_email) = 'cherrylatulah2000@gmail.com'
);
DELETE FROM public.sales_leads
WHERE lower(assigned_agent_email) = 'cherrylatulah2000@gmail.com';

UPDATE public.staff_members
SET is_active = false, updated_at = NOW()
WHERE lower(email) = 'cherrylatulah2000@gmail.com';

-- Ensure awuorcillah@gmail.com (Admin) & atulah@cillah.dev (User) are cleanly linked to cillah.dev
UPDATE public.staff_members
SET org_id = 'a1b2c3d4-e5f6-7890-abcd-222222222222', is_active = true
WHERE lower(email) IN ('awuorcillah@gmail.com', 'atulah@cillah.dev');

-- 2. Upsert "Rosy Realtors Nairobi" Demo Organization
INSERT INTO public.organizations (id, name, slug, website)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-555555555555',
  'Rosy Realtors Nairobi',
  'rosy-realtors',
  'https://rosyrealtors.co.ke'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  website = EXCLUDED.website;

-- 3. Clean up old Ndakala demo leads & demo agent rows before seeding Nairobi Real Estate leads
DELETE FROM public.lead_activities
WHERE org_id = 'a1b2c3d4-e5f6-7890-abcd-555555555555';

DELETE FROM public.lead_notes
WHERE lower(author_email) IN (
  'cherrylatulah@gmail.com',
  'kevin@ndakala-demo.co.ke',
  'brenda@ndakala-demo.co.ke',
  'kevin@rosyrealtors.co.ke',
  'brenda@rosyrealtors.co.ke'
);

DELETE FROM public.sales_leads
WHERE lower(assigned_agent_email) IN (
  'cherrylatulah@gmail.com',
  'kevin@ndakala-demo.co.ke',
  'brenda@ndakala-demo.co.ke',
  'kevin@rosyrealtors.co.ke',
  'brenda@rosyrealtors.co.ke'
);

DELETE FROM public.staff_members
WHERE lower(email) IN ('kevin@ndakala-demo.co.ke', 'brenda@ndakala-demo.co.ke');

-- 4. Upsert 3 Nairobi Real Estate Demo Sales Agents strictly inside Rosy Realtors Nairobi
INSERT INTO public.staff_members (crm_id, email, full_name, phone_number, role, status, is_active, org_id)
VALUES
  ('ROSY-AGT-001', 'cherrylatulah@gmail.com', 'Tossie', '+254711223344', 'sales', 'user', true, 'a1b2c3d4-e5f6-7890-abcd-555555555555'),
  ('ROSY-AGT-002', 'kevin@rosyrealtors.co.ke', 'Kevin Mwangi', '+254722104590', 'sales', 'user', true, 'a1b2c3d4-e5f6-7890-abcd-555555555555'),
  ('ROSY-AGT-003', 'brenda@rosyrealtors.co.ke', 'Brenda Akoth', '+254733890122', 'sales', 'user', true, 'a1b2c3d4-e5f6-7890-abcd-555555555555')
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = 'sales',
  status = 'user',
  is_active = true,
  org_id = 'a1b2c3d4-e5f6-7890-abcd-555555555555',
  updated_at = NOW();

-- 5. Seed 18 Realistic Nairobi Real Estate Buyer & Investor Leads
DO $$
DECLARE
  v_org_id UUID := 'a1b2c3d4-e5f6-7890-abcd-555555555555';
  v_tossie_id UUID;
  v_kevin_id UUID;
  v_brenda_id UUID;
  v_lead_id UUID;
  v_t1 UUID;
  v_t4 UUID;
  v_k1 UUID;
  v_b1 UUID;
  v_b2 UUID;
BEGIN
  SELECT id INTO v_tossie_id FROM public.staff_members WHERE lower(email) = 'cherrylatulah@gmail.com' LIMIT 1;
  SELECT id INTO v_kevin_id  FROM public.staff_members WHERE lower(email) = 'kevin@rosyrealtors.co.ke' LIMIT 1;
  SELECT id INTO v_brenda_id FROM public.staff_members WHERE lower(email) = 'brenda@rosyrealtors.co.ke' LIMIT 1;

  -- ==========================================================================
  -- AGENT 1: TOSSIE (cherrylatulah@gmail.com) — 8 Nairobi Real Estate Leads
  -- ==========================================================================

  -- T1: NEW INQUIRY — WhatsApp (Kilimani 3BR + DSQ Apartment)
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Mercy Wambui', 'm.wambui@diasporahomes.co.ke', '+254722410882',
    'Kilimani 3BR + DSQ • Cash Buyer', 'whatsapp', 'new_lead',
    'cherrylatulah@gmail.com', v_tossie_id, true, 16500000,
    'active', NOW() + INTERVAL '3 hours', 'Send Kilimani Floor Plans & Payment Plan',
    'WhatsApp inquiry on 3BR + DSQ near Yaya Centre. Cash buyer relocating from UK in June.',
    NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '25 minutes'
  ) RETURNING id INTO v_t1;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_t1, 'cherrylatulah@gmail.com', 'Tossie', 'whatsapp',
    'Auto-captured from Rosy Realtors WhatsApp. Requested 3BR + DSQ brochure along Argwings Kodhek Rd.');

  -- T2: NEW INQUIRY — Instagram DM (Westlands Luxury Penthouse)
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Catherine Mwangi', 'cmwangi@westlandsventures.co.ke', '+254722619044',
    'Westlands 4BR Duplex Penthouse', 'instagram_dm', 'new_lead',
    'cherrylatulah@gmail.com', v_tossie_id, true, 42000000,
    'active', NOW() + INTERVAL '5 hours', 'Confirm Penthouse Viewing Slot',
    'Sent Instagram DM on our Westlands Skyview duplex reel. Asking about rooftop pool & service charge.',
    NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '45 minutes'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'cherrylatulah@gmail.com', 'Tossie', 'instagram_dm',
    'Instagram DM lead auto-assigned to Tossie. Interested in Saturday morning viewing.');

  -- T3: REPEAT INQUIRY — Email (Lavington 5BR Townhouse)
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Dr. Grace Mutua', 'gmutua@nairobihospitalists.org', '+254720556190',
    'Lavington 5BR Gated Townhouse', 'email_campaign', 'repeat_lead',
    'cherrylatulah@gmail.com', v_tossie_id, true, 58000000,
    'active', NOW() + INTERVAL '1 day', 'Send Mortgage Pre-Approval Intro',
    'Replied to Lavington newsletter for the second time — wants 5BR townhouse near Braeburn School.',
    NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'cherrylatulah@gmail.com', 'Tossie', 'email_campaign',
    'Repeat inquiry flagged automatically — high-intent family buyer.');

  -- T4: HOT LEAD — Property Expo (Kileleshwa Off-Plan 2BR Investment Units)
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Eng. Benson Kamau', 'bkamau@riftinvest.co.ke', '+254722889301',
    'Kileleshwa 2x 2BR Off-Plan Units', 'event_forum', 'hot_lead',
    'cherrylatulah@gmail.com', v_tossie_id, true, 24000000,
    'active', NOW() + INTERVAL '16 hours', 'Send Letter of Offer for Units 8B & 9B',
    'Met at Nairobi Homes Expo (Sarit Centre). Purchasing 2 off-plan 2BR apartments for Airbnb yield.',
    NOW() - INTERVAL '2 hours', NOW() - INTERVAL '4 days'
  ) RETURNING id INTO v_t4;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_t4, 'cherrylatulah@gmail.com', 'Tossie', 'event_forum',
    'Reviewed 24-month 0% installment schedule. Ready to pay 20% deposit this Friday.');

  -- T5: HOT LEAD — WhatsApp (Riverside Drive 3BR Executive Suite)
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Brian Kiprop', 'bkiprop@eastafricacapital.co.ke', '+254723811402',
    'Riverside Drive 3BR Executive Suite', 'whatsapp', 'hot_lead',
    'cherrylatulah@gmail.com', v_tossie_id, true, 28500000,
    'active', NOW() + INTERVAL '12 hours', 'Confirm Offer Price with Developer',
    'Viewed Riverside Residence yesterday — negotiating KES 1.5M discount for 50% upfront payment.',
    NOW() - INTERVAL '2 hours', NOW() - INTERVAL '3 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'cherrylatulah@gmail.com', 'Tossie', 'whatsapp',
    'Client loved the river view unit on 11th floor. Preparing formal offer letter.');

  -- T6: WARM LEAD — Facebook Ad (Karen 1/2-Acre Prime Residential Plot)
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Lilian Akinyi', 'lakinyi@kareninteriors.co.ke', '+254718309551',
    'Karen Hardy 1/2-Acre Plot', 'facebook_ad', 'warm_lead',
    'cherrylatulah@gmail.com', v_tossie_id, true, 36000000,
    'active', NOW() + INTERVAL '2 days', 'Share Title Deed Copy for Advocate Search',
    'Submitted Facebook lead form for gated half-acre plot off Bogani Road, Karen.',
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '5 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'cherrylatulah@gmail.com', 'Tossie', 'facebook_ad',
    'Sent mutation map & pin location. Buyer reviewing with family advocate.');

  -- T7: BOOKED CONSULTATION / SITE VIEWING — Website (Runda 5BR Ambassadorial Villa)
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, viewing_date, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Peter Njoroge', 'pnjoroge@nairobifintech.co.ke', '+254728900412',
    'Runda 5BR Ambassadorial Villa', 'website_enquiry', 'viewing',
    'cherrylatulah@gmail.com', v_tossie_id, true, 95000000,
    'active', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day', 'Private Site Viewing — Runda Mimosa',
    'Booked private site viewing via Rosy Realtors website for 5BR standalone villa on 1/2 acre in Runda.',
    NOW() - INTERVAL '3 hours', NOW() - INTERVAL '5 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'cherrylatulah@gmail.com', 'Tossie', 'consultation_scheduled',
    'Site viewing confirmed for tomorrow 11:00 AM with spouse and architect.');

  -- T8: WON DEAL — WhatsApp (Kilimani 2BR Furnished Investment Apartment)
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Faith Muthoni', 'fmuthoni@apexlogistics.co.ke', '+254722771204',
    'Kilimani 2BR Furnished Residence', 'whatsapp', 'closed_won',
    'cherrylatulah@gmail.com', v_tossie_id, true, 13800000,
    'completed', 'Sale Agreement Signed',
    'Closed cash purchase of 2BR luxury apartment along Denis Pritt Road — 100% deposit cleared.',
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '14 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'cherrylatulah@gmail.com', 'Tossie', 'sales_agent',
    'Sale agreement executed (KES 13.8M). Commission invoiced.');

  -- ==========================================================================
  -- AGENT 2: KEVIN MWANGI (kevin@rosyrealtors.co.ke) — 5 Nairobi Leads
  -- ==========================================================================

  -- K1: NEW INQUIRY — Email (Upper Hill Grade-A Commercial Office Floor)
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Amina Hassan', 'ahassan@mombasafreight.co.ke', '+254724331098',
    'Upper Hill 4,500 sq.ft Office Suite', 'email_campaign', 'new_lead',
    'kevin@rosyrealtors.co.ke', v_kevin_id, true, 54000000,
    'active', NOW() + INTERVAL '4 hours', 'Send Upper Hill Commercial Spec Sheet',
    'Corporate HQ expansion inquiry — looking to purchase 4,500 sq.ft fitted office in Upper Hill or Westlands.',
    NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'
  ) RETURNING id INTO v_k1;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_k1, 'kevin@rosyrealtors.co.ke', 'Kevin Mwangi', 'email_campaign',
    'Commercial buyer routed to Kevin Mwangi. Comparing Prism Tower vs GTC Office suites.');

  -- K2: HOT LEAD — Website (Gigiri Diplomatic 4BR Residence)
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Daniel Mutiso', 'dmutiso@unhabitat-staff.org', '+254721904411',
    'Gigiri 4BR UN-Approved Villa', 'website_enquiry', 'hot_lead',
    'kevin@rosyrealtors.co.ke', v_kevin_id, true, 78000000,
    'active', NOW() + INTERVAL '1 day', 'Finalize UN Security Inspection',
    'Website inquiry for UN-approved 4BR home in Gigiri near Village Market. Financing pre-approved.',
    NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'kevin@rosyrealtors.co.ke', 'Kevin Mwangi', 'website_enquiry',
    'Second viewing completed — buyer preparing formal offer.');

  -- K3: WARM LEAD — Property Expo (Syokimau 4BR Maisonette)
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Samuel Kipchoge', 'skipchoge@highlandtea.co.ke', '+254721667342',
    'Syokimau 4BR Gated Maisonette', 'event_forum', 'warm_lead',
    'kevin@rosyrealtors.co.ke', v_kevin_id, true, 18500000,
    'active', NOW() + INTERVAL '3 days', 'Follow-Up After Bank Valuation',
    'Met at Nairobi Homes Expo. Comparing 4BR gated community homes off Mombasa Road.',
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '6 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'kevin@rosyrealtors.co.ke', 'Kevin Mwangi', 'event_forum',
    'Shared show-house video walkthrough on WhatsApp.');

  -- K4: BOOKED CONSULTATION / VIEWING — Facebook Ad (Kileleshwa 3BR Penthouse)
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, viewing_date, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Joyce Wanjiku', 'jwanjiku@upperhillpharma.co.ke', '+254725118704',
    'Kileleshwa 3BR Garden Apartment', 'facebook_ad', 'viewing',
    'kevin@rosyrealtors.co.ke', v_kevin_id, true, 21000000,
    'active', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days', 'Site Tour — Othaya Road Residences',
    'Facebook campaign buyer booked weekend tour of 3BR + DSQ garden apartment in Kileleshwa.',
    NOW() - INTERVAL '8 hours', NOW() - INTERVAL '4 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'kevin@rosyrealtors.co.ke', 'Kevin Mwangi', 'consultation_scheduled',
    'Viewing locked for Saturday 10:30 AM at Othaya Road.');

  -- K5: WON DEAL — Email (Lavington 4BR Luxury Townhouse)
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'George Omondi', 'gomondi@kisumupolymers.co.ke', '+254722300918',
    'Lavington 4BR Corner Townhouse', 'email_campaign', 'closed_won',
    'kevin@rosyrealtors.co.ke', v_kevin_id, true, 48000000,
    'completed', 'Deposit & Agreement Closed',
    'Closed 4BR luxury corner townhouse off James Gichuru Road — 30% deposit received.',
    NOW() - INTERVAL '2 days', NOW() - INTERVAL '16 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'kevin@rosyrealtors.co.ke', 'Kevin Mwangi', 'sales_agent',
    'Closed at KES 48M. Advocates finalizing transfer.');

  -- ==========================================================================
  -- AGENT 3: BRENDA AKOTH (brenda@rosyrealtors.co.ke) — 5 Nairobi Leads
  -- ==========================================================================

  -- B1: NEW INQUIRY — Instagram DM (Muthaiga 5BR Heritage Villa)
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'David Ochieng', 'dochieng@capitalgroup.co.ke', '+254733908114',
    'Muthaiga 5BR Villa on 1 Acre', 'instagram_dm', 'new_lead',
    'brenda@rosyrealtors.co.ke', v_brenda_id, true, 115000000,
    'active', NOW() + INTERVAL '2 days', 'Send Private Muthaiga Dossier',
    'High-net-worth Instagram DM inquiring about off-market 5BR residence in Old Muthaiga.',
    NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'
  ) RETURNING id INTO v_b1;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_b1, 'brenda@rosyrealtors.co.ke', 'Brenda Akoth', 'instagram_dm',
    'VIP private viewing requested — verifying proof of funds.');

  -- B2: HOT LEAD — WhatsApp (Westlands GTC 2BR Serviced Apartment)
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Beatrice Njoki', 'bnjoki@earenewables.org', '+254719442018',
    'Westlands GTC 2BR Serviced Suite', 'whatsapp', 'hot_lead',
    'brenda@rosyrealtors.co.ke', v_brenda_id, true, 31500000,
    'active', NOW() + INTERVAL '1 day', 'Sign Reservation Form Before 4:00 PM',
    'Ready to reserve 18th-floor 2BR executive unit at GTC Westlands for corporate rental yield.',
    NOW() - INTERVAL '1 hour', NOW() - INTERVAL '7 days'
  ) RETURNING id INTO v_b2;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_b2, 'brenda@rosyrealtors.co.ke', 'Brenda Akoth', 'whatsapp',
    'Reservation invoice sent — awaiting RTGS slip.');

  -- B3: BOOKED CONSULTATION / VIEWING — WhatsApp (Karen 5BR Contemporary Villa)
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, viewing_date, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Hassan Abdullahi', 'habdullahi@horntrade.co.ke', '+254720884321',
    'Karen 5BR Contemporary Villa', 'whatsapp', 'viewing',
    'brenda@rosyrealtors.co.ke', v_brenda_id, true, 88000000,
    'active', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day', 'Site Tour — Karen Miotoni Villa',
    'Booked private viewing of newly completed 5BR villa with heated pool in Karen Miotoni.',
    NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'brenda@rosyrealtors.co.ke', 'Brenda Akoth', 'consultation_scheduled',
    'Confirmed chauffeur pickup and gate clearance at Miotoni.');

  -- B4: REPEAT INQUIRY — Website (Westlands Commercial Retail Space)
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, next_followup_at, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'Esther Chebet', 'echebet@artisanroasters.co.ke', '+254712650933',
    'Westlands Ground-Floor Retail Space', 'website_enquiry', 'repeat_lead',
    'brenda@rosyrealtors.co.ke', v_brenda_id, true, 27000000,
    'active', NOW() + INTERVAL '2 days', 'Send Revised Lease-to-Own Terms',
    'Returned to website asking about ground-floor cafe retail space along Woodvale Grove.',
    NOW() - INTERVAL '6 hours', NOW() - INTERVAL '8 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'brenda@rosyrealtors.co.ke', 'Brenda Akoth', 'website_enquiry',
    'Repeat inquiry flagged automatically under Brenda Akoth.');

  -- B5: WON DEAL — Facebook Ad (Runda 4BR Contemporary Townhouse)
  INSERT INTO public.sales_leads (
    full_name, email, phone_number, company_name, source, stage,
    assigned_agent_email, assigned_agent_id, is_qualified, estimated_value,
    followup_status, followup_title, initial_note,
    last_interaction_at, created_at
  ) VALUES (
    'James Otieno', 'jotieno@lakebasinholdings.co.ke', '+254733519088',
    'Runda 4BR Luxury Townhouse', 'facebook_ad', 'closed_won',
    'brenda@rosyrealtors.co.ke', v_brenda_id, true, 64000000,
    'completed', 'Sale Closed & Handed Over',
    'Facebook lead converted to full purchase of 4BR townhouse in Runda Paradise.',
    NOW() - INTERVAL '2 days', NOW() - INTERVAL '19 days'
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_notes (lead_id, author_email, author_name, source, note_text)
  VALUES (v_lead_id, 'brenda@rosyrealtors.co.ke', 'Brenda Akoth', 'sales_agent',
    'Closed at KES 64M. Keys handed over.');

  -- 6. Seed 6 Live Nairobi Real Estate Follow-Up Activities for Executive Activity Log
  INSERT INTO public.lead_activities (lead_id, org_id, agent_email, agent_name, lead_name, activity_type, summary, duration_seconds, created_at)
  VALUES
    (v_t1, v_org_id, 'cherrylatulah@gmail.com', 'Tossie', 'Mercy Wambui', 'whatsapp_click', 'Sent Kilimani 3BR + DSQ brochure & payment schedule on WhatsApp', NULL, NOW() - INTERVAL '15 minutes'),
    (v_t4, v_org_id, 'cherrylatulah@gmail.com', 'Tossie', 'Eng. Benson Kamau', 'call_logged', 'Confirmed 20% deposit timeline for Kileleshwa Units 8B & 9B', 385, NOW() - INTERVAL '48 minutes'),
    (v_t4, v_org_id, 'cherrylatulah@gmail.com', 'Tossie', 'Eng. Benson Kamau', 'ai_draft', 'Drafted WhatsApp offer confirmation using Personal Sales AI', NULL, NOW() - INTERVAL '42 minutes'),
    (v_k1, v_org_id, 'kevin@rosyrealtors.co.ke', 'Kevin Mwangi', 'Amina Hassan', 'email_click', 'Emailed Upper Hill 4,500 sq.ft commercial spec sheet & floor plan', NULL, NOW() - INTERVAL '35 minutes'),
    (v_b2, v_org_id, 'brenda@rosyrealtors.co.ke', 'Brenda Akoth', 'Beatrice Njoki', 'call_logged', 'Walked through GTC Westlands reservation form & rental yield', 290, NOW() - INTERVAL '1 hour'),
    (v_b1, v_org_id, 'brenda@rosyrealtors.co.ke', 'Brenda Akoth', 'David Ochieng', 'followup_scheduled', 'Scheduled VIP private viewing for Old Muthaiga 5BR villa', NULL, NOW() - INTERVAL '2 hours');
END $$;
