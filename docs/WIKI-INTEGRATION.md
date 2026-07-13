# Wiki integration — Tribe Lore + Roleplay Guide onto the MediaWiki (plan, 2026-07-11)

The user has **direct edit access to the admins' MediaWiki** (`wiki.misfitsystems.net`). Question:
integrate the **Tribe Lore** and **Roleplay Guide** into the wiki so they can be read there too — and
how best to do it, including images. This reshapes the answer: it's not "mirror the Google Docs into the
app's wiki reader", it's **move the content onto the wiki and let the wiki be the single source**.

## Decision — the wiki becomes the single source of truth for lore/guide content

Today those two sections are **Google Docs** (`DOCS = [{id:lore, docId:…},{id:roleplay, docId:…}]`,
loaded by `loadDoc`). Recommend **moving them to wiki pages** and having the app read them through the
**existing wiki reader** (`loadWiki`), retiring the Google-Doc source for them.

Why this is the right call (and not double-maintenance):
1. **One source, less entropy.** The recurring project goal. One canonical copy on the wiki instead of a
   Doc the app reads + a wiki page humans read.
2. **Images actually work.** The sandbox (and, more importantly, the deployed reader) can reach the wiki
   host but **Google-Doc images are effectively unusable** (Drive/Docs image endpoints don't render
   reliably cross-origin). Wiki images are served from the wiki host the reader already fetches from — so
   **moving to the wiki is what makes images possible at all.**
3. **Public + discoverable.** The lore/guide become real wiki pages the whole community finds, not a
   link-shared Doc.
4. **The reader is already good.** `loadWiki` → `renderWiki` re-skins the MediaWiki HTML into the terminal
   theme (hero/callout/card-grid/columns), builds a TOC sidebar (`buildDocSidebar`/`styleTOC`), makes
   internal wiki links browse in-app with Back/Forward history, and has in-doc find. Lore/guide inherit
   all of that for free.

## The one blocking app change — STOP stripping images

`loadWiki` currently **deletes every image**:
```
tmp.querySelectorAll("… img,figure,.thumb").forEach(e=>e.remove());  // "the wiki has no images"
```
That comment is about to stop being true. Before any wiki image can show in the app, this must change to:
- **keep** `img` / `figure` / `.thumb`,
- rewrite each `src`/`srcset` to an **absolute** wiki-host URL via the existing `wikiAbs()` (MediaWiki
  emits `/images/…` relative paths),
- wrap them as themed **doc figures** (same treatment as roster portraits: the `--img-hue/--img-sat`
  duotone + a bordered frame + caption from the MediaWiki `<figcaption>`/`thumbcaption`),
- keep `loading="lazy"` and a sane `max-width`.

This is valuable **on its own**, independent of the lore/guide move — any wiki page with images renders
properly afterwards.

## App changes (in order)

1. ✅ **DONE (2026-07-11)** — **Un-strip + theme wiki images.** `loadWiki` no longer removes images; a new
   `normaliseWikiImages()` rewrites thumbs/galleries/inline images into bare `<img>` (absolute src via
   `wikiAbs`, caption lifted from `<figcaption>`/gallery text into `alt`, the File: wrapper link removed so
   the image isn't a broken nav target); `renderWiki` wraps a top-level `<img>` so `docClean` re-skins it
   as a themed `.docfig`; `armWikiFigures()` clears the loading state as each image settles. The wiki has
   **zero images today**, so this was verified synthetically (thumb + gallery + a real data-URI image):
   absolute src, lifted captions, unwrapped links, 3 themed figures, live render + fade-in, no regression.
2. **Generalise the section source model.** A faction "doc" tab becomes source-tagged:
   `{ id, label, source:{kind:"wiki", page:"The_Tribe/Lore"} }` **or** `{…, source:{kind:"gdoc", docId}}`.
   `setSection` dispatches: `kind==="wiki"` → `loadWiki(page)`, `kind==="gdoc"` → `loadDoc(doc)`. (Back-
   compat: a bare `docId` still means gdoc.) This is the `{type, source}` groundwork already noted for T28.
3. **Point the Tribe's Lore + Roleplay tabs at their wiki pages** once the pages exist. Row-2 nav and the
   home tiles are unchanged — only the source flips.
4. *(Optional)* keep the Google-Doc id as a **fallback** if the wiki fetch fails, or just drop it.

## Wiki page structure — recommendation

Match the admins' existing naming first (check whether a "The Tribe" page and subpages already exist).
Two clean options:
- **A — subpages (recommended):** `The_Tribe/Lore` and `The_Tribe/Roleplay_Guide`. One wiki page = one app
  tab, 1:1 with the current sections. Cleanest mapping; each is independently linkable/editable.
- **B — sections of the faction page:** one `The_Tribe` page with `== Lore ==` / `== Roleplay ==`
  headings. Fewer pages; the app would deep-link to the anchor. Better if the admins prefer one page per
  faction.

Either works with the reader. Default to **A** unless the wiki's convention says otherwise.

## Sequence

1. (me) Ship the image un-strip + theming — useful regardless. Verify on an existing image-bearing page.
2. (user) Create the wiki pages, paste the lore/guide content, add images (how-to below).
3. (me) Generalise the source model + flip the Tribe's two tabs to their wiki pages. Verify in the app.
4. (both) Confirm the rendered lore/guide read well in-theme; tune `renderWiki` for any new structures the
   user's wikitext introduces (tables, templates, galleries).

---

# MediaWiki how-to (for the user)

## Editing / creating a page
- **Edit an existing page:** open it, click **Edit** (VisualEditor, WYSIWYG) or **Edit source**
  (wikitext). For pasting structured content, wikitext is more predictable.
- **Create a new page:** go to its URL directly, e.g.
  `https://wiki.misfitsystems.net/wiki/The_Tribe/Lore` — MediaWiki shows a "create" prompt. Or type the
  title in search and click the red link. Subpages use a `/` in the title.
- **Save:** add a short edit summary and **Save changes**. Every edit is versioned (History tab) and fully
  revertable, so it's safe to experiment.

## Wikitext basics (source editor)
```
== Section heading ==        ← H2   (=== … === is H3)
'''bold'''   ''italic''
* bullet                     # numbered
[[The Tribe]]                ← internal link
[[The Tribe|the Yuma]]       ← internal link, custom text
[https://example.com label]  ← external link
----                         ← horizontal rule
{| class="wikitable"         ← table start
! Header !! Header
|-
| cell || cell
|}                           ← table end
```
The app's `renderWiki` already re-skins headings, lists, tables, and coloured `<div>` boxes
(banner/callout/alert/card-grid) into the terminal theme — so mirror the **Main Page's** box style for
callouts if you want them themed the same way in the app.

## Images
1. **Upload:** use **Special:Upload** (or the "Upload file" link). Pick a PNG/JPG, give it a clear name —
   it becomes `File:Yuma_Firepit.png`. *(If you don't see an upload option, uploads may be admin-gated —
   ask the admins to enable it for your account or to upload on your behalf.)*
2. **Place it on a page:**
   ```
   [[File:Yuma_Firepit.png|thumb|right|320px|The tribe's central fire.]]
   ```
   `thumb` = framed thumbnail with caption; `right`/`left`/`center` = float; `320px` = width; last field =
   caption. For a plain inline image drop `thumb` and the caption.
3. **Galleries** (several images):
   ```
   <gallery>
   File:A.png|Caption A
   File:B.png|Caption B
   </gallery>
   ```
4. **Licensing (important for this project):** the upload form asks for a **source + licence**. Use only
   images you **own or that are properly licensed** — no trademarked Fallout/Bethesda art and no AI-
   generated art on the public wiki, consistent with the repo's originals-only rule. Screenshots of your
   own SS14 sessions or your own artwork are the safe path; state the licence you intend (e.g. the wiki's
   default content licence) on upload.
5. **In the app:** once the image-un-strip change (above) ships, `thumb`/`File:` images render as themed
   figures in the reader — served from the wiki host, so they load where Google-Doc images can't.

## Tips
- **Preview** before saving (Show preview) — cheap, catches wikitext mistakes.
- Keep headings shallow (H2/H3) — they drive the app's TOC sidebar.
- Internal `[[links]]` between your pages become **in-app navigation** automatically (the reader
  intercepts wiki links and loads them without leaving the terminal).

---

# Converting the Google Docs → wikitext (the fast path)

Don't retype the guides by hand — convert them. The two source docs are:
- **Tribe Lore** — `https://docs.google.com/document/d/1N_gne2LAWEJpjp6CfLhtvuHHD8bm97d64V0dHoXnlIE/`
- **Roleplay Guide** — `https://docs.google.com/document/d/1lQrOZ-UPOR8-FP58l8ZFMvSPOyYDb5BYvvkwg0dR1oU/`

Target page names (option A, subpages — 1 wiki page per app tab):
`The_Tribe/Lore` and `The_Tribe/Roleplay_Guide`.

## Method A — pandoc (recommended, ~2 min, keeps headings/bold/lists/tables)
1. In each Google Doc: **File → Download → Microsoft Word (.docx)**. (Word keeps structure far better than
   plain text; pandoc reads it natively.)
2. Install pandoc once — macOS: `brew install pandoc` (or download from pandoc.org).
3. Convert each file to MediaWiki markup:
   ```bash
   pandoc "Tribe Lore.docx"        -f docx -t mediawiki --wrap=none -o tribe-lore.wiki
   pandoc "Roleplay Guide.docx"    -f docx -t mediawiki --wrap=none -o tribe-roleplay.wiki
   # If a doc has images, add:  --extract-media=./media   (then upload those via Special:Upload)
   ```
4. Open the `.wiki` file, **copy all**, paste into the wiki page's **Edit source** box, **Show preview**,
   then **Save**.

## Post-conversion cleanup (5-minute pass — pandoc is good, not perfect)
- **Headings:** make sure the top level is `== H2 ==` (pandoc may emit `= H1 =`; the app reserves H1 for the
  page title). Demote everything one level if so.
- **Drop cruft:** delete the Google title/author line if pandoc carried it in as body text — the wiki page
  title is the H1.
- **Label lead-ins:** the reader auto-bolds a short `Word:` at the start of a line as a mini-heading, so
  `'''Rank:''' description` reads consistently — keep those short and Capitalised.
- **Tables:** confirm they became `{| class="wikitable" … |}`. Keep them from getting very wide (the app
  reflows wide tables, but fewer/wider columns read best). See `WIKI-EDITS-TODO.md §5`.
- **Links:** turn plain-text cross-references into `[[The_Tribe/Lore|the lore page]]` so they become in-app
  navigation.
- **Add at the BOTTOM of each page** so it lands in the app's site-map + carries a credit:
  ```
  [[Category:Factions]]
  <!-- Lore/guide by Big Brom Matlok, for the Wasteland Tribe. -->
  ```
  (Category names the app groups by: **Server & Rules · Factions · Weapons · Crafting · Survival · Lore ·
  Gameplay · Mechanics** — `Factions` is right for these.)

## Method B — no pandoc? two fallbacks
- **Paste it to me.** Copy the doc body and paste it into our chat; I'll hand you the finished wikitext for
  both pages (I can't fetch your Google Docs from here — they're network-blocked in my environment).
- **Manual**, using the wikitext cheat-sheet above — fine for short docs, tedious for long ones.

## Page skeleton (fill from the converted text)
```mediawiki
The '''Wasteland Tribe''' ... one-line intro.

== <first section> ==
Prose. '''Label:''' short lead-ins read as mini-headings in the app.

* bullet
* bullet

== <next section> ==
...

[[Category:Factions]]
```
The Roleplay Guide already opens with *"A first draft, by Big Brom Matlok"* + a *"Your First Steps in the
Tribe"* section — keep that shape; just let the `==` headings carry the structure (not bold-as-heading).

## After the pages exist — tell me
I flip the Tribe's **Lore** and **Roleplay** tabs from the Google-Doc source to the wiki pages (source model
+ 2-line config change, WIKI-INTEGRATION "App changes" step 2–3) and verify they render in-theme. The row-2
tabs, home tiles, and deep-links (`#tribe/lore`, `#tribe/roleplay`) stay the same — only the source flips,
and the content becomes wiki-editable + shows on the public wiki too.
