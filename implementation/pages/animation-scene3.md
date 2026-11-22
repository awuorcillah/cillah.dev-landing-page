# Home Page Animation — Scene 3 Plan (Agent Pipelines & Notifications)

**Branch:** `home-redesign` (Scene 2 is already committed & pushed on `home-redesign` as `b661f4f`; `main` untouched)  
**Scope:** Build Scene 3 of 3 ("each sales agent gets their own pipeline and notifications") and wire it into `flow-animation.tsx` to complete the full 3-scene animation sequence.  
**Dependencies & Guardrails:** Zero new dependencies (reuses existing `framer-motion` `^11.0.0`, plain CSS, and inline SVG). Zero images, zero videos, zero external requests. No changes to `scene-1-inquiries.tsx`, `scene-2-building.tsx`, `channel-icons.tsx`, `components/home-page-client.tsx`, `package.json`, lock files, API routes, or any other section of the page.

---

## 1. Visual System (Reusing Existing Brand Tokens Only)

Matched directly to Scene 1 and Scene 2:
- **Canvas:** `#07070B`
- **Panels & Agent Cards:** `#1C1C1C` with thin `border border-white/10`
- **Text:** `#F9F7F6` (secondary `#F9F7F6]/65`–`75`, subtle muted `#F9F7F6]/45`)
- **Gold Accent:** `#C9A66B` (branch lines, initial badge border/tint, scan line, pulsing attention chips, bell icon & toast highlights)
- **Typography:** `font-heading` (`Sora`) for headings/labels/badges, `font-sans` (`Inter`) for chips, counters, and notifications. **Every text element in Scene 3 is `>= 12px`** (no text smaller than `12px`).
- **Icons:** Inline SVG outline bell icon (`fill="none"`, `stroke="currentColor"`, `strokeWidth="1.6"`). Zero external icons/images.

---

## 2. Parent Changes (`components/flow-animation/flow-animation.tsx`)

- **Full 3-Scene Sequence:**
  - Scene 1 → `0.9 s` hold → `600 ms` scale-and-fade zoom (`300 ms` exit + `300 ms` enter) → Scene 2 → `0.9 s` hold → `600 ms` scale-and-fade zoom → Scene 3 → rests on Scene 3's final frame.
- **Progress Dots (All 3 Enabled):**
  - Dot 1 → jumps straight to Scene 1's final frame (`forceFinalFrame = true`, clears timers).
  - Dot 2 → jumps straight to Scene 2's final frame.
  - Dot 3 → **enabled** (`aria-label="Show scene 3"`), jumps straight to Scene 3's final frame.
- **Replay:** Restarts the full sequence from **Scene 1** (`currentScene = 1`, `forceFinalFrame = false`, increments `playNonce`).
- **Shared Fixed Stage Height Per Breakpoint (All 3 Scenes — Zero Page Jump):**
  - **Phone (`375 px`, `< 640px`):** `h-[940px]` *(raised from `860px` so Scene 3's stacked backend + 4 compact cards + closing line fit with `>= 12px` text and zero clipping)*
  - **Tablet (`768 px`, `640px–1023px`):** `sm:h-[820px]` *(already comfortably fits Scene 1, Scene 2, and Scene 3)*
  - **Desktop (`1024 px+`, `lg:`):** `lg:h-[620px]` *(raised from `560px` so Scene 3's 4 full pipeline cards + closing line fit cleanly with `>= 12px` text and zero clipping)*
- **Reduced Motion (`prefers-reduced-motion: reduce`):**
  - Zero motion, zero timers; displays the final frame of the currently active scene while allowing all 3 progress dots to switch between Scene 1, Scene 2, and Scene 3 final frames.
- **Accessibility & SEO:**
  - Animated stage remains `aria-hidden="true"`; progress dots and `"Replay"` stay outside `aria-hidden` and keyboard-operable.
  - Update `<p className="sr-only">` to:
    > `"Customers message a real estate agency on WhatsApp, Instagram, Facebook, TikTok and LinkedIn. An AI assistant answers, collects their name and assigns each lead to a sales agent. All inquiries and website form submissions flow into one private backend, where each lead is assigned to a sales agent. Each lead then lands in the pipeline of its assigned sales agent, who receives notifications for new leads, follow-ups and upcoming viewings."`
  - Keep `"Sample data, fictional"` label and the existing caption line below `#cillah-flow-animation` untouched.

---

## 3. Scene 3 Design (`components/flow-animation/scene-3-pipelines.tsx`)

### Visual Elements
- **Backend Panel:** Labelled **`Backend: your private office`** with counter **`New leads: 6`** (carried over from Scene 2), plus a subtle gold **`Two days later`** badge that appears at Step 5.
- **Four Gold Branch Lines:** Inline SVG thin gold lines (`#C9A66B`, `strokeDasharray="4 4"`) connecting the backend panel to the four agent cards, with travelling gold dots/chips moving along the branches during lead distribution.
- **Four Agent Cards (`Tom`, `Mary`, `Jane`, `Dan`):**
  - Round initial badge (`T`, `M`, `J`, `D`), agent name, and notification toast area (bell outline SVG + readable `12px` toast text fading in and out).
  - Mini pipeline with 4 stages: **`New`**, **`Contacted`**, **`Viewing booked`**, **`Closed`**.
  - First-name-only lead chips: `Grace`, `Peter`, `Njeri`, `Brian`, `Caroline`, `Kelvin`.
- **Gold Scan Line:** Thin vertical gold scan line sweeping smoothly left-to-right across the 4 pipelines in Step 6, highlighting chips that need attention with a subtle gold pulse.
- **Closing Line:** Below the 4 cards on the final frame: **`Every lead assigned. Every follow-up reminded.`** (no statistics or percentages).

### Exact Sequence & Timing (`9.6 s` Total — Under 12 s)
1. **`0.0 s` — Backend Ready:** Backend panel (`New leads: 6`) and four empty agent cards (`Tom`, `Mary`, `Jane`, `Dan`) appear.
2. **`0.35 s` — Gold Branches Draw:** Four thin gold branch lines animate from the backend panel to the four cards (`~0.55 s`).
3. **`1.0 s` → `1.9 s` — Lead Distribution:** Travelling gold lead pulses move along the branches and lead chips land in each agent's **`New`** stage:
   - **Tom:** `Grace`, `Peter`
   - **Mary:** `Njeri`, `Brian`
   - **Jane:** `Caroline`
   - **Dan:** `Kelvin`
4. **`2.4 s` — New-Lead Notifications Fade In:**
   - **Tom:** `"New lead: Grace, 2-bed in Kilimani"`
   - **Mary:** `"New lead: Brian, 3-bed in Lavington"`
   - **Jane:** `"New lead: Caroline, Runda villa"`
   - **Dan:** `"New lead: Kelvin, plot in Karen"`
5. **`4.2 s` → `4.9 s` — "Two days later" Progression:**
   - New-lead notifications fade out (`4.2 s`), **`Two days later`** badge appears (`4.4 s`), and chips advance (`4.9 s`):
     - **Grace** → `Contacted` (Tom; `Peter` remains in `New`)
     - **Njeri** → `Contacted` (Mary; `Brian` remains in `New`)
     - **Caroline** → `Viewing booked` (Jane)
     - **Kelvin** remains in `New` (Dan)
6. **`6.3 s` → `7.5 s` — Gold Scan Line & Follow-Up Alerts:**
   - A thin gold scan line sweeps across all four pipelines (`1.2 s` sweep).
   - At `7.4 s`, attention chips pulse gold (`Peter`, `Brian`, `Kelvin`, and `Caroline` for tomorrow's viewing), and follow-up/reminder notification toasts fade in:
     - **Tom:** `"Follow-up due: Peter, no reply yet"`
     - **Mary:** `"Follow-up due: Brian"`
     - **Dan:** `"Follow-up due: Kelvin"`
     - **Jane:** `"Reminder: viewing tomorrow 10:00, Caroline"`
7. **`8.6 s` → `9.6 s` — Final Resting Frame:**
   - Closing line fades in: **`Every lead assigned. Every follow-up reminded.`**
   - Calls `onComplete()` at **`9.6 s`** and rests on the final frame.

### Planned Full 3-Scene Durations
- **Scene 1:** `6.1 s` (desktop `>= 1024px`) / `11.6 s` (phone & tablet `< 1024px`)
- **Scene 1 → 2 transition:** `0.9 s` hold + `0.6 s` zoom (`1.5 s`)
- **Scene 2:** `7.9 s`
- **Scene 2 → 3 transition:** `0.9 s` hold + `0.6 s` zoom (`1.5 s`)
- **Scene 3:** `9.6 s`
- **Full sequence total:** **`26.6 s`** on desktop / **`32.1 s`** on phone & tablet.

### Responsive Layouts (`lg` = `1024px` Breakpoint)
- **Desktop (`>= 1024px`, `lg:`):**
  - 12-column grid (`max-w-6xl mx-auto`): compact Backend panel on the left (`col-span-3`), SVG gold branch lines fanning from the panel to each card (`col-span-1`), and the 4 agent cards stacked vertically on the right (`col-span-8`), each showing its 4 pipeline stages (`New`, `Contacted`, `Viewing booked`, `Closed`) in a horizontal row (`grid-cols-4 gap-2`, `min-w-0`, all text `>= 12px`).
- **Phone & Tablet (`< 1024px`, readable at 375 px & 768 px, zero horizontal scroll):**
  - Compact Backend panel at the top (`max-w-xl mx-auto`), short downward gold branch lines SVG (`h-6`), then the 4 compact agent cards stacked below.
  - Each compact card shows: round initial badge + agent name + lead chips (`>= 12px`), short labelled stage counters (`New: X`, `Contacted: X`, `Viewing booked: X`, `Closed: X` in `grid-cols-2 sm:grid-cols-4 gap-1.5` so all labels stay `>= 12px` with zero wrapping/clipping at 375 px and sit on 1 row at 768 px), and the bell notification toast line below (`>= 12px`).
- **Timer Cleanup:**
  - All `window.setTimeout` handles tracked in `timersRef` and cleared on unmount, Replay, dot click (`forceFinalFrame`), `prefers-reduced-motion`, and `< 1024px` / `>= 1024px` breakpoint changes.

---

## 4. Complete List of Files to Create or Change

### New Files (1)
1. **`components/flow-animation/scene-3-pipelines.tsx`** — Scene 3 component with Backend panel, gold branch lines, 4 agent cards (`Tom`, `Mary`, `Jane`, `Dan`), pipeline progression, gold scan line, pulsing attention chips, bell notification toasts, closing line, `forceFinalFrame`, `prefers-reduced-motion`, and full timer cleanup.

### Modified Files (1)
1. **`components/flow-animation/flow-animation.tsx`** — Extend sequence to Scene 1 → zoom → Scene 2 → zoom → Scene 3 → rest; enable Dot 3; update shared fixed stage height (`h-[940px] sm:h-[820px] lg:h-[620px]`); update `sr-only` summary.

*(Total: 1 new file + 1 modified file. `scene-1-inquiries.tsx`, `scene-2-building.tsx`, `channel-icons.tsx`, `components/home-page-client.tsx`, `package.json`, lock files, API routes, and all other page sections stay untouched.)*

---

## 5. Verification Plan (After Approval)
1. Run full `npm run build` (`tinacms build && next build`) and `npx tsc --noEmit` on `components/flow-animation/*`, confirming 0 errors.
2. Verify in compiled `.next/server/app/index.html` and source:
   - Updated `sr-only` summary verbatim, 3 enabled progress dots, shared fixed heights (`h-[940px] sm:h-[820px] lg:h-[620px]`), `"Sample data, fictional"`, and `"Replay"`.
   - Zero text classes `< 12px` in `scene-3-pipelines.tsx`; zero external URLs, `<img>`, `<video>`, or `fetch()` calls.
   - Exact fictional names (`Grace`, `Peter`, `Njeri`, `Brian`, `Caroline`, `Kelvin`), exact agents (`Tom`, `Mary`, `Jane`, `Dan`), exact notifications, `"Two days later"`, and `"Every lead assigned. Every follow-up reminded."` (zero statistics/percentages).
3. Present complete summary and wait for `"go"` before committing or pushing to `home-redesign`.
