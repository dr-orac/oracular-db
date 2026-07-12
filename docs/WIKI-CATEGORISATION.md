# Wiki categorisation → a live, self-updating sitemap (2026-07-12)

You have wiki edit access and asked whether categorising helps. **Yes — it's the better path.** If the
wiki pages are consistently categorised, the app can derive the sitemap **live from the MediaWiki API**
(category tree → members) instead of a hand-maintained static map. Then a new page just needs its
`[[Category:…]]` tag and it appears in the app's sitemap automatically — nothing to update in code.

## The scheme (5 sections under one root)

Use the five top-level sections as categories (they already exist), and make each a **subcategory** of a
single root so the sitemap has a clean root → sections → pages shape:

```
Category:Nuclear-14            ← root (Main Page already uses it)
 ├─ Category:Factions
 ├─ Category:Weapons           (optionally: Category:Ranged Weapons, Category:Melee Weapons as subcats)
 ├─ Category:Crafting
 ├─ Category:Survival
 └─ Category:Server            ← rules / staff / systems
```

**Make a category a subcategory:** edit the *category page itself* (e.g. go to `Category:Factions`) and
add `[[Category:Nuclear-14]]` to it. Do that on all five so they nest under the root. (One-time, 5 edits.)

**Tag a page:** edit the page, add e.g. `[[Category:Factions]]` at the bottom. Save. That's it.

## Exact checklist — pages that still need a category

Most Weapons/Crafting/Survival pages are already done. The gaps (as of 2026-07-12):

**Factions** — add `[[Category:Factions]]` to each (only *The Enclave* has it today):
Brotherhood of Steel · Caesar's Legion · New California Republic · Followers of the Apocalypse ·
Vault Dwellers · Townsfolk · Wastelanders · Wasteland Tribes · Outlaws · Super Mutants · Synthetics ·
Minor Factions · Faction War · Factions Overview  *(and Caravan Company when you create it)*

**Weapons** — add `[[Category:Weapons]]`:  Armor

**Survival** — add `[[Category:Survival]]`:  Chems & Addiction · Currency

**Server** — add `[[Category:Server]]`:  Rule Clarifications · SPECIAL · Misfits Strike System

**Already fully categorised (no action):** all other Weapons pages (Big Guns, Explosives, Laser/Plasma/
Ranged/Melee/Small Guns, One-/Two-Handed Melee, Other Weapons, Weapons); all Crafting pages (Crafting,
Crafting System, Materials, Chemistry, Botany, Cooking, Bartending, Medicine Crafting); Survival Basics,
Survival Guide; Rules, Staff Expectations.

## Two cleanups while you're in there
- **Delete/redirect `Misfits Strick System`** — it's a typo-duplicate of `Misfits Strike System`.
- The **secondary tags** some pages carry (Gameplay, Mechanics, Lore, Chemistry, Cooking, Bartending,
  Staff, Enclave) are fine — the sitemap keys off the five *section* categories; extra tags don't hurt.

## Optional: weapon depth
If you want the app's sitemap to nest Ranged/Melee under Weapons (matching the real taxonomy), create
`Category:Ranged Weapons` + `Category:Melee Weapons`, make both `[[Category:Weapons]]`, and tag:
- Ranged: Small Guns, Big Guns, Laser Weapons, Plasma Weapons (+ Ranged Weapons hub)
- Melee: One-Handed Melee, Two-Handed Melee (+ Melee Weapons hub)
Not required — a flat Weapons category is perfectly fine for a first version.

## Then the app
Once this is in place (even partially), the app builds the sitemap by reading `Category:Nuclear-14`'s
subcategories and their members via the API — self-updating, with an "Uncategorised" fallback bucket so a
not-yet-tagged page is still listed (never silently dropped). Tell me when you've done a pass (or want me
to build it against the current partial state with that fallback).
