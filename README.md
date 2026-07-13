# Misfits Database (formerly the Yuma Tribe Roster / "The Tribe Database")

> **Picking up the work?** Start with **[`docs/HANDOFF-NEXT.md`](docs/HANDOFF-NEXT.md)** — the canonical
> handoff (working protocol, how to run/verify/ship, hard rules, architecture map, open tasks + decisions).

A Fallout-style ("Pip-Boy" terminal) web viewer for SS14 RP factions. The **Misfits Database**
is the umbrella: it hosts the factions from the Misfits wiki's own faction listing (the Tribe,
Brotherhood of Steel, NCR, Caesar's Legion, the Enclave, and more), each a config *skin* with its
own brand, colour, fonts, sheet and docs — a masthead selector switches between them. Each faction
reads a Google Sheet **live and read-only** and renders each character as a CRT dossier, with
optional write-back (uploads / edits) via a Google Apps Script. Beyond rosters it also renders
**Google Docs lore** and the **Misfits wiki** itself in the terminal theme (a `#wiki/<Page>`
reader that re-skins the wiki's own layout). (The source folder is still named `Yuma Tribe Roster`
for history.)

No framework, no build step — three static files plus assets.

**Live:** https://dr-orac.github.io/oracular-db/ (GitHub Pages, repo `dr-orac/oracular-db`,
deploys automatically on push to `main`).

> **New here? Read in this order:** this README → the newest `docs/HANDOFF-*.md` (current state +
> the sandbox gotchas) → `MAINTENANCE.md` (internals + invariants) → `CONTRIBUTING.md` (house rules).
> The live backlog is `TASKS.md`. To add a faction/character/doc, see CONTRIBUTING's "Adding things"
> — most additions are one config entry. **Hard rules:** never write to the tribe's source sheet; no
> AI-generated signals in the repo; one task = one commit; `python3 tools/selfcheck.py` must be clean.

---

## How it works (30-second version)

1. The browser fetches the sheet as CSV from Google's `gviz` endpoint
   (works for any sheet shared *"Anyone with the link → Viewer"*; no API key).
2. `app.js` parses the CSV, merges in code-defined extras, and renders the UI.
3. Theme/font/size/frame choices are CSS custom properties persisted in `localStorage`.
4. Optional **write-back** (photo uploads, log entries, field edits) POSTs to a deployed
   Apps Script web app, which writes to the sheet. The static page never holds credentials.

To go live, follow **[DEPLOY.md](DEPLOY.md)**.

## Layout

```
index.html        markup shell + the Theme popover + all modals
styles.css        everything visual (theme vars, CRT, frame modes, typography)
app.js            all logic — see the MODULE MAP banner at the top of the file
apps-script.gs    the write-back web app (pasted into Google, NOT hosted here)

favicon.svg       tab icon (pixel-Y monogram)
og-card.png       Discord/social link-preview card (1200×630)

fonts/            self-hosted woff2/ttf — Fallout, Fixedsys, VT323, IBM Plex Mono, …
media/            code-defined character portraits (referenced by MEDIA in app.js)
c/                per-character Open-Graph stubs for rich Discord embeds (generated)
tools/            dev scripts — selfcheck.py (integrity linter), preview.py (rebuild
                  the local preview), regenerate c/ stubs / OG card / roster dump,
                  git-hooks/ (pre-commit guard)
docs/             design + planning docs. START with the newest HANDOFF-*.md (current state +
                  gotchas); then ACCESSIBILITY-PLAN, WIKI-INTEGRATION, MASTER-SHEET-PLAN,
                  DESIGN-RELATIONSHIPS, AUDIT-2026-07-02 (security), the CRT theme guide

CONTRIBUTING.md   house rules — self-review, anti-entropy, run selfcheck, conventions
MAINTENANCE.md    how it's built + how not to break it (read this first when resuming)
STYLE-GUIDE.md    the portable phosphor-terminal design system
DEPLOY.md         go-live steps (host static + optional Apps Script write-back)
```

## Where things live in `app.js`

The file opens with a **MODULE MAP** comment listing its sections. Search for these
banners to jump around:

- `CONFIG / EXTRA_CHARACTERS / MEDIA` — data sources (sheet id, code-defined characters/portraits)
- `themes` — colour / background / font presets + the `apply*()` setters
- `CRT icon library` — inline SVG spirit sigils + the spirit-text → icon matcher
- `data fetch / parseCSV / buildModel` — load and normalise the sheet
- `rendering` — dossier, portrait, cards, roster, search highlight, empty state
- `Relations view` — `renderRelations` builds a character's relationship web from the roster's
  Relationships field (rail + panel; a per-faction `relations` section, no extra data source)
- `section nav / doc reader` — `DOCS` tabs that fetch + re-theme Google Docs (`docClean`/`styleTOC`)
- `WIKI reader` — `loadWiki`/`renderWiki` fetch a MediaWiki page (CORS parse API) and re-skin its
  own layout (hero / callouts / faction card grid / tables) as native components (`#wiki/<Page>`);
  `normaliseWikiImages` keeps + themes any images the page carries
- `photo upload` / `personal log` / `screenshots` — the write-back UIs
- `events / keyboard / load / init` — wiring and startup

## Key config (top of `app.js`)

- `CONFIG.sheetId` — the tribe's **original sheet** (their source of truth, shared
  anyone-with-link → Viewer). The site reads it live; community edits appear on next
  load. **Never write to it** by any means. Don't edit this id to preview against
  another sheet — pass `?sheet=<id>` in the URL instead (`effectiveSheetId()` honours
  it on **localhost only**; in production it's ignored so a crafted link can't render
  a foreign sheet under our URL).
- `CONFIG.webAppUrl` — paste the deployed Apps Script `/exec` URL here to enable
  write-back. Empty = read-only (uploads/edits persist only in the local browser).
- `DOCS` — array of `{ id, label, docId }`; each adds a top-nav tab that fetches a Google Doc
  and re-renders it in-theme. Each doc must be shared *Anyone with the link → Viewer*. In the
  Doc, start a paragraph with `> ` for a pull-quote. (See MAINTENANCE.md → "Doc reader".)

## Regenerating assets

```bash
python3 tools/make-og-card.py                          # rebuild og-card.png
python3 tools/make-og-stubs.py --base-url "https://…/" # rebuild c/ Discord stubs
# refresh tools/roster-dump.json first via tools/dump-roster.js (console snippet)
```

## Before you deploy or commit

```bash
# Once after a fresh clone: activate the repository's pre-commit check
./tools/setup-git.sh

python3 tools/selfcheck.py      # integrity linter: dangling element ids, undefined CSS
                                # vars, missing fonts/media, truncated JS, dead CSS classes
python3 tools/preview.py        # rebuild the local preview in /tmp (then open ?sheet=…)
```

`setup-git.sh` makes `selfcheck.py` a local git **pre-commit hook** (it blocks a broken
commit; `--no-verify` to override). GitHub also runs the same check on every push and pull
request. Full maintenance notes live in **MAINTENANCE.md**.

## Conventions worth knowing

- **Legibility floor:** any real text uses at least `--fg-dim` (≈4.6:1 contrast).
  `--fg-faint` is for borders/box-shadows only, never type.
- **Frame modes** are driven by `body[data-frame]` (`screen` default, `border` experimental);
  text size by `body[data-textsize]`; fonts by `body[data-font-head]` + `body[data-font-body]`
  (headings and body faces are picked separately in the Theme popover — see `FACES` in app.js).
- Reads never write. All mutations go through `CONFIG.webAppUrl`.
