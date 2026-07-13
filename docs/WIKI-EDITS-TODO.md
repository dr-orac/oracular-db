# Wiki edits TODO — for the wiki maintainer (you)

Things to change **on the source MediaWiki** (`wiki.misfitsystems.net`) that make the in-app reader +
site map render better. None of these are code changes — they're wiki content edits. Ordered by payoff.
The app re-fetches live, so every edit shows up on the next page load.

Exact category syntax + the faction-page checklist live in **`WIKI-CATEGORISATION.md`** — this file is the
prioritised action list.

---

## 1. Categorise the un-tagged pages → fixes the site map  ⭐ biggest win
The app's **Wiki Map** groups pages by their `[[Category:…]]` tags. **20 of 46 pages are untagged.** 12 of
those are faction pages the app already slots under **Factions** (via its own faction list), so they're
optional — but the **~8 non-faction pages below fall into "Uncategorised"** and should be tagged. Add ONE
line at the bottom of each page:

| Page | Suggested tag |
|------|---------------|
| Factions Overview | `[[Category:Factions]]` |
| Minor Factions | `[[Category:Factions]]` |
| Faction War | `[[Category:Factions]]` (or a new `[[Category:Rules]]`) |
| Rule Clarifications | `[[Category:Server & Rules]]` |
| Misfits Strike System | `[[Category:Server & Rules]]` |
| SPECIAL | `[[Category:Gameplay]]` or `[[Category:Survival]]` |
| Currency | `[[Category:Survival]]` (or `[[Category:Gameplay]]`) |
| Chems & Addiction | `[[Category:Survival]]` |
| Armor | `[[Category:Weapons]]` (or a new `[[Category:Equipment]]`) |

The app's map sections are: **Server & Rules · Factions · Weapons · Crafting · Survival · Lore · Gameplay ·
Mechanics** (+ an "Uncategorised" catch-all). Use those names so a page lands in the right group. Tagging the
12 faction pages `[[Category:Factions]]` too is nice-to-have (makes the grouping canonical rather than
relying on the app's built-in list).

## 2. Fix the page-name typo  ⭐ quick
There's a page titled **"Misfits Strick System"** — the Main Page links to **"Misfits Strike System"**.
Rename the page (or fix the link) so **Stri*ck* → Stri*ke*** and the link resolves.

## 3. Structure weapon + armor pages for the upcoming category icons (app tasks T75/T76)
When we add per-category icons to weapon/armor tables, the app keys them off **section headers**. To make
that clean:
- Give each weapon category its **own section** with a clear heading or a full-width **banner row** (a
  single cell spanning all columns — e.g. `! colspan="N" | PISTOLS`). The app already styles a lone
  spanning cell as a section banner, and will hang the category icon off it.
- Keep category names recognisable: **Pistols · Rifles/SMGs · Shotguns · Laser · Plasma · Melee · Heavy ·
  Explosives** (weapons); **Light · Medium · Heavy · Power Armor · Helmets** (armor). Consistent names →
  the app can map each to an icon.

## 4. Use "Label:" lead-ins freely — the app now formats them
The reader now renders a short leading **"Word(s):"** at the start of a line/bullet as a **bright mini-
heading** (e.g. `Paladin:`, `Protocol:`, `The New Mandate:`), and a trailing **"Roles:"**-style label
before a list drops onto its own line. So you can write `'''Rank:''' description` naturally and it reads
consistently — no need to hand-format each one. Keep labels **short (≤4 words) and Capitalised** so they're
recognised (lowercase prose like "he said the following:" is deliberately left alone).

## 5. Tables — keep them from getting too wide (until app task T81 lands)
Very wide stat tables currently scroll sideways in the reader. We're building an auto-reflow (T81), but
until then: prefer **fewer, wider columns** over many narrow ones, and put long prose in its own row rather
than a cramped cell. Section-header rows (full-width spanning cells) render nicely — use them to break big
tables into labelled blocks. Bulleted lists **inside** cells now left-justify automatically.

## 6. Headings — use real heading levels
Use proper `== H2 ==` / `=== H3 ===` structure (not bold text as a fake heading). The app builds the
in-reader **Contents** rail + section rules from real headings, and the section spacing (more space above
than below) only works on true headings.

---

_Cross-refs: `WIKI-CATEGORISATION.md` (exact category recipe + per-page checklist) · `WIKI-INTEGRATION.md`
(the plan to move Tribe Lore / Roleplay onto the wiki). App-side follow-ups that pair with these edits:
T62 (site map), T75/T76 (weapon/armor icons), T81 (table reflow) in `TASKS.md`._
