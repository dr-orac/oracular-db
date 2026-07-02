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
  exception). `--green-dim` is the darkest any *text* may be; `--green-faint` is borders only;
  no glow on small text.
- **Self-host assets.** New fonts go in `fonts/` as woff2 + an `@font-face`; no CDN. Only ship
  fonts you're licensed to embed and redistribute (`selfcheck.py` flags orphan font files).
- **Tokens over literals.** Prefer `var(--..)` so a theme change propagates.

## Preview

The preview is an isolated static server on port 4173 serving a copy of the app from `/tmp`.
`python3 tools/preview.py` rebuilds it from source (and recovers it if a neighbouring project
on the same machine wipes it); then open `/`. Reload the page after edits.
