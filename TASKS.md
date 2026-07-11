# TASKS — active backlog (specs + acceptance criteria)

Well-scoped work, specced so any contributor can execute without re-deriving context.
Work top-to-bottom unless told otherwise. **One task = one commit.**

## T54 · MASTER faction sheet (tab per faction) — ROADMAPPED, NOT STARTED — see docs/MASTER-SHEET-PLAN.md
User wants ONE master Google Sheet, a tab per faction, holding all Tribe + Brotherhood info,
standardised where it overlaps (faction-specific extras kept, e.g. Spirit Animal = tribe-only), linked
to the app; and asked if a live editable assistant↔sheet link is viable. Full plan in the doc. Key
findings: **live READ is viable** (read_file_content / gviz — I always see the sheet + user edits);
**live auto-WRITE is NOT** (no cell-update/batchUpdate tool; create_file makes a new single-tab file,
can't patch cells) → the workable model is "read-live, propose-diffs"; a true write link needs the
existing Apps Script backend (or a Sheets-API credential) the user would set up. NEVER touch
CONFIG.sheetId. Blocked on the user answering the 5 open questions in the doc (P0 sign-off) before any
file is created. Real schemas already read: Tribe 15 cols / 55 rows, Brotherhood 11 cols / 16 rows.

## FACTION ROSTER aligned to the wiki (2026-07-11)
`FACTIONS` now mirrors the Misfits **wiki's own faction listing** (each with the wiki's signature
colour, mapped to the nearest theme preset) + the Unity. 13 total: tribe(rust)·brotherhood(blue)·
ncr(gold)·legion(red)·enclave(white)·vault/Vault Dwellers(purple)·followers(cyan)·townsfolk(white)·
wastelanders(amber)·outlaws(orange)·synthetics(magenta)·supermutants(green)·unity(green). Dropped the
invented `bazaar`. tribe + brotherhood keep live sheet data; the rest are coming-soon until linked.
Added 6 new in-house SVG faction icons (medical cross / house / compass / skull / robot / fist) and
fixed the coming-soon possessive for s-ending names ("Outlaws’ archive"). Adding a faction still =
one `FACTIONS` entry + `FACTION_ORDER` + a `FACTION_ICONS` glyph (recipe in CONTRIBUTING.md).

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
- 🔜 **Executing now, in order:** **T18 (layout + proportion) → T12 (metal)** — sequenced
  (both edit styles.css; T18 is the alignment/spacing backbone, T12 the metal skin on top).
  Approach: a subagent audits the CSS spacing values while the overseer measures rendered
  alignment in preview; combine → propose a spacing scale → implement → show before/after
  (taste-gated). Then repeat the build-then-show pattern for T12.
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
- Constraints: pure CSS animation, uses `var(--fg*)` tokens only, honours
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

## T12 · Chassis metal — ✅ DONE 2026-07-11 (MINIMALIST PIXEL-ART, user-directed)
User steer: "a minimalist pixel art style might help get to a decent looking version quickly; make
sure it's fully implemented." Reworked the whole Chassis frame from the muddy soft-gradient "realistic
metal" (which the survey below flagged as busier-not-better) to **flat pixel-art**: solid `--panel-*`
colour blocks with HARD stepped bevels (lit top/left, shaded bottom/right), crisp keylines, flat pixel
BOLTS around the plate (dropped the centred top tab + brushed grain + raking sheen — `--metal-brush`/
`--metal-sheen` vars removed), a crisp recessed black bezel, a flat masthead plate, physical
pixel-beveled nav buttons with indicator lamps, the FACTION selector as a phosphor readout recessed
into the metal, and the cog as a matching metal button. Verified: olive + theme-tinted palettes,
desktop + mobile, home + content views; console + selfcheck clean. Docs updated (CREDITS, MAINTENANCE).
The original taste-gated spec is kept below for the record.

## T12 (original spec, superseded by the pixel-art rework above) — DESIGN / TASTE-GATED
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

---
# Batch 3 — system consolidation + doc images (queued 2026-07-09)

*Note: T18 shipped, plus a large run since — negative-space `--edge`/`--rail`/`--sp`/`--fs`
token scale, the Settings drawer revamp, the roster↔doc command-bar + index-rail
standardization, jet-black bezel + toggles, `prefs.js` reusable module, selfcheck
comment-guard. Batch 3 is the consolidation ("join the system") + the doc-image redesign.*

## T19 · Migrate Settings onto the reusable prefs.js schema — MEDIUM / CAREFUL (engine-swap)
The "Join B" from the sitrep — the biggest single entropy drop. Replace the ~15 bespoke
`apply*()` fns + hardcoded swatch containers with ONE `Prefs({schema})` driving
`lib/prefs/prefs.js`. Keep localStorage keys (`"yuma-"+id`) so existing users don't lose
settings; reuse derivation via custom `apply()` (colour→whole --fg-* palette, bg→3 vars,
frametint, font-derived Auto text-size, font hover-preview). CRT toggle stores "1"/"0" + a
body class today — handle in its apply. Sonnet drafts the schema + hard-case map; overseer
refactors the apply fns to effect-only, wires init→prefs boot + reset→prefs.reset(), verifies
EVERY control applies+persists identically (esp. Auto size re-deriving on body-font change),
commits. Acceptance: no behaviour change; selfcheck clean.

## T20 · Doc images: full-bleed, faded edges, softer CRT — SHIPPED 2026-07-09
Done: `.docreader` is now a full-bleed grid (`1fr min(74ch,100%) 1fr`); `.docfig` spans `1/-1`,
prose + caption stay in the 74ch measure; `mask-image` fades the screen top/bottom (11%/89%);
bezel/reticle/padding dropped so the image IS the screen; scanline `::after` opacity .5→.28.
Verified: full pane fill, edges fade, no h-overflow, phosphor tint intact. Original spec below.

Many doc images have text on them → make them "bleed into the screen": (1) full-width of the
reading pane via a full-bleed grid on `.docreader` (`1fr min(74ch,100%) 1fr`; `.docfig` spans
`1 / -1`, prose stays in the centre measure); (2) fade top+bottom to transparent via a
`mask-image` linear-gradient so edges melt into the phosphor (text usually sits mid-image →
stays legible); (3) softer CRT on images — drop the `.docfig-screen` bezel/reticle frame
(clashes with a fading image) + lower the scanline `::after` opacity so text-on-image reads;
green tint stays via the existing Image Colour toggle. Maybe keep the framed style as a
per-image opt-in. Acceptance: images fill the pane, edges fade, text readable, no h-overflow.

## T21 · Faction switcher (replaces the brand title) — LIVE 2026-07-10 (awaiting contributor sheets)
2026-07-10 (2): the 8 server factions are now real entries with their signature colours —
Brotherhood(red)/Vault(blue)/Legion(orange)/Bazaar(purple)/Tribe(rust)/Enclave(white)/
Unity(green)/NCR(cyan); added orange/purple/rust to THEMES. The masthead is a boxed-caret
dropdown listing all 8; selecting one re-skins the whole UI. Only the Tribe has a sheet — the
others (`data.sheetId:""`) show a themed "roster not linked yet" placeholder + their own (empty)
doc tabs, never blank or the wrong data (`showRosterFor`/`showFactionComingSoon`, `factionDocs`,
`body.coming-soon` hides the toolbar). Search box standardized across tabs (17px mono, fits its
placeholder, aligned over the rail). Contributors link a faction = fill its `data.sheetId`+`docs`
(recipe in CONTRIBUTING.md). REMAINING: real per-faction sheets; optional per-faction `<title>`/OG.
Earlier scaffold notes below.

## T21 · Faction switcher — scaffold notes (2026-07-10, superseded by the LIVE entry above)
Done: `FACTIONS` map + `FACTION_ORDER` in app.js (the tribe as the sole entry + a commented
TEMPLATE), `activeFaction()`/`applyFaction()` (applies a faction's colour+bg via the existing
THEMES/BGS machinery, updates the brand, persists `yuma-faction`, reloads only if the sheet
differs), `renderBrand()` (plain title at 1 faction → dropdown switcher at 2+), and
`effectiveSheetId()`/`sheetUrl()` wired to the active faction's sheet (yuma = CONFIG.sheetId,
so the default data flow and dev overrides are unchanged). Verified: 1-faction default renders
the plain title + green theme + 56 rows; a temp 2nd faction reveals the switcher and selecting
it re-skins the whole app (amber/warm) + persists; unknown-persisted-faction falls back safely.
Contributor recipe in CONTRIBUTING.md → "Adding things". REMAINING to fully finish: real 2nd
faction sheets from contributors (data-reload path is wired but only exercised with a different
sheet); optional per-faction `<title>`/OG meta + a faction-specific `relabelTribe`. Original spec:

Server variants ("factions") share ONE codebase + ONE data schema, differing only by a
config *skin*. Add a `FACTIONS` map: `{ id: { name, theme:{colour, bg, font/style overrides},
data:{sheetId, tab} } }`. A **dropdown where the brand title is** (top-left) selects the
faction → applies its theme token-set (reuses the existing THEMES/colour machinery) + swaps
the data source; persists as `yuma-faction`. A contributor adds a faction = ONE config entry
+ their own sheet — no code fork (that's the whole point: data into one structure, minimal
parallelism). Design the theme layer as token overrides so it's forward-compatible with
Substrate's DTCG theming (a faction ≈ a Substrate theme). Acceptance: switching faction
changes colour/style + data + persists; adding a faction needs only config, no code.
NOTE: this is the local expression of the bigger "reduce parallelism / integrate upstream"
goal — see the Substrate foundation (`~/Documents/Claude/Projects/App Suite Building
Foundations`), whose Phase 3.5 is the list-detail shell + drawer this app already built.

# Batch 4 — future / architecture-gated (queued 2026-07-10)

## T22 · Render the Misfits wiki in the terminal theme — DESIGN / architecture-gated
Extend the doc reader beyond Google Docs to display the **Misfits** SS14 (Nuclear-14 fork)
**wiki** inside the Pip-Boy shell. The pieces already exist: `loadDoc()` fetches HTML and
`docClean()` re-renders it from a strict whitelist into the theme — so a wiki page is "just
another content source." Work: (1) generalise the content source — a doc/section can be a
Google Doc OR a wiki URL (add a `type`/`source` field to the DOCS/faction-docs entry);
(2) fetch the wiki page HTML (CORS permitting — may need the wiki's REST/parse API or a read
proxy) and feed it through `docClean` (extend the whitelist for wiki markup: tables, infoboxes,
internal links → rewrite to in-app navigation); (3) a wiki has MANY pages → needs an index/nav
(the TOC rail could list pages, or follow internal links). Fits the per-faction `docs` model
(each faction points at its own wiki). **GATED:** the user wants this AFTER the app is properly
linked to **Substrate** (the Lit/DTCG multi-app foundation) and **Lattice** (a UI builder linked
to Substrate that supplies standard HTML layouts to reduce parallelism / standardise building —
in the Claude project folder). Acceptance: a wiki
page renders in-theme, internal links navigate in-app, no h-overflow, sanitised (no raw scripts).

## Faction system — remaining finish items (small, when factions get real data)
- **Faction-scoped `relabelTribe`** — the global "Yuma Tribe"→"Tribe" rewrite would wrongly
  rebrand a linked faction's data; gate it to the tribe (or make relabel a per-faction config).
  Latent only — no effect until a non-tribe faction links a sheet.
- **Per-faction visual style beyond colour** — the vision is "distinct colour AND visual style";
  today factions differ by colour+bg only. Consider a per-faction accent (heading font / frame
  treatment) so factions read distinct beyond hue.

## Done this session (2026-07-10, later): removed the ONLINE/UNITS/SYNC status line; command bar
## + rail no longer shift between views (docbar moved to header); nav always shows; doc images +
## portraits share a theme-tracking tint; Pip-Boy portrait frame + camera/emblem buttons; 8
## factions w/ signature colours + switcher + coming-soon state; per-faction tab title; AA fixes.

# Batch 5 — doc-reader polish + faction data (queued 2026-07-10) — go in order

**Progress (2026-07-10):** ✅ T23 (TOC: h1–h4, ≥17px, clean hierarchy) · ✅ T24 (quote-bullets
consistent) · ✅ T25 (tables restyled) · ✅ T26 (line-art auto-invert — SHIPPED but pending a LIVE
visual check; couldn't screenshot the diagram in the headless preview, tune the light-ratio
threshold after) · ✅ T27 (Brotherhood roster wired + faction data scoped: EXTRA_CHARACTERS,
default section, relabelTribe all now tribe-only). ⏳ **T28 remains** — the relationship-matrix
view (LARGE, design-first, its own context).


Facts gathered up front (build on these; don't re-derive):
- Sidebar TOC (`buildDocSidebar`, app.js): collects `querySelectorAll("h1,h2")` ONLY → every
  h3/h4 is dropped. `.doctoc a.tl2` = 15px (below the 17px legibility floor).
- Quote boxes vs tables: the two "-Brom" quotes are 1×1 (single-cell) tables; ALL other tables are
  multi-cell (lore 8×24 Faction/Standing; roleplay 5×15 Role/Description). The 1×1→framed-quote split
  SHIPPED this session (commit dd87fcf) and is correct — leave it.
- Bullets: two Roleplay bullets render differently despite IDENTICAL source (`<li class="c4 c17
  li-bullet-0">`, margin-left 30pt) → the divergence is in OUR rendering (docClean/CSS), not the Doc.
- Sheet A `1hG6V1ddnlr8jZZm8Rg0jJ4360WrH7zUD-TvNqaPkuUg` gid 735572717 = tribe-format Brotherhood
  roster clone (row1 "BROTHERHOOD OF STEEL ROSTER", row2 headers "Discord Name/Full name/Caste and
  Rank/Age·Sex·…" — columns differ slightly from the tribe's).
- Sheet B `1oJUOBuiDdjCo62ko39LWtqBtyt81ZLLgpE1iFIkltF0` gid 879658166 = a RELATIONSHIP MATRIX
  (characters × relationship types: Acquaintance/Friend/Crush/Family/Rival/Hatred…), not a roster.

## T23 · TOC — all headings + legible, attractive formatting — SMALL
The sidebar CONTENTS rail drops sub-headings and is too small. (1) `buildDocSidebar`: collect h1–h3
(add `tl3`), judge whether h4 is worth including from the real docs. (2) Raise sizes: no TOC entry
below the 17px floor (tl2 is 15px today); scale slightly by level (tl1 largest) but never < 17px.
(3) Make the hierarchy read clearly and attractively — indent per level, comfortable row spacing/
line-height, keep the active-item accent. Acceptance: every h1–h3 in both docs appears; nothing < 17px;
desktop + mobile screenshots; no overflow.

## T24 · Consistent bulleted lists — SMALL / investigate-then-fix
Identical-source bullets render differently → find where OUR pipeline diverges. Reproduce in preview
(inspect both `<li>`s: tag, parent `<ul>`/`<ol>`, computed margin/indent, `::before` marker). Likely
cause: Google exports runs of bullets as separate `<ul>`s or a stray element splits the list, or a
bullet loses its `<ul>` wrapper in docClean. Normalise so every same-level bullet is identical (marker,
indent, spacing). Acceptance: the two example bullets + all same-level bullets render identically;
numbered lists unaffected; screenshot.

## T25 · Make multi-cell data tables more attractive — DESIGN / MEDIUM
Real tables (lore Faction/Standing, roleplay Role/Description/Notes) use the plain `.doctable` style.
Improve: distinct header row, comfortable cell padding, phosphor-tuned row rhythm/zebra, a subtle
frame, graceful narrow-screen scroll (no page overflow). Theme-tracking (var(--fg*)). MULTI-cell
only — 1×1 boxes are quotes (done). Acceptance: both tables look polished desktop + mobile, header
clearly distinct, no h-overflow, before/after screenshots.

## T26 · Line-art diagrams — invert + colourise to theme — DESIGN / MEDIUM
Doc images get grayscale + theme-multiply (good for photos), but a flow chart (dark lines on white)
stays light-bg and clashes with the dark screen. For line-art: INVERT (light-on-dark) then colourise
to the phosphor. Weigh: (a) auto-detect line-art (mostly-white/few-colour) → invert; (b) author opt-in
via alt-text tag (e.g. "[diagram]"); (c) a per-figure/Settings toggle. Pick the simplest reliable one.
Acceptance: the lore flow chart reads clearly on the dark theme, colourised to the active faction;
photos unaffected; before/after screenshot.

## T27 · Wire the Brotherhood roster (make a faction real) — SMALL-MEDIUM
Point `FACTIONS.brotherhood.data.sheetId` (+ gid 735572717) at sheet A so switching to Brotherhood
loads a real roster (red theme) instead of coming-soon. Verify field mapping: its columns differ
("Caste and Rank" etc.) — ADD `FIELDS[x].match` fuzzy aliases as needed (never rename existing).
Confirm the sheet is shared "anyone with the link → Viewer". Acceptance: Brotherhood shows its real
roster, fields populate, tribe↔brotherhood reloads correct data, no console errors. ⚠ READ-ONLY —
never write to the sheet.

## T28 · Relationship-matrix view (new content type + own tab) — LARGE / DESIGN-FIRST
Sheet B is a character RELATIONSHIP MATRIX, not a roster — needs a bespoke renderer + its own nav
section (a third section type beyond roster/doc). Design first: how to present a 2D relationship grid
in the terminal theme (matrix? per-character relationship lists? interactive graph?), mobile included.
Do the content-source generalisation (`{type, source}` groundwork) first. Its own context/design pass
before building. Acceptance: TBD in the design pass.

## T28 DESIGN PASS DONE (2026-07-11) — see docs/DESIGN-RELATIONSHIPS.md
Assessed 3 presentations (A full matrix / B per-character dossier / C force-graph). RECOMMENDED **B**:
a per-faction "Relations" section — pick a character (reuse the roster rail) → their relationships
grouped by type (Family/Friend/Crush/Rival/Hatred/Acquaintance) as chips that link to each character's
dossier; types shown by group header + glyph + emphasis (monochrome-safe); deep-link
`#<faction>/relations/<slug>`. A themed **prototype shipped + screenshotted** (DOM-injected into the
live theme; app source untouched) — desktop + mobile both read well. BLOCKERS before building:
  (1) user confirms direction B (vs A/C), and section-vs-dossier-block (or both);
  (2) a SAMPLE of Sheet B's real layout — sandbox can't reach gviz, so the parser (long-edges vs wide
      N×N, directed vs mutual, full type list) must be locked against real rows first.
Build plan (data adapter → section plumbing → renderer → styles → verify) is in the design doc.

## Note — T22 gate clarified
"Lattice" = a UI builder linked to Substrate, providing standard HTML layouts to reduce parallelism /
standardise building (in the Claude project folder). T22 (Misfits wiki reader) stays gated on Substrate
+ Lattice.

# Batch 6 — Misfits Database: nav, home page, chrome, wiki (queued 2026-07-10)

The app is now a multi-faction **Misfits Database** (Tribe, Brotherhood, +more), not just the
Tribe. This batch reframes it around that. Do the quick fixes (T29 group) first, then the
design-led pieces. **Wiki (T35) is the eventual target — complete the rest first.**

## T29 · Settings-drawer cleanup — SMALL [quick fixes]
- **One fixed legible font** for the drawer chrome (from FACES, e.g. Plex / IBM Plex Mono) — do
  NOT inherit the user's chosen app font, so the prefs stay readable when a chunky pixel face is on.
- **Remove the little colour-circle previews** from the Colour swatches — and from the Background
  swatches too (keep the names/labels only).
- **Remove the Screen Density (comfortable/compact) control** — it does little; drop it (and its
  `body.compact` CSS / applyDensity) unless a real use surfaces.

## T30 · Image rendering improvements — MEDIUM (fade-in + lazy DONE 2026-07-11)
- **Brightness:** the theme-colourise multiply tint dims images — raise image brightness to
  compensate (portraits + doc figures), keeping the phosphor look. Tune per surface.
  → largely handled by the sepia→hue-rotate filter's brightness(1.12/1.14) (fa68514); a final
    by-eye tune on a live image with text is T37 (needs a real browser — Google data won't load in
    the sandbox preview).
- **Fade-in on scroll:** ✅ DONE — portraits now start opacity:0 + a slight scale and settle in on
  `load` (`.imgok` added via onload; `.portrait img` transition), so a lazy portrait fades in as it
  scrolls into view instead of popping. Doc figures already faded via the `.pending`→loaded opacity
  transition — added a matching scale-in. Both reduced-motion-aware (transform dropped, gentle opacity
  fade kept). Broken images still hide via the existing `onerror`→`.noimg`. Mechanism verified with an
  injected test image (onload→`.imgok`→opacity 1 — no stuck-invisible); the live fade shows on the
  deployed site (the sandbox can't reach Google's gviz/Docs endpoints to load real portraits/figures).
- **Lazy-load audit:** ✅ portraits already carry `loading="lazy"`; added `decoding="async"` to match
  the doc-figure hints. Card thumbs use the same `portraitHTML`, so they inherit it.

## T31 · Screen border redesign — MEDIUM / DESIGN
- A **jet-black bezel** around the screen (like a real Apple display) + a **rounded hairline** line
  where the rounded bezel meets the app content — a crisp inner edge that lifts visual quality.
  Must work in BOTH chassis (metal) and screen-only modes.

## T32 · Navigation + home-page redesign — LARGE / DESIGN-FIRST
The umbrella is "Misfits Database" hosting factions/sections. Rethink the top bar + add a home page.
- **Faction dropdown UNMISTAKABLY a dropdown** — the boxed caret isn't enough; make it obvious.
- **Top section buttons much larger** — stretch to fill the full width of their row, auto-dividing
  evenly by count.
- **Home button + home landing page:** big full-height section tiles, each with an icon + a short
  explainer of what's in that section — website-navigation logic. The top-row buttons essentially
  ARE the home tiles, elongated; the home page doesn't repeat them on its own top row.
- Consider a **gentle occasional pulse** on the top bar to signal "there's more than the database"
  (judge vs distracting).
- Design-first: sketch the home layout + nav behaviour before building.

## T33 · Rename the project → "Misfits Database" — MEDIUM
No longer just the Tribe. Rename consistently: the umbrella brand / page `<title>` / OG default =
**"Misfits Database"** (the share "preview" should say this), while each faction keeps its own
brand (Tribe → "THE TRIBE DATABASE"). Update README/docs and consider the repo name. Mind the
per-faction `document.title` already in renderBrand.

## T34 · Reading-progress marker — SMALL
A subtle indicator (bottom-right?) showing how far through a doc you've read (Medium-style),
driven by `#docscroll` progress.

## T35 · Wiki reading (AUTHORISED — relaxes T22's gate) — LARGE
The Google Docs are being migrated INTO the Misfits **wiki**; the target is to use this system to
view the WIKI well. **The database keeps reading Google Sheets (unchanged). The existing Google-Doc
reader MUST keep working — wiki reading is ADDITIONAL** (a new source type for now). Generalise the
content source (`{type: gdoc|wiki, source}`), fetch + sanitise wiki HTML through `docClean`, handle
wiki navigation / internal links. (Supersedes T22; its Substrate+Lattice gate is relaxed.)

## Also (folded into the above): remove the portrait corner-bracket reticle (quick, part of T29
## visual pass); dropdown-clarity is part of T32.

## T36 · Text-size +/- stepper with a legibility floor — SMALL [next]
The current text-size control is 5 swatches (Auto/Cozy/Comfortable/Large/X-Large) whose steps jump
DRASTICALLY, and "Auto" is font-derived so sizes swing when the font changes. Replace with a simple
**− / +** stepper (a logical spot in Settings → Typography, or near the doc reader). Requirements:
- A small, even step scale (e.g. 5–6 rem-ish steps) with a **hard minimum so BODY text is never too
  small** (respect the 17px legibility floor for prose).
- Persist the chosen step (`yuma-textsize`), keep it decoupled from the font choice (no more wild
  swings when the pixel font is picked).
- Wire to `applyTextSize` / `setTextSizeAttr` / the `body[data-textsize=…]` CSS in app.js/styles.css.
  Keep an "Auto/Default" middle if useful, but − and + are the primary control.
Acceptance: +/- steps the doc + roster text smoothly, never below the floor; persists; screenshot.

## T37 · Doc-image brightness/tint final tune — TINY [next]
The 4-edge fade + ~10% side buffers shipped. `.docfig img` brightness(1.16)/contrast(1.12) +
`.docfig-tint` opacity .42 still leave illustrations slightly washed. Tune by eye on the live site
(test an image WITH text / a screenshot). Balance: bright enough to survive the multiply tint, not so
bright it blows midtones to uniform colour. Portrait uses brightness(1.32)/contrast(1.3) + tint .5.

## T38 · Per-faction signature fonts + rename the iconic "Fallouty" face — SMALL/MED [now]
The app font (head + body) should differ per faction, giving each its own typographic identity —
loaded automatically when the faction loads, exactly like its signature COLOUR already does (per-
faction keys, user override remembered per faction). The iconic Fallout-1/2 pixel face is the
"primary" and may be reused across factions.

**Rename:** the FACES entry keyed `fallout` was labelled "Fallout 1·2". Its primary rendering font is
`Fallouty` (by Sébastien Caisse / "Red!", 2002 — the real, iconic fan recreation of the FO1/2 title
lettering; Fallout12/VT323 are only fallbacks). Relabel it to its real name **"Fallouty"** in the
picker. Keep the internal key `fallout` (renaming it would churn localStorage keys, PRESET_MIGRATE,
orders, defaults, and CSS `body[data-font-*="fallout"]` hooks — not worth it).

**Signature map** (`FACTIONS[id].font = {head, body}`), thematic, legible body everywhere:
- tribe       → fallout  / fallout    (Fallouty — the flagship/iconic look, unchanged)
- brotherhood → monofonto / sharetech (hard military terminal)
- vault       → overseer  / plex      (the actual Vault-Tec "Overseer" signage + legible prose)
- legion      → block     / sharetech (Pixelify — monolithic, carved-stone brutalism)
- bazaar      → ticker    / plex       (DotGothic16 — dot-matrix trader marquee)
- enclave     → fixedsys  / plex       (cold government mainframe)
- unity       → fallout   / plex       (Fallouty reused, green phosphor + legible body)
- ncr         → terminal  / plex        (VT323 — frontier-republic CRT surplus)

**Mechanism:** applyFontHead/applyFontBody persist to `yuma-font-head-<faction>` / `-body-<faction>`
(was global). applyFaction + init load `localStorage.getItem("yuma-font-head-"+id) || faction.font.head`.
One-time migration: fold any legacy global `yuma-font-head/-body` into the current faction's key.
Body faces are all legible (plex/sharetech) so the size-follows-font logic keeps prose readable.
Doc-reader fonts (--doc-font-*) stay on their own defaults this pass (separate reading surface) — a
possible follow-up is to key those per-faction too.
Acceptance: switching faction visibly changes the typeface throughout the chrome (home/roster/nav/
brand), Tribe still loads Fallouty, picker shows "Fallouty", overrides remembered per faction; verify
+ screenshot two factions.

## ── Batch 7 (2026-07-10 pm) — header relayout, declutter, architecture, bug ──

## T39 · Move the faction selector to the top-right corner — MED [design]
"THE TRIBE DATABASE" (the brand, which IS the faction switcher) should live in the **top-right
corner** with a **large, clear downward triangle (▼)** so it's unmistakably a selector dropdown.
This SUPERSEDES the "SWITCH FACTION" pill (de0a62c) — the wordmark itself becomes the trigger.
- Move `.brand` to the right of the titlebar row; drop the separate `.brand-switchbox` pill.
- Big ▼ glyph next to the wordmark; whole thing is the button (`#faction-btn`).
- To declutter, pull the nav tabs UP into the titlebar row (one row: [tabs] … [BRAND ▼] [⚙]),
  removing the separate `.navrow` where it fits. Keep the gentle pulse cue (optional, subtler).
- The dropdown menu (`.brand-menu`) opens anchored to the right edge.

## T40 · Drop the roster search INTO the list column — MED [design]
Right now the search sits in the command-bar row ABOVE the divider line. Move it so it **drops below
that line and nestles into the list column** (left rail), perfectly width-aligned with the character
list / the section-filter controls beneath it. Goal: **less busy** — the search reads as the head of
the roster column, not a floating toolbar element. Keep `#search`, `#search-clear`, the `/` hint;
the doc-find bar (`.docbar`) should mirror the same in-column placement over the doc TOC rail.

## T41 · Chunkier, abutting filter inputs + declutter — SMALL [design]
The square input boxes (section filter, sort, and the List/Cards seg) should be **larger, chunkier,
and ABUT each other** (shared 1px borders, no gaps between them) — a single segmented control bar
rather than scattered pills. Look for other clutter to cut (redundant labels, the Refresh button's
prominence, spacing). Keep the 17px legible type.

## T42 · Theme ALL dropdown menus consistently — SMALL/MED [design]
The section-filter and sort controls are native `<select>`s whose popup lists render in the OS chrome
(off-theme). Make every dropdown share ONE in-theme look. Prefer REUSING the existing custom-dropdown
pattern (`.brand-menu`/`.brand-opt` + open/close/outside-click/Esc from `wireFactionMenu`) rather than
adding a second system — extract a tiny reusable custom-select so faction + section + sort all match.
(If a full custom-select is too heavy, at minimum style the closed control + `<option>`s uniformly and
document the native-popup limitation.)

## T43 · Simplify the multi-faction architecture — MED [refactor]
Reduce parallelism/complexity in the faction system (driven by an architecture audit). Likely wins:
- One helper to resolve a per-faction pref: `factionPref(kind, faction)` returning
  `localStorage.getItem("yuma-"+kind+"-"+faction) || signatureDefault(kind, faction)` — collapse the
  repeated `getItem(...)||faction.theme.X` / `||factionFont().X` triples now duplicated across
  `applyFaction`, `init`, `refreshCur`, and reset.
- A single source of truth for each faction's signature (colour/bg/font) + one apply path used by both
  switch and init. No behaviour change; fewer places to update when adding a faction.

## T44 · BUG: Brotherhood entries must show only in the Brotherhood tab — [correctness]
User: "the 'brotherhood' entries should show up only in the brotherhood tab." Investigate how roster
data / EXTRA_CHARACTERS / sections are scoped per faction; ensure no Brotherhood-affiliated entries
appear under the Tribe (or any other faction). Root-cause via the architecture audit, then scope the
data correctly. Verify each faction's roster shows ONLY its own members.

## ── Batch 8 (2026-07-10 eve) — exterior border + breathing room ──
Principle (user): improve the SYSTEM as we go, don't generate entropy — extend existing structures
(the `body::after` bezel, the `--edge` inset model) rather than bolt on parallel ones.

## T45 · Exterior screen border rework — MED [design, needs 2 answers]
"The exterior border is a bit cramped." Rework the jet-black monitor bezel (screen mode: the
`body:not([data-frame="border"])::after` box-shadow at styles.css ~161, currently a 12px `#000` ring +
`border-radius:22px`). From OUTSIDE in:
  1. Jet-black border **~1mm thicker** (≈ +4px → 12px → ~16px).
  2. A small **gap/padding** (screen-bg) between the black border and…
  3. A **theme-coloured hairline** (~1px), rounded to follow the bezel radius (tracks `--fg`).
  4. **Healthy padding** between that hairline and interior content.
  5. EXCEPTION: long horizontal rules (e.g. the header divider) may extend all the way OUT to the
     hairline, rather than stopping at the content inset.
Approach: model it with CSS vars (`--bezel-black`, `--bezel-gap`, `--bezel-line`, `--bezel-pad`) and
raise the content inset (`--edge` min) so it never collapses under the border on small screens (the
current min 12px is the cramping). Likely restructure: `.app` pads to the hairline; header/main/
commandbar pad the "healthy" gap; header's border-bottom then reaches the hairline naturally.
⚠ OPEN Qs: (a) screen mode only, or Chassis too? (b) how the CodePen reference informs it (blocked).

## T46 · More padding in the top title area — SMALL
The header/title row needs more top (and general) breathing room — it reads tight against the bezel.
Fold into T45's padding model so the title area sits a healthy distance below the top hairline.

## T47 · Crib from the CodePen reference — BLOCKED (needs source)
codepen.io/carterfromsl/pen/OJjxXKJ — 403 to automated fetch, no export zip on disk. Once the user
pastes the code or drops the .zip in the project, mine it for thematic legibility ideas (borders,
glows, type, scanlines) and fold the good parts in WITHOUT adding parallel systems.

## ── Batch 9 (2026-07-11) — masthead controls + home-tile glow-up ──
Anti-entropy: reshape the existing `.brand`/`.brand-menu`/`wireFactionMenu` and `.home-tile`
systems — don't add parallel ones. Screen mode is the target; keep Chassis coherent.

## T48 · Settings → a large cog icon on the far right — SMALL
Replace the "⚙ Settings" text button with a large standalone cog GLYPH (no label), pinned to the
FAR right of the header row (rightmost element). Keep it accessible (aria-label "Settings",
title). It still opens the settings drawer. Style: sized to sit with the other masthead controls,
hover/active states, theme-tinted.

## T49 · A labelled FACTION dropdown box + drop the tagline — MED [design]
Replace the wordmark-as-dropdown with a dedicated **FACTION** control: a bordered box containing the
label "FACTION" (and the current faction) + a **generous, large Fallout-style ⯆ arrow** on its right.
This box is the dropdown trigger. **Remove the "// PIP-LINK" tagline** (`.brand small`) everywhere it
shows. Decide (see Q) whether the big wordmark stays as a title or the FACTION box replaces it.
Arrow = chunky pixel/Fallout chevron, not a text "▼".

## T50 · Workshop the faction dropdown motion — SMALL/MED [design]
Make the open/close feel FLUID and Fallout-like: the menu should animate in (slide+fade / expand from
the box, terminal-style), the big arrow should rotate/morph smoothly, options should have a crisp
phosphor hover, maybe a subtle stagger or scanline sweep. Respect prefers-reduced-motion. Reuse
`.brand-menu`/`.selctl` patterns; unify if it reduces duplication.

## T51 · Home-page tiles — a proper web-design glow-up — MED [design]
Make the home section tiles look impressive (study real web landing patterns): stronger visual
hierarchy, depth/framing, richer hover (lift, glow, arrow/CTA reveal, icon motion), better use of the
full-height space, maybe a faint terminal texture or per-section accent. Keep it on-theme + responsive
+ reduced-motion-safe. It's the first thing visitors see — it should feel designed, not utilitarian.

## ── Batch 11 (2026-07-11) — deep-link URLs, key rename, icons, wiki ──

## T48b · URL deep-linking (hash router) — MED [now]
Make the URL reflect the current view so people can link to a faction/section/character/doc-section.
Use HASH routing (not History API paths): it's client-side only — ZERO extra loading, no server
round-trip, no 404 risk on static GitHub Pages. Scheme, clear words + `/` only:
  #<faction>/<section>[/<target>]
  #tribe/roster · #tribe/roster/big-brom-matlok · #tribe/lore · #tribe/lore/relations-to-other-factions
  #home (faction-agnostic landing)
- `applyRoute(hash)` parses → applyFaction + setSection + open char / scroll to heading.
- `routeToHash()` writes the hash on nav (replaceState, no history spam for scroll; pushState for clicks).
- hashchange → applyRoute (back/forward); guard a re-entrancy flag so our own writes don't loop.
- Keep legacy `#c=<slug>` / `?c=<slug>` (the c/ OG stubs) working → normalise to the new scheme.

## T49b · Rename the legacy `yuma-*` keys → `mdb-*` — SMALL [now]
Dev-only storage keys (localStorage `yuma-color`, `yuma-font-*`, `yuma-faction`, … + `YUMA_SHEET_
OVERRIDE`, IndexedDB `yuma-docdb`) still say "yuma" from the old project name. No users yet → no
migration needed. Rename `yuma-` → `mdb-` in app.js AND tools/preview.py (which injects the override).
Fix other stale-name entropy spotted in passing (leave the repo/folder name — that's a bigger call).

## T50b · Larger, Fallout-style icons for the menu + home — MED [design]
The nav/faction/section glyphs are small flat silhouettes. Make them LARGER and more Fallout-styled
(chunkier, bolder, more iconic — Pip-Boy perk-icon energy) in the top nav, the faction picker, and the
home tiles/row. Keep fill:currentColor tinting + reduced-motion. (First pass: bump sizes; then refine
the drawing.)

## T51b · List/Cards toggle needs more internal padding — TINY [now]
`.seg button` (List / Cards) is cramped. Add vertical + horizontal padding so the pill breathes.

## T35 · WIKI reader — FEASIBILITY CONFIRMED, ready to build — LARGE [roadmap→build]
Target: https://wiki.misfitsystems.net (MediaWiki). ✅ Verified 2026-07-11: `api.php?action=parse&
page=<Page>&prop=text|sections&format=json&formatversion=2&origin=*` is **CORS-enabled** (browser fetch
returns `type:"cors"`, full parsed HTML + section anchors). So NO backend/proxy needed — same client-
side model as the Google-Doc reader. Plan:
  - Generalise the content source: a section can be `{type:"gdoc", docId}` OR `{type:"wiki", page}`.
  - `loadWiki(page)`: fetch the parse API, take `parse.text`, run it through `docClean` (already a
    strict whitelist sanitiser — reuse it), theme with the doc-reader CSS. Cache like docs (IndexedDB).
  - Rewrite internal links (`/index.php/Page` or `/wiki/Page`, and `#anchor`) to in-app routes so
    clicking a wiki link loads that page in-theme instead of leaving the site; strip edit/`action=`
    links. Section anchors from `parse.sections` feed the TOC + deep links (ties into T48b).
  - Keep the Google-Doc reader + Sheets roster working alongside; the wiki is an ADDITIONAL source.
  - Nice: the Main Page already ships dark-monospace inline styles — decide whether to keep or strip
    them so our theme fully owns the look (probably strip inline color/bg in docClean, keep structure).

## T35 UPDATE (2026-07-11) — WIKI TRIAL SHIPPED (0960d35), refinements remain
Built: universal Wiki tab + home card; `loadWiki(page)` (fetch parse API → strip chrome → flatten
layout tables → docClean → render); internal wiki links browse in-app; deep-link `#<faction>/wiki`.
STILL TO DO to make it good:
  1. Layout: the Main Page's bespoke markup still renders some text one-word-per-line even after the
     table flatten — investigate (maybe `<center>`/`<big>`/inline-style remnants, or `<pre>`); make
     wiki content flow at full reader width.
  2. Images: currently stripped — restore them (rewrite src→absolute, render like docfig, but they're
     URL-based not base64 so skip the base64 hydration path).
  3. Carry the wiki page in the URL (`#wiki/<Page>`) so a sub-page is linkable; add caching (IndexedDB
     like docs); build the sidebar TOC from `parse.sections`.
  4. Decide faction-scoping: the wiki is umbrella (currently routes under the active faction as
     `#tribe/wiki`) — maybe make it a top-level `#wiki` route instead.

## T35 UPDATE (2026-07-11, later) — refinements 1/3/4 DONE (85b0c26, ba744a9)
  1. ✅ NARROW TEXT FIXED — root cause found: `.docreader` is a grid (side · centre measure · side),
     and docClean returns wiki content as LOOSE inline/text runs (it drops every `<div>` wrapper), so
     bare runs auto-placed into the narrow side column → one word per line. Fix: wrap the cleaned wiki
     HTML in ONE `<div class="wikibody">` so it sits in the centre column and flows. (No new CSS — it
     rides the existing `.docreader > *{grid-column:2}` rule. The Google-Doc path is untouched: its
     content is already block-wrapped, so it never hit this.) Also: leaf content-`<div>`s → `<p>` in
     wiki preprocessing so the Main Page's styled banners keep their own lines (were merging).
  2. ⛔ IMAGES — MOOT, NOT NEEDED. Verified the wiki has ZERO uploaded images (`list=allimages` empty;
     content pages contain no `<img>`; the whole wiki is text + inline-CSS styled boxes). Nothing to
     restore. The strip pass still drops `img` defensively. (Reopen only if images are ever uploaded.)
  3. ✅ URL CARRIES THE PAGE + ✅ TOC. Top-level `#wiki/<Page>` route (writeRoute emits the current
     `_wikiPage`, applyRoute opens it, loadWiki writes it on every load → in-app link browsing AND cold
     deep links are shareable). TOC already builds from the rendered headings via `buildDocSidebar`
     (12 h's → 29 links on Rules), so `parse.sections` isn't needed. IndexedDB caching NOT done — wiki
     pages are 20–40 KB and fetch fast; low value, left as an optional nicety.
  4. ✅ FACTION-SCOPING DECIDED — wiki is now a TOP-LEVEL `#wiki` route (umbrella content), not
     `#<faction>/wiki`. The Wiki tab still appears in each faction's nav but shows the shared wiki.
  Verified live (both Main_Page and content pages render full-width, in-theme; console clean).

## T35 VISUAL LAYOUT (2026-07-11) — "surpass the source MediaWiki" — DONE
User: the wiki looked like a jumble; design a visual layout that beats the source. The flatten-and-
strip approach (above) fixed readability but DESTROYED the Main Page's hand-built structure. Replaced
it with a STRUCTURE-AWARE renderer `renderWiki()` (app.js): it walks the parsed MediaWiki DOM and
RE-SKINS the author's inline-styled semantics as native phosphor components instead of flattening —
  • styled centred box w/ big text → `.wiki-hero` (glowing bordered banner);
  • reddish-bordered box → `.wiki-callout--alert`; other styled box → `.wiki-callout` (accent-bar admonition);
  • a table whose cells carry inline border/background → `.wiki-cardgrid` of hover-lift `.wiki-card`s
    (the faction cards — the source colour-codes each; we go clean monochrome phosphor + hover);
  • a single-row plain multi-col table → `.wiki-cols` (responsive columns, stack on mobile);
  • a genuine data table (`<th>`, no per-cell inline bg) → the existing `.doctable`.
  Leaf prose still goes through docClean; `wikiClean()` runs the leaf-div→`<p>` pass per box/cell so
  title·body·links stack. CSS `.wiki-*` added to styles.css. The old destructive table-flatten loop is
  gone. Verified: Main Page now reads as a designed landing (hero + alert + 2-col quick-links + 3-col
  faction card grid); content pages (Rules) gain the hero/blockquote treatment with no regression;
  cards+cols stack on mobile (no h-overflow); standard `.wikitable`s still render as data tables; console
  + selfcheck clean.

## HOME fine-tuning (2026-07-11) — DONE (17e7a67, e2040bc, 7e1ae1b), user-picked
Three home-page polishes the user asked for after the wiki work:
  A. ✅ Trimmed the empty header band on `body[data-section="home"]` — nav+brand are hidden there, so
     the header held only the cog above a tall breathing band + divider. Slimmed top padding to just
     clear the bezel, dropped bottom padding + the divider on home → the hero sits high (header 101→68px).
  B. ✅ Richer section cards — the index numeral was floating mid-card (`right:150px`) over an empty
     right third. Anchored it to the right edge as a bold oversized index (brightens + drifts on hover),
     and moved the "Enter →" CTA under the blurb (left-aligned, grows in on hover) so it no longer
     overlaps the numeral. Resting cards read designed; hover is a clear CTA.
  C. ✅ Evened the faction tiles — dropped the leading "The " on the compact picker tiles (NCR went
     from a ragged 3-line wrap to a tidy 2) + uniform `min-height:52px` centred cells so both grid rows
     match. Verified desktop + mobile (single-column stack, no h-overflow).
  Untouched by request: T51's deeper tile texture/per-section accent (phosphor is monochrome by the
  two-surface law, so per-section colour was deliberately NOT added).

# Batch 13 — Discord source + bezel glow (queued 2026-07-11)

## T52 · Investigate integrating the Discord character/faction entries — INVESTIGATE-FIRST, DO NOT BUILD
User: a Discord channel holds character + faction entries worth pulling into the database. Roadmap +
investigate BEFORE any implementation; other tasks come first.
Source: https://discord.com/channels/1471565853534322715/1485727049078542366
  (guild 1471565853534322715, channel 1485727049078542366).
⚠ ACCESS: Discord content is auth-gated — it CANNOT be fetched with WebFetch/curl (login + the app
shell required). To read it, one of: (a) the user pastes/export a sample of the entries here; (b) use
the logged-in Chrome surface (mcp__claude-in-chrome) to read the channel with the user's session
(their call — it acts on their account); (c) a Discord API read with a bot token in the guild.
Investigation to produce (a short written assessment, like T2/T15 — no code):
  1. Sample the real entries — WHAT'S there (per-character fields? faction blurbs? free-form posts vs a
     structured format / bot embeds / a pinned template?), how consistent, roughly how many.
  2. Map it to our data model — do these become roster characters (→ the Sheets schema + FIELDS), or a
     new "faction dossier" content type, or doc/wiki pages? Which factions do they cover?
  3. Pick an integration PATH + cost:
     - one-off manual: copy into a Sheet (fits the existing gviz roster flow — zero new code) — likely
       the cheapest first step and keeps data READ-ONLY on our side;
     - semi-automated: a small script/bot that reads the channel → writes a Sheet/JSON the app already
       reads (never write to CONFIG.sheetId; a NEW sheet/source only);
     - live: fetch at runtime — almost certainly needs a proxy/bot (no CORS, no public read) → heaviest.
  4. Note freshness/ownership (who curates it, how often it changes) — that decides manual vs automated.
Deliverable: `docs/DISCORD-SOURCE.md` (assessment + recommendation) + concrete follow-up task(s). No
data written anywhere until the user approves the path. Sequence AFTER the current roadmap items.

## T53 · Edge border — extra glow + widescreen/responsive — DONE-THIS-BATCH (see git)
Make the exterior screen bezel (screen mode: `body:not([data-frame="border"])::after`, the `--bezel-*`
concentric rings) EXTRA glowy — a brighter phosphor bloom around the theme hairline, especially read on
the exterior edge — and verify it renders correctly + responsively on widescreen (and still mobile).
