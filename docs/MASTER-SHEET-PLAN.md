# Master faction sheet — plan (2026-07-11)

**Roadmap only. Nothing is created or changed yet.** The user asked for a single master Google Sheet
with a tab per faction, holding all the info from the Tribe + Brotherhood sheets, standardised where
it overlaps (with room for faction-specific fields, e.g. only tribals have a Spirit Animal), linked to
the app — and asked whether a *live editable tooling link* to that sheet is viable.

---

## 0. The hard constraint (unchanged)
**Never write to the original tribe sheet** `CONFIG.sheetId` (`10n4TFnu…BsSY`) — read-only, always.
The master sheet is a **NEW** file; the originals are only ever *read* to copy their data across.

## 1. Is a live link viable? (honest tooling reality)
Available Google tools here: **create_file** (create Drive files incl. Google Sheets, from text/CSV
content), **read_file_content** (read any accessible sheet's contents), search/metadata/copy/download.
There is **no cell-level update / batchUpdate tool**, and I must not change file **sharing** (a standing
safety rule — the user sets "anyone with link → Viewer").

So:
- **Live READ — YES.** I can read the master sheet on demand (via `read_file_content` or the public
  `gviz` CSV the app already uses). I always see its current contents + the user's manual edits, and can
  reason about improvements. (Proven: read both existing sheets' schemas for this plan.)
- **Live auto-WRITE / edit-in-place — NO (with these tools).** No API to patch an existing sheet's
  cells. `create_file` makes a *new* file (new id) and, from CSV, a *single-tab* sheet — it can't add a
  tab to, or edit, an existing multi-tab sheet.
- **Workable collaborative loop instead:** I generate/refresh a tab's content (CSV) → the user pastes it
  in (or approves me creating a fresh copy) → the user makes manual edits → I read the live sheet to see
  them and propose the next round. A **"read-live, propose-diffs" partnership**, not me typing in cells.
- **Path to true auto-write (future infra the user would set up):** the app already has an **Apps Script
  write-back** backend that writes to a sheet from the browser. A small dedicated Apps Script endpoint
  (or a Sheets-API service credential) could accept structured edits and write them — that would give a
  genuine programmatic write link, independent of these Drive tools. Out of scope for a first pass.
- ⚠ **Creating files is an outward action** on the user's Drive → confirm before creating anything. (This
  doc is plan-only, so nothing is created here.)

## 2. Data gathered (real schemas, read 2026-07-11)
Both sheets share the same shape: **row 1 = title, row 2 = column headers, row 3 = help text, row 4+ =
character data.** (The app's `parseCSV`/`buildModel` already expects title + header, and `FIELDS` maps
varied headers to canonical fields with fuzzy aliases — added when Brotherhood was wired, T27.)

- **Tribe (55 rows, 15 cols):** Discord Name · Use-Name · Honorific/Brave-Name · True Name · Birth/
  Original Name · Favoured Mode of Address · Species · Usual Role · Age/Sex/Appearance · **Spirit
  Animal** · Relationships with Other Characters · Key Plot Moments · Notes · Favourite Herb/Drink/Drug ·
  Favourite Activities.
- **Brotherhood (16 rows, 11 cols):** Discord Name · Full name · Caste and Rank · Age/Sex/Appearance ·
  Origin · Preferred Armament · Talents · Medical History · Accomplishments · Notes · Status.

## 3. Proposed standardised schema
A shared **CORE** block (every faction, same column order) + a per-faction **EXTRAS** block. Headers are
standardised; a faction simply leaves inapplicable extras out. Canonical CORE columns:

| CORE column        | Tribe source            | Brotherhood source     | Notes |
|--------------------|-------------------------|------------------------|-------|
| Discord Name       | Discord Name            | Discord Name           | key; may be blank |
| Name               | Use-Name                | Full name              | the primary display name |
| Role / Rank        | Usual Role              | Caste and Rank         | |
| Age / Sex / Appearance | Age / Sex / Appearance | Age / Sex / Appearance | identical already |
| Species            | Species                 | (Human)                | |
| Origin / Background | Birth Name + Key Plot   | Origin                 | free text |
| Relationships      | Relationships…          | —                      | |
| History / Deeds    | Key Plot Moments        | Accomplishments        | |
| Talents / Skills   | Favourite Activities    | Talents                | |
| Notes              | Notes                   | Notes                  | |
| Status             | —                       | Status                 | |

Per-faction **EXTRAS** (kept, not forced onto others):
- **Tribe:** Spirit Animal · Honorific/Brave-Name · True Name · Favoured Mode of Address · Favourite
  Herb/Drink/Drug.
- **Brotherhood:** Preferred Armament · Medical History.
- Other 11 factions: start with CORE only (contributors add extras as their lore needs them).

The app's `FIELDS` table gets alias entries for the standardised headers, and each faction can declare
which EXTRAS it shows (its ID/BLOCK render order) — the machinery for this already exists (Tribe vs
Brotherhood already render different field sets).

## 4. Structure of the master sheet
**One Google Sheet, one TAB per faction** (13 tabs). Each tab: title row + standardised header row +
help-text row + data rows (mirrors today's format). The app links each faction to its tab by **gid**:
`FACTIONS[id].data = { sheetId: MASTER_ID, gid: <that tab's gid> }`. Unlinked factions get an empty tab
(title+header+help only) → the app shows their coming-soon state until data is added, then they light up
with zero code changes.

## 5. Phased build (each phase = its own review; ACT only after user go-ahead)
- **P0 — schema sign-off.** User confirms the CORE columns + per-faction EXTRAS + which factions to seed.
- **P1 — templates.** Generate the standardised header+help rows for each faction tab (CSV/TSV), locally.
- **P2 — migrate.** Read the Tribe + Brotherhood sheets (read-only) and remap their rows into the new
  column order → the Tribe + Brotherhood tab content. Verify counts (55 / 16 rows) + no data loss.
- **P3 — create.** Create the master sheet + tabs, populate. ⚠ Tooling caveat (§1): `create_file` makes
  a single-tab sheet, so realistically the **user creates the sheet + 13 tabs** and pastes each tab's
  content (I hand it over ready-to-paste), OR we accept 13 separate single-tab sheets. Decide in P0.
- **P4 — wire + verify.** Point Tribe + Brotherhood `data` at the master's tabs; add `FIELDS` aliases;
  user shares the sheet "anyone with link → Viewer"; verify every faction loads (spot-check on the LIVE
  site — the sandbox can't reach gviz). Write-back note below.
- **P5 — iterate.** Read the live sheet, propose refinements; the user applies them (read-live loop).

## 6. Risks / things that will bite
- **Write-back (uploads / edits / logs)** posts to an **Apps Script** bound to a specific sheet. If the
  Tribe moves to the master sheet, that Apps Script must be re-pointed (or write-back stays on the
  original sheet, or is disabled for the master) — decide before switching the Tribe's `sheetId`.
- **The Tribe's live audience.** The Tribe sheet is actively used; do NOT repoint the app's Tribe data to
  the master until the master's Tribe tab is verified complete + shared — otherwise the live site breaks.
  Safer: seed + verify the master with the *other* factions first, keep the Tribe on its own sheet until
  last.
- **gviz needs public view sharing** — the user must set it (I can't change sharing).
- **Column drift** — if contributors reorder columns, `FIELDS` fuzzy aliases must cover it (they mostly
  do). Keep the help-text row so contributors know each column's meaning.

## 7. Open questions for the user (answer these to start P0)
1. **Live-link expectation:** is the **read-live + propose-diffs** loop (§1) acceptable for now, or do you
   want to stand up the Apps Script/Sheets-API write path first for true auto-edits?
2. **Sheet creation:** OK for me to create the master sheet in your Drive (I'll ask before each create),
   or will you create the sheet + tabs and I hand over ready-to-paste content per tab?
3. **Schema:** does the §3 CORE + EXTRAS split look right? Any CORE column to add/rename/drop?
4. **Which factions to seed now** beyond Tribe + Brotherhood (the other 11 can start as empty templates)?
5. **Write-back:** keep the Tribe's uploads/edits on its current sheet, or move + re-point the Apps
   Script? (Affects when we switch the Tribe's `sheetId`.)
