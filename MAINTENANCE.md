# MAINTENANCE — how this project is built and how not to break it

The durable, in-repo source of truth for anyone picking this up cold. If an
assistant's working memory is lost, **start here.** Last structural update: 2026-07-02.

---

## What this is

A **Fallout-1 / Pip-Boy themed roster viewer** for an SS14 RP tribe (presents as
**"The Tribe Database"**). It reads a Google Sheet live and renders one dossier per
character. Pure static site:

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
| `DOCS` | top-nav tabs that embed Google Docs (see "Doc reader" below) |
| `EXTRA_CHARACTERS` | code-defined dossiers not in the sheet (visitors etc.) |
| `FIELDS` / `ID_ORDER` / `BLOCK_ORDER` | the **data contract** (see below) |
| data fetch | `effectiveSheetId()`, `sheetUrl()`, `parseCSV()`, model build |
| render | `render()` (try/caught), `renderRoster()`, `renderCards()`, `dossierHTML()` |
| dossier pieces | portrait, spirit, S.P.E.C.I.A.L, connections, log, shots |
| section nav / doc reader | `renderNav()`, `setSection()`, `loadDoc()`, `docClean()`, `styleTOC()` (see below) |
| delegated events | one document click handler dispatches all in-content buttons |
| theme | `apply*()` setters, persisted in `localStorage` (`yuma-*`), Theme popover. Fonts: `FACES` catalogue, **headings + body picked separately** (`applyFontHead`/`applyFontBody`, `data-font-head`/`data-font-body`); legacy `yuma-font` preset key migrates once via `PRESET_MIGRATE` |
| edit / upload | optional write-back paths (only active when `webAppUrl` set) |
| boot | RobCo type-on intro, skippable, reduced-motion aware, hard timeout |

Global error nets: `render()` is wrapped in try/catch, and `window.onerror` /
`unhandledrejection` surface an on-screen `toast()` — **nothing fails silently.**

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

## Doc reader (top-nav tabs that embed Google Docs)

The top nav (`#topnav`) has a **Roster** tab plus one tab per entry in the `DOCS` array
(`{ id, label, docId }` near the top of `app.js`). Clicking a doc tab opens `#docview` and
renders the Google Doc **natively in the terminal theme** — not an iframe.

How it works:
- `loadDoc()` fetches `https://docs.google.com/document/d/<docId>/export?format=html`. That
  endpoint is **CORS-readable** for a link-shared doc (returns `type:"cors"`), so the content
  is fetchable client-side — no backend, no iframe.
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
- `setSection()` toggles roster vs doc; `render()` is guarded by `currentSection` so a refresh
  never clobbers the open doc. Roster-only chrome hides via `body[data-section]`.

**Fragility / future-proofing:** the reader depends on Google's `export?format=html` output
shape — heading `id="h.…"` anchors (TOC jumps), `<span style="font-weight/font-style">` for
bold/italic, base64 `data:` PNGs for images. If Google changes the export format and the doc
renders wrong, that's where to look (`docClean`). The whole thing degrades gracefully: a fetch
failure shows the "share the doc / open in Docs" fallback, so a format break can't white-screen
the app — at worst a doc tab looks off and the roster is unaffected.

**Requirements / gotchas:**
- A doc tab only renders once the doc is shared **Anyone-with-link → Viewer** (same as the
  sheet). Until then `loadDoc()` shows a graceful "share the doc" message.
- **Diagrams:** Google Docs rasterises *everything* to PNG on export (no SVG survives a Doc).
  Diagrams render in `.docfig` on a light "schematic plate" so dark-ink-on-light Docs diagrams
  stay legible on the dark theme. For seamless dark integration, author diagrams transparent-bg
  with light/green strokes (then they can drop the plate).
- **Authoring conventions:** start a paragraph with `> ` for a pull-quote; inline `"…"` is
  auto-emphasised. To add a doc: append to `DOCS` and share the doc.

---

## Invariants — do not break these

1. **Read-only, absolutely.** `CONFIG.sheetId` points at the tribe's original
   source-of-truth sheet, which must NEVER be written to — not by the app, not by
   Apps Script (`syncToMirror` must never target it), not by hand. The app only reads.
   Don't repoint it at the private working copy either (not world-readable; the site
   would show "could not reach the sheet").
2. **Legibility floor.** Min text size 17px for prose/labels (short uppercase chip labels
   like tags are an allowed ~15px exception). `--green-dim` is the darkest any *text* may be
   (AA-contrast); `--green-faint` is borders only, never text. No glow on small text.
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

**Why it just works:** `preview.py` injects `window.YUMA_SHEET_OVERRIDE="<mirror id>"` into
the **served** `index.html` only (the `/tmp` copy — the source is never touched), and
`effectiveSheetId()` honors it. So the preview reads the mirror at **any** URL, including a
bare reload. Precedence in `effectiveSheetId()`: `window.YUMA_SHEET_OVERRIDE` →
(**localhost only:** `?sheet=<id>` URL param → `localStorage.yuma-sheet-override`) →
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

## Open / future work (needs a human)

- **Scratchy's portrait**: a code-defined character with no image yet — drop a file in
  `media/` and add it to the `MEDIA` map in app.js.
- **Astro port** (sibling `../Yuma Roster - Astro POC/`): only if first-class Discord
  link-unfurl embeds become a priority. Parked.
- *(Done 2026-07-02: deploy to GitHub Pages, security audit, backend hardening, Theme
  font-picker rebuild, widescreen dossier cap, and the Discord per-character cards +
  OG-card rebrand — all live.)*
