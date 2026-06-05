# MAINTENANCE — how this project is built and how not to break it

The durable, in-repo source of truth for anyone (human or AI) picking this up cold. If an
assistant's working memory is lost, **start here.** Last structural update: 2026-06-05.

---

## What this is

A **Fallout-1 / Pip-Boy themed roster viewer** for an SS14 RP tribe. It reads a Google Sheet
live and renders one dossier per character. Pure static site:

- **No build step, no framework, no CDN, no dependencies.** Just `index.html` + `styles.css`
  + `app.js` + self-hosted `fonts/`. Open the file, it runs.
- Reads the sheet **read-only** via the gviz CSV endpoint. It never writes to the sheet
  unless an (optional, undeployed) Apps Script `webAppUrl` is configured.
- Deploys to any static host (GitHub Pages / Netlify).

Design language is documented in **STYLE-GUIDE.md**. Deploy steps in **DEPLOY.md**.

---

## Module map (app.js)

`app.js` is one file, sectioned by banner comments. The major regions, in order:

| Region | What it does |
|---|---|
| `CONFIG` | sheet id, gid, defaultSection, webAppUrl |
| `EXTRA_CHARACTERS` | code-defined dossiers not in the sheet (visitors etc.) |
| `FIELDS` / `ID_ORDER` / `BLOCK_ORDER` | the **data contract** (see below) |
| data fetch | `effectiveSheetId()`, `sheetUrl()`, `parseCSV()`, model build |
| render | `render()` (try/caught), `renderRoster()`, `renderCards()`, `dossierHTML()` |
| dossier pieces | portrait, spirit, S.P.E.C.I.A.L, connections, log, shots |
| delegated events | one document click handler dispatches all in-content buttons |
| theme | `apply*()` setters, persisted in `localStorage` (`yuma-*`), Theme popover |
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

## Invariants — do not break these

1. **Read-only by default.** Never point `CONFIG.sheetId` at the original source-of-truth for
   editing. The app reads; it does not write (unless `webAppUrl` is set, which is opt-in).
2. **Legibility floor.** Min text size 17px. `--green-dim` is the darkest any *text* may be
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

The preview is served from `/tmp/yuma-live` by `/tmp/yuma-serve.py` (port 4173, named
`yuma-roster` in `.claude/launch.json`). **Neighbouring projects share `/tmp` and periodically
wipe both** — so the whole preview is rebuildable in one command:

```bash
python3 tools/preview.py            # rebuilds serve.py + /tmp/yuma-live from source
# then (re)start the 'yuma-roster' preview server, and open:
#   /index.html?sheet=10n4TFnuMWekZLD3pucKS050h1cNItcYmL9v0ciuBsSY
```

**Why the `?sheet=` param:** the live working-copy sheet is private; the preview uses a public
**mirror** sheet. `app.js` reads a `?sheet=<id>` URL param (or `localStorage.yuma-sheet-override`)
as an override of `CONFIG.sheetId` — see `effectiveSheetId()`. This means **the source file is
never edited for preview.** (Historically we hand-edited the sheet id on every sync and
clobbered the preview repeatedly; that footgun is now gone.)

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
| Knowledge lost on AI memory reset | this file (in repo, in git) |
| Shared parent `.claude/launch.json` clobbered by neighbours | this subfolder has its own `.claude/launch.json` (yuma-roster only); open the subfolder as its own window to fully isolate |
| Design drift from the system | STYLE-GUIDE.md + selfcheck token-drift warning |

---

## Open / future work (needs a human)

- **Deploy** (DEPLOY.md): share the sheet, host on Pages/Netlify, optionally paste the Apps
  Script `/exec` URL into `CONFIG.webAppUrl` to enable upload + write-back.
- **Scratchy's portrait**: a code-defined character with no image yet — drop a file in `media/`.
- **Astro port** (sibling `../Yuma Roster - Astro POC/`): only if first-class Discord
  link-unfurl embeds become a priority. Parked.
