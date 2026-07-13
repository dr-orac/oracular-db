# Handoff — start here / next steps

**This is the canonical entry point.** The dated `HANDOFF-2026-07-*.md` files are historical; read those only
for backstory. Keep THIS file current — each work session should update "Open tasks" + "Recently shipped".

`main` is clean, selfcheck passes, everything below is pushed and live on GitHub Pages
(`dr-orac.github.io/oracular-db`). This is the authoritative "what's done / what's next" doc.

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
Originals only: **no traced real-world maps, no Vault-Tec/Bethesda trademarked art, no AI-generated art** on
the public site. Use own screenshots / original schematic art; note the licence on any wiki upload. (`docs/LEGAL-SWEEP.md`.)

## The project in 30 seconds
Vanilla, no-build static site: `index.html` + `styles.css` + `app.js` + self-hosted fonts + `tools/` +
`docs/`. A Fallout/Pip-Boy terminal viewer for SS14 factions. Data sources: Google Sheets (rosters),
Google Docs (lore/roleplay), the Misfits MediaWiki. Only **tribe** + **brotherhood** have live sheet data.

## How to run / verify / ship
- **Selfcheck (must pass before every commit):** `python3 tools/selfcheck.py` — checks id refs + css vars.
  A pre-commit hook and GitHub Actions both enforce it. After a fresh clone run `tools/setup-git.sh`.
- **Preview:** `python3 tools/preview.py` rebuilds a static copy; serve it and open in a browser to verify.
- **Deploy = push.** Pushing to `main` auto-deploys via GitHub Pages (~1–2 min). No separate deploy step.
- **Sandbox note:** Google Sheets/Docs fetches are often blocked in dev environments, so the **roster may
  not load locally** — verify roster-dependent things on the live URL. The wiki host is reachable.

## Hard rules (do not break)
- **No tool/assistant attribution anywhere** — not in tracked files, not in commit messages. Keep the repo
  reading as ordinary human development. (Any imported data must be stripped of non-data instruction/meta.)
- **Never write to `CONFIG.sheetId`** (`10n4TFnuMWekZLD3pucKS050h1cNItcYmL9v0ciuBsSY`, the tribe source sheet).
- **One task = one commit** (imperative subject + why-body). Selfcheck clean before committing.
- **No history rewriting / force-push on `main`** (a few old commit bodies are knowingly left as-is).

## Architecture map (where things live in app.js)
- **Routing:** hash router — `#home` · `#<faction>/<section>[/<target>]` · `#wiki/<Page>` · `#map[/<scope>]`
  · `#paperwork`. `parseRoute`/`applyRoute`/`writeRoute`/`setSection`. Umbrella sections (home/wiki/map/
  paperwork) are faction-agnostic; add new ones by following the Map/Paperwork pattern in `setSection`
  (guard + visibility toggle + branch), `renderPrimaryNav` (the `[["home","Home"],…]` list), `writeRoute`,
  `applyRoute`, `NAV_ICONS`, plus a `<section>` in index.html and a nav `<button>` in `#primary-nav`.
- **Masthead:** 3-zone grid ≥1024px — nav left, faction centred, settings right; row-2 section tabs centre
  under the faction; the flow-chart connector is positioned by `positionConnector()` (left+width vars, not
  left+right — don't reintroduce right-inset positioning, it caused the "bus overshoot" bug).
- **Map:** 3 scales (US atlas / Wendover Region / Local) sharing `#map[/<scope>]` with `_mapScope`. US pins
  are the hardcoded `MAP_LOCATIONS` (pixel coords in a 650×500 viewBox) + a Wendover hero marker. Region is
  a small original schematic. `renderMap()`/`showMapDetail()`/`setMapMode()`. Region drawing + coordinate
  contract are documented in `docs/MAP-ARCHITECTURE.md`.
- **Command palette:** ⌘K/Ctrl-K, fuzzy-ranked, deep-links via hash. Self-contained IIFE at end of app.js.
- **Roster search:** `filtered()` + `scoreMatch()`/`fuzzySubseq()` — fuzzy + ranked; flat "Results" list
  while searching, section-grouped when browsing.
- **Paperwork:** `PAPERWORK_TEMPLATES` + `renderPaperwork()` + the `paperworkWire` IIFE (end of app.js).
- **`EXTRA_CHARACTERS`** (top of app.js): hardcoded bios merged into the roster (incl. Wendover chars).

## Open tasks (priority order, with concrete pointers)
1. **Wire the map to `data/world.json`** (the main task; the map still uses hardcoded pixel pins).
   `data/world.json` has 13 locations with **real lat/long**, 7 regions, `connections` (routes),
   `faction_zones` (control), `event_hooks`, terrain, and `terminal_entry` lore. Plan:
   - **US atlas:** replace `MAP_LOCATIONS` pixel coords by projecting each location's lat/long into the
     650×500 viewBox. Calibrate with 2 known anchors (e.g. LA/Boneyard and Hoover Dam or Las Vegas) to fit a
     linear lon→x, lat→y transform, then map the `fallout_*` locations. Show `terminal_entry.body` in the
     detail panel. Do it behind the existing `renderMap()`/`showMapDetail()` so the UI is unchanged.
   - **Wendover Region/Local:** render the 4 `misfits_*` locations + their `connections` (draw routes) +
     `faction_zones` (control shading/legend) + lore, on top of the existing region schematic.
   - Keep increments bounded; verify each on the live URL (roster-independent, so it's testable).
2. **Grow the paperwork library.** The *system* is done (template picker → fillable fields → live SS14
   paper-code preview → copy). Add templates to `PAPERWORK_TEMPLATES` — each is
   `{ id, category, title, fields:[{key,label,multiline?}], render(v)=>string }` where `render` returns the
   in-game paper markup. Optional: a search box + category filter; letterheads/stamps. Reference form set:
   `…/SS14 Macros/App/Hammerspoon/_archive/paperwork_palette.js` (template data is in the adjacent `.lua`).
3. **Decide `EXTRA_CHARACTERS`.** Bios are hardcoded in app.js today. Decide: keep in code, or move to the
   Sheet/wiki like the rest of the roster (forks the data model — pick one and note it).
4. **Wiki migration (blocked on the user).** Move the Tribe Lore + Roleplay Guide onto the MediaWiki;
   full step-by-step (pandoc / VisualEditor paste, hub + two-card page shape) is in `docs/WIKI-INTEGRATION.md`.
   When those pages exist, flip the tribe's Lore/Roleplay tabs from the Google-Doc source to the wiki pages.

## Recently shipped (so you don't redo it)
Masthead centred-tree, connector overshoot fix (left+width), fullscreen focus polish + CRT power-on,
box-glow, find-bar vector magnifier, dossier folder-tab, fuzzy+ranked roster search, ⌘K palette, the 3-scale
map + Wendover schematic, `data/world.json`, the Paperwork system, and repo guardrails (setup-git.sh + CI).
