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
- **Wendover territory scenario** — T112 uses 2298 as the working midpoint of existing 2296–2300 records
  and retains NCR presence, raider activity, and vault-dweller site control as overlapping provisional point
  claims. Confirm or revise that campaign state before any claim is reviewed or rendered as an overlay.

## Sharp edges (don't re-break these)
- **Connector:** `#masthead-connectors` is one measured SVG overlay. `resetConnector()` invalidates before
  faction tabs are replaced; `positionConnector()` owns the dim stem/tree and draws a lit route only for one
  matching CSS + ARIA + route selection; `watchConnector()` observes state and geometry. Do not restore
  separately positioned pseudo-elements or an always-lit parent stem. Wrapped/collapsed layouts hide it.
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
  · `#paperwork` · `#events[/<document>[/<heading>]]` · `#stories[/<event>]` ·
  `#proposals[/<document>[/<heading>]]`. `parseRoute`/`applyRoute`/`writeRoute`/`setSection`.
  `UMBRELLA_SECTIONS` owns shared
  faction-agnostic metadata; `factionSections()` combines universal Roster/Relations with the active
  faction's configured documents. Routing validation, faction continuity, Home cards, tabs, headings, and
  command discovery consume those sources. Rendering stays explicit in `setSection()`. To add an umbrella
  surface, add its metadata once, then add its explicit renderer/visibility branch, `NAV_ICONS` entry if
  needed, `<section>` markup, and `#primary-nav` button. Do not add another section-validity or label list.
- **Community archive:** `COMMUNITY_COLLECTIONS` is the single registry for Events, Proposals, and the Event
  index used by Stories. Events/Proposals reuse the Google-Doc reader. Stories are Markdown records in
  browser-local storage (`mdb-event-stories-v1`), not shared or published data; do not imply server persistence.
- **Masthead:** at wide widths a 10-unit grid keeps Faction in the central two units and distributes the seven
  global destinations plus Settings evenly around it; smaller layouts wrap without hiding labels.
  `resetConnector()` clears old geometry before replacement; `positionConnector()` draws
  one SVG from the actual faction/tab rectangles and exact selection state; `watchConnector()` rebinds state
  and geometry observation. `renderMeasuredConnector()`/`resetMeasuredConnector()` are the shared atomic
  paint contract; surface-specific measurement remains local so route logic never enters the renderer.
- **Document/wiki contents:** Google Docs and MediaWiki both build `#doctoc`. Its decorative SVG derives
  parentage from H1–H4 levels while native anchors, `trackDocSection()`, and the bounded `#docscroll`/
  contents-rail coordinators remain authoritative. `clearDocSidebar()` invalidates replacement loads before
  they can expose the old page. `.docrail` owns the outline plus its shallow find dock, so search costs no
  reader height; current-heading/source metadata lives in `.sb-docmeta`. Never move find back into the global
  `.commandbar`, or measure the sticky header's changing offset as connector geometry. In focus mode the same
  `.docrail` becomes a collapsible floating outline while `.docbar` stays hidden; `data-focus-toc` owns only
  that presentation state. `data-focus-ui="quiet"` is a transient fine-pointer state derived from the live
  reading-lane bounds—never persist it or fork the TOC/active-section model.
- **Map:** 3 scales (US atlas / Wendover Region / Local) sharing `#map[/<scope>]` with `_mapScope`. US pins
  progressively enhance with the lazy self-hosted `map-terrain.js` adapter and MapLibre 5.24.0. It reads
  reviewed/provisional location state from `data/world.json` and the legacy migration inventory, while the
  existing SVG retains complete fallback coverage. Region uses authored world records with visible confidence.
  Local is deliberately a separate native game-grid renderer; T116 scopes a deterministic export from the
  user's map editor rather than loading `Wendover.yml` in the browser. `renderMap()`/`showMapDetail()`/
  `setMapScope()` remain application integration points; `map-terrain.js` owns renderer/layer/marker state.
  Full renderer and coordinate contracts are in `docs/MAP-ARCHITECTURE.md`.
- **Territory claims:** `data/territory-claims.json` is the separate, non-rendered inventory. It owns scenario,
  time, evidence, uncertainty, contestation, and review state; `world.json` must stay free of faction zones.
  No claim currently has geometry, and art-direction-only fan-map references cannot be used as evidence.
- **Command palette:** ⌘K/Ctrl-K, fuzzy-ranked, deep-links via hash. Self-contained IIFE at end of app.js.
- **Roster search:** `filtered()` + `scoreMatch()`/`fuzzySubseq()` — fuzzy + ranked; flat "Results" list
  while searching, section-grouped when browsing.
- **Paperwork:** `PAPERWORK_TEMPLATES` + `renderPaperwork()` + the `paperworkWire` IIFE (end of app.js).
- **`EXTRA_CHARACTERS`** (top of app.js): hardcoded bios merged into the roster (incl. Wendover chars).

## Open tasks (priority order, with concrete pointers)
1. **Execute the small-screen programme (T124).** Increment 1 is complete: dynamic/small viewport units,
   safe-area clearance, and one border-box canvas. Next build the compact navigation shell: one labelled
   horizontal global rail plus bounded faction tabs, both driven by the existing registries and selection
   state. Then proceed surface-by-surface and finish with the physical-device matrix in `TASKS.md`. Do not
   accumulate more isolated phone overrides before navigation and scroll ownership are settled.
2. **Make the world dataset display-ready.** The roster/dossier phase now includes UX-003–UX-006 / T104–T107:
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
3. **Continue the product audit alongside map data work.** UX-007 closed the settings, palette, and nested
   modal focus/close/restore defects, UX-010/T121 closed fullscreen reading, and UX-011 closed settings
   persistence/reset. Take the next bounded pass through the remaining non-Paperwork cross-surface states;
   Paperwork expansion and form/copy work are explicitly parked. Keep UX-001's VoiceOver, axe/Lighthouse,
   and physical iOS Safari checks external rather than claiming them locally.
4. **Evaluate one further connector adopter only if hierarchy benefits.** T118 proved the visual grammar in
   the shared Google-Doc/MediaWiki contents rail. The next plausible candidate is roster section → active
   character, but keep the existing list interaction authoritative and reject the extension if the extra
   lines add density without clarifying parentage. Flat lists, cards, and controls are not adopters.
5. **Audit the map editor, then prove the Local export (T116).** The ignored 40 MB YAML is source material,
   never a browser payload. Once the separate editor repository is available, inspect its parser, renderer,
   licences, coordinate conventions, and export seams before duplicating anything here. Generate original
   cartography plus a compact native-grid manifest; start with a labelled raster baseline and adopt tiles or
   canvas only after measurements justify them. Geographic Region and game-grid Local remain separate
   renderer decisions.
6. **Decide `EXTRA_CHARACTERS`.** Bios are hardcoded in app.js today. Decide: keep in code, or move to the
   Sheet/wiki like the rest of the roster (forks the data model — pick one and note it).
7. **Wiki migration (blocked on the user).** Move the Tribe Lore + Roleplay Guide onto the MediaWiki;
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
T114 accepted lazy self-hosted MapLibre 5.24.0 for US + Region: public-domain Natural Earth geography and a
bounded USGS 3DEP relief cache now form an original flat terrain base, accessible HTML clusters/markers own
interaction, and the original SVG remains available through slow/failing WebGL. The full desktop/phone matrix,
high contrast, reduced motion, label collision, scope transition, and cold-load budgets passed; Local remains
separate for T116, and faction territory stayed outside the renderer pending T112.
T112 then removed five ambiguous faction zones from location truth and migrated them into a guarded claims
inventory. Two unsupported broad NCR claims are withheld; three overlapping Wendover claims remain
provisional influence/site points; exact geometry and the art-direction fan map are excluded from evidence.
UX-007 then made every closed overlay inert, gave settings and the command palette bounded focus restoration,
and replaced the shared dossier-modal target with a chronological stack that unwinds nested tools one layer
at a time on desktop and phone.
T117 then removed the connector's stale faction-replacement frame and ghost parent glow. The entire tree is
dim without a selected faction section; exactly one CSS/ARIA/route-consistent branch lights when selected;
state and geometry are observed, invalidated, and selfcheck-guarded.
T118 then extracted the atomic paint contract during its first proven reuse. The shared Google-Doc/MediaWiki
contents rail now draws measured H1–H4 parentage and lights exactly one current branch without taking over
links or either scroll container. Loading, focus, and collapsed states synchronously clear old geometry; a
32-heading deep-scroll proof closed the sticky-header drift case.
T119 then replaced the globally opaque browser scrollbars with contextual CRT controls. Scroll owners share
one CSS registry and square scan-banded track; idle, owner hover/focus, touch, direct thumb hover, and high-
contrast tiers remain explicit. The treatment is CSS-only and never becomes another scroll-state owner.
T120 then removed the empty right side of the document command row. Find is now a flush 39px double-keyline
dock inside `.docrail`; the desktop reader gained 78px and mobile gained about 67px. Current heading/source
moved to the status bar, while the remaining global roster toolbar uses a solid hairline-to-hairline rule.
T121 then made focus mode a genuinely borderless canvas in both frame styles. The existing live contents rail
floats borderlessly at the upper left beneath its control, opposite the upper-right exit control, preserves
its single connector/navigation state, and collapses atomically. A two-ended content mask, recoverable pointer-quiet HUD, touch/keyboard tiers,
and bounded desktop/phone layouts complete the fullscreen reader without adding another scroll owner.
T122 then added Events, Stories, and Proposals as one shared community archive rather than three page systems.
Events and Proposals share the document registry and reader; Stories are explicitly browser-local Markdown
records grouped by Event. The wide masthead now distributes global destinations evenly around Faction.
UX-011 then made settings persistence truthful: resolved defaults no longer become silent overrides, Reset all
clears every faction appearance preference, faction signatures return correctly, and authored local data is
outside the reset boundary.
