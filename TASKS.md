# TASKS — active backlog (specs + acceptance criteria)

Well-scoped work, specced so any contributor can execute without re-deriving context.
Work top-to-bottom unless told otherwise. **One task = one commit.**

## Status

- ✅ **T1–T6 done** (activity indicators · CRT comparison report · dossier niceties ·
  doc-authoring guide · boot sequence · regression sweep). See git log. T6 fixed the
  chassis-mobile overflow and deferred the doc-tab race it found to T8; fuller sweep
  notes in `docs/T6-REGRESSION-SWEEP.md`.
- ✅ **T8 done** — the doc-tab stale-render race is fixed (`loadDoc()` bails when the user
  switched away before its cold fetch settled; guarded on both success and error).
- ⛔ **T7 blocked** — needs the two Publish-to-web URLs from the doc owners.
- ✅ **Batch 2: T9, T10, T11 done** — T9 CRT vignette softened · T10 selective text
  selection · T11 editable doc fonts + clearer scoping. ❌ T14 cancelled (Vault-Tec
  trademark).
- 🔜 **Taste-gated next:** T12 (make the chassis metal beautiful/authentic FO1-2) and
  T18 (visual alignment & harmony pass) — both build-then-show-before/after.
- **Needs your input:** T13 (red-button placement/function), T16 (map scope).
  **Blocked:** T17 (download the wbarahona + timeless888 zips). **T7 blocked** (pub URLs).
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

## T8 · Fix doc-tab race: switching mid-load can render the wrong doc — ✅ DONE

**Done** — fixed as specified below; `loadDoc()`'s cold path now no-ops if
`currentSection !== doc.id` when its fetch settles (guarded on success AND error, and
the shared loader timer is only stopped when still current). Verified against the exact
repro; single-switch loads unaffected. Spec retained below for the record.

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

# Batch 2 — fonts, selection, chassis, resources (queued 2026-07-04)

Captured from a design brainstorm. **Read the two-surface law (STYLE-GUIDE §0 principle 6)
before any chassis/metal work.** Tasks needing a human decision or a downloaded asset are
flagged **NEEDS-INPUT / BLOCKED**; do the unblocked ones first, in roughly the order below.

## T9 · CRT edge vignette too dark — ✅ DONE
Softened `.vignette` (was radial .55 + inset 160/30 .7 → now radial .22 @68% + inset
120/8 .28) so scanline mode doesn't crowd the screen edges. Committed.

## T10 · Selective text selection — SMALL
Right now everything is selectable (browser default; only two stray `user-select:none`
rules exist). Flip it: **chrome is not selectable; only copy-worthy content is.**
- Set `user-select:none` broadly on the app shell (e.g. on `.app`, or `body`), then
  re-enable `user-select:text` on exactly: (a) the Google-doc content — `.docreader`
  (and its `.doc-title`/headings/body); (b) the character dossier's *content* — the field
  bodies + values a user would copy: `.field .body`, `.idcell .v`, `.doss-name`,
  `.doss-hon`, `.lead-desc`, spirit/log/notes text, and the card equivalents
  (`.capp`, `.cname`, `.crole`, `.cmeta`). NOT the labels, nav, toolbar, statusline,
  buttons, roster row chrome.
- Cursor: keep `cursor:text` only where selectable; leave chrome as-is.
- Acceptance: dragging over UI chrome selects nothing; dragging over a dossier bio or the
  doc body selects normally and copies clean text; mobile long-press to copy still works on
  content; screenshot a selection in the doc + in a dossier bio.

## T11 · Font system: editable doc fonts + clearer scoping — MEDIUM
Two coupled parts (one task, since they touch the same UI and CSS).
- **(a) Editable doc-reader fonts.** The doc reader currently *hard-overrides* fonts:
  headings use `--font-head` / "Gothic 821"; body + captions are forced to IBM Plex Mono
  (`.docreader` rules in styles.css, ~L454/L472-483). Replace the hard-coded body override
  with **user-specifiable doc Title / Heading / Body faces**, defaulting to today's look
  (so nothing changes unless the user picks). Reuse the existing `FACES` catalogue +
  `applyFont*` pattern; add a **"Document" group** to the Theme popover with 2–3 face
  pickers (Title/Heading may be one control); persist under new `yuma-docfont-*` keys;
  drive via CSS vars (e.g. `--doc-font-head`/`--doc-font-body`) so `.docreader` reads them.
  Keep the legibility floor + the "Title/Subtitle → masthead" rendering intact.
- **(b) Clearer scoping.** Make it obvious which control affects which area. The app already
  has Headings/Body pickers with scope captions (`.popnote`); extend that clarity to cover
  the new Document group and tighten wording so a user can tell **app-headings vs app-body
  vs doc-title/heading/body** at a glance (consider a one-line "affects: …" caption per
  control, matching the existing `.popnote` style).
- Acceptance: picking a doc body face changes only the doc body (not the roster);
  defaults reproduce current look; persists across reload; scope captions read clearly;
  works on all 8 colour presets; selfcheck clean; screenshots of the Document group + a
  doc rendered in an alternate face.
- Scope note: touches the doc reader's CSS but **not `docClean()`** — stay out of the
  sanitiser per the scope fuse.

## T12 · Make the chassis metal beautiful + authentically Fallout-1/2 — DESIGN / TASTE-GATED
Goal (user): plated metal that's *beautiful and skeuomorphic like the Fallout 1 & 2 UI* —
worn industrial olive-drab panels, not clean sci-fi. **Finding from surveying the CSS
references** (skeuomorphic-spacecraft-control-panel + the fallout-4-pip-boy / pip-boy-screen
/ nv-pip-boy pens, all local): the beautiful ones win through **restraint + coherence**, not
more layers — a clean directional base gradient, ONE strong catch-light edge, soft depth
shadows, rounded/molded corners, and (spacecraft) subtle brush + machined concentric rings +
dimensional screws. Ours currently stacks rivets + top tab + brushed grain + sheen + gradient
border-image and reads busier without reading better.

Direction to implement (then screenshot before/after and present — TASTE-GATED, no commit
until verdict):
1. **One coherent light direction** across frame, masthead, buttons, rivets (top-left).
2. **Refined bevel** on the frame — replace the flat faceted border with a proper multi-stop
   metallic edge: strong bright catch on the top/left, soft dark on bottom/right, a crisp
   inner keyline. (The pip-boy pens get depth from a single bright edge + soft shadow.)
3. **Fewer, better rivets** — dimensional domed screws, less regular/dense; drop the centred
   top "tab" unless it earns its place.
4. **The missing Fallout ingredient: WEAR.** FO1/2 metal is *aged* — subtle grime settled in
   the crevices/recesses, faint edge scratches, uneven worn highlights. Add this at very low
   opacity (a soft dark inner grime, a sparse scratch texture) — this is what reads as
   "Fallout" vs "generic brushed metal", and is likely what's missing more than "simplicity".
5. Keep the olive `--panel-*` palette, the two-surface law, and legibility. Tune the brush
   down (it may be too visible); consider a small corner radius for a "molded panel" feel.
Credit stays as-is (CREDITS.md). Do this AFTER T11 (both touch styles.css — avoid overlap).

## T13 · Iconic Fallout red HUD button — NEEDS-INPUT (placement/function), then SMALL
Adapt the spacecraft pen's launch button (already red: `radial-gradient(circle at 40% 30%,
#ff6060, red 50%, #8b0000)` in a concentric-ring recessed housing with a press-down active
state) into our tokens as a signature red button — "our own Fallout version of that iconic
red HUD button". Clean-room technique → CREDITS courtesy entry. **NEEDS a decision from the
user before building:** what does it *do* and where does it live? Candidates: the ⟳ Refresh
action restyled; a chassis-mounted power/CRT toggle; or a decorative HUD accent. It's a
METAL-surface control (two-surface law), so it belongs on the chassis, not the screen.

## T14 · Vault-Tec logo on the boot screen — ❌ CANCELLED (2026-07-04)
Decision (user): do NOT use the Vault-Tec logo — it's a distinctive Bethesda trademark and
this is a public site. The standing rule holds: **no specific Fallout trademarked art/logos**
(Vault-Tec seal, Vault Boy, etc.). The general *genre* aesthetic — worn olive metal, phosphor
terminal, RobCo-flavoured text — is fine and stays. (This reaffirms T5's original caution.)
The `css3-only-vault-tec-logo` pen stays in the library but is not for this project.

## T15 · Layout ideas from the NV Pip-Boy pen — REPORT-FIRST, then maybe SMALL
`working-fallout-new-vegas-pip-boy-bootstrap` (local; @carterfromsl) — assess whether its
layout patterns would improve ours. Note it's **Bootstrap-based**, so this is
*reference-only*: extract ideas and reimplement in our vanilla CSS (no Bootstrap, no new
deps). Deliverable: a short written assessment (like T2/CRT-COMPARISON) of any genuinely
useful layout idea + a recommendation, before any code.

## T16 · Wendover, Utah area map — LARGE / NEEDS-INPUT (scope + content)
New feature: a map of the game's area (Wendover, UT). Big and underspecified — do NOT start
building; this needs scoping with the user first: what locations/regions, static vs
interactive, where it lives (a new nav tab? a "MAP" screen?), and how it fits the
two-surface system + terminal aesthetic. The `timeless888/NPRgmjv` pen "could be partly how
we do it" — assessment of that depends on T17 (download). Produce a short design proposal
(options + recommendation) once the two pens are in hand and the user has weighed in on scope.

## T17 · Acquire + index two pens — BLOCKED (needs the user to download)
CodePen blocks automated fetch, so these can't be read remotely. **User action:** download
the ZIPs and extract into `…/Claude Resources/Codepen Downloads/` (same as the others):
- `wbarahona/KMYybE` — "a nice quality effect" (unidentified; assess once local).
- `timeless888/NPRgmjv` — "a lot of great stuff" + candidate technique for the T16 map.
Then: add both to `CODEPEN-INDEX.md`, assess each, and spin off concrete follow-up tasks
(the KMYybE effect; the map technique). Until downloaded, T16's map technique + any KMYybE
use are blocked.

## T18 · Visual alignment & harmony pass — DESIGN / TASTE-GATED
Goal (user): key on-screen elements should *line up* and the layout should feel
harmonious/proportional. **On golden ratio vs rule of thirds:** be honest — neither is a
magic bullet for a data UI. Rule of thirds is a photo-composition heuristic; golden ratio
is fine for a *couple* of proportion choices (e.g. sidebar:content) but chasing 1.618
everywhere is cargo-cult. What genuinely reads as "harmonious" in UI is: (a) a **consistent
spacing scale** (pick a base unit; make gutters/margins/gaps multiples of it), (b) **strong
edge alignment** — shared left edges and baselines down each column, consistent gutters,
(c) **consistent rhythm** (repeated vertical spacing between sections), (d) a **sensible
proportion** for the big split (the roster rail : dossier — golden-ish ~38/62 is a
reasonable target and close to today's clamp). Use proportion where it helps, alignment +
a spacing scale as the backbone.

Do this as: **audit first, then fix.** Screenshot the roster + dossier + cards + doc at a
couple widths, mark where edges/baselines/gutters DON'T line up or spacing is ad-hoc
(there are many one-off px values in styles.css), propose a small spacing scale + the
alignment fixes, then apply. Taste-gated — present the before/after and the proposed scale
for a verdict before committing. Respect the legibility floor + two-surface law. Sequence
after T11 + T12 (all touch styles.css / layout — avoid overlapping edits).

---

*Done recently (context for the above): doc split into Lore/Roleplay tabs;
find-in-doc; IndexedDB doc cache + lazy image hydration; Chassis frame mode
(two-surface system); per-character Discord cards; boot sequence self-test +
sweep bar; T6 regression sweep (fixed Chassis mobile overflow; found T8). See
git log.*
