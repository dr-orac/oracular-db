# Handoff — start here / next steps

**This is the canonical entry point.** The dated `HANDOFF-2026-07-*.md` files are historical; read those only
for backstory. Keep THIS file current — each work session should update "Open tasks" + "Recently shipped".

This is the authoritative "what's done / what's next" doc. Run `git status --short --branch` before relying
on deployment state; local checkpoints may intentionally be ahead of GitHub Pages (`dr-orac.github.io/oracular-db`).

## Working protocol (multiple people/tools alternate on this repo — one at a time)
- **Before starting:** `git fetch && git pull` (or fast-forward). Someone else may have pushed.
- **When done:** commit (selfcheck must pass) and **push** — push = deploy.
- **One at a time.** Don't work in parallel on `main`; hand off via this doc. If you brought research/data
  from elsewhere, strip any non-data instruction/meta before committing it.

## Open decisions — need the user (don't silently drop these)
- **`EXTRA_CHARACTERS`** — keep bios hardcoded in app.js, or move to the Sheet/wiki like the rest? (forks the data model.)
- **Licensing / credit / donate (T100)** — no `LICENSE` yet; the SHWIWWI-TEC credit + any donate link wait on the user's licence choice. See the licensing discussion in `TASKS.md`.
- **Font licensing risk** — Monofonto + Gothic 821 Cn are commercial with no web licence (`docs/LEGAL-SWEEP.md`); OFL fallbacks are in-repo — user to swap or licence.
- **Wiki migration go-ahead** — moving Tribe Lore/Roleplay onto the MediaWiki (steps in `docs/WIKI-INTEGRATION.md`).

## Sharp edges (don't re-break these)
- **Connector** must stay positioned by **left+width** (never left+right insets) — that was the "bus overshoot" bug.
- **Preview width quirk:** the dev preview evaluates media queries at a wider CSS width than `window.innerWidth`
  reports (downscaling) — width-gated CSS can't be tested by resizing; verify at the target width by measurement.
- **CRT motion** is gated on the app's **Reduce-Motion toggle** (`body[data-reducemotion]`), NOT the system pref.
- **Faction sheets:** a faction's own sheet wins over any preview override (`effectiveSheetId`) — don't regress it.
- **Sheets/Docs are often blocked in dev** → verify roster-dependent changes on the LIVE url, not locally.

## Content & art rules (for map / paperwork / wiki additions)
Originals only: **no traced real-world maps and no Vault-Tec/Bethesda trademarked art** on the public site.
Use own screenshots or original schematic art; note the licence on any wiki upload. (`docs/LEGAL-SWEEP.md`.)

## The project in 30 seconds
Vanilla, no-build static site: `index.html` + `styles.css` + `app.js` + self-hosted fonts + `tools/` +
`docs/`. A Fallout/Pip-Boy terminal viewer for SS14 factions. Data sources: Google Sheets (rosters),
Google Docs (lore/roleplay), the Misfits MediaWiki. Only **tribe** + **brotherhood** have live sheet data.

## How to run / verify / ship
- **Selfcheck (must pass before every commit):** `python3 tools/selfcheck.py` — checks application wiring,
  assets, structural drift, and world-data integrity.
  A pre-commit hook and GitHub Actions both enforce it. After a fresh clone run `tools/setup-git.sh`.
- **Preview:** `python3 tools/preview.py` rebuilds a static copy; serve it and open in a browser to verify.
- **Deploy = push.** Pushing to `main` auto-deploys via GitHub Pages (~1–2 min). No separate deploy step.
- **Sandbox note:** Google Sheets/Docs fetches are often blocked in dev environments, so the **roster may
  not load locally** — verify roster-dependent things on the live URL. The wiki host is reachable.

## Hard rules (do not break)
- **Repository history describes the work itself** — what changed, why, sources, and validation. Do not
  record private production metadata in tracked files or commit messages. Imported data must contain only
  project-relevant content and provenance.
- **Never write to `CONFIG.sheetId`** (`10n4TFnuMWekZLD3pucKS050h1cNItcYmL9v0ciuBsSY`, the tribe source sheet).
- **One task = one commit** (imperative subject + why-body). Selfcheck clean before committing.
- **No history rewriting / force-push on `main`** (a few old commit bodies are knowingly left as-is).

## Architecture map (where things live in app.js)
- **Routing:** hash router — `#home` · `#<faction>/<section>[/<target>]` · `#wiki/<Page>` · `#map[/<scope>]`
  · `#paperwork`. `parseRoute`/`applyRoute`/`writeRoute`/`setSection`. `UMBRELLA_SECTIONS` owns shared
  faction-agnostic metadata; `factionSections()` combines universal Roster/Relations with the active
  faction's configured documents. Routing validation, faction continuity, Home cards, tabs, headings, and
  command discovery consume those sources. Rendering stays explicit in `setSection()`. To add an umbrella
  surface, add its metadata once, then add its explicit renderer/visibility branch, `NAV_ICONS` entry if
  needed, `<section>` markup, and `#primary-nav` button. Do not add another section-validity or label list.
- **Masthead:** 3-zone grid ≥1024px — nav left, faction centred, settings right; row-2 section tabs centre
  under the faction; the flow-chart connector is positioned by `positionConnector()` (left+width vars, not
  left+right — don't reintroduce right-inset positioning, it caused the "bus overshoot" bug).
- **Map:** 3 scales (US atlas / Wendover Region / Local) sharing `#map[/<scope>]` with `_mapScope`. US pins
  are the hardcoded `MAP_LOCATIONS` (pixel coords in a 650×500 viewBox) + a Wendover hero marker. Region is
  a small original schematic. `renderMap()`/`showMapDetail()`/`setMapScope()`. Region drawing + coordinate
  contract are documented in `docs/MAP-ARCHITECTURE.md`.
- **Command palette:** ⌘K/Ctrl-K, fuzzy-ranked, deep-links via hash. Self-contained IIFE at end of app.js.
- **Roster search:** `filtered()` + `scoreMatch()`/`fuzzySubseq()` — fuzzy + ranked; flat "Results" list
  while searching, section-grouped when browsing.
- **Paperwork:** `PAPERWORK_TEMPLATES` + `renderPaperwork()` + the `paperworkWire` IIFE (end of app.js).
- **`EXTRA_CHARACTERS`** (top of app.js): hardcoded bios merged into the roster (incl. Wendover chars).

## Open tasks (priority order, with concrete pointers)
1. **Fix the malformed Relations target (UX-004 / T105), then continue the roster/dossier audit.** UX-003 /
   T104 and UX-005 / T106 have complete local passes: List, Cards, dossier, filters/sort, route, ARIA selection,
   display-order keyboard state, and fresh direct Roster links now agree. After T105, continue Phase 0 with
   roster/dossier visual hierarchy and slow/offline loading behavior. Retain UX-001's three external checks.
2. **Make the world dataset display-ready** (research may proceed while the audit runs; it does not edit UI).
   `data/world.json` is deliberately `provisional`: its 13 current locations and valid internal references
   are a research starting point, not yet authoritative placements. Follow `docs/MAP-ARCHITECTURE.md`:
   - inventory the existing 23 US atlas entries so migration never reduces coverage;
   - collect identity anchors and map-relative evidence game by game;
   - classify placement basis, review status, and uncertainty separately from location identity;
   - reconcile the researched records, then change `data_status` only when every published marker passes;
   - migrate one game-sized set at a time behind the existing `renderMap()`/`showMapDetail()` UI.
3. **Run a bounded geographic-renderer proof.** After the audit baseline, test MapLibre for US + Region
   geographic layers, lazy-loaded and self-hosted where practical. Keep Local in its original game-space
   coordinates and design the transition between systems. The dependency must pass the Phase 4 gate.
4. **Extend Region, then build Local.** Keep the original Wendover schematic and its verified real-world
   anchors. Add reviewed regional routes/landmarks next; build the playable Local schematic only from the
   supplied in-game overview and user-confirmed landmarks.
5. **Decide `EXTRA_CHARACTERS`.** Bios are hardcoded in app.js today. Decide: keep in code, or move to the
   Sheet/wiki like the rest of the roster (forks the data model — pick one and note it).
6. **Wiki migration (blocked on the user).** Move the Tribe Lore + Roleplay Guide onto the MediaWiki;
   full step-by-step (pandoc / VisualEditor paste, hub + two-card page shape) is in `docs/WIKI-INTEGRATION.md`.
   When those pages exist, flip the tribe's Lore/Roleplay tabs from the Google-Doc source to the wiki pages.

## Parked

- **Paperwork expansion** waits for access to its source application. Keep the current feature in regression
  coverage, but do not grow a second template library independently.

## Recently shipped (so you don't redo it)
Masthead centred-tree, connector overshoot fix (left+width), fullscreen focus polish + CRT power-on,
box-glow, find-bar vector magnifier, dossier folder-tab, fuzzy+ranked roster search, ⌘K palette, the 3-scale
map + Wendover schematic, `data/world.json`, the Paperwork system, and repo guardrails (setup-git.sh + CI).
