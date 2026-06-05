# Yuma Tribe Roster

A Fallout-style ("Pip-Boy" terminal) web viewer for an RP character roster. It reads a
Google Sheet **live and read-only** and renders each character as a CRT dossier, with
optional write-back (uploads / edits) via a Google Apps Script.

No framework, no build step — three static files plus assets.

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
docs/             project-agnostic reference: CRT theme guide + portable crt-theme.css

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
- `photo upload` / `personal log` / `screenshots` — the write-back UIs
- `events / keyboard / load / init` — wiring and startup

## Key config (top of `app.js`)

- `CONFIG.sheetId` — the **working-copy** sheet (private). Don't repoint this at the
  original source-of-truth sheet. For previewing against a public mirror, **don't edit this** —
  pass `?sheet=<id>` in the URL (or set `localStorage.yuma-sheet-override`); `effectiveSheetId()`
  uses it as an override so the source file is never touched.
- `CONFIG.webAppUrl` — paste the deployed Apps Script `/exec` URL here to enable
  write-back. Empty = read-only (uploads/edits persist only in the local browser).

## Regenerating assets

```bash
python3 tools/make-og-card.py                          # rebuild og-card.png
python3 tools/make-og-stubs.py --base-url "https://…/" # rebuild c/ Discord stubs
# refresh tools/roster-dump.json first via tools/dump-roster.js (console snippet)
```

## Before you deploy or commit

```bash
python3 tools/selfcheck.py      # integrity linter: dangling element ids, undefined CSS
                                # vars, missing fonts/media, truncated JS, dead CSS classes
python3 tools/preview.py        # rebuild the local preview in /tmp (then open ?sheet=…)
```

`selfcheck.py` also runs automatically as a git **pre-commit hook** (it blocks a broken
commit; `--no-verify` to override). Full maintenance notes live in **MAINTENANCE.md**.

## Conventions worth knowing

- **Legibility floor:** any real text uses at least `--green-dim` (≈4.6:1 contrast).
  `--green-faint` is for borders/box-shadows only, never type.
- **Frame modes** are driven by `body[data-frame]` (`screen` default, `border` experimental);
  text size by `body[data-textsize]`; font by `body[data-font]`.
- Reads never write. All mutations go through `CONFIG.webAppUrl`.
