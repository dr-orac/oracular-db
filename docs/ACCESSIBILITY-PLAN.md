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

## Contrast — audited 2026-07-11 (Sonnet subagent), CLEAN
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
- [ ] **Chassis metal text** (engraved `--panel-ink` on `--panel*`) — not covered by the phosphor audit;
      spot-check separately (lower priority — it's a deliberate engraved look).
- [x] ✅ **High-Contrast mode** — DONE. `body[data-contrast="high"]`: applyColor lifts `--fg-dim`→`--fg`
      (secondary text to full phosphor) + `--fg-faint`→`--fg-dim` (borders); CSS drops the scanline
      overlay + thickens the focus ring. A Settings toggle (`#contrast-toggle`), auto-on from OS
      `prefers-contrast:more` when the user hasn't chosen, persisted in `mdb-contrast`, reset-aware.
      Verified: toggle lifts/restores the palette + scanline both ways.

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
      listbox per the activedescendant pattern). Algorithm verified over 10 cases incl. clamping,
      Page steps, and the filtered-out fallback; end-to-end keypress needs live roster data.
      Remaining: modal focus-trap verify (a MutationObserver handles it).

## ARIA / semantics
- [x] ✅ Heading order: the page had ZERO `<h1>`. Added ONE sr-only `#app-h1` in `<main>`, updated per
      view by `setAppHeading()` — "The Tribe — Wiki", "Brotherhood of Steel — Roster", "Misfits Database
      — Home". Content headings stay h2+, so the outline is clean (verified single h1).
- [x] ✅ Landmarks present: `<header>` (banner), `<main>`, two labelled `<nav>`s ("Faction sections",
      "Document contents"). `aria-current` — still TODO on the active nav tab / faction option.
- [ ] `aria-current` on the active row-1 box + row-2 tab + faction option (partially done on the navbox).
- [ ] Icon-only buttons have `aria-label` (cog does — audit the rest: camera/upload, doc steppers).
- [x] ✅ A polite **live region** for loading state. Roster already had one (`#state`). Added
      `#doc-announce` (dedicated sr-only, stable — the animated `#docstatus` repaints 12×/s so can't be
      one) firing once per state ("Loading document…" / "<page> loaded" / error), + `aria-busy` on
      `#docreader` while loading (d7a76ae). `aria-busy` on `main` during the roster fetch — DONE.
- [ ] `aria-expanded` on all disclosure controls (faction/select dropdowns — done; audit others).

## Motion
- [x] ✅ SWEPT — clean. All 5 keyframe animations are disabled under `prefers-reduced-motion`: flicker +
      cursor blink (styles.css:151), home-tile entrance (:718), doc-loader `docrx` (:980), vault-boy
      `vaultping` (:1605); plus the menu/tile/control transitions (:557, :718, :1896) and image fade
      (earlier). No un-tamed animation found. (Boot sequence is JS-gated on reduced-motion.)

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
