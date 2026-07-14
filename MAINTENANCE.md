# MAINTENANCE — how this project is built and how not to break it

The durable, in-repo source of truth for anyone picking this up cold. If an
assistant's working memory is lost, **start here.** Last structural update: 2026-07-02.

---

## What this is

A **Fallout-1 / Pip-Boy themed roster viewer** for SS14 RP factions. The umbrella brand is the
**Misfits Database**, hosting multiple factions (the Tribe, the Brotherhood of Steel, and more);
each faction keeps its own brand (e.g. **"The Tribe Database"**) and a masthead selector switches
between them. Each faction reads a Google Sheet live and renders one dossier per character. Pure
static site:

- **No build step, no framework, no CDN, no dependencies.** Just `index.html` + `styles.css`
  + `app.js` + self-hosted `fonts/`. Open the file, it runs.
- Reads the sheet **read-only** via the gviz CSV endpoint. It never writes to the sheet
  unless an (optional, undeployed) Apps Script `webAppUrl` is configured.
- **LIVE at https://dr-orac.github.io/oracular-db/** — GitHub Pages, repo
  `dr-orac/oracular-db`, serves `main` branch root, redeploys on every push (~1 min).

**Data flow (two sheets — don't confuse them):** the deployed site reads the tribe's
**ORIGINAL sheet** (`10n4T…`, `CONFIG.sheetId`) read-only — the community edits it and
changes appear on the site on next load, no sync involved. **Never write to the
original** (by hand, tool, or script — standing user directive). A private
experimental **working copy** (`1649x…`) exists from the write-back spike; it is
stale, nothing reads it, and it only matters if write-back is ever deployed (see
"Open / future work" — that needs a data-flow decision first).

Design language is documented in **STYLE-GUIDE.md**. Deploy steps in **DEPLOY.md**.
Security posture: **docs/AUDIT-2026-07-02.md** — full audit of every innerHTML sink and
remote-data path, what was fixed, what was deferred and why. Read it before touching
`docClean`, `effectiveSheetId`, or the local-storage save paths, and re-audit
`apps-script.gs` before ever setting `CONFIG.webAppUrl` on the deployed site.

---

## Module map (app.js)

`app.js` is one file, sectioned by banner comments. The major regions, in order:

| Region | What it does |
|---|---|
| `CONFIG` | sheet id, gid, defaultSection, webAppUrl |
| `FACTIONS` | multi-faction config map + `FACTION_ORDER` / `FACTION_ICONS` / `FACTION_WIKI`. `activeFaction()`, `applyFaction()`, `factionAppearance()`, `fkey()`. Only linked factions (non-empty `data.sheetId`) show data; others → a themed "coming soon" |
| `DOCS` | the tribe's configured Google Doc tabs — other factions start with `docs:[]` (see "Doc reader" below) |
| section registry | `UMBRELLA_SECTIONS` owns global section metadata; `factionSections()` combines universal Roster/Relations with a faction's configured docs. These drive validity, continuity, labels, Home/tabs, headings, and command discovery. |
| `EXTRA_CHARACTERS` | code-defined dossiers not in the sheet (visitors etc.), each tagged with its `faction` |
| `FIELDS` / `ID_ORDER` / `BLOCK_ORDER` | the **data contract** (see below) |
| data fetch | `effectiveSheetId()`, `sheetUrl()`, `parseCSV()`, model build; `buildNameIndex()` + `buildConnections()` (the cross-link / mention graph). A newer roster request cancels the previous one, and only its owner may update the screen. |
| render | `render()` (try/caught), `renderRoster()`, `renderCards()`, `dossierHTML()` |
| dossier pieces | portrait, spirit, S.P.E.C.I.A.L, connections, log, shots |
| masthead (2 rows) | row 1 = global section controls / **FACTION box** / cog (`renderPrimaryNav()`, `renderBrand()`, `wireFactionMenu()`); row 2 = this faction's sections (`renderNav()`) |
| section routing | `setSection()` explicitly dispatches Home · Map · Paperwork · Roster · Relations · Wiki · a faction doc. Hash router `applyRoute`/`writeRoute`/`parseRoute`/`openPendingChar`; malformed destinations repair to a canonical hash. |
| relations view | `renderRelations()`, `relationsGraph()`, `relationsPanelHTML()`, `parseRelationshipEntries()` — a character's web from the roster's Relationships field. Shares `state.selected` + the `listboxStep()` keyboard helper with the roster list |
| doc reader | `loadDoc()` → `docClean()` (strict whitelist; strips `<div>`; themes `<img>` as `.docfig`), `styleTOC()`, `buildDocSidebar()` (see below) |
| wiki reader | `loadWiki()` → `normaliseWikiImages()` (keep + absolutise images) → `renderWiki()` (re-skin MediaWiki structure) → `wikiClean()`/`docClean()`; internal links browse in-app. A new page or section aborts the old request, so late responses cannot replace the active reader. |
| delegated events | one document click handler dispatches all in-content buttons |
| theme | `apply*()` setters, persisted in `localStorage` (`mdb-*`, per-faction where relevant). Fonts: `FACES` catalogue, **headings + body picked separately** (`applyFontHead`/`applyFontBody`, `data-font-head`/`data-font-body`); legacy `mdb-font` preset key migrates once via `PRESET_MIGRATE`. Frame modes `data-frame`, `data-contrast="high"` (a11y) |
| edit / upload | optional write-back paths (only active when `webAppUrl` set) |
| boot | RobCo type-on intro, skippable, reduced-motion aware, hard timeout |

Global error nets: `render()` is wrapped in try/catch, and `window.onerror` /
`unhandledrejection` surface an on-screen `toast()` — **nothing fails silently.**

Roster representations share `visibleRosterCharacters()`: ranked search results are narrowed by the section
filter once, then consumed by List rows, Cards, dossier selection, and keyboard navigation. Do not add a
layout-specific filter path. Search relevance owns ordering while a query is active; otherwise Cards applies
`sortChars()`, and List applies the same sort within its section groups. Filter/sort handlers call `render()`
so the currently active List/Cards layout is the one refreshed.

### Section ownership (keep one source of truth)

- Global, faction-agnostic identity lives in `UMBRELLA_SECTIONS`.
- Faction navigation comes from `factionSections(f)`: Roster + Relations + `f.docs`.
- Availability checks use `sectionAvailable()`; labels use `umbrellaSection()` or `factionSection()`.
- `setSection()` remains an explicit renderer/visibility dispatcher. The metadata registry must not become a
  generic rendering framework.
- To add a global surface, add one registry entry, then its explicit `setSection()` branch/visibility,
  `NAV_ICONS` entry if needed, markup in `index.html`, and a `#primary-nav` button. Home/faction continuity,
  route validation, headings, and command-palette discovery should require no extra label or validity edits.
- To add a faction document, add it to that faction's `docs` configuration. Tabs, Home cards, validation,
  headings, and command discovery derive from that entry. Use a distinct id unless same-id documents are
  intentionally equivalent destinations across factions.

---

## The data contract (what the sheet must provide)

The app maps **sheet columns → fields by fuzzy header matching** (`FIELDS[x].match` is a list
of case-insensitive substrings). This is deliberately rot-resistant: columns can be reordered
or lightly renamed and still match. Key fields (see `FIELDS` for the full list + aliases):

- Identity (top grid): `usename`, `honorific`, `truename`, `birth`, `address`, `species`,
  `discord` (shown as "Player").
- Narrative blocks: `appearance`, `spirit`, `relationships`, `plot`, `notes`, `tastes`,
  `activities`.
- Extras: `role`, `special` (7 S.P.E.C.I.A.L numbers), `tags`, `icon`, `image`/`imageside`.
- Section grouping comes from the sheet's own section rows; ordering via `sortChars()`
  (rank → chiefs, shamans, then sheet order).

**If a character stops rendering a field:** check the sheet header still contains one of the
`match` substrings for that field. Add a new alias to the `match` array rather than renaming
the sheet.

---

## Doc reader (faction tabs that embed Google Docs)

The faction nav (`#topnav`) has **Roster**, **Relations**, and one tab per configured document
(`{ id, label, docId }` in a faction's `docs`). Clicking a doc tab opens `#docview` and
renders the Google Doc **natively in the terminal theme** — not an iframe.

How it works:
- `loadDoc()` fetches `https://docs.google.com/document/d/<docId>/export?format=html`. That
  endpoint is **CORS-readable** for a link-shared doc (returns `type:"cors"`), so the content
  is fetchable client-side — no backend, no iframe.
- **Performance model** (the export inlines images as base64 — measured ~99% of the bytes;
  the text is <100KB): `prepareDoc()` caches the parsed+cleaned doc in memory AND
  **IndexedDB** (`mdb-docdb`), so the multi-MB download happens once per device; later
  opens are local with a background re-fetch when >15 min stale. Base64 images are
  **stripped into a side-table** and lazily hydrated as they scroll near
  (`hydrateDocImages` — IntersectionObserver primary + a rect-check pass on render/scroll,
  because IO/rAF are suspended in hidden tabs). Pending frames show a "RECEIVING IMAGE"
  skeleton. Concurrent hover/click requests for the same document share one cold read, and
  stale-cache refreshes are similarly coalesced. Each document fetch owns its image list, so
  concurrent document work cannot cross-wire lazy image data. Tab hover/focus prefetches that
  doc (`prefetchDoc`); there is deliberately no blanket prefetch (mobile bandwidth).
- `docClean()` rebuilds the doc from a **strict element whitelist**, dropping all of Google's
  inline styles/classes (so our CSS themes it) — this is also the sanitiser (no scripts/styles
  can pass). It preserves heading `id`s (for the TOC), converts `<span>` weight/italic to
  `<strong>`/`<em>`, wraps `"…"` runs in `.dq`, turns `> ` paragraphs into `.docquote`
  pull-quotes, allows `data:image/` srcs (Docs embeds diagrams as base64 PNGs), and wraps
  tables for horizontal scroll.
- `styleTOC()` runs after render: tags each Table-of-Contents entry (`p > a.docanchor`) with
  its target heading's level (`toc-l1..4`) for indent + size.
- `buildDocSidebar()` builds the wide-screen outline sidebar (`#doctoc`) from the doc's H1/H2
  (caches them in `docHeads`); `trackDocSection()` (one rAF-throttled `#docscroll` scroll
  handler, shared with back-to-top) updates the sticky "current section" breadcrumb (`#docnow`)
  and the sidebar's active highlight. Sidebar + breadcrumb are wide-screen-only.
- `setSection()` switches between home · roster · relations · wiki · a faction doc (see the module
  map); `render()` is guarded by `currentSection` so a refresh never clobbers the open doc/wiki.
  Section-specific chrome hides via `body[data-section]`.

**Fragility / future-proofing:** the reader depends on Google's `export?format=html` output
shape — heading `id="h.…"` anchors (TOC jumps), `<span style="font-weight/font-style">` for
bold/italic, base64 `data:` PNGs for images. If Google changes the export format and the doc
renders wrong, that's where to look (`docClean`). The whole thing degrades gracefully: a fetch
failure shows the "share the doc / open in Docs" fallback, so a format break can't white-screen
the app — at worst a doc tab looks off and the roster is unaffected.

**Requirements / gotchas:**
- A doc tab only renders once the doc is shared **Anyone-with-link → Viewer** (same as the
  sheet). Until then `loadDoc()` shows a graceful "share the doc" message.
- **Images/diagrams:** Google Docs rasterises *everything* to PNG on export (no SVG survives a
  Doc), at the image's original uploaded resolution regardless of how it's resized on the page
  — this is why oversized source images bloat the export (see the performance model above).
  `.docfig` renders each image as a terminal "screen": a phosphor bezel + corner reticle ticks
  + a subtle scanline overlay (fades on hover), full colour, with the image's alt text (if set)
  shown as a mono caption underneath.
- **Authoring conventions:** start a paragraph with `> ` for a pull-quote; inline `"…"` is
  auto-emphasised; Title/Subtitle paragraph styles become the masthead. To add a doc: append
  to `DOCS` and share the doc. Full authoring guidance for non-technical editors (image sizing,
  headings, pull-quotes) is in **[docs/DOC-AUTHORING.md](docs/DOC-AUTHORING.md)**.

---

## Chassis frame — an isolated, removable module

The **metal chassis** (the "Chassis" frame option: flat pixel-art olive panels with hard
stepped bevels + pixel bolts, physical nav buttons with indicator lamps, and the FACTION
selector as a phosphor readout recessed into the metal) is a **fully opt-in, self-contained
module**. The default **"Screen only"** mode never touches a line of it. It was built to
be lifted out cleanly if the metal direction doesn't earn its keep — leaving just the
plain phosphor screen, exactly as it is by default.

**Why it's safe to remove:** every part is scoped to `body[data-frame="border"]` (or
`[data-frametint=…]`) in CSS, and gated behind the frame toggle in JS. Nothing in the
screen-only path reads it. Removing it is deletion only — no rewrites.

**The two-surface rule it serves:** SCREEN = phosphor/glow (green); METAL = physical
housing (bevel/rivets/engraving, no glow). **Gothic 821 is the metal signage face and
lives *only* here** — it is never a screen/doc font (the doc pickers exclude it by
design; see the `DOC_HEAD_FACES` comment in app.js). If you remove the chassis, Gothic
821 has no remaining user — drop its `@font-face` + the `FACES.gothic` catalogue entry too.

**Removal recipe** (grep `@chassis-module` and `[data-frame=` to see every piece):

- **styles.css** — (1) delete the whole `CHASSIS MODULE — BEGIN … END` banner block (all
  the contiguous `body[data-frame="border"]` rules); (2) delete the two out-of-band
  `@chassis-module`-tagged bits: the metal `--panel-*/--rivet-*/--frame/--bezel/--metal-*`
  vars in `:root`, and the `body[data-frame="border"] .brand small{display:none}` line in
  the ≤760px media query.
- **app.js** — delete `applyFrame()` and `applyFrameTint()`; in `buildSettings()` delete the
  `#frame-swatches` + `#frametint-swatches` innerHTML/click wiring; in `refreshCur()` delete
  the `#cur-frame` line; in the reset handler drop `"mdb-frame"`/`"mdb-frametint"` from the
  key list and the `applyFrame("screen"); applyFrameTint("olive");` calls; in `init()` remove
  the two `applyFrame(…)/applyFrameTint(…)` calls.
- **index.html** — delete the `Frame` `<details class="popgrp">` group in the Theme popover
  (the `#cur-frame` summary + `#frame-swatches` + `#frametint-swatches`). The `.masthead`
  wrapper div is inert in screen mode — leave it or unwrap it, your call.

After removal, run `python3 tools/selfcheck.py` — a clean pass confirms no orphaned
element-id or CSS-var references remain. The screen-only view is byte-for-byte unchanged.

---

## Invariants — do not break these

1. **Read-only, absolutely.** `CONFIG.sheetId` points at the tribe's original
   source-of-truth sheet, which must NEVER be written to — not by the app, not by
   Apps Script (`syncToMirror` must never target it), not by hand. The app only reads.
   Don't repoint it at the private working copy either (not world-readable; the site
   would show "could not reach the sheet").
2. **Legibility floor.** Min text size 17px for prose/labels (short uppercase chip labels
   like tags are an allowed ~15px exception). `--fg-dim` is the darkest any *text* may be
   (AA-contrast); `--fg-faint` is borders only, never text. No glow on small text.
3. **Self-host everything.** No CDN. New fonts go in `fonts/` as `woff2` with an `@font-face`.
4. **Soft edges for content, crisp for chrome** (see STYLE-GUIDE.md §3). Don't feather grids,
   modals, or form controls.
5. **Tokens first.** New colors should be `var(--..)`, not fresh hex. `selfcheck.py` warns on
   drift.
6. **Run `selfcheck.py` before every deploy/commit** (a git pre-commit hook does this; see
   below).

---

## Preview workflow (isolated, repeatable)

The preview is served from `/tmp/yuma-live` by `/tmp/yuma-serve.py` (a static server on port
4173). **Other projects on the same machine share `/tmp` and periodically wipe both** — so the
whole preview is rebuildable in one command:

```bash
python3 tools/preview.py            # rebuilds serve.py + /tmp/yuma-live from source
# then (re)start the 'yuma-roster' preview server and open  /  (no query needed)
```

**Why it just works:** `preview.py` injects `window.MDB_SHEET_OVERRIDE="<mirror id>"` into
the **served** `index.html` only (the `/tmp` copy — the source is never touched), and
`effectiveSheetId()` honors it. So the preview reads the mirror at **any** URL, including a
bare reload. Precedence in `effectiveSheetId()`: `window.MDB_SHEET_OVERRIDE` →
(**localhost only:** `?sheet=<id>` URL param → `localStorage.mdb-sheet-override`) →
`CONFIG.sheetId`. The localhost gate is a security measure — on the deployed site a crafted
`?sheet=` link would render an arbitrary spreadsheet under our URL (see the audit doc); in
production only `CONFIG.sheetId` applies. (Historically we hand-edited the sheet id on every
sync and clobbered the preview; that footgun is gone.)

The server sends `Cache-Control: no-store` (no stale assets) and routes any foreign path back
to our `index.html` (no neighbour-demo leakage).

---

## Self-check (the missing compiler)

```bash
python3 tools/selfcheck.py     # exit 0 = clean, 1 = errors
```

Catches the rot a no-build app can't catch otherwise:
- an element id referenced in `app.js` that no element defines (renamed-but-not-updated)
- a `var(--token)` with no definition
- a missing `@font-face` / `fonts/` / `media/` file
- `app.js` truncated or brace-unbalanced (uses `node --check` if node is present, else a
  regex-aware heuristic warning)
- index.html no longer loading styles.css / app.js

Stdlib Python only. No node required (but used if available).

---

## Version control & the pre-commit guard

This project is a local git repo (the single biggest anti-rot measure: history + undo + diff).
A **pre-commit hook** runs `selfcheck.py` and blocks a commit that fails — so a broken state
can't be snapshotted. Bypass in a genuine emergency with `git commit --no-verify`.

`.gitignore` excludes OS cruft and local-only artifacts. The private working-copy **sheet id
in `CONFIG.sheetId` is not a secret** (the sheet is shared "anyone with link → viewer"), so it
is committed; nothing sensitive lives in the repo.

---

## Known entropy sources → their safeguard

| Entropy source | Safeguard |
|---|---|
| `/tmp/yuma-live` + `/tmp/yuma-serve.py` wiped by neighbours | `tools/preview.py` rebuilds both idempotently |
| Hand-editing sheet id on every sync (clobbered preview) | `?sheet=` URL override — source never edited |
| Renamed element id / undefined token / missing asset | `tools/selfcheck.py` + pre-commit hook |
| No history / no undo | local git repo + initial snapshot |
| Knowledge lost between sessions / contributors | this file (in repo, in git) |
| Shared `/tmp` + run config clobbered by neighbouring projects | `tools/preview.py` rebuilds the server + live dir idempotently; work in this subfolder as its own project to isolate |
| Design drift from the system | STYLE-GUIDE.md + selfcheck token-drift warning |
| Cross-surface UI regressions and duplicated local fixes | `docs/UI-UX-AUDIT.md` representative journey matrix + cause-based tasks |

---

## Settled decisions (don't re-litigate without new input)

- **Write-back stays OFF.** `CONFIG.webAppUrl=""`; uploads/edits/logs persist per-browser
  only, which is safe and is the intended default. Enabling it is NOT a code task — it
  needs a human decision about the community's data, because the script binds to the
  private working copy while the site reads the ORIGINAL sheet, so deployed as-is edits
  would never appear. The only two coherent ways to turn it on, either of which the
  tribe must choose deliberately: (a) the group blesses writes into the original sheet
  (revokes the read-only directive — their sheet, their call), script binds there; or
  (b) the site switches to reading a disposable copy that the working copy syncs to
  (`syncToMirror` exists, dormant, disarmed, for exactly this). The script itself is
  audited + hardened (fail-closed passphrase, size caps, rate limit, lock — see
  docs/AUDIT-2026-07-02.md); don't revert it. **Decision: leave off until the tribe asks.**
- **Ultra-wide dossier stays single-column.** A 2-column narrative on very wide screens
  was considered and declined: the width cap (`.dossier > *{max-width:1080px}`) already
  makes the layout read as intentional, and 2-col would risk the tuned prose measure /
  reading flow and the lead-lists' own internal columns for marginal gain above ~1600px.
  Revisit only if a user specifically wants the void filled.

## Open / future work

**The active engineering backlog lives in [TASKS.md](TASKS.md)** — specced tasks with
ground rules and acceptance criteria; work from there. Items below need a *human*
decision or asset first and are parked, not specced:

- **Scratchy's portrait**: a code-defined character with no image yet — drop a file in
  `media/` and add it to the `MEDIA` map in app.js.
- **Astro port** (sibling `../Yuma Roster - Astro POC/`): only if first-class Discord
  link-unfurl embeds become a priority. Parked.
- *(Done 2026-07-02: deploy to GitHub Pages, security audit, backend hardening, Theme
  font-picker rebuild, widescreen dossier cap, and the Discord per-character cards +
  OG-card rebrand — all live.)*
