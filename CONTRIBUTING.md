# Contributing — house rules

How we keep this project correct, legible, and resistant to rot. Architecture and invariants
are in **MAINTENANCE.md**; the design system is in **STYLE-GUIDE.md**.

## Working principles

1. **Review your own change before you commit it.** Verify rather than assume — run it, read
   back the result, check the preview. Name the weakest part of the change and fix or flag it.
   Depth scales with stakes, but never skip the glance.
2. **Leave it better than you found it.** Every change should remove a little cruft, not just
   add features: delete dead code and stale docs, keep one source of truth for repeated values
   (a token/constant, not a hardcoded duplicate), and prefer small, reversible diffs.
3. **Only net-positive changes.** Skip low- or negative-value churn (e.g. tokenizing a
   used-once value, or splitting files with no build step). Know when to stop.
4. **No silent caps.** If a change bounds something (skips a case, samples, truncates), say so
   in the commit/PR — don't let it read as "done" when it isn't.

## Before you commit

```bash
python3 tools/selfcheck.py     # integrity linter: element ids, CSS vars, fonts/media,
                               # JS structure, dead CSS classes, orphan fonts, token drift
python3 tools/preview.py       # rebuild the local preview, then open /
```

`selfcheck.py` runs automatically as a **pre-commit hook** and blocks a commit that fails
(`--no-verify` to override in an emergency). Let the linter do mechanical checks — reserve
review effort for design and trade-offs.

## Project conventions

- **Data is read-only.** `CONFIG.sheetId` points at the tribe's original source-of-truth
  sheet — the site reads it and nothing may ever write to it. Don't repoint the id.
  For previewing, don't edit the source — `preview.py` injects an override (localhost only).
- **Legibility floor 17px** for prose/labels (short uppercase chips ~15px are an allowed
  exception). `--fg-dim` is the darkest any *text* may be; `--fg-faint` is borders only;
  no glow on small text.
- **Self-host assets.** New fonts go in `fonts/` as woff2 + an `@font-face`; no CDN. Only ship
  fonts you're licensed to embed and redistribute (`selfcheck.py` flags orphan font files).
- **Tokens over literals.** Prefer `var(--..)` so a theme change propagates.
- **Commits.** One logical change per commit; imperative subject line + a body that says
  *why*. No trailers or attributions — just the change and its reason.

## Adding things

Most additions are one config entry — the app wires the rest.

- **A character.** Normally: add a row to the tribe's Google Sheet (columns match by fuzzy
  header substring; a row with a single filled cell is a section divider). For a
  character that isn't in the sheet (a visitor / NPC), append to `EXTRA_CHARACTERS` in
  `app.js`: `{ name, section, fields:{ usename, honorific, role, species, appearance, … } }`.
- **A doc tab.** Append to `DOCS` in `app.js`: `{ id, label, docId }` — `docId` is the long
  string in the Google Doc URL; share the doc *"anyone with the link → Viewer"*. The tab
  appears automatically. Give it a Fallout glyph by adding an entry to `NAV_ICONS` keyed by
  the tab `id` (else it gets the default document icon).
- **Linking a faction.** The `FACTIONS` map in `app.js` already lists the server's factions,
  each with its signature `theme` colour. A faction whose `data.sheetId` is `""` is *not linked
  yet* — the switcher re-skins the app in its colour and shows a "roster not linked yet"
  placeholder. To bring one online, fill in its entry:
  - `data.sheetId` — **your** Google Sheet (same column layout as the tribe's, shared
    *"anyone with the link → Viewer"*); `data.gid` `""` = the first tab;
  - `docs` — that faction's doc tabs, `[{ id, label, docId }, …]` (starts `[]` = no doc tabs).
- **A brand-new faction.** Add another entry to `FACTIONS` (unique id) with `name` (switcher
  label), `brand` + `tagline` (masthead title), `theme` — a `{ color, bg }` pair of keys from the
  palette (any key in `THEMES` / `BGS`), `font` — a `{ head, body }` pair of `FACES` keys, and
  `data`/`docs` as above. Then:
  - add the id to **`FACTION_ORDER`** (its position in the dropdown + home grid);
  - add a glyph to **`FACTION_ICONS`** keyed by the id (a flat `fill:currentColor` inline SVG,
    `viewBox="0 0 24 24"` — else the picker/home cell shows no icon);
  - optionally add its wiki page to **`FACTION_WIKI`** (so the coming-soon screen links to it).

  With two or more factions the masthead title becomes a dropdown; selecting your faction re-skins
  the whole app and loads its roster. No other code.

## Preview

The preview is an isolated static server on port 4173 serving a copy of the app from `/tmp`.
`python3 tools/preview.py` rebuilds it from source (and recovers it if a neighbouring project
on the same machine wipes it); then open `/`. Reload the page after edits.
