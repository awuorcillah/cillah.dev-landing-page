# Home Page Animation — Scene 1 Plan (Inquiries Across Channels)

**Branch:** `home-redesign` (staying on `home-redesign`; no commits or pushes until approved)  
**Scope:** Build Scene 1 of 3 inside the existing `#cillah-flow-animation` container on the home page, structured so Scene 2 and Scene 3 plug directly into the parent component later.  
**Dependencies:** Checked `package.json` — `framer-motion` (`^11.0.0`) is already installed and used in `components/home-page-client.tsx`. **Zero new dependencies** will be added. `package.json`, lock files, all API routes, and all other sections of the home page remain untouched.

---

## 1. Visual System (Reusing Existing Site Tokens Only)

Matched directly from `components/home-page-client.tsx`, `app/globals.css`, and `tailwind.config.ts`:

- **Canvas / Background:** `#07070B`
- **Panels / Cards:** `#1C1C1C` with thin `border border-white/10`
- **Primary Text:** `#F9F7F6` (secondary muted `#F9F7F6]/65`–`75`, subtle labels `#F9F7F6]/45`)
- **Gold Accent:** `#C9A66B` (borders `border-[#C9A66B]/40`, soft tint `bg-[#C9A66B]/10`)
- **Typography:** Headings / labels in `font-heading` (`Sora`), body / chat text in `font-sans` (`Inter`)
- **Channel Icons:** Custom inline `<svg>` outline icons (`fill="none"`, ivory `#F9F7F6` & gold `#C9A66B` stroke). Zero official brand colours, zero external images, zero external network requests.
- **Chat Bubbles:**
  - **Customer bubble:** Dark fill (`bg-[#07070B]/80`) with thin border (`border border-white/10`), ivory text (`text-[#F9F7F6]/90`), subtle customer name label.
  - **AI bubble:** Gold-bordered panel (`border border-[#C9A66B]/45 bg-[#C9A66B]/[0.06]`), small gold label `"Cillah AI"`, ivory text (`text-[#F9F7F6]`).
  - **Assignment tag:** Small gold pill (`border border-[#C9A66B]/40 bg-[#C9A66B]/10 text-[#C9A66B]`) showing `"Assigned to Tom"` / `"Assigned to Mary"` / `"Assigned to Jane"` / `"Assigned to Dan"`.

---

## 2. Component Architecture (Ready for Scenes 2 & 3)

### A. `components/flow-animation/flow-animation.tsx` (Parent Client Component)
- Exported as `FlowAnimation` and loaded in `components/home-page-client.tsx` via `next/dynamic` (code-split chunk so it does not slow first page load, while keeping SSR output for the visually hidden SEO summary).
- **Scene State:** Holds `type FlowScene = 1 | 2 | 3` and `currentScene` state (initialized to `1`). Renders `<Scene1Inquiries ... />` when `currentScene === 1`, with clean switch/extension points ready for Scene 2 and Scene 3.
- **Scroll Trigger (`IntersectionObserver`):** Observes the stage wrapper (`threshold: 0.2`). Does not start playing while off-screen; triggers playback once when scrolled into view.
- **Reduced Motion (`prefers-reduced-motion: reduce`):**
  - Checks `window.matchMedia("(prefers-reduced-motion: reduce)")` and listens for changes.
  - When enabled: renders the complete final frame immediately with **no motion** and **no timers**.
- **Play Once + Replay Control:**
  - Plays Scene 1 once, then rests on the final frame.
  - Renders a subtle footer bar inside the stage with:
    - Small label: `"Sample conversations, fictional data"`
    - Small `"Replay"` text button (resets playback via an incrementing `playNonce`, only active once playback has started and hidden/no-op when reduced motion is on, or cleanly resets to final frame).
- **Accessibility & SEO:**
  - Visually hidden summary (`<p className="sr-only">`) readable by screen readers and search engines:
    > `"Customers message a real estate agency on WhatsApp, Instagram, Facebook, TikTok and LinkedIn. An AI assistant answers, collects their name and assigns each lead to a sales agent."`
  - Visual animation stage wrapped in `aria-hidden="true"`.
  - `"Replay"` button remains outside `aria-hidden` so keyboard/screen-reader users are not trapped.

### B. `components/flow-animation/scene-1-inquiries.tsx` (Scene 1 Client Component)
- Renders the 5 channels in a row in this exact order:
  1. **WhatsApp**
  2. **LinkedIn**
  3. **Instagram**
  4. **TikTok**
  5. **Facebook**
- **Exact Sample Conversations (All Fictional; Only Agents Tom, Mary, Jane, Dan):**
  1. **WhatsApp — Grace**
     - Customer: `"How much is the 2-bed in Kilimani?"`
     - `Cillah AI`: `"From KES 14,500,000. May I have your name so I can assign you to one of our agents?"`
     - Customer: `"Grace"`
     - `Cillah AI`: `"Thanks Grace. Tom will message you shortly."`
     - Tag: `"Assigned to Tom"`
  2. **LinkedIn — Njeri**
     - Customer: `"Looking for office space in Westlands."`
     - `Cillah AI`: `"Great. May I have your name so I can assign you to an agent?"`
     - Customer: `"Njeri"`
     - Tag: `"Assigned to Mary"`
  3. **Instagram — Caroline**
     - Customer: `"Is the Runda villa still available?"`
     - `Cillah AI`: `"Yes, it is. May I have your name so I can assign you to an agent?"`
     - Customer: `"Caroline"`
     - Tag: `"Assigned to Jane"`
  4. **TikTok — Peter**
     - Customer: `"Can I view the apartment this weekend?"`
     - `Cillah AI`: `"Yes. May I have your name so I can assign you to an agent?"`
     - Customer: `"Peter"`
     - Tag: `"Assigned to Tom"`
  5. **Facebook — Kelvin**
     - Customer: `"Do you have plots in Karen?"`
     - `Cillah AI`: `"We do. May I have your name so I can assign you to an agent?"`
     - Customer: `"Kelvin"`
     - Tag: `"Assigned to Dan"`

- **Desktop Layout (`>= 640px`, `sm:` and up):**
  - 5-column grid (`grid-cols-5` with generous spacing `gap-3 lg:gap-5`) displaying all five inline SVG outline icons across the top of each column, with each channel's chat bubbles popping in below its icon.
  - **Staggered reveal:** Channels activate in staggered order (WhatsApp → LinkedIn → Instagram → TikTok → Facebook) with overlapping timing so each channel icon highlights in gold and its bubbles + `"Assigned to ..."` tag appear one by one with a soft fade + slight rise (`opacity: 0, y: 10` → `opacity: 1, y: 0`, ~300 ms `easeOut`).
  - Rests on the complete final frame showing all 5 completed conversations and assignment tags.

- **Phone Layout (`< 640px`, verified for 375 px width with zero horizontal scroll):**
  - Compact 5-icon row at the top (`grid-cols-5 gap-2`), with the currently active channel icon highlighted in gold (`border-[#C9A66B] bg-[#C9A66B]/15 text-[#C9A66B]`) and the others in muted ivory/white-10.
  - Below the icon row, **one single `#1C1C1C` conversation panel** (`border border-white/10 rounded-[16px] p-4 min-h-[260px]`) that plays each of the 5 channels in turn — bubbles pop in one after another followed by the `"Assigned to ..."` tag, brief reading pause, then smoothly advances to the next channel, resting on the final completed channel.
  - Once finished (or in reduced-motion mode), tapping any of the 5 icons also allows viewing that channel's completed conversation without breaking the single-panel mobile layout.

- **Timer Cleanup:**
  - All `window.setTimeout` handles are stored in a ref array and cleared on unmount, on Replay, when `prefers-reduced-motion` is active, and on desktop/mobile media-query change.

---

## 3. Complete List of Files to Create or Change

### New Files (2)
1. **`components/flow-animation/flow-animation.tsx`** — Parent animation stage (`currentScene` state for Scenes 1–3, `IntersectionObserver`, `prefers-reduced-motion`, Replay button, `"Sample conversations, fictional data"` label, `sr-only` summary, `aria-hidden` stage).
2. **`components/flow-animation/scene-1-inquiries.tsx`** — Scene 1 with 5 inline SVG outline channel icons, exact sample conversations, staggered 5-column desktop layout, single-panel sequential mobile layout, Framer Motion soft fade-and-rise transitions, and complete timer cleanup.

### Modified Files (1)
1. **`components/home-page-client.tsx`** — Dynamically import `FlowAnimation` via `next/dynamic` and render it inside the existing `<div id="cillah-flow-animation" className="w-full min-h-[280px] sm:min-h-[340px] md:min-h-[400px]">` container (keeping its exact `id`, reserved height, heading, sub-line, and bottom caption line untouched; widening only that section's outer wrapper from `max-w-5xl` to `max-w-7xl` so the 5 desktop columns have generous room while keeping the heading at `max-w-3xl` and caption at `max-w-2xl`).

*(Total: 2 new files + 1 modified file. Zero changes to any other home page section, API routes, `package.json`, or lock files.)*

---

## 4. Verification Plan (After Approval)
1. Run full `npm run build` (`tinacms build && next build`) and confirm 0 errors.
2. Verify compiled HTML / bundle:
   - `#cillah-flow-animation` exists with reserved height and caption line untouched below it.
   - `sr-only` accessibility summary text is present verbatim.
   - Zero external image/video/network references in `components/flow-animation/*`.
   - Zero references to any agent outside Tom, Mary, Jane, and Dan.
   - All timers cleaned up on unmount; `prefers-reduced-motion` path sets final frame with zero timers.
3. Verify zero horizontal overflow classes at 375 px width.
4. Present summary and wait for `"go"` before committing or pushing to `home-redesign`.
