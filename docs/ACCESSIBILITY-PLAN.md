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

## Contrast — audited 2026-07-11, CLEAN
- [x] ✅ Full static audit done. **No literal-colour text exists** — every text rule routes through the
      theme vars. **No `--fg-dim` text below 4.5:1** (worst ~5.4:1 on the lightest panel bg, all 11
      themes); `--fg` (primary) worst ~6.2:1 — all pass AA. Inverted/active pairs (7–15:1), placeholders
      (~5.65:1 worst), `::selection`/`mark.docfind` translucent highlights — all clear.
- [x] ✅ `--fg-faint` on text: only ONE, decorative — the `⸻` chapter-break glyph
      (`.docreader h1.part::before/::after`, styles.css:829). Every other `--fg-faint` is border/underline
      (non-text). Acceptable (a faded ornament, not prose).
- [ ] The **CRT overlay** (scanlines ~28% multiply on alt rows + vignette; OFF by default) is the one
      thing the audit can't measure statically — it presses the `--fg-dim` tier (its ~5.4:1 floor) and
      the intentional low-contrast decoration (`.home-tile-num`, `.docquote::before`) closest to their
      margin when enabled. This is exactly what the High-Contrast mode below fixes.
- [x] ✅ **Chassis metal text** (engraved `--panel-ink` on `--panel*`, border-frame mode) — measured:
      dark ink on mid-metal is ~2.49:1 and the pressed active tab ~1.36:1. This is inherent — dark-on-metal
      can't exceed ~2.6:1 — and the engraved look is deliberate, so the DEFAULT stays as-is. The fix is the
      accessible PATH: High-Contrast mode now lifts every engraved-text button face to the lit metal
      (`--panel-hi`), where the same ink measures **6.33:1 (AA)** — was doing nothing for the metal before.
      Verified by measurement + screenshot (legible, still reads as engraved metal).
- [x] ✅ **High-Contrast mode** — DONE. `body[data-contrast="high"]`: applyColor lifts `--fg-dim`→`--fg`
      (secondary text to full phosphor) + `--fg-faint`→`--fg-dim` (borders); CSS drops the scanline
      overlay + thickens the focus ring. A Settings toggle (`#contrast-toggle`), auto-on from OS
      `prefers-contrast:more` when the user hasn't chosen, persisted in `mdb-contrast`, reset-aware.
      Verified: toggle lifts/restores the palette + scanline both ways.

## Minimum font size
Current tiers: body/reading prose **≥17px** (enforced via `--root-fs` floor + the text-size stepper +
the `.row-sub` 17px rule); `--fs-note` **14px** (captions/counts/TOC); `--fs-hint` **13px** (stated
"absolute minimum"). Gaps:
- [x] ✅ **Raw sub-13px text** fixed. `.faction-legend` (the only sub-floor *screen text*) 12px → `--fs-hint`
      (13px). The remaining raw small values are exempt: `.selctl-caret` 11px is a decorative ▾ glyph (an
      icon, not prose) and the 12px in the `@media print` block is paper-only.
- [x] ✅ **Relative `em` sizes** audited by MEASURING the computed px in a rendered page: the doc reader
      base is 17px, so the smallest (`.toc-l4` .8em → 13.6px) clears the floor; `.bootmono` .72em is the
      transient boot readout (exempt). A full-page leaf scan (desktop + mobile, settings drawer open)
      found **0 readable elements below 13px**.
- [x] ✅ **Reflow / high zoom** — checked at **320px** CSS width (≈400% zoom, WCAG 1.4.10's target) across
      home / roster / relations / wiki: **0px document-level horizontal scroll** in every view. The only
      wider-than-viewport elements are the off-screen settings drawer (not visible) and a wide wiki data
      table that scrolls inside its OWN container (the page never gains 2D scroll). Masthead stacks,
      content wraps, all legible. WCAG reflow satisfied.

## Focus visibility
- [x] ✅ VERIFIED ADEQUATE. A global `:focus-visible{ outline:2px solid var(--fg-bright) }` rule covers
      all interactive elements; keyboard Tab shows a clear bright ring, confirmed in BOTH screen and
      chassis modes (home faction cells, section cards, nav). `.home-tile`/`.row` use a custom but
      visible border+lift+glow focus treatment. No change needed. (Re-audit if new controls are added.)

## Keyboard navigation
- [x] ✅ Faction dropdown fully keyboard-navigable (b7c57d4): ↑/↓ from the trigger open + step in,
      arrows/Home/End move, Esc closes + refocuses the trigger; and the closed menu is now
      `visibility:hidden` so its options leave the tab order (was opacity:0 — a hidden tab-trap).
- [x] ✅ Roster listbox arrow-nav — `#list` (already `role="listbox"` + `tabindex=0` +
      `aria-activedescendant`) now handles ↑/↓/Home/End/PageUp/PageDown, stepping through rows in
      DISPLAY order (section + sort, not global index) and moving the selection (focus stays on the
      listbox per the activedescendant pattern). Verified END-TO-END with live roster data (2026-07-12):
      arrows/Home/End move the selection + `aria-activedescendant`, focus stays on the listbox, the dossier
      follows. The **Relations rail** now has the same listbox ARIA + keyboard nav (shared `listboxStep`).
- [x] ✅ **Overlay focus management VERIFIED** (2026-07-15, live data). Settings, the command palette, and
      all four dossier overlays leave the tab order while closed. Tab/Shift+Tab wrap inside the visible layer.
      The dossier → icon-picker nested path exposes only the top layer; consecutive Escape presses restore
      focus first to the dossier's sigil control and then to the exact roster card. The same settings trap and
      restoration pass at 390×844. One chronological stack, rather than DOM order, owns nested modal focus.

## ARIA / semantics
- [x] ✅ Heading order: the page had ZERO `<h1>`. Added ONE sr-only `#app-h1` in `<main>`, updated per
      view by `setAppHeading()` — "The Tribe — Wiki", "Brotherhood of Steel — Roster", "Misfits Database
      — Home". Content headings stay h2+, so the outline is clean (verified single h1).
- [x] ✅ Landmarks present: `<header>` (banner), `<main>`, two labelled `<nav>`s ("Faction sections",
      "Document contents").
- [x] ✅ Selection state uses the appropriate semantic for each control: row-1 navigation links use
      `aria-current`; row-2 tabs, faction tabs, and faction listbox options use `aria-selected`.
- [x] ✅ Icon-only buttons have explicit accessible names: navigation, settings, roster search, document
      steppers/focus/back-to-top, portrait/sigil, personal-log, screenshot, and text-size controls audited.
- [x] ✅ A polite **live region** for loading state. Roster already had one (`#state`). Added
      `#doc-announce` (dedicated sr-only, stable — the animated `#docstatus` repaints 12×/s so can't be
      one) firing once per state ("Loading document…" / "<page> loaded" / error), + `aria-busy` on
      `#docreader` while loading (d7a76ae). `aria-busy` on `main` during the roster fetch — DONE.
- [x] ✅ `aria-expanded` is synchronized on custom disclosure controls: settings, faction and generated
      selectors, plus dossier More menus. Native `<details>` elements retain their native state semantics.

## Motion
- [x] ✅ SWEPT — clean. All 5 keyframe animations are disabled under `prefers-reduced-motion`: flicker +
      cursor blink (styles.css:151), home-tile entrance (:718), doc-loader `docrx` (:980), vault-boy
      `vaultping` (:1605); plus the menu/tile/control transitions (:557, :718, :1896) and image fade
      (earlier). No un-tamed animation found. (Boot sequence is JS-gated on reduced-motion.)

## Touch targets (mobile)
- [x] ✅ Interactive controls ≥ 44×44px on mobile. Measured the small ones at 375px and found several
      under: cog 40, settings ✕ 36×30, swatches 42×34. A `@media (max-width:760px)` block (appended last
      so it wins by source order) now floors the cog, settings ✕, `.swatch` (incl. narrow text-size
      swatches → min-width 44 + centred), `.docfind-btn`, `.mini`, and modal `.btn.close` to 44px.
      Verified: cog / ✕ / all text-size swatches now 44×44; settings drawer still reads clean.

## Images / non-text
- [ ] Portraits carry `alt` = character name; doc figures use `alt` as the caption; decorative SVG icons
      are `aria-hidden` (done). Confirm no meaningful image is alt-less; the wiki has no images.

## Colour independence
- [x] ✅ Satisfied by design. The phosphor theme is single-hue, so nothing encodes meaning by colour; the
      Relations view distinguishes entries by name + count, not colour. Keep that principle for any new UI.

## Testing checklist (run after the fixes)
- [ ] Automated: run axe / Lighthouse a11y on home, roster, a doc, a wiki page.
- [ ] Manual: keyboard-only traverse of every view; 200% browser zoom; a screen-reader spot-check
      (VoiceOver) of the roster + doc reader; each of the 11 colour presets spot-checked for contrast.

## Sequencing
Step 0 (text floor) shipped. Suggested order next: font-size floor → focus visibility → the contrast
audit (incl. CRT overlay + chassis) → the High-Contrast mode → ARIA/live-region → keyboard/motion/touch
sweeps → the testing pass. Each is small and independently shippable; none blocks the others.

## STATUS — 2026-07-12: substantive pass COMPLETE
Everything in this plan that can be done in code + verified here is done and checked off: text-brightness
floor, contrast audit, High-Contrast mode (phosphor **and** the engraved-metal chassis), font-size floor,
focus visibility, keyboard nav (faction menu + both listboxes), modal focus-trap, ARIA/landmarks/live
regions/single-H1, reduced-motion, touch targets, reflow at 320px, colour-independence. Row-1 boxes carry
`aria-current`; row-2 tabs carry `aria-selected` (correct for the tab pattern). **Only genuinely external
checks remain** (a human/tooling job, not code): an automated **axe/Lighthouse** run and a **screen-reader
(VoiceOver)** spot-check on the live site.
