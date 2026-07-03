# CRT layer comparison — native vs. Enhanced vs. the CodePen reference

T2 deliverable. Report only — no code changed by this task. Compares what we actually
ship against `css-crt-screen-effect` by lbebber (`Codepen Downloads/css-crt-screen-effect`,
MIT), the pen flagged as an "easy win" candidate.

## What we ship today (two layers, one toggle away from each other)

### 1. Native (`styles.css` — always active when `body.crt`, the default)

- **Scanlines**: one fixed, full-viewport `repeating-linear-gradient` (4px cycle,
  multiply blend). `.vignette`: a radial gradient + inset box-shadow. Both are static
  `<div>` overlays — no animation.
- **Flicker**: `body.crt .app{ animation:flicker 6s infinite steps(1) }` — two quick
  opacity dips per cycle (99% of the time full opacity). `prefers-reduced-motion`
  disables it.
- **Glass sheen** (`.glass`, off by default): a faint diagonal + radial white gradient,
  `mix-blend-mode:screen`.
- **Cost**: two-to-three fixed-position overlay divs and one slow, steps-based
  animation. No JS, no filters, no canvas. This is about as cheap as a CRT effect can
  be — negligible paint/composite cost, nothing to optimize.

### 2. "Enhanced CRT" (`crt-screen-integration.js` + vendored `vendor/crt-screen/`, opt-in toggle)

- Vendored library (`crt-screen` v1.5.0, 12KB CSS + 36KB JS), loaded **lazily** — its
  files aren't fetched at all until the user switches Theme → CRT Effect → Enhanced.
- Technique: builds an **SVG filter** (`feDisplacementMap` fed by a canvas-generated
  radial map) applied via CSS `filter:` to `.app` — real **barrel distortion**, real
  per-channel **chromatic aberration** (actual channel displacement, not a color
  overlay), and a canvas-drawn **RGB phosphor dot mask** texture. None of that exists
  in the native layer.
- **No animation loop**: grepped `crt.js` for `requestAnimationFrame`/`setInterval` —
  zero hits. The filter is a static SVG def; the browser compositor handles it the same
  class of cost as any CSS `filter: blur()`. The library *does* support animated
  scanline-roll/flicker/noise/roll-bar via CSS keyframes, but the project's `PRESET` in
  `crt-screen-integration.js` sets all of `flicker/noise/roll/scanline-speed` to `0` —
  which matches the library's own built-in "Legible" presets (same 0-value pattern),
  so this is a first-class supported configuration, not a workaround.
- Applied in **`inplace` mode** to `.app` — filters the existing DOM without
  restructuring it, so the app's flex/grid layout survives with no wrapper.
  Project-specific CSS flattens internal panel chrome (dossier box, sidebar rule,
  header rule) so Enhanced reads as one continuous screen rather than separate boxes.
- **Cost**: zero until opted in (nothing loaded). Once enabled: one SVG filter
  applied to one element, no ongoing JS.

## `css-crt-screen-effect` (lbebber) — what it actually does

Read the pen's real CSS (not assumed from the name):

- **Scanlines**: `repeating-linear-gradient` on a `::before` — the *same class of
  technique* as our native scanlines, just different pixel values. Nothing to gain by
  adopting it — we already do this.
- **"Chromatic"**: a `::before` gradient with three static colored stripes
  (red/green/blue-tinted horizontal bands at low opacity) layered under the scanlines.
  This is a color-fringe decoration, **not** real chromatic aberration (no per-channel
  image displacement). Enhanced's `feDisplacementMap` approach is strictly more
  authentic than this. Nothing to gain here either.
- **No barrel distortion, no phosphor dot mask.**
- **Flicker**: a randomized-opacity keyframe sequence (`::after`) toggled by a hidden
  checkbox input. Comparable in spirit to our native flicker, different curve.
- **The one genuinely distinct technique**: a **"turn on / turn off" power transition**
  — `scale()` + `brightness()`/`contrast()` filter keyframes that flash-bloom and
  squash the screen when the checkbox toggles, mimicking an old CRT's degauss-on /
  collapse-off. **Neither of our two layers has anything like this.** It's a genuinely
  nice, small, self-contained effect.
- Built as a fixed 800×600 non-responsive demo with its own toggle-switch UI (we
  don't need the switch — Theme → CRT Effect already exists).

## Recommendation

- **Ignore** the pen's scanline and "chromatic" techniques — both are already covered,
  and covered *better*, by what we ship (native scanlines are equivalent; Enhanced's
  real channel-displacement chromatic aberration outclasses the pen's static color
  stripes).
- **Adapt** (technique-only, clean-room, future task — not this one) the **power-on /
  power-off transition** as a small enhancement to the CRT Effect toggle itself: when
  a user flips Theme → CRT Effect on/off, play a brief scale+brightness flash instead
  of the current instant class-toggle. This is the only idea here that adds something
  new. Small, self-contained, screen-surface only, no dependency — a good future T-item
  if wanted, not urgent.
- **No change to the native/Enhanced split.** Both existing layers are already
  well-designed for their job (native = free default; Enhanced = opt-in, lazy-loaded,
  more authentic optics) and the pen offers nothing that would improve either.
