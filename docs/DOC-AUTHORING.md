# Writing for the Tribe Lore / Roleplay Guide docs

A quick guide for anyone editing the two Google Docs that show up as tabs on the
site (**Tribe Lore**, **Roleplay Guide**). The site fetches these docs and re-renders
them in the terminal theme automatically — you don't need to touch any code, just
know a few things that affect how it looks and how fast it loads.

## Keep images small

This is the single biggest thing you can do to keep the site fast. When you paste or
insert an image, Google embeds the **original file**, at full resolution, into the
page — even if you then drag its corners to make it look smaller on the page. A
photo straight off a phone or a full-size screenshot can be several megabytes, and
that has to download before the doc can show up on the site.

**Resize the image file itself before you insert it** — aim for **around 1200px on
the long side**. Any image editor, Preview (Mac), Paint (Windows), or a free online
resizer works. If it's already inserted and looks big, it's worth swapping it for a
smaller version rather than just shrinking it on the page.

## Give images alt text

Right-click an image → **Alt text**, and add a short description. On the site, that
description becomes the caption printed under the image in its terminal frame. It's
also just good practice for anyone using a screen reader.

## Use Title / Subtitle styles for headings

If you use Google's **Title** paragraph style (Format → Paragraph styles → Title)
for the doc's main heading, it becomes the big glowing masthead at the top of the
page. A second Title-styled line (or a **Subtitle**-styled one) renders underneath
it as a smaller subtitle line. Regular **Heading 1/2/3** styles become the normal
in-page section headings and populate the table of contents on the side.

## Pull quotes

Start a paragraph with `>` followed by a space (e.g. `> "Kin to kin, we hold each
other up."`) and it renders as a highlighted, indented quote block instead of a
normal paragraph.

For a quote you want to really stand out — a longer passage, verse, or scripture —
**put it in a box**: the most reliable way is a **1×1 table** (Insert → Table → 1×1),
type the quote inside. A single-celled box renders as a fully-framed, centred
pull-quote that glows off the screen. (A table with more than one cell still renders
as a normal data table, so only use 1×1 for quote boxes.)

## Keep the two docs separate

Lore and Roleplay are split into two docs on purpose — a shorter, focused doc loads
faster and is much less overwhelming to read than one giant combined document.
Please keep new material in whichever of the two it actually belongs to, rather
than merging them back together or starting a third doc without asking (a third
doc means a new site tab has to be added in the code).

---

*Technical detail for maintainers, not needed for authoring: see "Doc reader" in
[MAINTENANCE.md](../MAINTENANCE.md).*
