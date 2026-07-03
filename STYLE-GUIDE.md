# Phosphor Terminal — CSS Theme Style Guide

A guide for building a CRT/atompunk "terminal readout" CSS theme, distilled from the
Yuma Tribe Roster. Written so another agent (or person) can reproduce the *system*, not
just copy the surface. The aesthetic: **green phosphor on deep black, monospace/pixel
type, soft glowing edges — a Fallout-1 Pip-Boy terminal rendered with restraint.**

It is plain hand-written CSS + vanilla JS. No framework, no build step, no CDN. Everything
self-hosted. That constraint is a feature: the whole theme is ~1 stylesheet of tokens +
components you can read top to bottom.

---

## 0. The five principles (read these first)

1. **One accent, everything else recedes.** The bright phosphor green is precious. Most of
   the UI lives in dim/faint greens on near-black. If everything glows, nothing reads.
2. **Soft edges for content, crisp edges for chrome.** Content panels *feather* (fade out);
   structural chrome (header underline, column borders, form controls) stays crisp. Mixing
   them is what makes the soft effect feel intentional rather than a blur filter.
3. **Legibility floor is non-negotiable.** A pixel font that looks "authentic" but can't be
   read has failed. Enforce a minimum size and WCAG-AA contrast on *every* background.
4. **Remove before you add.** Redundant labels, duplicate dividers, rarely-used buttons in
   prime space — cut them or decant them into a menu. Clutter is the default failure mode of
   a "data readout" aesthetic.
5. **Tokens, then components, then state.** Define custom properties once; build components
   from them; switch whole themes by flipping `data-*` attributes on `<body>`.
6. **Two surfaces — SCREEN and METAL (the Fallout-1 material law).** Everything rendered
   belongs to one of two physical materials, and each forbids the other's effects:
   - **SCREEN** — phosphor text *behind glass*, inset into the device. Glow, scanlines,
     terminal faces, data, cursors. Nothing physical can be "inside" it: no paper, no
     tape, no typewriter ink, ever.
   - **METAL** — the raised housing (`--panel-*`/`--rivet-*` tokens; the Chassis frame
     mode). Bevels, rivets, engraved type (dark, light catch — **never** glowing),
     physical controls (buttons, toggles, lamps), and *stuck-on artifacts*: label tape,
     taped paper, stamps. Typewriter/embossed faces exist only here.
   - The one lawful glow on metal is an **indicator lamp** — it is a light source, not
     phosphor text.
   When adding any effect, first ask *which material is this?* — that decides its
   tokens, its typography, and where it may appear.

---

## 1. Color tokens

Four greens, three backgrounds, one rare warning accent. That's the entire palette. Resist
adding more — depth comes from the *backgrounds*, not more hues.

```css
:root{
  --green:        #3cff7a;   /* primary phosphor — THE accent. Use sparingly. */
  --green-bright: #b6ffce;   /* highlights, titles, the value you want read first */
  --green-dim:    #21954d;   /* labels, secondary text — must clear WCAG-AA on every bg */
  --green-faint:  #0f3a22;   /* borders, rules, hairlines — decoration only, never text */
  --bg:           #050a06;   /* deep terminal black-green (page) */
  --bg-panel:     #07140c;   /* panel fill (one step up from bg) */
  --bg-panel-2:   #0a1d11;   /* raised fill (hover, selected, feathered glow) */
  --amber:        #ffd24a;   /* rare accent — warnings/disconnected only */
  --glow:         0 0 2px rgba(60,255,122,.5);
}
```

**The contract that keeps it readable:**
- `--green-dim` is the *floor for text*. It is tuned to clear ~4.5:1 against the lightest
  background it ever sits on. If you add a new lighter panel, re-check dim against it.
- `--green-faint` is *never* used for text — only borders, rules, box-shadows. Contrast
  doesn't matter for a 1px hairline; it does for a glyph.
- The three backgrounds are a ladder: `bg` < `bg-panel` < `bg-panel-2`. Elevation = one step
  up the ladder, not a new color.

**Building other palettes from this skeleton:** keep the *roles* (`accent / bright / dim /
faint` + `bg / panel / panel-2` + one warn), swap the hues. An amber-monochrome ("Reactor
Meltdown") or a cold blue ("Vault-Tec") theme is just seven recolored tokens — every
component inherits automatically.

---

## 2. Typography

### Fonts
- **Body/head:** a pixel or monospace face (`Fallout`, `VT323`, `Fixedsys`, fall back to
  `ui-monospace, monospace`). Self-host as `woff2` with `font-display:swap`.
- **Masthead/logo:** one condensed display face used *only* for the wordmark
  (here `Gothic 821`). A logo is not body text — give it its own face.
- Keep a fallback chain so a missing glyph degrades instead of disappearing.

### Two gotchas that bite with pixel fonts
1. **Em-fill varies wildly.** Two "same size" pixel fonts can differ 2× in visual size
   because one fills 44% of the em and another 88%. *Pick the face by how big it reads, not
   by its nominal px,* then set the default size to match. (We default pixel fonts to a
   larger step than legible "office" fonts for exactly this reason.)
2. **Stray glyphs render as tofu boxes.** Some pixel fonts map punctuation like `·` to a
   filled box. Scope such a face to printable ASCII so the rest falls back:
   ```css
   @font-face{ font-family:"JH Fallout"; src:url(...); unicode-range:U+0020-007E; }
   ```

### Size scale (set on `<body>`, switchable)
```css
body[data-textsize="cozy"]        { font-size:17px; }  /* the MINIMUM — still legible */
body[data-textsize="comfortable"] { font-size:19px; }  /* default for legible faces */
body[data-textsize="large"]       { font-size:23px; }  /* default for PIXEL faces */
body[data-textsize="xlarge"]      { font-size:26px; }
```
17px is the hard floor. Pixel fonts default to `large`; smooth fonts to `comfortable`.

### Hierarchy (the actual ladder used)
| Role | size | color | notes |
|---|---|---|---|
| Hero name | 52px | `--green-bright` | the one place a soft text-glow is allowed |
| Section heading | ~19–23px | `--green-dim` | uppercase, wide tracking (2.5px), **no glow** |
| Body prose | 18–23px | `--green` | line-height 1.6–1.8, measure ≤ ~58ch |
| Labels / meta | 15–17px | `--green-dim` | uppercase, tracked, **no glow** |
| Status chrome | 15px | `--green-dim` | dimmed (opacity .78), tracked |

### The glow rule
`text-shadow:var(--glow)` is on by default for body, but **stripped from all small/secondary
text** so it stays crisp:
```css
.row-sub, .idcell .k, .label, .tag, .statusline, ...{ text-shadow:none; }
```
Glow is for the hero name and ambient body — never for a 15px label. Readability beats vibe.

### Measure & rhythm
- Cap prose at `max-width:~58ch`. Long lines kill readability even on a terminal.
- Generous leading (1.6–1.8). Pixel bitmaps need air.
- For glossary-style lists (relationships, etc.): hanging indent + a faint left rule, and
  break into 2 columns only when there are ≥3 entries (a single entry stays full-width).

---

## 3. The soft-edge language (the signature move)

This is what makes the theme feel like a *glowing readout* rather than a set of boxes. Three
related techniques, all built on CSS masks/gradients.

### 3a. Feathered panel (no hard rim)
A hero panel is a *pool of light*, not a bordered box. Drop the border; paint the fill on a
masked pseudo-element that fades out on all four edges. The text sits on the solid plateau;
the fade lives in a bleed margin *outside* the content, so the glow reaches toward the edges
without clipping the text.

```css
.panel{ position:relative; isolation:isolate; padding:22px 0; }  /* vertical-only padding */
.panel::before{
  content:""; position:absolute; inset:-16px -40px; z-index:-1;   /* BLEED outward */
  background:var(--bg-panel-2);
  /* intersect a horizontal + vertical edge-fade → all four sides melt */
  -webkit-mask-image:
    linear-gradient(to right,  transparent, #000 24px, #000 calc(100% - 24px), transparent),
    linear-gradient(to bottom, transparent, #000 20px, #000 calc(100% - 20px), transparent);
  -webkit-mask-composite: source-in;   /* old WebKit */
  mask-image:
    linear-gradient(to right,  transparent, #000 24px, #000 calc(100% - 24px), transparent),
    linear-gradient(to bottom, transparent, #000 20px, #000 calc(100% - 20px), transparent);
  mask-composite: intersect;           /* standard */
}
```
Key relationships:
- **Bleed > fade.** With `inset:-40px` and a `24px` fade, the fill stays *solid* until ~16px
  beyond the content edge, then melts. Make the fade *smaller* than the bleed to keep more
  color near the edges; make it larger to fade sooner.
- **`padding` is vertical-only** so the panel's content aligns to the same left edge as
  whatever follows it. The glow widens via the pseudo's negative inset, *not* via padding —
  that's how you get "wider glow, still-aligned text."
- **`isolation:isolate` + `z-index:-1`** keeps the glow behind the panel's own content
  without escaping behind the page.
- **Responsive:** shrink the bleed on small screens (`inset:-8px -12px`) so it never exceeds
  the viewport gutter and triggers horizontal scroll.

### 3b. Fading divider (not a hard hairline)
Dividers fade at the ends instead of butting hard into the edges:
```css
/* a centered-label rule: ───────  LABEL  ─────── that fades outward */
.rule::before{ content:""; flex:1; height:1px; background:linear-gradient(to right, transparent, var(--green-faint)); }
.rule::after { content:""; flex:1; height:1px; background:linear-gradient(to left,  transparent, var(--green-faint)); }

/* an internal separator inside a panel, fading at both ends */
.subdivider{ border-top:1px solid; border-image:linear-gradient(to right,
  transparent, var(--green-faint) 18%, var(--green-faint) 82%, transparent) 1; }
```

### 3c. Scroll-edge fade
A scrolling list/region recedes softly into the frame instead of being chopped:
```css
.scroll-list{ overflow:auto;
  -webkit-mask-image:linear-gradient(to bottom, #000 calc(100% - 22px), transparent);
          mask-image:linear-gradient(to bottom, #000 calc(100% - 22px), transparent); }
```
**Gotcha:** if the list has a `position:sticky` header pinned at `top:0`, fade the *bottom
only* — a top fade would dim the sticky header.

### Where NOT to feather
Cards in a grid, modals, popovers, form controls, the app header underline, column borders.
These rely on crisp edges for separation and hit-targeting. Feathering them reads as *foggy*,
not *atmospheric*. Reserve the feather for the one or two hero surfaces.

---

## 4. CRT / atmosphere (subtle, optional, toggleable)

- **Scanlines + vignette** as fixed overlays at low opacity. Keep them faint enough to read
  through; offer a toggle for accessibility.
- **`prefers-reduced-motion`**: skip any boot/type-on animation and auto-dismiss it. Never
  trap the user behind an effect; always provide a click/keypress skip and a hard timeout.
- The phosphor **glow** (§2) is the primary atmosphere; scanlines are seasoning.

---

## 5. Components (recipes)

### Tag / status chip — "data key with an LED"
```css
.tag{ display:inline-flex; align-items:center; gap:7px;
  font-size:15px; letter-spacing:1.5px; text-transform:uppercase; color:var(--green-bright);
  padding:4px 11px 4px 9px; border:1px solid var(--green-faint);
  background:linear-gradient(180deg, rgba(60,255,122,.11), rgba(60,255,122,.025)); }
.tag::before{ content:""; width:5px; height:5px; background:var(--green);
  box-shadow:0 0 6px var(--green); }                       /* glowing LED marker */
.tag:hover, .tag:focus-visible{ border-color:var(--green);
  background:linear-gradient(180deg, rgba(60,255,122,.22), rgba(60,255,122,.07)); }
```
A faint green-tinted fill + a glowing dot reads as a terminal readout; a plain outlined box
reads as a generic web tag. Same effort, much better.

### Buttons
Square corners (this aesthetic is pixel, not rounded). `--bg-panel` fill, `--green-faint`
border, brighten to `--bg-panel-2` + `--green-bright` on hover. Confirmation feedback can
*invert*: `.copied{ background:var(--green); color:var(--bg); text-shadow:none; }`.

### Selected list row — accent bar, not a fill
Don't flood the row with bright green (shouty). Raise it one bg step and add a left accent:
```css
.row.active{ background:var(--bg-panel-2); box-shadow:inset 3px 0 0 var(--green); }
.row.active .row-name{ color:var(--green-bright); }
```

### Overflow ("More") menu — declutter rarely-used actions
Rarely-used actions (export, copy-link, edit) do not deserve prime header space. Collapse
them into one `⋯ More` button with an absolutely-positioned dropdown:
```css
.morewrap{ position:relative; }
.moremenu{ display:none; position:absolute; right:0; top:calc(100% + 6px); z-index:30;
  flex-direction:column; min-width:170px; padding:5px;
  background:var(--bg-panel-2); border:1px solid var(--green-faint);
  box-shadow:0 10px 26px -10px rgba(0,0,0,.85); }
.morewrap.open .moremenu{ display:flex; }
```
Behavior to wire: toggle on click, close on outside-click **and** Escape, keep open after a
"Copy" (so its confirmation shows) but close after a navigating action (Export). Set
`aria-haspopup`/`aria-expanded` and `role="menu"`/`role="menuitem"`.

### Data grid (key/value facts)
A responsive auto-fit grid; keys are dim+uppercase+tracked, values are bright. Widen the
column min so values read in full lines rather than hyphenating:
```css
.idgrid{ display:grid; grid-template-columns:repeat(auto-fit, minmax(240px,1fr)); gap:16px 32px; }
.idgrid .k{ font-size:17px; color:var(--green-dim); text-transform:uppercase; letter-spacing:1.5px; }
.idgrid .v{ color:var(--green-bright); }
```

### Status strip — quiet chrome
Strip verbose labels; let format carry meaning. `DATA LINK: ONLINE → ● ONLINE`,
`UNITS: 43 → 43 UNITS`, `LAST SYNC: 13:55:48 → SYNC 13:55`. Dim it (`opacity:.78`, 15px,
tracked); the one live status **dot** is the only accent.

### Long-form reading view — re-theme an external document, don't iframe it
To show an external doc (e.g. a Google Doc) *in your theme*, don't iframe it (you can't
restyle cross-origin content). Instead **fetch its HTML and rebuild it from a whitelist**:
- Fetch the document's HTML export. (Google Docs' `…/export?format=html` is CORS-readable for
  a link-shared doc — `fetch()` returns `type:"cors"`; no backend needed.)
- Walk the parsed DOM and re-emit only allowed elements (`h1–h4, p, ul/ol/li, a, table, img,
  strong/em…`), **dropping every inline style/class**. This both themes it (your CSS owns the
  look) *and* sanitises it (no scripts/handlers survive). Escape all text; only allow
  `http(s):`/`data:image/` URLs.
- For reading comfort: **display headings in a characterful face, body in a clean readable
  mono** (long prose in a chunky pixel font is tiring); em-based heading sizes; ~70–74ch
  measure; space-above-headings proportional to level.
- **Diagrams on a dark theme:** raster diagrams are usually drawn dark-ink-on-light, so they
  vanish on a dark background. Mount them on a light "schematic plate" (`background:#e7e5da`)
  so they stay legible — or, if you control them, author them transparent-bg with light/green
  strokes and drop the plate. (Note: tools like Google Docs rasterise everything to PNG on
  export — you can't get an SVG out of one.)

---

## 6. Layout & spacing

- **Alignment is a feature.** Everything in a column shares one left edge. We verify by
  measuring `getBoundingClientRect().left` — eyebrow, portrait, data keys, and body prose
  all landed on the same px. If a panel needs to be wider than its text, widen it with an
  *outset background*, not text padding.
- **Negative space chunking.** Break dense prose into labeled chunks; ~10 words per column is
  a comfortable target. More air > more density.
- **Elevation by background step**, not by shadow soup. A panel is `--bg-panel`; a raised
  thing is `--bg-panel-2`. Shadows are reserved for genuinely floating layers (menus, modals).

---

## 7. Theming mechanics (how to make it switchable)

Drive everything from `<body data-*>` attributes; persist choices in `localStorage`; apply on
load. No per-element overrides — components read tokens, attributes swap tokens/fonts.

```js
// pattern
function applyTheme(key, value){
  document.body.setAttribute('data-' + key, value);   // e.g. data-textsize="large"
  localStorage.setItem('app-' + key, value);
}
```
```css
body[data-font="workbench"] .doss-name{ font-family:"Workbench"; ... }
body[data-textsize="large"]{ font-size:23px; }
body[data-frame="border"] .app{ /* optional decorative bezel */ }
```
This is how one stylesheet supports many presets (color schemes, fonts, density, CRT on/off,
text size, decorative frame) without forking CSS. Also sync `<meta name="theme-color">` to
the active background so mobile browser chrome matches.

---

## 8. Accessibility (the floors, restated as rules)

- **Contrast:** body/labels ≥ 4.5:1; large text/decoration ≥ 3:1. Tune `--green-dim` against
  the *lightest* background it appears on, not the darkest.
- **Min text size 17px** for prose and labels. Pixel fonts especially — "authentic but
  unreadable" is a bug. (Allowed exception: short uppercase *chip* labels like tags sit at
  ~15px — they're glanceable tokens, tracked and bright, not reading text.)
- **No glow on small text.** It smears at small sizes.
- **Keyboard:** every interactive chip/menu is focusable with a visible `:focus-visible`
  state; menus close on Escape; modals trap focus.
- **Motion:** honor `prefers-reduced-motion`; effects are skippable and time-bounded.
- **Live regions:** status/count updates go in an `aria-live="polite"` region.

---

## 9. Anti-patterns (learned the hard way)

- ❌ Bright green everywhere → ✅ one accent, lots of dim.
- ❌ A divider line *and* a bordered box stacked → ✅ one container, one (fading) separator.
- ❌ Padding to widen a panel (misaligns text) → ✅ outset background, vertical-only padding.
- ❌ Feathering everything → ✅ feather hero content; keep chrome crisp.
- ❌ Top scroll-fade over a sticky header → ✅ bottom-only fade.
- ❌ Verbose status labels & every button in the header → ✅ trim labels, decant to `⋯ More`.
- ❌ Picking a pixel font by nominal px → ✅ pick by how big it *reads*; set default to match.
- ❌ Negative-inset glow wider than the mobile gutter → ✅ shrink bleed in the breakpoint.

---

## 10. Minimal starter

```html
<body data-textsize="large" data-font="fallout">
  <div class="panel">
    <h1 class="hero">UNIT NAME</h1>
    <div class="tags"><span class="tag">CHIEF</span><span class="tag">SHAMAN</span></div>
    <div class="idgrid">
      <div><div class="k">True Name</div><div class="v">…</div></div>
    </div>
  </div>
</body>
```
Define the tokens (§1), set body bg/color/font (§2), add the panel feather (§3a), the tag
chip (§5), and the data grid (§5). That's a coherent phosphor terminal in well under 100
lines of CSS. Everything else is the same five principles applied again.
