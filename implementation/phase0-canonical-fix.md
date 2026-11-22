# Phase 0 — Canonical Domain, Sitemap, Robots & Internal Linking Fix Plan

**Project:** `cillah.dev-landing-page` (Next.js 16 App Router, TinaCMS, Supabase, Vercel)  
**Canonical Base URL:** `https://www.cillah.dev` (replaces non-www `https://cillah.dev`)  
**Scope Rules:** No copy rewrites, no design or colour changes. No code changes or commits until approved.

---

## 0. Baseline Build Result (Before Any Changes)

Ran with zero code modifications on a clean clone after installing dependencies (`npm ci --legacy-peer-deps`, required due to `react-day-picker@8.10.1` peer dependency on React 18 vs project React 19.2.3):

1. **`npm run build` (`tinacms build && next build`) — FAILED (missing local env vars):**
   ```text
   Starting Tina build
   Error: Client not configured properly. Missing clientId, token.
   ```
   Cause: No `.env.local` exists on this fresh local clone yet, so `NEXT_PUBLIC_TINA_CLIENT_ID` and `TINA_TOKEN` are unset.
2. **`npx next build` (Next.js step alone) — FAILED during page-data collection (missing local Supabase env vars):**
   - TypeScript/Turbopack compilation **succeeded** (`✓ Compiled successfully in 23.1s`).
   - Failed at `Collecting page data` for `/api/leads/followup`:
     ```text
     Error: supabaseUrl is required.
     ```
   Cause: `NEXT_PUBLIC_SUPABASE_URL` (and Supabase keys) are not present in a local `.env.local` yet.

**Action needed before final build verification:** Provide a `.env.local` (or sign into the Vercel plugin / run `vercel env pull .env.local`) with the production TinaCMS and Supabase environment variables so `npm run build` can be verified cleanly end-to-end locally before any commit.

---

## 1. Single Canonical Base URL Constant (`https://www.cillah.dev`)

### Design
Create **`lib/site-config.ts`** as the single source of truth for all absolute URLs:

```ts
export const SITE_URL = "https://www.cillah.dev" as const
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/cillah-emblem.png` as const

export function absoluteUrl(path = ""): string {
  if (!path || path === "/") return SITE_URL
  if (path.startsWith("http://") || path.startsWith("https://")) return path
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}
```

Use `SITE_URL`, `DEFAULT_OG_IMAGE`, and `absoluteUrl()` everywhere a full URL is constructed:
- `metadataBase: new URL(SITE_URL)` in `app/layout.tsx`
- All `alternates.canonical` tags via the Next.js Metadata API
- All `openGraph.url`, `openGraph.images`, and `twitter.images` (converted from relative `/images/cillah-emblem.png` and relative `featuredImage` paths to explicit absolute `https://www.cillah.dev/...` URLs)
- All JSON-LD structured data (`Organization`, `WebSite`, `ItemList`, `CollectionPage`, `Article`)
- `app/sitemap.ts`
- `app/robots.ts` (`Sitemap: https://www.cillah.dev/sitemap.xml`)
- Internal API webhook fetch in `app/api/leads/connect-advisor/route.ts` (prevents a non-www → www redirect on a `POST` request)

### Complete Inventory of Hardcoded `https://cillah.dev` URLs Found

#### Runtime Application Files (50 occurrences across 14 files — ALL will be updated)

| File | Line(s) | Current Hardcoded Value(s) |
| :--- | :--- | :--- |
| `app/layout.tsx` | 23, 25 | `metadataBase: new URL("https://cillah.dev")`, `canonical: "https://cillah.dev"` (also removing root `alternates.canonical` — see Section 7) |
| `app/layout.tsx` | 105, 108, 111, 112, 113, 116 | Organization JSON-LD `@id`, `url`, `#logo`, `logo.url`, `logo.contentUrl`, `image` |
| `app/layout.tsx` | 154, 155, 159 | WebSite JSON-LD `@id`, `url`, `publisher.@id` |
| `app/layout.tsx` | 165, 173, 180, 187, 194, 201, 208 | Sitelinks `ItemList` JSON-LD `@id` and `SiteNavigationElement` URLs (`/login`, `/signup`, `/our-services`, `/book-consultation`, `/use-cases`, `/pricing`) |
| `app/robots.ts` | 4 | `const baseUrl = "https://cillah.dev"` |
| `app/sitemap.ts` | 33 | `const baseUrl = "https://cillah.dev"` |
| `app/articles/page.tsx` | 14, 20, 202, 207, 208 | `canonical`, `openGraph.url`, `CollectionPage` JSON-LD `url`, `publisher.url`, `publisher.logo` |
| `app/articles/[slug]/page.tsx` | 121, 240, 361, 367, 370 | `canonicalUrl` (in `generateMetadata` & component), `Article` JSON-LD `author.url`, `publisher.url`, `publisher.logo.url` |
| `app/book-consultation/layout.tsx` | 8, 14 | `canonical`, `openGraph.url` |
| `app/our-services/layout.tsx` | 8, 14 | `canonical`, `openGraph.url` |
| `app/pricing/layout.tsx` | 8, 14 | `canonical`, `openGraph.url` |
| `app/privacy-policy/layout.tsx` | 8, 13 | `canonical`, `openGraph.url` |
| `app/terms/layout.tsx` | 8, 13 | `canonical`, `openGraph.url` |
| `app/use-cases/layout.tsx` | 7, 12 | `canonical`, `openGraph.url` (duplicate metadata to be removed — see Section 7) |
| `app/use-cases/page.tsx` | 14, 20 | `canonical`, `openGraph.url` |
| `app/use-cases/[slug]/page.tsx` | 176, 298, 303, 309, 312 | `canonicalUrl`, `Article` JSON-LD `mainEntityOfPage.@id`, `author.url`, `publisher.url`, `publisher.logo.url` |
| `app/api/leads/connect-advisor/route.ts` | 224 | `fetch('https://cillah.dev/api/whatsapp/send-notification', ...)` |

*(Note: `app/(auth)/login/layout.tsx` lines 7 & 12 and `app/(auth)/signup/layout.tsx` lines 7 & 12 already hardcode `https://www.cillah.dev/...`; both will be refactored to import `SITE_URL` / `absoluteUrl()` as well so zero hardcoded base URLs remain in `app/`.)*

#### Non-Runtime / Docs / Scripts (Found & Noted — Left Untouched Unless Requested)
- `.env.example` (line 21: `MPESA_CALLBACK_URL=https://cillah.dev/api/mpesa/callback`)
- `implementation/SEO-AEO-GEO.md` (lines 4, 15, 29, 47, 93, 119, 129, 138–140 — historical doc)
- `implementation/implementation_plan.md` (lines 264, 273, 303 — historical doc)
- `scratch/*.js` and `scratch/*.json` (one-off local n8n test scripts)
- `supabase/multi_tenant_organizations_setup.sql` (line 24) and `supabase/stage_properties_schema.sql` (line 19)

---

## 2. Sitemap Overhaul (`app/sitemap.ts`)

### Current Implementation
Generated dynamically by Next.js App Router at `app/sitemap.ts` (`export default function sitemap(): MetadataRoute.Sitemap`).

### Issues Found
1. Uses `const baseUrl = "https://cillah.dev"` (non-www).
2. Includes `/login` and `/signup`.
3. Uses `const now = new Date()` (build/request time) for all static pages and as fallback for markdown entries without a date.
4. Includes `changeFrequency` and `priority` on every entry.
5. `content/use-cases/How-Real-Estate-Companies-Can-Turn-Social-Media-attention-Into-Qualified-Sales-Leads.md` has **no `publishedAt` field** in frontmatter, so it currently falls back to `now` (build time).

### Planned Changes to `app/sitemap.ts`
- Import `SITE_URL` and `absoluteUrl` from `lib/site-config.ts`.
- **Remove `/login` and `/signup`.**
- **Drop `priority` and `changeFrequency`** from every sitemap entry.
- **Include only real 200 OK indexable routes (15 total URLs):**
  - **Static pages (8)** with real last-modified dates from git history (explicit ISO dates so Vercel's fresh-clone filesystem timestamps cannot turn them into build time):
    - `https://www.cillah.dev` — `2026-10-27`
    - `https://www.cillah.dev/our-services` — `2026-10-27`
    - `https://www.cillah.dev/book-consultation` — `2026-10-16`
    - `https://www.cillah.dev/articles` — latest article date (`2026-10-18`)
    - `https://www.cillah.dev/use-cases` — `2026-10-18`
    - `https://www.cillah.dev/pricing` — `2026-10-03`
    - `https://www.cillah.dev/privacy-policy` — `2026-10-01`
    - `https://www.cillah.dev/terms` — `2026-10-01`
  - **Dynamic Articles (3)** from `content/articles/*.md`, reading real `date` (or `updatedAt`) from frontmatter:
    - `https://www.cillah.dev/articles/how-to-deploy-ai-agents-inside-whatsapp-and-instagram` (`2026-10-16`)
    - `https://www.cillah.dev/articles/the-death-of-static-brochure-websites` (`2026-10-15`)
    - `https://www.cillah.dev/articles/unifying-marketing-channels-into-a-single-crm-pipeline` (`2026-10-17`)
  - **Dynamic Use Cases (4)** from `content/use-cases/*.md`, reading frontmatter `slug` and `publishedAt` (with a real fixed fallback `2026-09-29` — its actual commit date — when `publishedAt` is omitted, never `new Date()`):
    - `https://www.cillah.dev/use-cases/real-estate-database-reactivation` (`2026-07-10`)
    - `https://www.cillah.dev/use-cases/real-estate-social-media-leads-automation` (`2026-09-29`)
    - `https://www.cillah.dev/use-cases/nairobi-agency` (`2026-07-13`)
    - `https://www.cillah.dev/use-cases/real-estate-conversions-api-lead-quality` (`2026-07-08`)

---

## 3. Add `noindex` to `/login` and `/signup`

- **`app/(auth)/login/layout.tsx`**:
  - Add `robots: { index: false, follow: true }`
  - Use `absoluteUrl("/login")` for `alternates.canonical` and `openGraph.url`
  - Add `openGraph.images: [DEFAULT_OG_IMAGE]` and `twitter` metadata with `images: [DEFAULT_OG_IMAGE]`
- **`app/(auth)/signup/layout.tsx`**:
  - Add `robots: { index: false, follow: true }`
  - Use `absoluteUrl("/signup")` for `alternates.canonical` and `openGraph.url`
  - Replace relative `images: ['/images/cillah-emblem.png']` with `images: [DEFAULT_OG_IMAGE]` in both `openGraph` and `twitter`
- **`app/robots.ts`**: Keep `/login` and `/signup` **allowed** (NOT disallowed) so Googlebot can fetch both pages and read `<meta name="robots" content="noindex, follow">`.
- **`app/layout.tsx` JSON-LD `#sitelinks` note**: Currently `SiteNavigationElement` lists `/login` (pos 1) and `/signup` (pos 2) and omits `/articles`. Recommend removing `/login` and `/signup` from `#sitelinks` and adding `/articles` so structured data aligns with `noindex` and the sitemap. *(Please confirm if you want `/login` and `/signup` removed from `#sitelinks` too.)*

---

## 4. Broken Link `/use-cases/property-bookings` (404)

### Audit Finding
- Searched every file in the repository (`app/`, `components/`, `content/`, `lib/`, `tina/`, `public/`, `scratch/`, `supabase/`).
- **Zero internal links or code references** point to `/use-cases/property-bookings`.
- **Root cause of the 404:** The file `content/use-cases/property-bookings.md` still has that filename, while its TinaCMS frontmatter `slug` was changed to `real-estate-conversions-api-lead-quality` (*"How Real Estate Companies Can Use Conversions API to Improve Lead Quality From Meta Ads"*). Because `app/use-cases/[slug]/page.tsx` resolves routes exclusively by frontmatter `slug`, `/use-cases/property-bookings` returns 404 for any external link or previously crawled Google Search Console URL.

### Recommendation
Add a **permanent redirect (`permanent: true`, HTTP 308)** in **`next.config.mjs`**:

```js
async redirects() {
  return [
    {
      source: "/use-cases/property-bookings",
      destination: "/use-cases",
      permanent: true,
    },
  ]
}
```

- **Why redirect to `/use-cases` (Recommended):** The current content inside `property-bookings.md` is about Meta Conversions API rather than property bookings, so redirecting `/use-cases/property-bookings` → `/use-cases` best matches visitor intent and cleanly clears the 404 in Google Search Console.
- *(Alternative: if you prefer redirecting directly to `/use-cases/real-estate-conversions-api-lead-quality`, let me know and I will use that destination instead.)*

---

## 5. Robots (`app/robots.ts`)

- Replace `const baseUrl = "https://cillah.dev"` with `import { SITE_URL } from "@/lib/site-config"` so the `Sitemap` directive outputs:
  ```txt
  Sitemap: https://www.cillah.dev/sitemap.xml
  ```
- Preserve all existing `allow` and `disallow` rules exactly as-is (`/admin`, `/admin/`, `/api`, `/api/`, `/dashboard`, `/dashboard/`, `/client`, `/client/`, `/user`, `/user/`, `/unauthorized`, `/client-portal`).
- Do **not** add `/login` or `/signup` to `disallow`.
- Leave Cloudflare's edge-injected robots rules completely untouched.

---

## 6. Internal Links (Home Page, Footer & Articles — Preserving Copy, Design & Colours)

### A. Home Page (`app/page.tsx` → `components/home-page-client.tsx`)
- **Current state:** Inside `<main>`, the home page only links to `/our-services` (once as `"Learn More"`, once as `"Our Services"`), `/book-consultation`, `/login`, and `/signup`. It has **no in-body links** to `/use-cases`, `/articles`, or `/pricing`.
- **Planned change (minimal, matching existing dark luxury palette `#07070B` / `#C9A66B` / `border-white/10`):**
  - Keep all existing page copy, layout, and colours untouched.
  - In the final CTA section (section 9, directly below the two primary CTA buttons), add a clean, subtle descriptive link row pointing to all 4 core destinations using Next.js `<Link>`:
    - `/our-services` — `"Explore Our AI & Automation Services"`
    - `/use-cases` — `"View Real Estate Automation Use Cases"`
    - `/articles` — `"Read Automation & AI Articles"`
    - `/pricing` — `"See Deployment & Pricing Options"`

### B. Footer (`components/footer.tsx`)
- **Current state:** `quickLinks` already links to `/our-services` (`"Our Services"`), `/use-cases` (`"Use Cases"`), `/pricing` (`"Pricing"`), and `/articles` (`"Articles"`), with zero `"click here"` links.
- **Planned change:** Keep the exact footer layout and styling, and refine those 4 link labels to be explicitly descriptive of their destinations (or keep current labels if you prefer):
  - `/our-services` — `"Our Automation Services"`
  - `/use-cases` — `"Client Use Cases"`
  - `/articles` — `"Automation Articles"`
  - `/pricing` — `"Pricing & Deployment"`

### C. Every Article Page (`app/articles/[slug]/page.tsx`)
- **Current state:** The bottom CTA block links to `/book-consultation` (`"Book Consultation"`, via raw `<a>`) and `/articles` (`"Explore More Articles"`), and does **not** link to `/our-services`.
- **Planned change:** In the bottom CTA action row of `app/articles/[slug]/page.tsx` (automatically applied to all current and future articles), use Next.js `<Link>` with descriptive labels linking to BOTH:
  - `/book-consultation` — `"Book a 1-on-1 Automation Consultation"`
  - `/our-services` — `"Explore Our AI & Web Services"`
  - *(Plus keep existing `"Explore More Articles"` → `/articles` alongside them, using the existing button styles and colours.)*

---

## 7. Single Self-Referencing Canonical Tag Verification (Every Page)

### Critical Inheritance Bugs Caught in Audit
1. **Root layout canonical leak (`app/layout.tsx` line 25):**
   - `app/layout.tsx` currently exports `alternates: { canonical: "https://cillah.dev" }`.
   - Because Next.js merges layout metadata downward, **every route without its own `alternates.canonical`** (such as `/unauthorized`, `/client-portal`, `/dashboard`, `/admin/*`, `/client/*`, `/user/*`, and 404 responses) currently emits `<link rel="canonical" href="https://cillah.dev">` pointing to the **home page**.
   - **Fix:** Remove `alternates` from `app/layout.tsx`. Move the `"use client"` interactive JSX of `app/page.tsx` into `components/home-page-client.tsx` (zero visual/copy changes), and convert `app/page.tsx` into a Server Component that exports the home page `metadata` with `alternates: { canonical: SITE_URL }`, `openGraph.url: SITE_URL`, `openGraph.images: [DEFAULT_OG_IMAGE]`, and `twitter.images: [DEFAULT_OG_IMAGE]`.
2. **Duplicate `/use-cases` canonical in `app/use-cases/layout.tsx`:**
   - Both `app/use-cases/layout.tsx` and `app/use-cases/page.tsx` export `metadata` with `alternates.canonical` pointing to `/use-cases`.
   - Worse, if `/use-cases/[slug]` hits `!useCase`, `generateMetadata` omits `alternates`, causing Next.js to inherit `canonical: /use-cases` from `app/use-cases/layout.tsx` on a 404 page.
   - **Fix:** Remove the duplicate `metadata` export from `app/use-cases/layout.tsx`, keeping `/use-cases` metadata exclusively in `app/use-cases/page.tsx` and `/use-cases/[slug]` metadata exclusively in `app/use-cases/[slug]/page.tsx`.
3. **No duplicate `<link rel="canonical">` tags:** Verified zero manual `<link rel="canonical">` elements exist anywhere in `app/` or `components/`; all canonicals are generated strictly via Next.js Metadata API (`alternates.canonical`).

### Per-Route Canonical & Robots Matrix After Fix

| Route | Metadata Owner | `canonical` | `robots` | `og:url` / `og:image` / `twitter:image` |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `app/page.tsx` (Server wrapper) | `https://www.cillah.dev` | default (`index, follow`) | `https://www.cillah.dev` + absolute image |
| `/our-services` | `app/our-services/layout.tsx` | `https://www.cillah.dev/our-services` | default | `https://www.cillah.dev/our-services` + absolute image |
| `/book-consultation` | `app/book-consultation/layout.tsx` | `https://www.cillah.dev/book-consultation` | default | `https://www.cillah.dev/book-consultation` + absolute image |
| `/pricing` | `app/pricing/layout.tsx` | `https://www.cillah.dev/pricing` | default | `https://www.cillah.dev/pricing` + absolute image |
| `/use-cases` | `app/use-cases/page.tsx` | `https://www.cillah.dev/use-cases` | default | `https://www.cillah.dev/use-cases` + absolute image |
| `/use-cases/[slug]` | `app/use-cases/[slug]/page.tsx` | `https://www.cillah.dev/use-cases/[slug]` | default | `https://www.cillah.dev/use-cases/[slug]` + absolute image |
| `/articles` | `app/articles/page.tsx` | `https://www.cillah.dev/articles` | default | `https://www.cillah.dev/articles` + absolute image |
| `/articles/[slug]` | `app/articles/[slug]/page.tsx` | `https://www.cillah.dev/articles/[slug]` | default | `https://www.cillah.dev/articles/[slug]` + absolute image |
| `/privacy-policy` | `app/privacy-policy/layout.tsx` | `https://www.cillah.dev/privacy-policy` | default | `https://www.cillah.dev/privacy-policy` + absolute image |
| `/terms` | `app/terms/layout.tsx` | `https://www.cillah.dev/terms` | default | `https://www.cillah.dev/terms` + absolute image |
| `/login` | `app/(auth)/login/layout.tsx` | `https://www.cillah.dev/login` | `noindex, follow` | `https://www.cillah.dev/login` + absolute image |
| `/signup` | `app/(auth)/signup/layout.tsx` | `https://www.cillah.dev/signup` | `noindex, follow` | `https://www.cillah.dev/signup` + absolute image |
| Private / 404 routes | Inherit `app/layout.tsx` (no `alternates`) | None (never points to another page) | Disallowed in `robots.txt` / 404 | Shared defaults |

---

## 8. Complete List of Every File to Create or Change

### New Files (2)
1. **`lib/site-config.ts`** — Single canonical base URL (`SITE_URL = "https://www.cillah.dev"`), `DEFAULT_OG_IMAGE`, and `absoluteUrl()` helper.
2. **`components/home-page-client.tsx`** — Unchanged client UI extracted from `app/page.tsx` (plus the subtle descriptive internal link row in section 9) so `app/page.tsx` can be a Server Component exporting home-page-only `metadata`.

### Modified Files (19)
1. **`app/layout.tsx`** — Use `SITE_URL` & `DEFAULT_OG_IMAGE` for `metadataBase`, default `openGraph.images` / `twitter.images`, and all JSON-LD URLs; remove root `alternates.canonical`; update `#sitelinks` (pending confirmation on dropping `/login` & `/signup` and adding `/articles`).
2. **`app/page.tsx`** — Convert to Server Component exporting home page `metadata` (`alternates.canonical: SITE_URL`, `openGraph.url`, absolute `og:image` & `twitter:image`) and rendering `<HomePageClient />`.
3. **`app/robots.ts`** — Import `SITE_URL` so `Sitemap` outputs `https://www.cillah.dev/sitemap.xml`; keep all existing `Disallow` rules untouched.
4. **`app/sitemap.ts`** — Use `SITE_URL`; remove `/login` and `/signup`; remove `priority` and `changeFrequency`; use real frontmatter dates for articles/use-cases and real git dates for static pages (no build-time `new Date()`).
5. **`app/(auth)/login/layout.tsx`** — Add `robots: { index: false, follow: true }`, use `absoluteUrl("/login")` and `DEFAULT_OG_IMAGE` for canonical, OpenGraph, and Twitter metadata.
6. **`app/(auth)/signup/layout.tsx`** — Add `robots: { index: false, follow: true }`, use `absoluteUrl("/signup")` and `DEFAULT_OG_IMAGE` for canonical, OpenGraph, and Twitter metadata.
7. **`app/our-services/layout.tsx`** — Use `absoluteUrl("/our-services")` and `DEFAULT_OG_IMAGE` for canonical, `og:url`, `og:image`, and `twitter:image`.
8. **`app/book-consultation/layout.tsx`** — Use `absoluteUrl("/book-consultation")` and `DEFAULT_OG_IMAGE` for canonical, `og:url`, `og:image`, and `twitter:image`.
9. **`app/pricing/layout.tsx`** — Use `absoluteUrl("/pricing")` and `DEFAULT_OG_IMAGE` for canonical, `og:url`, `og:image`, and `twitter:image`.
10. **`app/privacy-policy/layout.tsx`** — Use `absoluteUrl("/privacy-policy")` and `DEFAULT_OG_IMAGE` for canonical, `og:url`, `og:image`, and add `twitter` metadata with `DEFAULT_OG_IMAGE`.
11. **`app/terms/layout.tsx`** — Use `absoluteUrl("/terms")` and `DEFAULT_OG_IMAGE` for canonical, `og:url`, `og:image`, and add `twitter` metadata with `DEFAULT_OG_IMAGE`.
12. **`app/use-cases/layout.tsx`** — Remove duplicate `metadata` export (so `/use-cases/page.tsx` and `/use-cases/[slug]/page.tsx` each own their own canonical without child inheritance leaks).
13. **`app/use-cases/page.tsx`** — Use `absoluteUrl("/use-cases")` and `DEFAULT_OG_IMAGE` for canonical, `og:url`, `og:image`, and `twitter:image`.
14. **`app/use-cases/[slug]/page.tsx`** — Use `absoluteUrl(...)` and `DEFAULT_OG_IMAGE` for `canonical`, `og:url`, `og:image`, `twitter:image`, and `Article` JSON-LD URLs.
15. **`app/articles/page.tsx`** — Use `SITE_URL`, `absoluteUrl("/articles")`, and `DEFAULT_OG_IMAGE` for canonical, `og:url`, `og:image`, `twitter` metadata, and `CollectionPage` JSON-LD URLs.
16. **`app/articles/[slug]/page.tsx`** — Use `SITE_URL`, `absoluteUrl(...)`, and `DEFAULT_OG_IMAGE` for canonical, `og:url`, `og:image`, `twitter:image`, and `Article` JSON-LD URLs; add descriptive internal links to both `/our-services` and `/book-consultation`.
17. **`app/api/leads/connect-advisor/route.ts`** — Replace hardcoded `https://cillah.dev/api/whatsapp/send-notification` with `absoluteUrl("/api/whatsapp/send-notification")`.
18. **`components/footer.tsx`** — Refine link labels for `/our-services`, `/use-cases`, `/articles`, and `/pricing` so each is explicitly descriptive (preserving exact layout and colours).
19. **`next.config.mjs`** — Add permanent redirect from `/use-cases/property-bookings` → `/use-cases`.

*(Total: 2 new files + 19 modified files = 21 files. Zero copy, design, or colour changes.)*

---

## 9. Verification Plan (After Approval & Implementation)

1. Run `npm run build` (requires `.env.local` with TinaCMS + Supabase keys) and confirm 0 errors.
2. Start the production build locally (`npm run start`) or inspect generated `.next/server/app/*.html` to confirm:
   - Every public page and `/login`, `/signup` has **exactly one** `<link rel="canonical">` matching `https://www.cillah.dev<route>`.
   - Zero occurrences of `https://cillah.dev` (non-www) in rendered HTML, JSON-LD, `/robots.txt`, or `/sitemap.xml`.
   - `/login` and `/signup` emit `<meta name="robots" content="noindex, follow">` and are absent from `/sitemap.xml` and NOT disallowed in `/robots.txt`.
   - `/sitemap.xml` has 15 URLs, real `lastmod` dates, and zero `<priority>` or `<changefreq>` tags.
   - `/use-cases/property-bookings` returns a permanent redirect to `/use-cases`.
   - Home page, footer, and every article page contain the required descriptive internal links.
3. Present the summary of every file changed and wait for explicit go-ahead before committing or pushing.
