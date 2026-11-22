# Home Page Animation — Scene 2 Plan (Channels Feed Into One Building)

**Branch:** `home-redesign` (staying on `home-redesign`; no commits or pushes until approved)  
**Scope:** Build Scene 2 of 3 ("channels feed into one building") and upgrade `flow-animation.tsx` to transition smoothly from Scene 1 → Scene 2 with progress dots, fixed per-breakpoint stage height, and Scene 3 extensibility.  
**Dependencies & Guardrails:** Zero new dependencies (reuses existing `framer-motion` `^11.0.0`, plain CSS, and inline SVG). Zero images, zero videos, zero external requests. No changes to `components/home-page-client.tsx`, `package.json`, lock files, API routes, or any other section of the site.

---

## 1. Visual System (Reusing Existing Site Tokens Only)

Matched directly to `components/flow-animation/scene-1-inquiries.tsx` and `components/home-page-client.tsx`:

- **Canvas:** `#07070B`
- **Building Faces / Panels:** `#1C1C1C` with thin `border border-white/10`
- **Text:** `#F9F7F6` (muted labels `#F9F7F6]/50`–`70`)
- **Gold Accent:** `#C9A66B` (dotted lines, active icons, gold Submit button, travelling dot, assignment pills, counter accent)
- **Typography:** Headings/labels in `font-heading` (`Sora`), body/form/rows in `font-sans` (`Inter`)
- **Icons:** Inline SVG outline icons (`fill="none"`, ivory & gold only, zero official brand colours) extracted into `components/flow-animation/channel-icons.tsx` and shared between Scene 1 and Scene 2 (adding a simple outline `website` globe/window icon for Brian's `"Website form"` row).

---

## 2. Parent Changes (`components/flow-animation/flow-animation.tsx`)

### Sequence & Transition
- Plays **Scene 1** once when scrolled into view (`IntersectionObserver`, `threshold: 0.2`).
- After Scene 1 completes, holds briefly (~900 ms so the viewer sees all completed Scene 1 chats), then performs a smooth **600 ms zoom transition** (`AnimatePresence mode="wait"`):
  - Exit: `opacity: 0, scale: 1.04` (600 ms `easeInOut`)
  - Enter: `opacity: 0, scale: 0.96` → `opacity: 1, scale: 1` (600 ms `easeInOut`)
- Plays **Scene 2** once, then rests on Scene 2's final frame (`currentScene === 2`). Scene 3 (`FlowScene = 1 | 2 | 3`) remains ready to wire in next.

### Fixed Stage Height (Zero Page Jump Between Scenes)
- The animated stage wrapper uses an explicit fixed height per breakpoint so switching between Scene 1 and Scene 2 never shifts content below:
  - **Phone (`< 640px`, checked for 375 px):** `h-[720px]`
  - **Tablet (`640px`–`1023px`, checked for 768 px):** `h-[700px]`
  - **Desktop (`>= 1024px`, `lg:`):** `h-[540px]`
- Both Scene 1 and Scene 2 fit comfortably inside these fixed heights with zero text clipping and zero horizontal scroll.

### Progress Dots & Controls Under the Stage
- **3 small progress dots** centred under the stage (outside `aria-hidden` so keyboard/screen-reader users can operate them):
  - **Dot 1 (Scene 1):** clickable; jumps straight to Scene 1's **final frame** (cancels any active transition/playback timers).
  - **Dot 2 (Scene 2):** clickable; jumps straight to Scene 2's **final frame**.
  - **Dot 3 (Scene 3):** greyed out and `disabled` (`aria-label="Scene 3 coming soon"`) until Scene 3 is added.
- **Footer bar:**
  - Label updated to: **`Sample data, fictional`**
  - Small **`Replay`** text button restarts the full sequence from **Scene 1** (`currentScene = 1`, `forceFinalFrame = false`, increments `playNonce`).

### Reduced Motion (`prefers-reduced-motion: reduce`)
- Zero motion and zero timers (no Scene 1 → Scene 2 auto-advance timer and no internal step timers).
- Shows the **final frame** of the currently selected scene, and clicking Dot 1 or Dot 2 switches immediately between Scene 1's final frame and Scene 2's final frame.

### Accessibility & SEO
- Keep `aria-hidden="true"` on the animated visual stage.
- Update the `<p className="sr-only">` summary to:
  > `"Customers message a real estate agency on WhatsApp, Instagram, Facebook, TikTok and LinkedIn. An AI assistant answers, collects their name and assigns each lead to a sales agent. All inquiries and website form submissions flow into one private backend, where each lead is assigned to a sales agent."`
- Leave the existing caption line below `#cillah-flow-animation` in `components/home-page-client.tsx` untouched.

---

## 3. Scene 2 Design (`components/flow-animation/scene-2-building.tsx`)

### Building Structure (Plain CSS + Inline SVG)
Two faces slightly offset on desktop to suggest architectural depth (and stacked vertically below `1024px`):
- **FRONT face** — Label: **`Frontend: what your customers see`**
  - Compact mini-website card (`#1C1C1C`, thin `border-white/10`, subtle top bar) containing a mini form:
    - `Name` → fills with **`Brian`**
    - `Phone` → fills with **`+254 700 000 006`**
    - `Looking for` → fills with **`3-bed in Lavington`**
    - Gold **`Submit`** button (`bg-[#C9A66B] text-[#07070B]`) that pulses on submit.
- **BACK face** — Label: **`Backend: your private office`**
  - Header with live counter **`New leads`** (`0` → `6`).
  - Lead list filling up to 6 rows (only agents `Tom`, `Mary`, `Jane`, `Dan`):
    1. **Grace** — WhatsApp icon — `Assigned to Tom`
    2. **Njeri** — LinkedIn icon — `Assigned to Mary`
    3. **Caroline** — Instagram icon — `Assigned to Jane`
    4. **Peter** — TikTok icon — `Assigned to Tom`
    5. **Kelvin** — Facebook icon — `Assigned to Dan`
    6. **Brian** — Website icon (`Website form`) — `Assigned to Mary`

### Animation Sequence
1. **Channel Icons & Flow Lines:** The five outline channel icons (`WhatsApp`, `LinkedIn`, `Instagram`, `TikTok`, `Facebook`) appear; thin gold dotted SVG lines (`#C9A66B`, `strokeDasharray`) animate one by one from each icon into the **BACK** face.
2. **Backend Lead Rows & Counter:** As each channel line arrives, its corresponding lead row fades & rises into the backend list (showing lead name, source outline icon, and `"Assigned to [agent]"`), incrementing `"New leads"` from `1` through `5`.
3. **Frontend Form Auto-Fill & Submit:** In the **FRONT** face, the website form fills one field at a time (`Brian` → `+254 700 000 006` → `3-bed in Lavington`). The gold `Submit` button pulses, a glowing gold dot travels along a path from the form into the **BACK** face, and the 6th row appears (**Brian**, Website form, **Assigned to Mary**), updating `"New leads"` to **`6`**.
4. **Rest:** Rests on the complete final frame and notifies the parent via `onComplete()`.

### Responsive Layouts (`lg` = `1024px` Breakpoint)
- **Desktop (`>= 1024px`, `lg:`):**
  - 5 channel icons spaced in a row centred above the building.
  - Inline SVG thin gold dotted lines curving/flowing down from each icon into the **BACK** face.
  - Centred two-face building (`max-w-5xl mx-auto`): **FRONT** face positioned slightly forward/left with subtle elevation shadow and **BACK** face offset behind/right-upward to suggest 3D depth, with a gold connector path carrying the travelling dot from `Submit` into the Back face.
- **Phone & Tablet (`< 1024px`, readable at 375 px and 768 px, zero horizontal scroll):**
  - Compact 5-icon row across the top (`grid-cols-5 gap-1.5 sm:gap-3`), with short vertical gold dotted lines flowing downward.
  - Building stacked vertically (`w-full max-w-xl mx-auto`): **FRONT** face first (readable `text-[13px] sm:text-[14px]` form fields & Submit button), short vertical gold connector with travelling dot, then **BACK** face below (readable `text-[12.5px] sm:text-[13.5px]` lead rows + `New leads` counter). All flex/grid children use `min-w-0` so zero overflow occurs at 375 px or 768 px.

### Timer Cleanup
- Every `window.setTimeout` in both `flow-animation.tsx` and `scene-2-building.tsx` is stored in a ref and cleared on unmount, on Replay, on dot click (`forceFinalFrame`), when `prefers-reduced-motion` is on, and on `< 1024px` / `>= 1024px` breakpoint changes.

---

## 4. Complete List of Files to Create or Change

### New Files (2)
1. **`components/flow-animation/channel-icons.tsx`** — Shared inline SVG outline icons (`whatsapp`, `linkedin`, `instagram`, `tiktok`, `facebook`, `website`) in ivory & gold and shared `ChannelId` type.
2. **`components/flow-animation/scene-2-building.tsx`** — Scene 2 component (5 channel icons, animated gold dotted SVG lines, two-face Front/Back building, auto-filling mini form, pulsing Submit button, travelling gold dot, 6-row backend lead list + `New leads` counter, `lg` layered layout & `< lg` vertical stacked layout).

### Modified Files (2)
1. **`components/flow-animation/flow-animation.tsx`** — Scene 1 → 600 ms zoom transition → Scene 2 sequencing, 3 progress dots (Scene 3 disabled/greyed out), fixed per-breakpoint stage height, `"Sample data, fictional"` label, `"Replay"` from Scene 1, updated `sr-only` SEO summary, reduced-motion dot switching.
2. **`components/flow-animation/scene-1-inquiries.tsx`** — Switch to shared `ChannelOutlineIcon` from `./channel-icons` and add `forceFinalFrame?: boolean` prop so clicking Dot 1 displays Scene 1's final frame cleanly with zero timers.

*(Total: 2 new files + 2 modified files. `components/home-page-client.tsx`, `package.json`, lock files, API routes, and all other page sections are untouched.)*

---

## 5. Verification Plan (After Approval)
1. Run full `npm run build` (`tinacms build && next build`) and `npx tsc --noEmit` on touched files, confirming 0 errors.
2. Verify in compiled HTML & source:
   - Updated `sr-only` summary is present verbatim in `.next/server/app/index.html`.
   - `"Sample data, fictional"` label, 3 progress dots (Dot 3 disabled), and `"Replay"` button are present.
   - Zero external URLs, `<img>`, `<video>`, or `fetch()` calls in `components/flow-animation/*`.
   - Only agents `Tom`, `Mary`, `Jane`, and `Dan` appear; leads match Scene 1 + Brian (`+254 700 000 006`, `3-bed in Lavington`, `Website form`, `Assigned to Mary`, counter `6`).
   - Fixed per-breakpoint stage heights (`h-[720px] sm:h-[700px] lg:h-[540px]`) and zero horizontal overflow classes at 375 px, 768 px, and 1024 px.
3. Present summary and wait for `"go"` before committing or pushing to `home-redesign`.
