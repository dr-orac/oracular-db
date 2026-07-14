# Handoff — start here / next steps

**This is the canonical entry point.** The dated `HANDOFF-2026-07-*.md` files are historical; read those only
for backstory. Keep THIS file current — each work session should update "Open tasks" + "Recently shipped".

This is the authoritative "what's done / what's next" doc. The [documentation index](README.md) classifies
every project document and explains which files are current contracts versus historical context. Run
`git status --short --branch` before relying on deployment state; local checkpoints may intentionally be
ahead of GitHub Pages (`dr-orac.github.io/oracular-db`).

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
- **Connector:** `#masthead-connectors` is one measured SVG overlay. `positionConnector()` owns the stem,
  bus, risers, and arrowheads in one masthead coordinate system; `watchConnector()` observes every geometry
  owner. Do not restore separately positioned pseudo-elements. Wrapped or collapsed layouts intentionally
  hide the diagram.
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
  under the faction. `positionConnector()` draws one SVG from the actual faction/tab rectangles;
  `watchConnector()` rebinds observation after the faction control is replaced.
- **Map:** 3 scales (US atlas / Wendover Region / Local) sharing `#map[/<scope>]` with `_mapScope`. US pins
  are the hardcoded `MAP_LOCATIONS` (pixel coords in a 650×500 viewBox) + a Wendover hero marker. Region is
  a small original schematic. Local is deliberately a separate native game-grid renderer; T116 scopes a
  deterministic export from the user's map editor rather than loading `Wendover.yml` in the browser.
  `renderMap()`/`showMapDetail()`/`setMapScope()`. Renderer and coordinate contracts are documented in
  `docs/MAP-ARCHITECTURE.md`.
- **Command palette:** ⌘K/Ctrl-K, fuzzy-ranked, deep-links via hash. Self-contained IIFE at end of app.js.
- **Roster search:** `filtered()` + `scoreMatch()`/`fuzzySubseq()` — fuzzy + ranked; flat "Results" list
  while searching, section-grouped when browsing.
- **Paperwork:** `PAPERWORK_TEMPLATES` + `renderPaperwork()` + the `paperworkWire` IIFE (end of app.js).
- **`EXTRA_CHARACTERS`** (top of app.js): hardcoded bios merged into the roster (incl. Wendover chars).

## Open tasks (priority order, with concrete pointers)
1. **Make the world dataset display-ready.** The roster/dossier phase now includes UX-003–UX-006 / T104–T107:
   representations, routes, visual hierarchy, short-phone containment, and load/error/refresh ownership have
   passed at 1440px, 390px, 375px, and 320px. Begin the next map work at the data boundary, not the renderer.
   `data/world.json` is deliberately `provisional`: its 32 current locations and valid internal references
   are a research starting point, not yet authoritative placements. Follow `docs/MAP-ARCHITECTURE.md`:
   - use the completed `data/atlas-migration.json` inventory (23/23 matched; no records required) so migration
     never reduces coverage; `docs/MAP-DATA-INVENTORY.md` separates record coverage from display approval;
   - treat the Fallout 1 record-coverage batch as reconciled, but keep all nine placements provisional or
     withheld until the same-map anchor fit in `docs/MAP-FALLOUT-1-REVIEW.md` passes review;
   - treat the Fallout 2 record-coverage batch as reconciled under `docs/MAP-FALLOUT-2-REVIEW.md`; preserve
     its broad Arroyo and Vault City uncertainty rather than applying one global world-map transform;
   - treat the New Vegas record-coverage batch as reconciled under `docs/MAP-NEW-VEGAS-REVIEW.md`; preserve
     Novac and the three same-area counterparts as inference rather than real-world identities;
   - classify placement basis, review status, and uncertainty separately from location identity;
   - promote defensible direct identities, then change `data_status` only when every published marker passes;
   - migrate one game-sized set at a time behind the existing `renderMap()`/`showMapDetail()` UI.
2. **Continue the product audit alongside map data work.** Take the next bounded pass through settings and
   modal focus/close/restore behavior, then the remaining cross-surface states. Keep UX-001's VoiceOver,
   axe/Lighthouse, and physical iOS Safari checks external rather than claiming them locally.
3. **Run the bounded terrain and geographic-renderer proof (T114).** After the completed T113 containment work
   and the dataset inventory,
   test MapLibre for an original, two-dimensional US + Region underlay. Separate licensed elevation and
   hydrography from toggleable, evidence-aware post-war condition masks; keep locations and labels above the
   terrain. Lazy-load and self-host the renderer and selected assets where practical, require no client token
   or paid tile service, measure transfer and failure behavior, and preserve the SVG atlas as fallback. Keep
   Local in its original game-space coordinates. The dependency must pass the Phase 4 gate. Keep faction
   territory out of the base proof; then run T112's claims audit before drawing any overlay polygons.
4. **Audit the map editor, then prove the Local export (T116).** The ignored 40 MB YAML is source material,
   never a browser payload. Once the separate editor repository is available, inspect its parser, renderer,
   licences, coordinate conventions, and export seams before duplicating anything here. Generate original
   cartography plus a compact native-grid manifest; start with a labelled raster baseline and adopt tiles or
   canvas only after measurements justify them. This audit may happen before T114, but geographic Region and
   game-grid Local remain separate renderer decisions.
5. **Decide `EXTRA_CHARACTERS`.** Bios are hardcoded in app.js today. Decide: keep in code, or move to the
   Sheet/wiki like the rest of the roster (forks the data model — pick one and note it).
6. **Wiki migration (blocked on the user).** Move the Tribe Lore + Roleplay Guide onto the MediaWiki;
   full step-by-step (pandoc / VisualEditor paste, hub + two-card page shape) is in `docs/WIKI-INTEGRATION.md`.
   When those pages exist, flip the tribe's Lore/Roleplay tabs from the Google-Doc source to the wiki pages.

## Parked

- **Paperwork expansion** waits for access to its source application. Keep the current feature in regression
  coverage, but do not grow a second template library independently.

## Recently shipped (so you don't redo it)
Masthead centred-tree and measured SVG connectors, Townsfolk lore routing, the scoped Wendover Local export
pipeline, fullscreen focus polish + CRT power-on, box-glow, find-bar vector magnifier, dossier folder-tab,
fuzzy+ranked roster search, ⌘K palette, the 3-scale map + Wendover schematic, `data/world.json`, the Paperwork
system, the documentation ownership index, and repository guardrails for local links and runtime assets.
The housekeeping pass also removed unused font archives and orphaned licence notes, recorded verifiable
provenance for the vendored CRT package and Fallouty font, classified parked reference modules, corrected
per-character share pages to retain faction identity, and closed the remaining in-repository accessibility
semantics audit. Generated share pages now have a selfcheck-enforced canonical route and collision-safe
regeneration path.
T113 then made Home expose Wiki, Map, and Paperwork as one registry-derived row and gave the three map scales
a bounded desktop viewport plus reachable natural phone flow, clearing the containment gate for T114.
