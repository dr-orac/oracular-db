# T28 · Relationship view — design pass (2026-07-11)

Design-first assessment (like `CRT-COMPARISON.md` / the T15 NV-pen assessment). **No data is
written; nothing is wired to a sheet yet.** This picks the *presentation* before building, per the
roadmap's T28 gate. A themed prototype of the recommended option shipped alongside this doc (see the
screenshots in the handoff / the commit that added this file).

## The data

Sheet B (`1oJUOBuiDdjCo62ko39LWtqBtyt81ZLLgpE1iFIkltF0`, gid 879658166) is a **relationship matrix**,
not a roster: characters related to characters, tagged by relationship **type** — the known set from
the earlier audit is *Acquaintance / Friend / Crush / Family / Rival / Hatred* (there may be more).

⚠ The exact sheet **layout is not yet confirmed** (the dev sandbox can't reach Google's gviz endpoint
to read it). Two plausible shapes, and the parser differs:
- **Long / per-row edges** — one row per relationship: `From | To | Type | (Note?)`. Easiest to parse,
  scales, supports notes. **Hope it's this.**
- **Wide / true N×N grid** — characters down the first column AND across the header row, each cell a
  type. Compact to eyeball but sparse, and 55×55 is unwieldy; we'd read it into the same edge list.
Either way we normalise to a list of edges `{from, to, type, note?}` and render from that. **Before
building, grab a 5–10 row sample of Sheet B** (paste, or read it on the live site) to lock the parser.
Relationships may be directed (A's *crush* on B isn't mutual) — keep an edge's direction.

## Constraints that shape the choice

- **Terminal phosphor theme is monochrome** (one `--fg` per theme, two-surface law) → we can't lean on
  colour to separate the 6 types. Differentiate by **label + glyph + weight/emphasis** instead.
- **Scale + sparsity** — the Tribe roster is ~55 characters; a full N×N grid is 3,025 cells, almost all
  empty. A birds-eye matrix doesn't scale and reads as mostly-blank.
- **Mobile** — must work at 375px. A wide matrix can't.
- **Reuse, don't fork** — characters already have slugs, a roster rail, dossiers, and hash routing
  (`#<faction>/roster/<slug>`). Relationships should *link into* that, not duplicate it.

## Options

### A · Full matrix grid (characters × characters)
Rows and columns are characters; each cell shows the relationship glyph.
- ➕ True "matrix"; shows the whole web at once; good for spotting clusters/hubs.
- ➖ Doesn't scale (55² mostly-empty cells); unreadable + unusable on mobile; monochrome makes 6 cell
  types hard to distinguish at a glance; heavy to render.
- Verdict: **only viable as a compact *overview* for a small faction** (≤~12 characters), never the
  primary view. Nice-to-have secondary at most.

### B · Per-character relationship dossier  ← RECOMMENDED
Pick a character (same rail as the roster) → see **their** relationships grouped by type, each a chip
that links to that character's dossier. Reads like a "Connections" page in the character's file.
- ➕ Scales to any roster size; naturally mobile (a stacked list); fits the existing dossier metaphor;
  reuses the roster rail + slugs + routing; monochrome-friendly (types are labelled group headers, not
  colours); supports per-edge notes; deep-linkable (`#<faction>/relations/<slug>`).
- ➖ One character at a time — less "birds-eye" than a matrix (mitigated by chips that jump between
  characters, so you *walk* the web).
- Verdict: **the primary view.** Lowest risk, highest fit, works everywhere.

### C · Force-directed graph (nodes + edges)
A visual web of character nodes linked by relationship edges.
- ➕ Striking; shows clusters/hubs visually; "wow" factor.
- ➖ Needs a layout algorithm + canvas/SVG (more code, arguably a new dependency-shaped thing we've
  avoided); hard to read past ~20 nodes; poor on mobile; labels overlap; monochrome edges can't easily
  encode 6 types. High effort, fragile.
- Verdict: **not now.** Possible far-future flourish for a *small* faction; not worth the complexity.

## Recommendation

Build **B (per-character relationship dossier)** as the T28 v1:
- A new section **"Relations"** per faction (nav tab + home card + `#<faction>/relations[/<slug>]`),
  reusing the roster rail on the left to pick a character.
- Right pane: the character's relationships **grouped by type** (Family / Friend / Crush / Rival /
  Hatred / Acquaintance), each entry a **chip** = the other character's name (+ optional note), which
  **links to their dossier** (and, in Relations, to *their* relationship page — you browse the web by
  walking it).
- Type is shown by a **group header + a small glyph**, and emphasis (Family/Friend bright, Rival/Hatred
  outlined-dim, Crush italic) — monochrome-safe.
- **Reciprocity:** show incoming vs. outgoing where the data is directed (e.g. "→ has a crush on" vs.
  "← crushed on by"). If the sheet is undirected, treat every edge as mutual.
- Later, *optionally*, add **A** as a compact "Overview" toggle **only** for factions small enough
  (gate on character count) — a bonus, not a blocker.

Then, as a stretch, the same grouped-relationships block can be embedded **inside the roster dossier**
(a "Connections" field) so it shows in both places from one renderer.

## Build plan (once the direction + sheet format are confirmed)
1. **Data adapter** — fetch Sheet B via the existing gviz path (a NEW source; never touch
   `CONFIG.sheetId`), normalise to `edges[{from,to,type,note,dir}]`, index by character slug. Confirm
   the parser against a real sample first.
2. **Section plumbing** — add `relations` to `setSection`, the nav (`renderNav`), home (`renderHome` +
   `HOME_INFO`/`NAV_ICONS`), and the router (`parseRoute`/`applyRoute`/`writeRoute`,
   `#<faction>/relations/<slug>`), mirroring how `wiki`/docs sections are added.
3. **Renderer** — `renderRelations()`: rail = the roster's character list (reuse); pane = grouped chips
   with glyphs/emphasis + notes + dossier links; empty/no-data + "character has no relations" states.
4. **Styles** — chips + group headers from `--fg*` tokens; mobile stack; reduced-motion-safe.
5. **Verify** — mock data in-sandbox (Google data won't load here); full verify + the real sheet on the
   live site. Acceptance: pick a character → their relationships show grouped + linked; deep link works;
   mobile clean; console + selfcheck clean; never writes to any sheet.

## Open questions for the user
1. Confirm **B** as the direction (or ask for A/C).
2. Paste/point at a **sample of Sheet B** so the parser matches the real layout (long vs. wide, directed
   vs. mutual, and the full list of relationship types).
3. Should Relations be its **own top section**, or folded into the **roster dossier** as a "Connections"
   block — or both?
