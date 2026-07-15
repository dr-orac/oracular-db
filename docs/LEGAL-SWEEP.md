# Legality / licensing sweep (T89)

A documented best-effort risk map for what this project can safely use — **not legal advice**.
The Misfits Database is a free, non-commercial, fan-made tool for one SS14 Discord community; nobody is
being charged, nothing is monetised, and there's no claim of official status. That posture is the single
biggest thing keeping risk low across every item below — don't let it slip (see "Bottom line").

This gates **T86** (the wasteland Map — Fallout location names, lore, map likeness) and **T88** (icon
sourcing from libraries). Re-run a sweep like this if either project ever adds ads/donations/merch, or if
new fonts/icon sources get added later.

Verdicts: **✅ Safe** · **⚠ Needs attention** (do something specific, then it's fine) · **⛔ Avoid**
(don't ship this without a purchased licence or without swapping it out).

---

## 1 · Fallout / Bethesda–ZeniMax IP

**Copyright vs trademark, quickly:** copyright protects specific creative *expression* — art, written
text, character designs — automatically, from the moment it's made. It does **not** protect names, short
phrases, facts, or general ideas/mechanics on their own. Trademark protects *source-identifying* marks
(names/logos used to identify who made a thing) against uses that could confuse people about origin or
imply endorsement — this applies even to non-commercial use if it looks official. **Nominative fair use**
is the recognised defence for referring to a trademarked thing *by its real name* to identify or discuss
it — using only as much of the mark as needed, with nothing implying sponsorship. Naming a map pin "The
Hub" to say "this is where The Hub was in the games" is nominative use; slapping the Vault-Tec logo on
your own site's header is not.

**Bethesda's actual posture:** they've openly tolerated large non-commercial fan projects (wikis, mods,
fan sites) for two decades, and their own modding guidelines focus on stopping *monetised* infringement
and third-party IP inside mods, not shutting down fan discussion. But they have sent cease-and-desist
letters to non-commercial fan sites that leaned hard on "Fallout" branding or reused official art in a way
that read as an official product (e.g. Fallout-Posters.com in 2011). The pattern: **text/name references
are low-risk, official art/logos are the trigger.**

| Item | Verdict | Why | What to do |
|---|---|---|---|
| **Location names** (Shady Sands, The Hub, New Vegas, Hoover Dam, Wendover, Vault 13, Goodsprings…) | ✅ Safe | Names/short phrases aren't independently copyrightable; using them to label pins on *your own* map is nominative/descriptive use, not reproduction of Bethesda's expression. | Use freely as pin labels. Don't title the feature/section anything that reads as an official Bethesda product (the app already frames everything as "Misfits"/Tribe content — keep that framing on the Map tab too). |
| **Faction names** (Brotherhood of Steel, NCR, Enclave, Caesar's Legion, Followers of the Apocalypse) | ✅ Safe | Same as above — referencing the fictional orgs by name to filter/colour-code pins is nominative use. | Fine as text labels and filter categories. Don't reproduce their official **insignia** (see logos row) — invent your own simple colour-coding or an original glyph if you want a visual marker. |
| **Lore/timeline text** — paraphrased | ✅ Safe | Facts and paraphrase in your own words aren't copyright infringement; only the specific expression is protected. | Write pin blurbs and timeline copy in your own words, informed by the games/wiki as reference. |
| **Lore/timeline text** — verbatim | ⛔ Avoid | Copying Bethesda's (or the Fallout Fandom wiki's) actual sentences is straightforward copyright infringement regardless of commercial status; "it's just a paragraph" doesn't create a fair-use safe harbor for a wholesale copy. | Never paste wiki/game text directly into pin blurbs — summarise from memory/notes instead. |
| **Map likeness** of the in-game world | ✅ Safe for the implemented base | Real-world geography is factual. The enhanced US/Region base uses public-domain Natural Earth geometry and an original subdued relief generated from public-domain USGS 3DEP elevation; it does not copy fan-map or in-game pixels, textures, labels, icons, or geometry. | Keep physical geography sourced and reproducible. Treat supplied/fan maps only as discovery or visual direction; never trace them. Post-war conditions and faction territory must remain separate evidence-aware project layers. |
| **Trademarked logos/art** — Vault Boy, Vault-Tec logo, Pip-Boy device imagery | ⛔ Avoid | Vault Boy is a registered US trademark (Bethesda Softworks LLC, Reg. No. 6033938) *and* a copyrighted character design; Vault-Tec's logo and the Pip-Boy's specific device art are likewise protected. This is exactly the category of asset Bethesda has historically enforced against, even for non-commercial sites. | Never embed, trace, or closely imitate official art. If you want a "vault door" or "wrist computer" motif, draw an **original** stylised version — which is already this project's practice for its hand-authored SVG icon set (see §2) and its CRT effects (see `CREDITS.md`'s "Technique inspiration" section, which explicitly reimplements effects from scratch rather than copying assets). Keep doing that for any map markers/mascots. |
| **Pip-Boy/CRT terminal aesthetic** in general | ✅ Safe | A green-phosphor CRT-terminal look is a *style/genre*, shared by dozens of unrelated retro-computing fan projects — general aesthetics aren't protectable the way specific art assets are. | Keep reimplementing effects yourself (as documented in `CREDITS.md`) rather than lifting the actual in-game UI's specific icon set, exact font pairing, or a screenshot of the real Pip-Boy bezel. |
| **Monetisation / implied endorsement** | ⛔ Avoid (if it ever changes) | Confirmed non-commercial status is the biggest risk-reducer on this whole list; ads, paid access, merch, or any donation button framed around "Fallout" content pushes this from "tolerated fan work" toward "commercial use of someone else's IP," which is what triggers enforcement. | Stay free, stay unaffiliated, never state or imply Bethesda/ZeniMax endorsement or involvement. A small "unofficial fan project, not affiliated with Bethesda/ZeniMax" line in the footer or About/CREDITS is cheap insurance. |

Sources: [Bethesda Fan Video Policy](https://bethesda.net/en/article/3XrnHrB0iAesac8844yeuo/bethesda-video-policy) ·
[Bethesda.net Modding Guidelines](https://help.bethesda.net/app/answers/detail/a_id/51731/~/bethesda.net-modding-guidelines---mods/creations) ·
[VAULT BOY trademark registration #6033938 (Justia)](https://trademarks.justia.com/866/49/vault-86649770.html) ·
[Bethesda policy towards Fallout fan projects — NMA thread, incl. Fallout-Posters.com C&D](https://www.nma-fallout.com/threads/bethesda-policy-towards-fallout-fan-projects.199869/) ·
[Starfield, Mods, and Derivative Works — Tyz Law Group](https://www.tyzlaw.com/games-blog-archive/starfield-mods-and-derivative-works-an-in-depth-look)

### Geographic renderer and source data added by T114

| Item | Licence/status | Project handling |
|---|---|---|
| **MapLibre GL JS 5.24.0** | BSD-3-Clause plus bundled component notices | Version, distribution source, licence, and SHA-256 hashes travel in `vendor/maplibre/`; loaded locally only for US/Region. |
| **Natural Earth 1:110m land/lakes/rivers** | Public domain; attribution not required | Unmodified pinned GeoJSON and hashes live in `data/geography/`; credited for provenance. |
| **USGS 3DEP relief source** | US government public-domain data with no use restrictions | Only bounded generated WebP presentation tiles ship; service snapshot, processing, scope, and hashes live in the manifest. |

No Google/Mapbox tile service, client API key, paid feed, supplied relief artwork, or fan-map image is part of
the implemented terrain base. A future source or overlay requires its own licence/provenance entry before it
ships.

---

## 2 · Icon libraries

The project's default and safest path is what it already does: **hand-author original SVG icons**
(`NAV_ICONS`/`FACTION_ICONS` etc. in `app.js`) — 100% original work, zero licence obligations. The question
below is only about icons *copied or adapted from a library* for T88.

| Item | Verdict | Why | What to do |
|---|---|---|---|
| **game-icons.net** | ⚠ Needs attribution | Licensed **CC BY 3.0**. Free for personal *and commercial* use, but every icon requires crediting its individual author (not just the site) — confirmed on the site's own About/FAQ pages. | For each icon you adapt, note its **author name** (shown on the icon's page on game-icons.net) and add a line to `CREDITS.md` (template below). A single credits-page mention is enough per their own FAQ — no in-UI badge needed. Keep a running list as T88 adds icons; don't batch-defer it, the per-author requirement makes it easy to lose track. |
| **Lucide** | ✅ Safe | ISC licence (permissive, MIT-equivalent) — no attribution legally required. | Good if you want a generic UI-icon look with no bookkeeping. Less Fallout-specific than game-icons.net. |
| **Tabler Icons** | ✅ Safe | MIT licence — no attribution required. | Same trade-off as Lucide. |
| **Bootstrap Icons** | ✅ Safe | MIT licence — no attribution required. | Same. |
| **Heroicons** | ✅ Safe | MIT licence — no attribution required. | Same. |
| **Font Awesome (Free set)** | ⚠ Needs attention | The free icon *glyphs* are CC BY 4.0 (attribution required); the free *code/CSS* is MIT. Easy to miss the icon-attribution half since most sites treat FA as "just free." | If used, credit per FA's own attribution guidance; otherwise prefer one of the MIT-only sets above to skip this. |

**Recommendation for T88:** since the theme benefits from game-icons.net's large post-apoc/fantasy/weapon
vocabulary, use it where the shape vocabulary really matters (weapon categories, chems, currency), and
reach for an MIT set (Lucide/Tabler/Heroicons) for generic UI chrome where attribution bookkeeping isn't
worth it. Either way, prefer **hand-adapting into the existing flat `currentColor` style** (already the
project's practice) over embedding a library's raw SVG — that keeps the visual language consistent *and*
makes clear in the diff/commit that the shape was studied and redrawn, not copy-pasted wholesale.

Sources: [game-icons.net — About](https://game-icons.net/about.html) · [game-icons.net — FAQ](https://game-icons.net/faq.html) ·
[Lucide license](https://lucide.dev/license) · [Tabler Icons license](https://tabler.io/icons) ·
[Font Awesome license](https://fontawesome.com/license/free)

---

## 3 · Fonts already in the repo

Enumerated from `fonts/` + the `@font-face` block at the top of `styles.css` (verified against each font
file's own embedded `name` table via `fonttools`, which is more reliable than filenames). One earlier
project doc, `docs/CRT-Terminal-Theme-Guide.md` §3, already flagged Monofonto and Overseer as licensing
risks *before* their actual licence files were obtained — this sweep supersedes that with the real terms
now sitting in `fonts/*-LICENSE.txt`.

| Font family (CSS name) | File(s) | Rights holder | Licence found | Verdict | What to do |
|---|---|---|---|---|---|
| **Fixedsys Excelsior** | `FSEX300.woff2`/`.ttf` | Darien Valentine | Public domain / CC0 | ✅ Safe | Nothing needed — already the project's own documented "safe to self-host" pick. |
| **Special Elite** | `SpecialElite.woff2` | Brian J. Bonislawsky / Astigmatic | Apache License 2.0 | ✅ Safe | Permissive, web-embed explicitly fine. Optional courtesy credit. |
| **Share Tech Mono** | `share-tech-mono.woff2` | Carrois Type Design | SIL OFL 1.1 | ✅ Safe | OFL explicitly permits redistribution/embedding. |
| **VT323** | `vt323.woff2` | The VT323 Project Authors | SIL OFL 1.1 | ✅ Safe | Same. |
| **IBM Plex Mono** | `ibm-plex-mono.woff2` | IBM Corp | SIL OFL 1.1 | ✅ Safe | Same. |
| **Pixelify Sans** | `pixelify-sans.woff2` | Pixelify Sans Project Authors | SIL OFL 1.1 | ✅ Safe | Same. |
| **DotGothic16** | `dotgothic16.woff2` | DotGothic16 Project Authors | SIL OFL 1.1 | ✅ Safe | Same. |
| **Workbench** | `workbench.woff2` | Workbench Project Authors | SIL OFL 1.1 | ✅ Safe | Same. |
| **Overseer** | `Overseer.woff2`, `Overseer-Bold.woff2` | Neale Davidson / Pixel Sagas | Pixel Sagas Freeware EULA (`fonts/Overseer-LICENSE.txt`) | ✅ Safe *for this project* | Free for **personal, non-commercial** use, and the licence text explicitly says freeware fonts "may... be embedded for web, publication, or general software use." Since the project is confirmed non-commercial, self-hosting via `@font-face` is covered. **This would flip to ⛔ if the project ever monetises** — commercial use needs a paid Pixel Sagas licence. Courtesy credit appreciated, not required. |
| **Monofonto** | `Monofonto.woff2` | Ray Larabie / Typodermic Fonts | Typodermic "Free Desktop License" (`fonts/Monofonto-EULA.pdf`) | ⛔ Avoid (unconfirmed) | The bundled EULA is Typodermic's **desktop** licence — covers installing the font on a machine and using it to make static graphics/print, but does **not** cover embedding the font file into a website or application. Typodermic sells a separate Application/Embedding licence for exactly this use case. The repo currently self-hosts `Monofonto.woff2` via `@font-face` with no evidence a webfont/app licence was purchased — this is the single most concrete finding of this sweep. | Confirm with the maintainer whether a paid Typodermic webfont/app licence exists for Monofonto. If not: either buy one, or swap the "Monofonto" preset to an OFL look-alike — the project already has **Share Tech Mono** and **IBM Plex Mono** self-hosted, either reads close enough as a "cold government mainframe" mono face. |
| **Gothic 821 Condensed BT** ("Gothic 821") | `Gothic821Cn.woff2` | Bitstream Inc. (1990–1993) | None found — commercial foundry font, sold via MyFonts/Bitstream resellers | ⛔ Avoid (unconfirmed) | This is a **paid commercial font**, not freeware; embedded metadata carries no licence grant, and it's not distributed as a free webfont anywhere reputable. Currently self-hosted with no purchase evidence. This wasn't caught by the earlier CRT-Terminal-Theme-Guide.md pass — it's a new finding. | Confirm whether a webfont licence was purchased. If not, drop the self-hosted file and lean on the **existing CSS fallback** — `styles.css` already chains `"Gothic 821","Oswald",sans-serif`, so switching the primary to **Oswald** (Google Fonts, OFL) is a low-effort swap that keeps the same condensed-grotesque "metal signage" look. |
| **"Fallout"** (pixel logo font) | `Fallout12.woff2`/`.ttf` | Embedded metadata credits "IshPassion"; no licence text embedded or bundled | ⚠ Needs attention | This specific fan recreation of the FO1/FO2 title font circulates on freeware font sites as personal-use-free / commercial-paid, but no licence file for *this exact build* is bundled in `fonts/`, unlike every other risky font here. | Low practical risk for a non-commercial project (this is one of the most widely-mirrored "the Fallout font" builds, used across countless non-commercial fan sites for 20+ years), but track down and archive the actual `readme`/licence text next to it (as done for Overseer/Fallouty) so the next sweep isn't guessing. Don't use it anywhere monetised. |
| **JH Fallout** | `JH_Fallout.woff2`/`.ttf` | Joiro Hatagaya, 2002 | Embedded copyright reads **"Copyright 2002 Joiro Hatagaya. All rights reserved."** — no licence grant of any kind embedded | ⚠ Needs attention | "All rights reserved" with no accompanying licence text is, strictly, no permission granted at all — despite that, this font has been freely mirrored across essentially every Fallout fan-font page (Fallout Wiki's own Fonts index links it) for two decades with no known enforcement. Practical risk is low for a small non-commercial fan tool, but it's the weakest paper trail of any font in the repo. | Keep for non-commercial use; don't use it anywhere monetised; if a written licence/readme for this exact build turns up, archive it next to the font like the others. |
| **Fallouty** | `Fallouty.woff2` | Sébastien Caisse ("Red!"), 2002 — the flagship/iconic tribe face per `TASKS.md` T38 | Custom licence embedded in the font and transcribed to `fonts/Fallouty-LICENSE.txt` | ✅ Conditions recorded | The licence grants free use with redistribution, modification-forwarding, credit, and original-file-link conditions. `CREDITS.md` now identifies version 1.7209, credits the owner, links the shipped original, and the readable licence travels with it. | Keep the font unmodified. If it is ever replaced or modified, re-check the forwarding and redistribution conditions. |

Sources: [Typodermic Fonts — license page](https://typodermicfonts.com/license/) ·
[Monofonto — Typodermic](https://typodermicfonts.com/monofonto/) ·
[Fixedsys Excelsior — kika/fixedsys on GitHub](https://github.com/kika/fixedsys) ·
[Gothic 821 Condensed BT — MyFonts/Bitstream listing](https://www.myfonts.com/collections/gothic-821-font-bitstream) ·
[Fallout Fonts — the Fallout Wiki](https://fallout.wiki/wiki/Fallout_Fonts) ·
[SIL Open Font License 1.1](https://scripts.sil.org/OFL) · [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
(Overseer/Fallouty terms are recorded in `fonts/Overseer-LICENSE.txt` and
`fonts/Fallouty-LICENSE.txt`; the latter is transcribed from the original font's embedded name table.)

---

## 4 · SS14 / Space Station 14 / Nuclear-14 content

| Item | Verdict | Why | What to do |
|---|---|---|---|
| **Referencing SS14/Nuclear-14 by name, mechanics, server lore** | ✅ Safe | Space Station 14's own repo is dual-licensed: **code under MIT**, most **content/assets under CC-BY-SA 3.0** (space-wizards/space-station-14, `LICENSE.TXT`). Discussing/referencing an open-source game and its community content is unproblematic. | Nothing needed for text/name references, including the "Yuma Tribe"/"Misfits" Nuclear-14 fork framing already used throughout the app. |
| **Embedding actual SS14 game sprites/icons** (if ever done) | ⚠ Needs attention | CC-BY-SA is a **share-alike copyleft** licence: reuse requires attribution *and* any adaptation must carry the same licence forward. A minority of SS14 assets are marked **CC-BY-NC-SA** (non-commercial only) per-asset in each `meta.json` — fine for this non-commercial project, but still share-alike. | If a future feature pulls actual SS14 sprites (not the case today — this is a roster/wiki viewer, not a game-asset browser), check the specific asset's `meta.json` for its licence + attribution name before use, and credit per CC-BY-SA's terms. |

Sources: [space-station-14 LICENSE.TXT](https://github.com/space-wizards/space-station-14/blob/master/LICENSE.TXT) ·
[Space Wizards Dev Wiki — Art](https://docs.spacestation14.com/en/space-station-14/art.html)

---

## 5 · Player-submitted content (bios, Discord photos)

Not a copyright-registry question so much as a practical-consent one — this is community-submitted
material, not licensed third-party content.

| Item | Verdict | Why | What to do |
|---|---|---|---|
| **Character bios written by community members** | ✅ Safe | The author of a bio owns it (or is submitting it in good faith believing they have the right to). | Keep the existing practice: content flows from the community's own sheet/Discord submissions, nothing is scraped from outside sources. |
| **Photos/images used as character faceclaims** | ⚠ Needs attention | A player pasting in a random internet photo (stock art, a celebrity photo, someone else's fan art) as a "faceclaim" is republishing *someone else's* copyrighted work, which the project would then be hosting. | No code fix — a light community norm is enough: prefer original art/the player's own images, and be willing to swap/remove an image on request (from the player or a rights holder). |
| **Real photos of real people pulled from Discord** | ⚠ Needs attention | This is a consent/privacy question more than a copyright one — publishing someone's photo without them knowing changes the terms they agreed to when posting in Discord. | Get explicit opt-in before publishing a real photo of a person to the public site (a Discord post isn't automatic consent to republish on a public web page); this is already implicitly how the roster works via sheet submission, just worth keeping explicit as the project grows. |

---

## Attribution snippets — ready to paste into `CREDITS.md`

Add a new `## Fonts` and/or `## Icons` section to `CREDITS.md` (it currently only has "Adapted code" and
"Technique inspiration"); suggested lines:

```md
## Fonts

- **Fallouty** — © Sébastien Caisse ("Red!"), 2002. Used under the font's own licence (embedded in
  `fonts/Fallouty.woff2`'s name table): free to use, modify, and redistribute provided the licence/
  copyright notice travels with any copy and — for web use — the original font remains linked and
  credited. Original font: search "Fallouty font Sebastien Caisse" (source site no longer live; the
  woff2 in this repo is the archived original).
- **Overseer** — © Neale Davidson / Pixel Sagas, 2011–2015. Freeware for personal/non-commercial use
  per `fonts/Overseer-LICENSE.txt`; commercial use requires a paid licence from pixelsagas.com.
- **Share Tech Mono, VT323, IBM Plex Mono, Pixelify Sans, DotGothic16, Workbench** — each © their
  respective Project Authors, licensed under the SIL Open Font License 1.1 (scripts.sil.org/OFL).
- **Special Elite** — © 2010 Brian J. Bonislawsky / Astigmatic, licensed under the Apache License 2.0.
- **Fixedsys Excelsior** — © Darien Valentine, released to the public domain / CC0
  (github.com/kika/fixedsys).
```

```md
## Icons

- Icons made by {author name shown on the icon's game-icons.net page}. Available on
  https://game-icons.net (CC BY 3.0). Repeat one line per author used — check the icon's own page,
  not just the site, for the correct name.
```

---

## Bottom line / do & don't

**Do**
- Stay free, unaffiliated, non-commercial — this is what keeps almost everything above a ✅ or ⚠ instead
  of a ⛔. Add a small "unofficial fan project, not affiliated with Bethesda/ZeniMax" line somewhere
  visible (footer/About/CREDITS).
- Keep hand-authoring icons and CSS effects from scratch, as the project already does — it's the cleanest
  path and needs zero licence bookkeeping.
- Paraphrase all Fallout lore/timeline text for map pins in your own words; never paste wiki/game text
  verbatim.
- Keep the wasteland map's implemented public-domain geography + original presentation boundary; add lore
  summaries and overlays without tracing an in-game or fan-map texture.
- Attribute game-icons.net icons per-author as you adapt them (T88) — do it as you go, not as a batch
  cleanup later.
- Keep font credits and readable licence files with the distributed font files.

**Don't**
- Don't embed, trace, or closely imitate Vault Boy, the Vault-Tec logo, or actual Pip-Boy device art —
  this is the one category with a documented Bethesda enforcement history even against non-commercial
  sites.
- Don't keep self-hosting **Monofonto** or **Gothic 821 Condensed BT** without confirming a purchased
  webfont/embedding licence — both have free fallbacks already sitting in the repo (Share Tech Mono/IBM
  Plex Mono for Monofonto; Oswald, already in the CSS fallback chain, for Gothic 821).
- Don't add ads, paid access, or merch tied to Fallout branding — that's the change that would flip most
  of §1 and the Overseer font row from safe to risky.
- Don't republish a player's real photo pulled from Discord without their explicit okay to put it on the
  public site.
