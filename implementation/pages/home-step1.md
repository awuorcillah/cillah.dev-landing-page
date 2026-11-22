# Home Page Step 1 & Brand Name Update Plan

**Project:** `cillah.dev-landing-page` (Next.js 16 App Router, TinaCMS, Supabase, Vercel)  
**Brand Style Reference:** `/implementation/BRAND.md` does **not** exist in the repository (`implementation/` currently contains `implementation_kickstart.md`, `implementation_plan.md`, `phase0-canonical-fix.md`, `SEO-AEO-GEO.md`). All changes strictly reuse the existing site colours (`#07070B`, `#1C1C1C`, `#F9F7F6`, `#C9A66B`, `#F2B6C1`, blush pink gradient), fonts (`Sora` via `font-heading`, `Inter` via `font-sans`), uppercase gold section labels (`text-[11px] font-heading font-medium uppercase tracking-[0.25em] text-[#C9A66B]`), and gold italic emphasis (`<span className="text-[#C9A66B] font-normal italic">...</span>`).  
**URL Rule:** All full URLs continue to come from `SITE_URL` / `DEFAULT_OG_IMAGE` / `absoluteUrl()` in `lib/site-config.ts`. Zero hardcoded `https://www.cillah.dev`.  
**Guardrails:** No changes to `package.json`, lock files, or untouched sections. No code edits, commits, or pushes until approved.

---

## 1. Brand Name Audit: `"Cillah"` vs `"cillah.dev"`

Full case-insensitive search for `cillah.dev` across `app/`, `components/`, `content/`, `hooks/`, `lib/`, `styles/`, `tina/config.ts`, `next.config.mjs`, and `middleware.ts`.

### A. Places Changing from `cillah.dev` / `Cillah.dev` → `Cillah`

| File | Line(s) | Current Text | Planned Change |
| :--- | :--- | :--- | :--- |
| `components/navbar.tsx` | 74, 79 | `alt="Cillah.dev Logo"`, `cillah.dev` | `alt="Cillah Logo"`, `Cillah` |
| `components/footer.tsx` | 16, 49, 54 | `brandName = "Cillah.dev"`, `alt="Cillah.dev Logo"`, `cillah.dev` | `brandName = "Cillah"` (copyright becomes `© {year} Cillah — Registered as Cillah AI Automation (Govt. of Kenya • BN-5559Q2JL). All rights reserved.`), `alt="Cillah Logo"`, `Cillah` |
| `app/layout.tsx` | 25, 27, 28–34, 35, 37, 39, 46, 48 | Default `title`, `description`, `keywords`, `authors`, `openGraph`, `twitter` using `Cillah.dev` | Update to new title/description using `Cillah`; `authors: [{ name: "Cillah" }]`; **remove `keywords` completely** |
| `app/layout.tsx` | 106, 114, 117, 156, 166 | Organization `name`, logo `caption`, Organization `description`, WebSite `name`, Sitelinks `name` | `"Cillah"`, `"Cillah Logo"`, new Organization description (Section 2 below), `"Cillah"`, `"Cillah Sitelinks"` (keep `"legalName": "Cillah AI Automation"` and `"BN-5559Q2JL"`) |
| `app/page.tsx` | 6, 8, 13, 15, 23, 25 | `title`, `description`, `openGraph`, `twitter` using `Cillah.dev` | Update to exact title & meta description in Section 2 below |
| `components/home-page-client.tsx` | 68, 139, 207, 944 | Friction #04 (`Cillah.dev`), hero paragraph (`Cillah.dev gives...`), company paragraph (`Cillah.dev is...`), `aria-label="Explore Cillah.dev"` | Friction #04 replaced (Section 6), `Cillah gives your business a system`, `Cillah is a Software Solutions Company`, `aria-label="Explore Cillah"` |
| `app/articles/page.tsx` | 13, 20, 29, 209, 215 | `... \| Cillah.dev`, JSON-LD `name` & `publisher.name` | `Articles & Knowledge Hub \| Cillah`, `publisher.name: "Cillah"` (keep `legalName: "Cillah AI Automation"`) |
| `app/articles/[slug]/page.tsx` | 118, 125, 131, 141, 323, 372 | `... \| Cillah.dev`, CTA copy `consultation with Cillah.dev`, JSON-LD `publisher.name` | `... \| Cillah`, `consultation with Cillah`, `publisher.name: "Cillah"` (keep `legalName: "Cillah AI Automation"`) |
| `app/book-consultation/layout.tsx` | 7, 9, 14, 16, 22, 24 | `title`, `description`, `openGraph`, `twitter` using `Cillah.dev` | Replace `Cillah.dev` with `Cillah` |
| `app/our-services/layout.tsx` | 7, 14, 22 | `... \| Cillah.dev` (`title`, `openGraph`, `twitter`) | `... \| Cillah` |
| `app/pricing/layout.tsx` | 7, 14, 22 | `... \| Cillah.dev` (`title`, `openGraph`, `twitter`) | `... \| Cillah` |
| `app/privacy-policy/layout.tsx` | 7, 9, 14, 15, 21, 22 | `Privacy Policy \| Cillah.dev` & descriptions | Replace `Cillah.dev` with `Cillah` (keep `Cillah AI Automation`) |
| `app/terms/layout.tsx` | 7, 9, 14, 15, 21, 22 | `Terms of Service \| Cillah.dev` & descriptions | Replace `Cillah.dev` with `Cillah` (keep `Cillah AI Automation`) |
| `app/terms/page.tsx` | 36, 44, 87 | `use of cillah.dev`, `Cillah.dev provides...`, `Cillah.dev is not liable...` | `use of Cillah`, `Cillah provides...`, `Cillah is not liable...` |
| `app/use-cases/page.tsx` | 13, 20, 28 | `Case Studies & Client Results \| Cillah.dev` | `Case Studies & Client Results \| Cillah` |
| `app/use-cases/[slug]/page.tsx` | 173, 181, 187, 195, 309 | `... \| Cillah.dev` & JSON-LD `publisher.name` | `... \| Cillah` & `publisher.name: "Cillah"` (keep `legalName: "Cillah AI Automation"`) |
| `app/(auth)/login/layout.tsx` | 7, 9, 18, 20, 26, 28 | `Log In \| Cillah.dev Client & Admin Portal` & descriptions | Replace `Cillah.dev` with `Cillah` |
| `app/(auth)/login/page.tsx` | 143, 146, 149 | `alt="cillah.dev"`, `Log In to Cillah.dev`, `your cillah.dev client or admin portal` | `alt="Cillah Logo"`, `Log In to Cillah`, `your Cillah client or admin portal` |
| `app/(auth)/signup/layout.tsx` | 7, 9, 18, 20, 26, 28 | `Sign Up \| Cillah.dev Client & Admin Portal` & descriptions | Replace `Cillah.dev` with `Cillah` |
| `app/(auth)/signup/page.tsx` | 134, 137, 140 | `alt="cillah.dev"`, `Create your Cillah.dev Account`, `Join cillah.dev to access...` | `alt="Cillah Logo"`, `Create your Cillah Account`, `Join Cillah to access...` |
| `components/booking-modal.tsx` | 31 | `consultation with Cillah.dev` | `consultation with Cillah` |
| `content/articles/how-to-deploy-ai-agents-inside-whatsapp-and-instagram.md` | 32 | `When Cillah.dev configures...` | `When Cillah configures...` |
| `content/articles/unifying-marketing-channels-into-a-single-crm-pipeline.md` | 32 | `At Cillah.dev, we build...` | `At Cillah, we build...` |
| `app/admin/layout.tsx` | 208, 211, 228, 508, 569 | Visible admin sidebar/header org labels (`cillah.dev`, `cillah.dev Operations`, `Organization Admin (cillah.dev)`) | `Cillah`, `Cillah Operations`, `Organization Admin (Cillah)` (keep `Cillah AI Automation` on line 208) |
| `app/admin/organizations/page.tsx` | 59 | Card display `name: 'cillah.dev'` | `name: 'Cillah'` (keep `slug: 'cillah-dev'` and DB `id` untouched) |
| `app/admin/organizations/cillah-dev/marketing/page.tsx` | 104, 195 | Visible demo message & org header (`cillah.dev`) | `Cillah` |
| `app/admin/organizations/cillah-dev/sales/page.tsx` | 323 | Visible org header (`cillah.dev Organization & Department`) | `Cillah Organization & Department` |
| `app/admin/organizations/cillah-dev/teams/page.tsx` | 110, 163, 263, 375 | Visible toast/header/subtext (`under cillah.dev`, `cillah.dev Organization`) | `Cillah` |
| `components/crm/crm-pipeline-board.tsx` | 208 | Fallback UI display `name: 'cillah.dev'` | `name: 'Cillah'` (keep `slug: 'cillah-dev'` and `id` untouched) |
| `app/api/booking/create/route.ts` | 144, 170, 264 | User-facing calendar title fallback `(cillah.dev)` and WhatsApp confirmation `*Cillah.dev*` | `Cillah` / `*Cillah*` |

### B. Places Keeping `cillah.dev` (With Reason)

| File | Line(s) | Kept Value | Reason |
| :--- | :--- | :--- | :--- |
| `lib/site-config.ts` | 1 | `SITE_URL = "https://www.cillah.dev"` | Single canonical domain constant powering all canonicals, OG URLs, sitemap, robots, and JSON-LD |
| `app/layout.tsx` | 118, 140 | `atulah@cillah.dev`, `https://www.tiktok.com/@cillah.dev` | Real contact email address and TikTok profile URL |
| `components/footer.tsx` | 20, 25 | `atulah@cillah.dev`, `https://www.tiktok.com/@cillah.dev` | Real contact email line and TikTok profile URL |
| `app/book-consultation/page.tsx` | 845 | `atulah@cillah.dev` | Contact email address |
| `app/privacy-policy/page.tsx` | 83, 84 | `mailto:atulah@cillah.dev` / `atulah@cillah.dev` | Contact email address |
| `app/terms/page.tsx` | 97, 98 | `mailto:atulah@cillah.dev` / `atulah@cillah.dev` | Contact email address |
| `app/(auth)/login/page.tsx` | 190 | `placeholder="cheryl@cillah.dev"` | Email address placeholder |
| `app/pricing/page.tsx` | 69, 101 | `logs in directly through cillah.dev`, `Direct portal login via cillah.dev` | Refers to the real web address where clients log in *(confirm if you prefer changing these to `Cillah` instead)* |
| `app/api/booking/create/route.ts` | 36, 155, 249 | `atulah@cillah.dev`, `Booking confirmed via cillah.dev` | Real email address and booking website address |
| `app/api/calendar/book/route.ts` | 39 | `This consultation was booked via cillah.dev` | Website address reference |
| `app/api/consultation/finalize-booking/route.ts` | 86, 127 | `booked via cillah.dev` | Website address reference |
| `app/api/consultation/payment-stkpush/route.ts` | 95 | `request.headers.get("host") \|\| "cillah.dev"` | Hostname fallback for M-Pesa callback URL |
| `app/api/leads/followup/route.ts` | 87, 109 | `atulah@cillah.dev`, `system@cillah.dev` | Real/system email addresses |
| `app/api/leads/ingest/route.ts` | 86, 178, 228 | `atulah@cillah.dev`, `system@cillah.dev` | Real/system email addresses & Supabase email query |
| `app/admin/dashboard/page.tsx` | 37, 116, 593 | `atulah@cillah.dev` | Staff email address |
| `app/admin/pipeline/page.tsx` | 10 | `atulah@cillah.dev` | Staff email address |
| `app/admin/organizations/cillah-dev/teams/page.tsx` | 72–77 | `john@cillah.dev` … `daniel@cillah.dev` | Email addresses |
| `app/user/dashboard/page.tsx` | 10 | `atulah@cillah.dev` | Staff email address |
| `components/crm/crm-pipeline-board.tsx` | 103, 384, 476 | `atulah@cillah.dev`, `cheryl@cillah.dev`, `system@cillah.dev` | Email addresses |
| `lib/google-calendar.ts` | 208 | `atulah@cillah.dev` | Calendar email fallback |
| `lib/supabase/middleware.ts` | 50 | `email === 'atulah@cillah.dev'` | Admin auth email check |
| `lib/error-notify.ts` | 32, 46 | `API error occurred on cillah.dev`, `CILLAH.DEV — ... Error` | Internal server error notification identifying the domain |
| Route path / DB slug | `app/admin/organizations/cillah-dev/*`, `slug: 'cillah-dev'` | `cillah-dev` | Internal URL slug & Supabase org key (not user-facing brand copy) |
| Non-runtime files | `implementation/*.md`, `scratch/*`, `supabase/*.sql`, `.env.example`, `GITHUB_ISSUES_GUIDE.md` | Historical docs / SQL / scripts | Not rendered on the site |

**Legal name & registration preserved everywhere:** `"Cillah AI Automation"` and `"BN-5559Q2JL"` remain completely untouched.

---

## 2. Home Page Title, Meta, JSON-LD & Hero

### Metadata (`app/page.tsx` & `app/layout.tsx`)
- **Title tag:** `Cillah | AI & Automation for Real Estate Agencies in Kenya`
- **Meta description:** `Cillah builds websites, AI assistants and automation for Kenyan real estate agencies, so no lead is lost to slow, manual follow-up.`
- **`og:title`, `og:description`, `twitter:title`, `twitter:description`:** Identical wording to the title and meta description above.
- **Organization JSON-LD (`app/layout.tsx`):** Set `"description"` to:
  `"Cillah builds websites, AI assistants and automation for real estate agencies in Kenya, so no lead is lost to slow, manual follow-up."`
- **Meta `keywords` tag:** Remove `keywords` from `app/layout.tsx` (confirmed no other page or layout defines `keywords`).

### Hero Section (`components/home-page-client.tsx`)
- **Small uppercase label above `<h1>`** (using exact existing uppercase section label style `text-[11px] font-heading font-medium uppercase tracking-[0.25em] text-[#C9A66B] mb-4 block`):
  `AI & AUTOMATION FOR REAL ESTATE AGENCIES`
- **Hero `<h1>`** (reusing exact existing `font-heading font-light text-[34px] sm:text-[44px] md:text-[56px] leading-[1.12] text-[#F9F7F6] mb-8 text-balance` and gold italic span):
  `Turn every message into a ` + `<span className="text-[#C9A66B] font-normal italic">booked viewing</span>.`
- **Hero paragraphs:** Keep existing two paragraphs word-for-word, changing only `"Cillah.dev gives your business a system"` → `"Cillah gives your business a system"`.

---

## 3. Replace the Hero Image With Connected System Section & Animation Placeholder

- **Asset check:** `public/ChatGPT Image Aug 4, 2026, 01_06_29 PM.png` is referenced **only** in `components/home-page-client.tsx:157` (zero other references anywhere in the repo).
- **Action:**
  1. Delete `public/ChatGPT Image Aug 4, 2026, 01_06_29 PM.png`.
  2. Remove the hero image container from the Hero section.
  3. Immediately in its place (new section between Hero and the blush-pink Company section, using existing dark `#07070B` background, `border-b border-white/5`, and responsive `px-6 md:px-12` spacing):
     - **Heading (`<h2>`):** `Predictable growth starts with ` + `<span className="text-[#C9A66B] font-normal italic">one connected system</span>`
     - **Sub-line (`<p>`):** `Replace scattered tools and manual work with one connected system that keeps your business moving.`
     - **Empty animation container:** `<div id="cillah-flow-animation" className="w-full min-h-[280px] sm:min-h-[340px] md:min-h-[400px]" />` (completely empty for now; reserved vertical height prevents layout shift when the animation is added later; `w-full` avoids any horizontal overflow at 375px).
     - **Caption line below container:** `Connects WhatsApp, Instagram, Facebook, TikTok, your website, CRM, calendar and phone calls.`

---

## 4. Remove the Old "Seamless Ecosystem Integrations" Section

- **Asset check:** `/ecosystem-demo.mp4` is referenced **only** in `components/home-page-client.tsx:259` (zero other references anywhere in the repo).
  - **Bonus finding:** `public/ecosystem-demo.mp4.mp4` (3.78 MB exact duplicate) also exists in `public/` and is unused anywhere in the repo.
- **Action:**
  1. Delete the entire `"2. SEAMLESS ECOSYSTEM INTEGRATIONS"` section, its `integrations` array, and unused imports in `components/home-page-client.tsx`.
  2. Delete `public/ecosystem-demo.mp4` *(and recommend also deleting the unused duplicate `public/ecosystem-demo.mp4.mp4` — please confirm)*.

---

## 5. Company Paragraph (Blush Pink Section)

- Keep `"Headquartered in Nairobi, Kenya"` • `"Registered as Cillah AI Automation (Govt. of Kenya • BN-5559Q2JL)"` word-for-word.
- Keep the next headline and supporting paragraph word-for-word, changing only:
  - `"Cillah.dev is a Software Solutions Company"` → `"Cillah is a Software Solutions Company"`.

---

## 6. Friction Section (`#the-friction`)

- Keep items `01`, `02`, and `03` untouched word-for-word.
- Replace item `04` with:
  - **Title:** `Unfollowed leads`
  - **Text:** `Over time, leads pile up in the CRM and no salesperson can chase them all. Cillah scans each agent's pipeline, flags who needs a follow-up, and reminds them of upcoming meetings, all in one place.`

---

## 7. Metrics Section (`THE PERFORMANCE`)

- Keep all 4 cards and all other text identical.
- Under the `Growth` card (`Viewings`), change only the large value from `"more sales"` to `"More viewings, more sales"`. Keep `"Without manual coordination"` unchanged.

---

## 8. Dashboard Sample (`Rosy Realtors Nairobi`)

- **Add small label near the dashboard:** `Sample dashboard, fictional data` (displayed clearly near the top of the dashboard card using existing subtle text styling).
- **Use only 4 sales agents consistently everywhere:**
  - `Tom` `(Senior Realtor)`
  - `Mary` `(Commercial Lead)`
  - `Jane` `(Luxury Estates)`
  - `Dan` `(Land Specialist)`
  - Remove `Sarah M.`, `David K.`, `Alex O.`, `Faith N.`, and `Brian K.`.
- **Live Lead Event line:**
  `"New Lead: Grace Wanjiku (+254 700 000 001) • Looking for 2-Bed Luxury Apt in Kilimani • Buying Immediately • Assigned to Tom"`
- **Assigned Leads Table (5 rows across the 4 agents; fake phone numbers):**

| Row | Lead Name | Phone Number | Assigned Sales Agent | Property Interest | Timeline | Source |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Grace Wanjiku *(was Mary Wanjiku)* | `+254 700 000 001` | Tom `(Senior Realtor)` | Residential • 2-Bed Luxury Apt, Kilimani | Immediately | WhatsApp |
| 2 | James Omondi | `+254 700 000 002` | Mary `(Commercial Lead)` | Commercial • 250 sqft Office, Westlands | 3 Months | Website |
| 3 | Caroline Njuguna | `+254 700 000 003` | Jane `(Luxury Estates)` | Residential • 4-Bed Villa, Runda | Immediately | Instagram |
| 4 | Kelvin Mutua | `+254 700 000 004` | Dan `(Land Specialist)` | Residential • 0.5 Acre Plot, Karen | 6 Months | Facebook |
| 5 | Amina Hassan | `+254 700 000 005` | Mary `(Commercial Lead)` | Commercial • Retail Storefront, Lavington | Just Browsing | WhatsApp |

---

## 9. Complete List of Every File to Change or Delete

### Files to Modify (29)
1. `app/layout.tsx`
2. `app/page.tsx`
3. `components/home-page-client.tsx`
4. `components/navbar.tsx`
5. `components/footer.tsx`
6. `components/booking-modal.tsx`
7. `components/crm/crm-pipeline-board.tsx`
8. `app/(auth)/login/layout.tsx`
9. `app/(auth)/login/page.tsx`
10. `app/(auth)/signup/layout.tsx`
11. `app/(auth)/signup/page.tsx`
12. `app/articles/page.tsx`
13. `app/articles/[slug]/page.tsx`
14. `app/book-consultation/layout.tsx`
15. `app/our-services/layout.tsx`
16. `app/pricing/layout.tsx`
17. `app/privacy-policy/layout.tsx`
18. `app/terms/layout.tsx`
19. `app/terms/page.tsx`
20. `app/use-cases/page.tsx`
21. `app/use-cases/[slug]/page.tsx`
22. `app/admin/layout.tsx`
23. `app/admin/organizations/page.tsx`
24. `app/admin/organizations/cillah-dev/marketing/page.tsx`
25. `app/admin/organizations/cillah-dev/sales/page.tsx`
26. `app/admin/organizations/cillah-dev/teams/page.tsx`
27. `app/api/booking/create/route.ts`
28. `content/articles/how-to-deploy-ai-agents-inside-whatsapp-and-instagram.md`
29. `content/articles/unifying-marketing-channels-into-a-single-crm-pipeline.md`

*(Total: 29 modified files.)*

### Files to Delete (2, or 3 with duplicate video)
1. `public/ChatGPT Image Aug 4, 2026, 01_06_29 PM.png` (unused anywhere else)
2. `public/ecosystem-demo.mp4` (unused anywhere else)
3. *(Optional, recommended)* `public/ecosystem-demo.mp4.mp4` (identical unused 3.78 MB duplicate of `ecosystem-demo.mp4`)

---

## 10. Verification Plan (After Approval & Implementation)

1. Run full `npm run build` (`tinacms build && next build`) with `.env.local` loaded into the shell environment and confirm 0 errors.
2. Verify in compiled HTML:
   - Exact new `<title>`, `<meta name="description">`, `og:title`, `og:description`, `twitter:title`, `twitter:description`, and Organization JSON-LD `description`.
   - Zero `<meta name="keywords">` tags on any page.
   - Zero visible `cillah.dev` / `Cillah.dev` brand mentions (only real URLs, emails, and contact lines kept).
   - Zero hardcoded `https://www.cillah.dev` outside `lib/site-config.ts`.
   - `#cillah-flow-animation` exists and is empty; hero image and old integrations section are gone.
   - Dashboard shows only Tom, Mary, Jane, Dan, Grace Wanjiku, fake `+254 700 000 00x` numbers, and `"Sample dashboard, fictional data"`.
3. Verify responsive layout at **375 px** width (no page-level horizontal scroll).
4. Present a complete summary of every file changed, anything skipped, and any issues found — then wait for go-ahead before committing or pushing.
