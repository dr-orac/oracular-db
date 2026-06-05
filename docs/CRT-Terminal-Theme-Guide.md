# CRT / Terminal Theme + Live-Sheet Viewer — Reusable Design Guide

A distilled, project-agnostic guide to the techniques used to build a Fallout-style
"Pip-Boy" terminal web app that renders live data from a Google Sheet. Drop this into
another project's context to reproduce the look, the theming system, and the
no-backend data plumbing. Nothing here is specific to any one dataset.

The whole thing is intentionally a **single static `index.html`** (HTML + CSS + vanilla
JS, no build step, no framework). That portability is a feature: it deploys to GitHub
Pages or any static host by copying one file.

> **Drop-in stylesheet:** the reusable distilled version lives in **`crt-theme.css`**
> (sibling file). `<link>` it, set `<html data-theme="green" data-bg="phosphor"
> data-font="terminal">`, add `<div class="scanlines"></div><div class="vignette"></div>`,
> and you have the whole look with switchable themes and no JS. This markdown is the
> "why / how it fits together"; the CSS file is the "paste-and-go".

---

## 1. The CRT / phosphor aesthetic

The look is four cheap effects layered over a near-black background:

1. **A single accent "phosphor" colour** used for almost everything (text, borders, icons), with a few brightness variants.
2. **Text glow** via `text-shadow`.
3. **Scanlines** — a repeating dark gradient overlay.
4. **Vignette + subtle flicker** for the CRT curve/instability feel.

### Palette as CSS variables (the key to theming)

Define every colour and font as a CSS custom property on `:root`. Everything else
references the variables, never literals. This is what makes runtime theming a
two-line operation later.

```css
:root{
  --accent:        #3cff7a;   /* primary phosphor */
  --accent-bright: #b6ffce;   /* titles / highlights */
  --accent-dim:    #1f8a47;   /* labels / secondary text */
  --accent-faint:  #0f3a22;   /* borders / rules */
  --bg:            #050a06;   /* deep near-black */
  --bg-panel:      #07140c;
  --bg-panel-2:    #0a1d11;
  --glow:          0 0 4px rgba(60,255,122,.55);
  --font-body:     "Share Tech Mono", ui-monospace, monospace;
  --font-head:     "VT323", monospace;
}
body{ background:var(--bg); color:var(--accent); font-family:var(--font-body);
      text-shadow:var(--glow); }
```

### Scanlines, vignette, flicker

Two fixed, `pointer-events:none` overlays plus an optional flicker keyframe. Gate them
behind a body class (`.crt`) so users can switch the effect off.

```css
.scanlines{ position:fixed; inset:0; z-index:9000; pointer-events:none;
  background:repeating-linear-gradient(to bottom,
    rgba(0,0,0,0) 0 2px, rgba(0,0,0,.28) 3px 4px); mix-blend-mode:multiply; }
.vignette{ position:fixed; inset:0; z-index:9001; pointer-events:none;
  box-shadow:inset 0 0 160px 30px rgba(0,0,0,.7);
  background:radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.55)); }
body.crt .app{ animation:flicker 6s steps(1) infinite; }
@keyframes flicker{ 0%,100%{opacity:1} 50%{opacity:.965} 73%{opacity:.98} }
@media (prefers-reduced-motion: reduce){ body.crt .app{ animation:none } }
```

**Always honour `prefers-reduced-motion`** and make the CRT effect toggleable — the glow
and scanlines hurt readability for some users.

---

## 2. Theming system (colour / background / font presets)

Because every style references CSS variables, a "theme" is just a small object of values
that you write onto `:root` in JS, then persist to `localStorage`.

```js
const THEMES = {
  green: { accent:"#3cff7a", bright:"#b6ffce", dim:"#1f8a47", faint:"#0f3a22", glow:"rgba(60,255,122,.55)" },
  amber: { accent:"#ffb642", bright:"#ffe0a3", dim:"#9a6a22", faint:"#3a2a0e", glow:"rgba(255,182,66,.5)" },
  blue:  { accent:"#5db4ff", bright:"#c8e8ff", dim:"#2c6a9e", faint:"#10304a", glow:"rgba(93,180,255,.5)" },
  // cyan / white / magenta / red ...
};
function applyTheme(key){
  const t = THEMES[key], r = document.documentElement.style;
  r.setProperty("--accent", t.accent);   r.setProperty("--accent-bright", t.bright);
  r.setProperty("--accent-dim", t.dim);  r.setProperty("--accent-faint", t.faint);
  r.setProperty("--glow", "0 0 4px " + t.glow);
  localStorage.setItem("theme", key);
}
```

Same pattern for **backgrounds** (`--bg`, `--bg-panel`, `--bg-panel-2` → warm/cool/black)
and **fonts** (`--font-body`, `--font-head`). Restore all three on load from
`localStorage` before first paint.

**Readability tips when choosing accent colours on dark:** avoid pure primary blue
(`#00f`) — lift it toward azure; keep "white" slightly tinted/grey, not `#fff`; give each
colour a *bright* variant for titles and a *dim* variant for labels so hierarchy survives
the monochrome palette.

---

## 3. Fonts & licensing (important)

Retro/game fonts found on font-sharing sites are frequently **"free for personal use
only"** — that licence does **not** permit embedding/redistribution in a hosted web app.
Don't ship those. Use openly-licensed (SIL OFL) fonts that Google Fonts serves with a
free commercial/web-embed licence. Good terminal/pixel choices:

| Font | Licence | Vibe / best for |
|------|---------|-----------------|
| **VT323** | OFL | DEC VT320 terminal — body + headings |
| **Share Tech Mono** | OFL | clean mono — readable body |
| **Pixelify Sans** | OFL | blocky-but-readable pixel — whole-UI pixel look |
| **IBM Plex Mono** | OFL | clean technical mono (used in Fallout-4 UI mods) |
| **DotGothic16** | OFL | dot-matrix / ticker-tape feel |
| **Silkscreen** | OFL | tiny LED/segment look — labels, accents |
| **Press Start 2P** | OFL | 8-bit arcade — headings only (too heavy for body) |

Offer several font presets that swap `--font-body` / `--font-head`.

**On "the Fallout font" specifically:** the series' real fonts and their reusability:
- **Monofonto** (FO3/NV HUD) — Typodermic "Free Desktop License"; desktop use is free but
  **web embedding is not clearly granted** — treat as unsafe to self-host without checking.
- **Fixedsys Excelsior** (FO3/NV terminals & Pip-Boy) — released **CC0 / public domain**, so
  it *is* safe to self-host via `@font-face`; this is the most authentic terminal look.
  Build/download: `github.com/kika/fixedsys` (ships `FSEX302.ttf`). Convert TTF→WOFF2 with
  `fonttools` (`f.flavor="woff2"; f.save(...)`) — ~100KB — and embed as a base64
  `@font-face` data URL to keep the page a single file. (Done in this project.)
- **Overseer** (the logo font) — fan font, typically **free-for-personal-use only** → don't
  embed. The logo is close to *Futura Display* anyway.
- Fonts grabbed from font-sharing sites are very often "free for personal use only," which
  does **not** cover embedding/redistribution in a hosted app. When in doubt, use an OFL
  look-alike (table above) or have the user supply a licensed file.

---

## 4. CRT iconography (SVG)

Hand-built inline SVG icons that inherit the theme colour automatically:

- `stroke:currentColor; fill:none` so they recolour with the active theme for free.
- `filter:drop-shadow(var(--glow))` to match the text glow.
- Match by keyword: map a data string (e.g. a category) to an icon key, matching the
  **first line only** with **word boundaries** so prose can't trigger false matches
  (`/\bcat\b/` won't fire on "communicated").

```js
const ICONS = { paw:`<circle .../>`, owl:`<circle .../>`, /* ... */ };
const svg = (key,cls="") => `<svg class="ic ${cls}" viewBox="0 0 24 24">${ICONS[key]||ICONS.paw}</svg>`;
```
```css
.ic{ width:1em; height:1em; fill:none; stroke:currentColor; stroke-width:1.6;
     stroke-linejoin:round; filter:drop-shadow(var(--glow)); }
```

---

## 5. Photos as "terminal mugshots"

To make arbitrary uploaded images look on-theme:

```css
.portrait img{ object-fit:cover; image-rendering:pixelated;   /* crisp pixel art */
               filter:grayscale(1) brightness(1.35) contrast(1.22); }
.portrait .tint{ position:absolute; inset:0; background:var(--accent);
                 mix-blend-mode:multiply; opacity:.5; }       /* green/amber monochrome */
.portrait::after{ /* scanlines + light vignette, as section 1 */ }
```

- **Grayscale + a multiply-blended accent layer** = monochrome phosphor photo. Lift
  `brightness` first because game sprites are often dark and get crushed otherwise.
- **`image-rendering:pixelated`** keeps pixel-art sprites sharp when scaled.
- **Body + face crops:** from one screenshot, produce a full-figure crop *and* a tight
  head crop; pad to square and upscale with nearest-neighbour (2×) to stay crisp. A
  simple heuristic for top-down/3-quarter sprites: the head sits in the upper-centre, so a
  face crop ≈ the top ~45% of the subject's bounding box, centred horizontally.
- **Adaptive gallery:** one large primary + up to two smaller secondaries stacked beside
  it. Lay out with fl: main fixed-size, a column of secondaries whose combined height
  matches the main. Make it read well at 1, 2, and 3 images; click a secondary to promote
  it to primary.

---

## 6. Live data from a public Google Sheet (no backend, no API key)

A static page can read a sheet shared **"Anyone with the link → Viewer"** via the
visualization endpoint, which **is CORS-enabled** (it echoes the requesting `Origin`):

```
https://docs.google.com/spreadsheets/d/<SHEET_ID>/gviz/tq?tqx=out:csv
```

- Append `&gid=<tab gid>` for a specific tab and `&_=<Date.now()>` to bust caches.
- Works from any real `http(s)` origin (GitHub Pages, etc.). **It will *not* work from
  `file://`** — the browser sends a `null` origin that Google rejects. Use a tiny static
  server locally.
- Google caches a few minutes, so "live" means "fresh on load," not realtime.

Parse the CSV yourself (handle quoted fields, `""` escapes, and embedded newlines/commas).
Then be defensive about real-world sheet shape:

- **Find the header row** by content (e.g. the row containing a known column name) instead
  of assuming row 0 — sheets often have title/description rows above the headers.
- **Map columns by fuzzy header match** (substring of the normalised header) so reordering
  or renaming columns doesn't break the app. Remember each field's *actual* header text if
  you ever write back.
- **Section dividers:** treat rows with only one cell filled as group headings.
- Build stable **slugs** from a name field for permalinks (`#id=<slug>`, dedupe collisions).

---

## 7. Optional write-back (still no server of your own)

A static site can't write to a Sheet (no credentials). The standard no-server solution is
a **Google Apps Script web app** bound to the sheet, deployed as "execute as me / anyone
can access". The page POSTs to its `/exec` URL; the script (running as the owner) edits
cells and can save uploads to Drive.

CORS gotchas that actually bite:
- **Don't set `Content-Type: application/json`** on the fetch — that triggers a CORS
  preflight Apps Script won't answer. Send a plain string body (defaults to
  `text/plain`) and `JSON.parse(e.postData.contents)` in the script.
- Apps Script can't set response headers, but its `/exec` 302-redirects to a
  `googleusercontent.com` URL that *does* send `Access-Control-Allow-Origin: *`, and
  `fetch` follows the redirect — so simple POSTs work.
- Match rows by a stable key (e.g. a name column); normalise header whitespace on both
  sides before matching (sheet headers often contain newlines).
- For image upload: downscale + re-encode to JPEG **client-side via canvas** before
  POSTing (keeps payloads small); the script base64-decodes, saves to a Drive folder, sets
  link-sharing, and writes the URL back. Public Drive image URL form that currently works:
  `https://lh3.googleusercontent.com/d/<FILE_ID>`.

### Auth for a public write endpoint

A public page with a live write URL means anyone can POST. For a small trusted group, a
**soft passphrase gate** is a reasonable middle ground: keep the secret **server-side** (a
Script Property), prompt for it in the UI, send it with each write, reject mismatches.
Be honest that this is deterrence, not real security — for stronger control use Google
sign-in / an allow-list.

---

## 8. UX niceties that sell the theme

- **Permalinks:** `#id=<slug>` opens a specific record; add a "copy link" button. Honour
  the hash on load and on `hashchange`.
- **Keyboard nav:** `/` focuses search; `↑/↓` (and `j/k`) step through the list;
  `Esc` closes overlays. Guard against firing while typing in an input/textarea.
- **Graceful states:** themed loading ("ACCESSING…") and error states; an offline/error
  state that tells the user exactly what to fix (e.g. sheet sharing).
- **Persistence:** remember view mode, theme, font, and CRT toggle in `localStorage`.
- **Status line:** a "DATA LINK: ONLINE · LAST SYNC hh:mm:ss" strip reinforces the
  terminal fiction and doubles as real feedback.

---

## 9. Further ideas (not yet built / worth considering)

- **Boot sequence:** a short skippable "RobCo terminal boot" type-on overlay at load.
- **Teletype reveal:** type long text fields in character-by-character on open.
- **(Built) Auto mugshot from a body shot:** instead of a separate generated file, render
  the primary as the same image CSS-zoomed into the upper-centre
  (`transform:scale(2.3); transform-origin:50% 20%`) with `image-rendering:auto` + a tiny
  `blur()` to smooth the upscale — a "camera-feed" mugshot, no canvas/storage needed.
  Pair it with a **Front / Side** upload (both optional); secondaries show the full shots.
- **Optional audio:** subtle key-clack / beep on navigation, behind a mute toggle.
- **Export/print** a single record as a styled "dossier" sheet.
- **Bloom/scanline intensity slider** and a "high-readability" low-glow mode.

---

## 10. Principles worth keeping

- One self-contained static file; config (sheet id, endpoints) in one obvious block at top.
- Everything themable flows through CSS variables — no colour/font literals scattered around.
- Read is free and safe; treat write as privileged and clearly separated.
- Be defensive about messy real-world data (header rows, blank rows, reordered columns).
- Respect reduced-motion, keep contrast/readability switchable, and never ship a
  personal-use-only font in a hosted project.
