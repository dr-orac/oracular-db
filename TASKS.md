# TASKS — active backlog (specs + acceptance criteria)

Well-scoped work, specced so any contributor can execute without re-deriving context.
Work top-to-bottom unless told otherwise. **One task = one commit.**

## Status

- ✅ **T1–T5 done** (activity indicators · CRT comparison report · dossier niceties ·
  doc-authoring guide · boot sequence). See git log.
- ✅ **T6 done** — regression sweep; two bugs found + fixed (doc tab-switch race; the
  chassis-mobile PIP-LINK overflow was already resolved). Report: `docs/T6-REGRESSION-SWEEP.md`.
- ⛔ **T7 blocked** — needs the two Publish-to-web URLs from the doc owners.
- *(Ad-hoc, shipped alongside: jet-black CRT bezel + brushed-metal upgrade to the Chassis
  frame mode — see git log + CREDITS.md.)*

The specs below remain as the record of what each task covered.

## Ground rules (apply to every task)

1. **Read first:** `MAINTENANCE.md` (architecture, invariants, preview workflow) and
   `STYLE-GUIDE.md` §0 — especially principle 6, the **two-surface law** (SCREEN =
   phosphor behind glass; METAL = the housing; each forbids the other's effects).
2. **Data is read-only.** Never change `CONFIG.sheetId`, never write to any sheet.
3. **Verify before commit:** `python3 tools/preview.py`, check in the `yuma-roster`
   preview (port 4173), zero console errors, no mobile overflow (375px), and
   `python3 tools/selfcheck.py` clean (the pre-commit hook enforces it).
4. **Commit style:** imperative subject + a body that explains *why*. No trailers or
   signatures of any kind in commit messages.
5. **Visual changes need visual proof:** screenshot the before/after in the preview and
   include it in your summary. For taste-level changes, present the screenshot and wait
   for a verdict rather than iterating alone.
6. **Library adaptations** (from the CodePen reference library, indexed at
   `…/Claude Resources/Codepen Downloads/CODEPEN-INDEX.md`): prefer clean-room
   reimplementation of the *technique*; if code is genuinely adapted, follow the
   protocol in `CREDITS.md`. No new dependencies, no CDN, no new font files.
7. **Scope fuse:** if a task turns out ambiguous, bigger than described, or requires
   touching `docClean`, `effectiveSheetId`, `apps-script.gs`, or the localStorage save
   paths — **stop and report** instead of improvising. (Those areas are audited;
   see `docs/AUDIT-2026-07-02.md`.)

---

## T1 · Terminal activity indicators (screen surface) — SMALL

The statusline says "RE-SYNCING…" / "SAVING…" as plain text; the doc reader's
background refresh is invisible. Add subtle CSS-only activity indicators.

- Build 1–2 single-element CSS loaders in the existing ASCII/terminal language
  (reference: `ascii-loaders` and `terminal-ish-progress-bars…` in the library —
  technique study; both are simple enough to clean-room).
- Apply to: (a) the statusline while `setLink()` shows an in-progress state
  (RE-SYNCING…/SAVING…/UPLOADING…), (b) optionally a tiny pulse next to `#syncinfo`
  while a background doc re-fetch is running.
- Constraints: pure CSS animation, uses `var(--green*)` tokens only, honours
  `prefers-reduced-motion` (static fallback), 17px-legibility floor untouched,
  works on all 8 colour presets (spot-check green + amber + white).
- Acceptance: indicators visible in preview during a manual ⟳ Refresh; no layout
  shift in the statusline; selfcheck clean; screenshot in summary.

## T2 · CRT engine comparison — REPORT ONLY, NO CODE

We ship two CRT layers: the built-in scanlines/vignette CSS and the optional
`crt-screen-integration.js` "Enhanced CRT" engine. The library has the well-known
`css-crt-screen-effect` pen (lbebber).

- Deliverable: `docs/CRT-COMPARISON.md` — a one-page comparison: what each of the
  three does (technique level), performance cost, whether the pen offers anything
  ours lack, and a recommendation (adopt / adapt / ignore).
- **Do not change any code.** This is an audit that decides IF a future task exists.
- Acceptance: the doc exists, is factual about our current implementation (read the
  actual files, don't guess), and ends with a clear recommendation.

## T3 · Dossier layout niceties (deferred from an earlier audit) — SMALL

Two cosmetic items previously judged worthwhile-but-minor:

- (a) In the dossier, the short "At The Fire" and "Off-Duty" blocks each occupy a
  full-width row with lots of trailing space. On wide screens (≥1100px dossier
  width), lay these two specific blocks side-by-side as a 2-up pair. Keep them
  stacked on narrow screens. Don't generalise this to other blocks.
- (b) In Cards view, cards in the same row have ragged heights. Equalise via the
  grid (e.g. `grid-auto-rows`/subgrid or a min-height) WITHOUT clipping content —
  if equalising clips anything, report instead of forcing it.
- Acceptance: desktop + 1440px + mobile screenshots, no overflow, no clipped text,
  selfcheck clean.

## T4 · Doc authoring guide (docs only) — SMALL

Write `docs/DOC-AUTHORING.md`: half a page for the people who edit the Lore /
Roleplay Google Docs. Cover: images should be ≤1200px wide before inserting
(the export inlines them base64 — oversized images are why the docs were slow);
give images alt text (it becomes the terminal-frame caption); use the Title/Subtitle
paragraph styles (they render as the masthead); `> ` starts a pull-quote; keep the
two docs split rather than one mega-doc. Then link it from MAINTENANCE's doc-reader
section. No code changes.

## T5 · Boot sequence polish (taste-gated) — MEDIUM

The RobCo boot overlay (`runBoot()`) is plain type-on text. Make it a touch richer
using the same block-glyph ASCII language as the doc loader (`startDocLoader`).

- Ideas: a brief self-test readout (memory check / archive link / units counted),
  a sweep bar, a final "OK". Keep it under ~3.5s total, still skippable, still
  once-per-session, still `prefers-reduced-motion`-aware, hard timeout intact.
- **No trademarked art**: no Vault-Tec logo or Vault Boy reproductions — generic
  RobCo-terminal styling only (a legal caution for a public site).
- **Taste gate:** implement, screenshot, present — commit only after a verdict.

## T6 · Recent-feature regression sweep — VERIFICATION, MOSTLY NO CODE

Walk the recent features end-to-end in the preview and report findings:
find-in-doc (type/step/Esc across both docs), doc tab switching mid-load, lazy
image hydration while scrolling (visible browser!), Chassis mode across all 8
colour presets + frame tint + mobile, Theme popover summaries, keyboard nav,
focus states. Fix only trivial issues found (≤5-line CSS); list everything else
in the summary with repro steps.

## T7 · Publish-to-web doc source — **BLOCKED: needs the two published URLs**

When the doc owners run File → Share → Publish to web on the Lore and Roleplay
docs, wire the reader to prefer the published HTML (images become separate lazy
URLs; the HTML drops from multi-MB to tens of KB, making even first visits fast).

- `DOCS` entries gain an optional `pubUrl`; `fetchAndPrepare_()` tries `pubUrl`
  first and falls back to the export URL on any failure.
- The published page's DOM differs from the export (different wrapper, heading ids,
  image handling) — verify `docClean()` output on the real published page for:
  headings/TOC jumps, bold/italic detection, pull-quotes, image frames + captions,
  find-in-doc. If `docClean` needs changes, remember the scope fuse (rule 7):
  propose, don't improvise.
- Acceptance: cold first open of each doc under ~2s on a normal connection; all
  doc-reader features verified; export path still works as fallback (test by
  breaking the pubUrl deliberately).

## T8 · Fix doc-tab race: switching mid-load can render the wrong doc — MEDIUM

Found + confirmed during T6's regression sweep (reproduced twice, screenshotted).
Touches `loadDoc()`/`prepareDoc()` — doc-reader-adjacent to audited code, so this
was reported rather than fixed on the spot per the scope fuse (rule 7).

**Repro:** clear the doc cache (`indexedDB.deleteDatabase('yuma-docdb')` +
`_docCache.clear()`), click "Tribe Lore" (starts a cold ~14MB fetch), within
~100ms click "Roleplay Guide" (starts its own cold ~7MB fetch) before Lore
finishes, then wait for both to settle. **Result:** the nav tab and doc header
both correctly read "Roleplay Guide", but `#docreader`'s actual rendered content
is the Lore doc (`reader.dataset.docid === "lore"`) — a real, user-visible
title/content mismatch.

**Root cause:** whichever cold fetch resolves *last* wins and calls
`renderPreparedDoc()`, overwriting the reader regardless of which tab is
currently active. Neither `loadDoc()` nor `fetchAndPrepare_()` checks that the
resolving request still matches the currently-selected section before
rendering.

**Fix direction** (propose in full before implementing, per the scope fuse):
a "is this still the active doc?" guard — e.g. stamp the section id active at
request time, compare it to `currentSection` immediately before the
`renderPreparedDoc()` call in `loadDoc()`'s cold-fetch path, and no-op if a
newer switch has since occurred. Verify: the repro above no longer mismatches;
rapid tab-flapping (3+ switches in quick succession) always lands on whichever
doc is active when everything settles; existing single-switch loads unaffected.

---

*Done recently (context for the above): doc split into Lore/Roleplay tabs;
find-in-doc; IndexedDB doc cache + lazy image hydration; Chassis frame mode
(two-surface system); per-character Discord cards; boot sequence self-test +
sweep bar; T6 regression sweep (fixed Chassis mobile overflow; found T8). See
git log.*
