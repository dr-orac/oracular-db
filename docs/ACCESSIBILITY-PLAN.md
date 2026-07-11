# Accessibility pass — plan (2026-07-11)

A comprehensive a11y roadmap. The goal (user): **a minimum brightness floor for text** so nothing is
too dark to read, **while keeping noticeably different brightness levels for hierarchy**; and **a
reasonable minimum font size**. Target: **WCAG 2.1 AA**, on both surfaces (screen phosphor + chassis
metal) and all 11 colour presets. Track work here; each item lands as its own commit.

## ✅ Step 0 — DONE: text-brightness floor (the immediate fix)
`--fg-dim` (the dimmest colour used for *text*: captions, descriptions, subtitles, doc meta) was ~5:1
on its bg — technically AA (4.5) but weak, especially at small sizes. **Raised it to ~6.5:1 across all
11 themes** while keeping it clearly below `primary` (7–15:1) and `bright` (13–18:1), so the hierarchy
holds: **bright > fg > dim**, all comfortably readable. `--fg-faint` (1.2–1.6:1) is **non-text only**
(borders/rules) — verified it never colours prose (only borders, a decorative ⸻ rule, and underline
decoration). Documented the token roles in `THEMES`.

## Contrast — remaining
- [ ] Audit EVERY text-colour usage against its actual background (there are 65 `color:var(--fg-dim)`
      sites) — confirm all clear AA at their rendered size; flag any still-weak combos.
- [ ] The **CRT scanline + vignette overlays** lower *effective* on-screen contrast — measure with them
      on (default) and soften if they push borderline text under AA.
- [ ] **Chassis metal text** is engraved dark-on-olive by design (two-surface law) — check
      `--panel-ink` on `--panel*` meets AA; it's a separate contrast context from the phosphor screen.
- [ ] Check specific pairs: `.dq` quoted-speech, links (`--fg-bright` underlined), input placeholders,
      disabled states (`.stepbtn:disabled`), error text (`.docstatus.error`), the coming-soon copy,
      `mark.docfind` highlight (bg vs text), wiki `.wiki-card`/`.wiki-callout` bodies.
- [ ] Add an optional **High-Contrast mode** (honours `prefers-contrast: more`): drop the scanline,
      push dim→fg, thicken focus rings. Small, high value.

## Minimum font size
Current tiers: body/reading prose **≥17px** (enforced via `--root-fs` floor + the text-size stepper +
the `.row-sub` 17px rule); `--fs-note` **14px** (captions/counts/TOC); `--fs-hint` **13px** (stated
"absolute minimum"). Gaps:
- [ ] **Raw 11px / 12px** usages (e.g. `.faction-legend` 11px, a couple of labels) dip BELOW the stated
      13px minimum — review: bump to ≥12–13px, or justify (short all-caps letter-spaced labels read
      larger than body at the same px, but 11px is low). Prefer the `--fs-*` tokens over raw px.
- [ ] **Relative `em` sizes** (`.8em`, `.85em`, `.95em`, `.72em`) can compound below the floor inside an
      already-small parent — audit the computed px at each and clamp to the floor.
- [ ] Confirm the text-size stepper scales *all* reading text (not just `--root-fs` consumers), and that
      the app survives browser zoom to 200% without clipping/overflow.

## Focus visibility
- [ ] Audit keyboard-focus rings on every interactive element (nav tabs, faction box, cog, home cards,
      section cards, wiki/doc links, form fields, steppers, modal close) — a visible, high-contrast
      `:focus-visible` ring in BOTH screen and chassis modes. Some exist; make it universal + consistent.

## Keyboard navigation
- [ ] Full tab order sanity pass; Esc closes overlays (done); add arrow-key nav within the faction menu
      + roster list; verify the skip-link (exists) lands correctly; no focus traps in modals (focus
      should cycle within an open modal and return on close).

## ARIA / semantics
- [ ] Heading order (one h1 per view; no skipped levels) across home/roster/doc/wiki.
- [ ] Landmark roles (`banner`/`main`/`navigation`); `aria-current` on the active nav tab + faction.
- [ ] Icon-only buttons have `aria-label` (cog does — audit the rest: camera/upload, doc steppers).
- [ ] A polite **live region** for the loading/sync status ("RE-SYNCING…", "RECEIVING IMAGE") so screen
      readers announce state changes; `aria-busy` on the roster/doc while loading.
- [ ] `aria-expanded` on all disclosure controls (faction/select dropdowns — done; audit others).

## Motion
- [ ] `prefers-reduced-motion` is honoured in many places (tiles, menus, image fade, pending loader) —
      sweep the rest: brand pulse, boot sequence, arrow rotations, hover transforms — ensure each has a
      reduced-motion fallback.

## Touch targets (mobile)
- [ ] Interactive controls ≥ ~44×44px on mobile (text-size steppers, modal close ×, doc-find buttons,
      small nav). Some are currently smaller.

## Images / non-text
- [ ] Portraits carry `alt` = character name; doc figures use `alt` as the caption; decorative SVG icons
      are `aria-hidden` (done). Confirm no meaningful image is alt-less; the wiki has no images.

## Colour independence
- [ ] Don't rely on colour alone. The phosphor theme is single-hue by design, so this is mostly moot;
      the T28 relationship types already use glyph+label, not colour — keep that principle for any new UI.

## Testing checklist (run after the fixes)
- [ ] Automated: run axe / Lighthouse a11y on home, roster, a doc, a wiki page.
- [ ] Manual: keyboard-only traverse of every view; 200% browser zoom; a screen-reader spot-check
      (VoiceOver) of the roster + doc reader; each of the 11 colour presets spot-checked for contrast.

## Sequencing
Step 0 (text floor) shipped. Suggested order next: font-size floor → focus visibility → the contrast
audit (incl. CRT overlay + chassis) → the High-Contrast mode → ARIA/live-region → keyboard/motion/touch
sweeps → the testing pass. Each is small and independently shippable; none blocks the others.
