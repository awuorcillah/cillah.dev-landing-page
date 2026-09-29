# Implementation Kickstart

## Cheryl Cilla Atulah - AI Automation for Real Estate Landing Page

Production-ready execution plan. No placeholders. No alternatives.

---

## 1. Project Overview

**Product:** High-converting SaaS landing page for AI automation services targeting real estate agencies.

**Founder:** Cheryl Cilla Atulah - AI Automation Strategist for Real Estate.

**Objective:** Drive bookings for "Free Automation Audit" calls via embedded Calendly. Single CTA. No distractions.

**Page Type:** Long-scroll dark SaaS landing page (2000px+). Mobile-first. Conversion-optimized.

**Core Message:** "You lose money because you respond late. AI fixes it instantly. This is a system, not a chatbot toy. It starts at $500. Book audit."

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript | 5.7.3 |
| UI Library | React | 19.2.3 |
| Styling | Tailwind CSS | 3.4.17 |
| Components | shadcn/ui | Pre-installed (Accordion, Dialog, Button, Card, Badge, Select, Input, Textarea, Label, Sheet) |
| Animation | Framer Motion | Install: `framer-motion` |
| Icons | Lucide React | 0.544.0 (pre-installed) |
| Font | Geist (primary), Inter (fallback) | Geist pre-installed via `next/font/google` |
| Booking | Calendly Embed | Inline embed via `react-calendly` or raw iframe |
| Email (future) | Resend | API route ready, not wired yet |
| Analytics | Google Analytics 4 + Google Tag Manager + Meta Pixel | Script tags in layout.tsx |
| Deployment | Vercel | Default |

### Dependencies to Install

```json
{
  "framer-motion": "^11.0.0"
}
```

Note: `react-calendly` is optional. We can embed Calendly via a standard iframe inside the Dialog component to avoid an extra dependency. Decision: use raw iframe embed inside shadcn Dialog for zero added dependencies.

---

## 3. Folder Structure

```
/app
  layout.tsx              # Root layout - Geist font, metadata, GA/GTM/Meta Pixel scripts
  page.tsx                # Landing page - imports and composes all sections
  globals.css             # Custom design tokens overriding shadcn defaults
  api/
    lead/
      route.ts            # POST endpoint: pre-qualification form + lead capture
    newsletter/
      route.ts            # POST endpoint: email capture ("Not ready to book?")

/components
  navbar.tsx              # Sticky navbar: logo + CTA button
  hero.tsx                # Hero section with headline + chat mockup
  chat-mockup.tsx         # WhatsApp-style static chat UI mockup
  problem.tsx             # Pain points section (4 bullets)
  solution.tsx            # Feature cards (4-card static grid)
  program-features.tsx    # Detailed feature blocks (5 core features)
  how-it-works.tsx        # 4-step horizontal flow with connectors
  social-proof.tsx        # Metrics + testimonials + transformation stories
  pricing.tsx             # 3-tier pricing cards (Starter $500, Growth custom, Scale custom)
  guarantee.tsx           # 30-day performance guarantee
  founder.tsx             # Cheryl Cilla Atulah bio + authority section
  faq.tsx                 # Accordion FAQ: Core FAQs + Objection Handling
  final-cta.tsx           # Large centered CTA section
  lead-capture.tsx        # "Not ready to book?" email capture above footer
  footer.tsx              # Minimal SaaS footer
  booking-modal.tsx       # Dialog with pre-qualification form + Calendly iframe
  mobile-cta-bar.tsx      # Sticky bottom CTA bar (mobile only)
  section-wrapper.tsx     # Reusable scroll-animation wrapper (Framer Motion)
  mobile-nav.tsx          # Animated slide-in mobile navigation (Sheet component)

/components/ui            # Pre-installed shadcn components (accordion, dialog, button, etc.)

/lib
  utils.ts                # Pre-installed cn() utility
  constants.ts            # All copy, FAQ data, feature data, pricing data, testimonials
  analytics.ts            # GA4 + Meta Pixel event helper functions
```

---

## 4. Component Breakdown

### 4.1 Navbar (`navbar.tsx`)
- **Behavior:** Transparent at top, solid `#0F172A` background after 80px scroll
- **Desktop:** Logo (text: "Cheryl Cilla Atulah" or brand mark) left, CTA button right
- **Mobile:** Logo left, hamburger icon (Lucide `Menu`) right, CTA in mobile nav
- **Logo click:** Smooth scroll to top
- **CTA:** Opens `booking-modal.tsx` (Dialog)
- **Mobile nav:** Uses shadcn `Sheet` component with slide-in animation
- **Z-index:** Fixed, highest layer

### 4.2 Hero (`hero.tsx`)
- **Headline:** "Stop Losing Property Leads to Slow Replies." (64px desktop / 36px mobile, font-weight 700)
- **Subheadline:** "Deploy AI chatbots that capture, qualify, and book property viewings 24/7 across Instagram, Facebook, WhatsApp, and your website." (20px, font-weight 500)
- **CTA Button:** "Book a Free Automation Audit" - opens booking modal
- **Right visual:** `chat-mockup.tsx` - WhatsApp-style static chat UI
- **Platform icons:** Row of 4 small icons below chat mockup (Instagram, Facebook, WhatsApp, Globe/Website)
- **Layout:** Two-column on desktop (text left, chat right), stacked on mobile (text top, chat bottom scaled down)

### 4.3 Chat Mockup (`chat-mockup.tsx`)
- **Style:** WhatsApp-style dark chat bubbles
- **Static** - no animation
- **Conversation flow:**
  1. User (right, green bubble): "Hi, I'm interested in property 8."
  2. AI (left, dark bubble): "Great choice! Property 8 is a 3-bed apartment in Westlands. To help you further, are you looking to buy or rent?"
  3. User: "Buy"
  4. AI: "What's your budget range?"
  5. User: "15-20M"
  6. AI: "Perfect. I have a viewing slot available tomorrow at 2 PM. Shall I book it for you?"
  7. User: "Yes please"
  8. AI: "Done! Your viewing for Property 8 is confirmed for tomorrow at 2:00 PM. Our agent James will meet you there. You'll receive a confirmation shortly."
- **Header bar:** WhatsApp-style with "AI Property Assistant" name, green online dot
- **Proportional scaling on mobile**

### 4.4 Problem (`problem.tsx`)
- **Headline:** "Your Ads Are Working. Your Response System Is Not."
- **4 pain points** with minimal Lucide icons:
  1. Clock icon - "Leads waiting hours for replies"
  2. CalendarOff icon - "Missed weekend inquiries"
  3. MessageSquare icon - "Repetitive DM questions consuming agent time"
  4. ListX icon - "No structured qualification process"
- **Layout:** 2x2 grid on desktop, single column on mobile

### 4.5 Solution (`solution.tsx`)
- **Headline:** "AI That Handles Property Inquiries in Seconds."
- **4 feature cards** - static grid, no carousel:
  1. Zap icon - "Instant Lead Capture" - "Every inquiry across all platforms captured and logged in real time."
  2. Filter icon - "Smart Property Qualification" - "AI collects budget, property interest, location, and buyer intent automatically."
  3. CalendarCheck icon - "Automated Viewing Booking" - "Prospects book viewings directly through the chat. No back-and-forth."
  4. BellRing icon - "Qualified Lead Alerts" - "Your sales agents get immediate notification with structured lead summaries for follow-up."
- **Card styling:** Glassmorphism (`rgba(255,255,255,0.04)`, `backdrop-blur-[12px]`, border `rgba(255,255,255,0.08)`)
- **Layout:** 4-column grid on desktop, 2-column on tablet, single column on mobile

### 4.6 Program Features (`program-features.tsx`)
- **Headline:** "The Real Estate AI Automation System"
- **5 detailed feature blocks** with icon + title + bullet list:
  1. **Instant Multi-Platform Deployment** - Instagram, Facebook, WhatsApp, Website widget
  2. **Smart Property Qualification** - Captures property of interest, filters buyers vs renters, collects budget range, captures location preference
  3. **Automated Viewing Booking** - Calendar integration, time-slot selection, automated confirmations
  4. **CRM & Agent Notifications** - Sends qualified leads to CRM, instant agent alerts, structured lead summaries
  5. **API & Automation Layer** - Connects chatbot to CRM, syncs calendar, sends WhatsApp follow-ups, connects data to any app, automates lead routing
- **Styling:** Premium SaaS feature grid. Alternating layout or uniform cards.

### 4.7 How It Works (`how-it-works.tsx`)
- **ONE section only** (duplicate removed per decision doc)
- **4-step horizontal flow** (vertical on mobile):
  1. "Ads & Social Media" (Megaphone icon)
  2. "AI Chatbot Handles Inquiry" (Bot icon)
  3. "System Qualifies & Books" (CheckCircle icon)
  4. "Agent Receives Structured Lead" (UserCheck icon)
- **Visual connectors:** Horizontal line/arrow between steps on desktop, vertical on mobile
- **Step numbers** or sequential indicators

### 4.8 Social Proof (`social-proof.tsx`)
- **Section title:** "Proven Results for Real Estate Agencies."
- **Subtext:** "Automation that improves response speed, lead handling, and booking efficiency."
- **Label:** "Typical results after implementation" (clearly stated)
- **Three content layers:**

**Layer 1 - Before/After Metrics Grid (3 cards):**
  - Card 1 - Response Time: "4-6 hour average" -> "Under 5 seconds"
  - Card 2 - Lead Qualification: "Manual DM conversations" -> "Structured qualification flow"
  - Card 3 - Viewing Bookings: "Back-and-forth scheduling" -> "Automatic calendar booking"
  - Design: Split cards, red-tinted left (before), emerald right (after), icons

**Layer 2 - Testimonials (3 cards):**
  - James M., Agency Director: "We were running ads but responding manually..."
  - Sarah W., Sales Manager: "The structured qualification alone changed everything..."
  - Daniel K., Property Developer: "Weekend inquiries used to pile up..."
  - Design: Rounded glass cards, generic avatar placeholders, subtle border glow

**Layer 3 - Transformation Stories (2 blocks):**
  - Story 1: Mid-size Agency - Instagram ads, multi-platform chatbot, instant handling
  - Story 2: Property Developer - High volume questions, AI qualification + CRM routing
  - Format: Agency Type / Problem / Automation / Result

### 4.9 Pricing (`pricing.tsx`)
- **Headline:** "Simple, Predictable Investment."
- **3 tiers:**

| Tier | Label | Price | Badge |
|------|-------|-------|-------|
| Starter | Lead Capture System | Starting at $500 | - |
| Growth | Booking Automation System | Custom Quote | "Most Popular" |
| Scale | Full Automation Infrastructure | Custom Quote | - |

- **Starter includes:** 1 platform deployment, basic qualification flow, lead capture, email/WhatsApp notifications (round robin)
- **Growth includes:** Multi-platform, smart qualification, calendar booking, CRM integration, agent alerts, 30-day optimization support
- **Scale includes:** Everything in Growth + API integrations, advanced workflows, follow-up sequences, custom automation mapping, dedicated support
- **Below pricing:** "All systems are custom-built based on your agency's workflow."
- **CTA button** after pricing section opens booking modal

### 4.10 Guarantee (`guarantee.tsx`)
- **Headline:** "Response-Time Guarantee."
- **Copy:** "If your automation system doesn't reduce your response time to under 60 seconds, we fix it at no additional cost."
- **Design:** Shield icon, high-contrast card, emerald accent border
- **No money-back language. No revenue guarantees.**

### 4.11 Founder (`founder.tsx`)
- **Title:** "Built for Real Estate. By an Automation Specialist."
- **Image:** Generated professional placeholder headshot
- **Name:** Cheryl Cilla Atulah
- **Title:** AI Automation Strategist for Real Estate
- **Bio (3-4 lines):**
  - Specializes in real estate workflow automation
  - Focused on conversion systems, not chat gimmicks
  - Helps agencies respond in under 5 seconds
  - Architect of multi-platform automation systems
- **LinkedIn icon** placeholder
- **CTA button** under bio opens booking modal

### 4.12 FAQ (`faq.tsx`)
- **Title:** "Questions Real Estate Agencies Ask Before Automating."
- **Subtext:** "Clear answers. No vague promises."
- **Component:** shadcn Accordion, type="single", collapsible, all collapsed by default
- **Two subheadings within one section:**

**Part 1 - Core FAQs (7 items):**
  1. How is this different from a basic chatbot?
  2. Will this replace my agents?
  3. Can it handle multiple properties?
  4. What platforms does it work on?
  5. How long does setup take?
  6. Does it integrate with our CRM?
  7. What if the system doesn't perform?

**Part 2 - Common Concerns (6 items):**
  1. "Our team already replies to messages."
  2. "Our agency is too small for automation."
  3. "AI will sound robotic."
  4. "This sounds complicated."
  5. "What if we get too many leads?"
  6. "Is this expensive?"

- Full answer text sourced from planning document, stored in `constants.ts`

### 4.13 Final CTA (`final-cta.tsx`)
- **Headline:** "Ready to Stop Losing Property Leads?"
- **Button:** "Book a Free Automation Audit"
- **High contrast section** - can use primary blue background with white text
- **Opens booking modal**

### 4.14 Lead Capture (`lead-capture.tsx`)
- **Position:** Above footer
- **Headline:** "Not ready to book?"
- **Offer:** "Get our free Real Estate AI Automation Checklist."
- **Fields:** Name + Email
- **Submit:** POST to `/api/newsletter`
- **Subtle section**, not competing with main CTA

### 4.15 Footer (`footer.tsx`)
- **Minimal SaaS footer:**
  - Logo / brand name
  - "AI Automation Systems for Real Estate Agencies"
  - Copyright 2026
  - Links: Privacy Policy, Terms, Contact Email
  - Social: LinkedIn icon
- **Full-width dark background**

### 4.16 Booking Modal (`booking-modal.tsx`)
- **Component:** shadcn Dialog
- **Two-step flow:**
  - **Step 1 - Pre-qualification form:**
    - Full Name (Input)
    - Agency Name (Input)
    - Monthly Inquiry Volume (Select: 0-20 / 20-50 / 50-100 / 100+)
    - Platforms Used (multi-select checkboxes: IG / FB / WhatsApp / Website)
    - Biggest Lead Handling Problem (Textarea, max 200 chars)
    - Submit button: "Continue to Booking"
  - **Step 2 - Calendly embed:**
    - Iframe embed (Calendly URL to be configured via environment variable)
    - Full width within dialog
- **Form data:** POST to `/api/lead` on submit, then show Calendly
- **Validation:** All fields required except textarea

### 4.17 Mobile CTA Bar (`mobile-cta-bar.tsx`)
- **Visibility:** Mobile only (`md:hidden`), fixed bottom
- **Content:** Full-width "Book a Free Automation Audit" button
- **Appears after scrolling past hero section**
- **Z-index:** Above content, below modal

### 4.18 Section Wrapper (`section-wrapper.tsx`)
- **Framer Motion wrapper** for scroll-triggered animations
- **Animation:** `opacity: 0 -> 1`, `y: 20 -> 0`, `duration: 0.6`
- **Trigger:** `whileInView`, `viewport: { once: true, amount: 0.2 }`
- **Stagger support:** Optional `delay` prop for feature card sequences (0.1s increments)

### 4.19 Mobile Nav (`mobile-nav.tsx`)
- **Component:** shadcn Sheet (side="right")
- **Trigger:** Hamburger (Lucide `Menu` icon)
- **Content:** CTA button, optional section links for scrolling
- **Animation:** Slide-in from right

---

## 5. Design Tokens

### 5.1 Color System (globals.css override)

All colors mapped to shadcn CSS custom properties in HSL format:

| Token | Hex | HSL | Usage |
|-------|-----|-----|-------|
| `--background` | `#0F172A` | `222.2 47.4% 11.2%` | Page background |
| `--foreground` | `#F9FAFB` | `210 20% 98%` | Primary text |
| `--card` | `#111827` | `220 26.5% 12.2%` | Card solid background |
| `--card-foreground` | `#F9FAFB` | `210 20% 98%` | Card text |
| `--primary` | `#2563EB` | `217.2 91.2% 53.3%` | Electric blue - buttons, links |
| `--primary-foreground` | `#FFFFFF` | `0 0% 100%` | Text on primary |
| `--secondary` | `#1E293B` | `217.2 32.6% 17.5%` | Secondary surfaces |
| `--secondary-foreground` | `#F9FAFB` | `210 20% 98%` | Text on secondary |
| `--accent` | `#10B981` | `160.1 84.1% 39.4%` | Emerald - success, highlights |
| `--accent-foreground` | `#FFFFFF` | `0 0% 100%` | Text on accent |
| `--muted` | `#1E293B` | `217.2 32.6% 17.5%` | Muted backgrounds |
| `--muted-foreground` | `#9CA3AF` | `217.9 10.6% 64.9%` | Secondary text |
| `--destructive` | `#EF4444` | `0 84.2% 60.2%` | Error states, "before" metrics |
| `--border` | `rgba(255,255,255,0.08)` | `0 0% 100% / 0.08` | Subtle borders |
| `--input` | `#1E293B` | `217.2 32.6% 17.5%` | Input backgrounds |
| `--ring` | `#2563EB` | `217.2 91.2% 53.3%` | Focus rings |
| `--radius` | - | `1.25rem` | Global radius (20px) |

### 5.2 Glassmorphism Tokens

```css
--glass-bg: rgba(255, 255, 255, 0.04);
--glass-border: rgba(255, 255, 255, 0.08);
--glass-blur: 12px;
--glass-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
```

Fallback to solid `#111827` if accessibility contrast fails WCAG AA.

### 5.3 Typography

| Element | Size (Desktop) | Size (Mobile) | Weight | Line Height |
|---------|----------------|---------------|--------|-------------|
| Hero H1 | 64px (text-6xl) | 36px (text-4xl) | 700 | 1.1 |
| Section H2 | 40px (text-4xl) | 28px (text-3xl) | 700 | 1.2 |
| Subheadline | 20px (text-xl) | 18px (text-lg) | 500 | 1.4 |
| Body | 16px (text-base) | 16px (text-base) | 400 | 1.6 |
| Small/Label | 14px (text-sm) | 14px (text-sm) | 500 | 1.4 |

Font stack: `font-sans` mapped to Geist (already configured in layout.tsx).

### 5.4 Spacing Scale

| Context | Desktop | Mobile |
|---------|---------|--------|
| Section vertical padding | `py-24` (96px) | `py-16` (64px) |
| Card padding | `p-6` (24px) | `p-5` (20px) |
| Container max width | `max-w-6xl` (1152px) | Full width with `px-4` |
| Between sections | Inherent from `py-24` | Inherent from `py-16` |
| Card gap | `gap-6` (24px) | `gap-4` (16px) |

### 5.5 Button Styles

**Primary CTA:**
- Background: `bg-primary` (#2563EB)
- Text: `text-primary-foreground` (white)
- Radius: `rounded-2xl`
- Padding: `px-8 py-4` (large) or `px-6 py-3` (standard)
- Hover: `hover:bg-primary/90` + `hover:scale-[1.03]` transition
- Font: `text-base font-semibold`

**Secondary (Outline):**
- Border: `border border-foreground/20`
- Text: `text-foreground`
- Background: transparent
- Hover: `hover:bg-foreground/5`

---

## 6. CTA Implementation Flow

### User Journey:

```
User clicks "Book a Free Automation Audit" (any placement)
          |
          v
    Dialog opens (booking-modal.tsx)
          |
          v
    Step 1: Pre-qualification form
    - Full Name
    - Agency Name
    - Monthly Inquiry Volume
    - Platforms Used
    - Biggest Lead Handling Problem
          |
    User clicks "Continue to Booking"
          |
          v
    Form data POSTed to /api/lead
    (stores data, sends email notification via Resend - future)
    (writes to Google Sheet - future)
          |
          v
    Step 2: Calendly iframe loads inline
    - User selects date/time
    - Books directly within modal
          |
          v
    Booking complete. Dialog can close.
```

### CTA Placements (minimum 3, up to 5):

1. **Navbar** - Always visible (desktop), in mobile nav sheet
2. **Hero** - Primary hero CTA button
3. **After Pricing** - Below pricing tiers
4. **Final CTA Section** - Dedicated large section
5. **Mobile sticky bar** - Fixed bottom on mobile (after scrolling past hero)

All buttons identical: "Book a Free Automation Audit". No variation.

---

## 7. Form + Calendly Flow

### API Route: `/api/lead/route.ts`

```
POST /api/lead
Content-Type: application/json

Body:
{
  "fullName": string (required),
  "agencyName": string (required),
  "monthlyVolume": "0-20" | "20-50" | "50-100" | "100+",
  "platforms": string[] (subset of ["instagram", "facebook", "whatsapp", "website"]),
  "biggestProblem": string (optional, max 200 chars)
}

Response:
200 - { success: true }
400 - { error: "Validation failed", details: [...] }
```

**Current implementation:** Log to console + return success (functional skeleton).
**Future:** Resend email notification, Google Sheets append, CRM webhook.

### API Route: `/api/newsletter/route.ts`

```
POST /api/newsletter
Content-Type: application/json

Body:
{
  "name": string (required),
  "email": string (required, valid email)
}

Response:
200 - { success: true }
400 - { error: "Validation failed" }
```

### Calendly Integration

- **Environment variable:** `NEXT_PUBLIC_CALENDLY_URL` (user must provide their Calendly scheduling link)
- **Embed method:** iframe inside Dialog step 2
- **Fallback:** If env var not set, show "Booking calendar coming soon. Email us at [contact email]."
- **iframe attributes:** `width="100%"`, `height="630"`, `frameBorder="0"`

---

## 8. Analytics Setup

### Google Analytics 4

- **Script injection:** `layout.tsx` via `<Script>` component from `next/script`
- **Environment variable:** `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- **Events to track:**

| Event | Trigger | Parameters |
|-------|---------|------------|
| `cta_click` | Any CTA button click | `location` (hero, navbar, pricing, final, mobile_bar) |
| `form_start` | Pre-qualification form opened | - |
| `form_submit` | Pre-qualification form submitted | `monthly_volume`, `platforms_count` |
| `calendly_open` | Calendly iframe loaded | - |
| `newsletter_submit` | Email capture form submitted | - |

### Google Tag Manager

- **Environment variable:** `NEXT_PUBLIC_GTM_ID`
- **Script injection:** `layout.tsx` head + body noscript

### Meta Pixel

- **Environment variable:** `NEXT_PUBLIC_META_PIXEL_ID`
- **Script injection:** `layout.tsx`
- **Events:** `PageView` (auto), `Lead` (on form submit), `Schedule` (on Calendly load)

### Helper (`lib/analytics.ts`)

Utility functions:
- `trackEvent(eventName: string, params?: Record<string, string>)` - fires GA4 event
- `trackMetaEvent(eventName: string, params?: Record<string, string>)` - fires Meta Pixel event

Graceful fallback: if `window.gtag` or `window.fbq` undefined, no-op (no errors).

---

## 9. SEO Setup

### Metadata (`layout.tsx`)

```typescript
export const metadata: Metadata = {
  title: "AI Chatbot & Automation for Real Estate Agencies | Cheryl Cilla Atulah",
  description: "Reduce response time to under 5 seconds. Capture and qualify every lead automatically across WhatsApp, Instagram, Facebook and your website.",
  keywords: ["real estate automation", "AI chatbot real estate", "property lead qualification", "real estate WhatsApp bot"],
  authors: [{ name: "Cheryl Cilla Atulah" }],
  openGraph: {
    title: "AI Chatbot & Automation for Real Estate Agencies",
    description: "Reduce response time to under 5 seconds. Capture and qualify every lead automatically.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Chatbot & Automation for Real Estate Agencies",
    description: "Reduce response time to under 5 seconds. Capture and qualify every lead automatically.",
  },
}
```

### Viewport

```typescript
export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
}
```

### Semantic HTML

- Single `<h1>` in hero only
- Section headings: `<h2>`
- Sub-headings within sections: `<h3>`
- `<main>` wrapper around all sections
- `<header>` for navbar
- `<footer>` for footer
- `<section>` with `aria-labelledby` for each page section
- `<nav>` for navigation

### Structured Data (JSON-LD in layout.tsx)

Organization schema:
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Cheryl Cilla Atulah - AI Automation",
  "description": "AI Chatbot & Automation for Real Estate Agencies",
  "url": "https://[domain]"
}
```

---

## 10. Responsive Strategy

### Breakpoints

| Breakpoint | Width | Tailwind Prefix |
|-----------|-------|-----------------|
| Mobile | 320px+ | Default (no prefix) |
| Tablet | 768px+ | `md:` |
| Desktop | 1024px+ | `lg:` |

### Mobile-First Approach

All base styles target mobile. Desktop enhancements via `md:` and `lg:` prefixes.

### Key Responsive Behaviors

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| Navbar | Logo + hamburger | Logo + CTA | Logo + CTA |
| Hero | Stacked (text, then chat) | Stacked | Two-column |
| Feature cards | 1 column | 2 columns | 4 columns |
| Program features | 1 column | 2 columns | 2-3 columns |
| How It Works | Vertical flow | Vertical flow | Horizontal flow |
| Before/After cards | 1 column | 3 columns | 3 columns |
| Testimonials | 1 column | 2 columns | 3 columns |
| Pricing | 1 column stacked | 3 columns | 3 columns |
| FAQ | Full width | Full width | max-w-3xl centered |
| CTA bar | Sticky bottom visible | Hidden | Hidden |

### Touch Targets

- Minimum 44px height for all interactive elements on mobile
- CTA buttons: `py-4` minimum on mobile
- FAQ accordion triggers: `py-4` minimum
- Adequate spacing between tap targets

---

## 11. Animation System

### Library: Framer Motion

### Global Animation Presets (defined in `section-wrapper.tsx`)

**Section Entrance:**
```
initial: { opacity: 0, y: 20 }
whileInView: { opacity: 1, y: 0 }
transition: { duration: 0.6, ease: "easeOut" }
viewport: { once: true, amount: 0.2 }
```

**Staggered Cards (feature cards, pricing, testimonials):**
```
Parent: staggerChildren: 0.1
Child: { opacity: 0, y: 20 } -> { opacity: 1, y: 0 }
```

**Button Hover:**
```
whileHover: { scale: 1.03 }
whileTap: { scale: 0.98 }
transition: { type: "spring", stiffness: 400, damping: 17 }
```

**Navbar Background Transition:**
```css
transition-colors duration-300
```
Triggered by scroll position (JavaScript scroll listener, not Framer Motion).

**FAQ Accordion:**
- Uses built-in shadcn/Radix accordion animation (already configured in tailwind.config.ts)
- `animate-accordion-down` / `animate-accordion-up` keyframes pre-configured

### What We Do NOT Animate

- No parallax effects
- No looping animations
- No heavy SVG path animations
- No page transition animations
- No auto-playing carousels or sliders

---

## 12. Deployment Steps (Vercel)

### Pre-Deployment Checklist

1. All components built and tested locally via `pnpm dev`
2. `pnpm build` passes without errors
3. Environment variables documented

### Environment Variables Required

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_CALENDLY_URL` | Yes | Calendly scheduling page URL |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | Google Analytics 4 measurement ID |
| `NEXT_PUBLIC_GTM_ID` | No | Google Tag Manager container ID |
| `NEXT_PUBLIC_META_PIXEL_ID` | No | Meta/Facebook Pixel ID |
| `RESEND_API_KEY` | No (future) | Resend API key for email notifications |
| `NOTIFICATION_EMAIL` | No (future) | Email to receive lead notifications |

### Deployment Flow

1. Connect GitHub repository to Vercel project (via v0 sidebar)
2. Set environment variables in Vercel dashboard (or v0 Vars panel)
3. Push to main branch triggers automatic deployment
4. Vercel auto-detects Next.js, builds with Turbopack
5. Preview URL generated for review
6. Promote to production domain when ready

### Performance Targets

- LCP < 2.5s (hero text renders immediately as static content)
- FID < 100ms (minimal JavaScript on initial load)
- CLS < 0.1 (all images/embeds have explicit dimensions)
- Lighthouse Performance: 90+

### Post-Deployment

- Verify Calendly embed loads correctly
- Test form submission API routes
- Confirm analytics events firing in GA4 real-time view
- Test mobile sticky CTA bar behavior
- Cross-browser check (Chrome, Safari, Firefox, mobile Safari)

---

## 13. Implementation Order

The page will be built as a single cohesive landing page. Recommended build sequence:

1. **Foundation:** Update `globals.css` with dark theme tokens, update `tailwind.config.ts` with font family, update `layout.tsx` with metadata/viewport/scripts
2. **Shared utilities:** Create `lib/constants.ts` (all content data), `lib/analytics.ts`, `section-wrapper.tsx`
3. **Page shell:** Build `page.tsx` composing all section imports
4. **Sections top-down:** Navbar -> Hero + Chat Mockup -> Problem -> Solution -> Program Features -> How It Works -> Social Proof -> Pricing -> Guarantee -> Founder -> FAQ -> Final CTA -> Lead Capture -> Footer
5. **Interactive overlays:** Booking Modal, Mobile Nav, Mobile CTA Bar
6. **API Routes:** `/api/lead`, `/api/newsletter`
7. **Analytics wiring:** Add event tracking to all CTA clicks and form submissions

---

*Document generated for production implementation. All decisions are final per the locked directive documents.*
