# Credits & third-party notices

How external work enters this codebase, and the record of what did.

**Policy.** When an effect is *reimplemented from scratch* after studying how someone
else achieved it (a technique — techniques aren't copyrightable), no licence applies and
it's listed under *Technique inspiration* below as a courtesy. When code is *adapted*
(substantial portions ported), the source licence applies — for MIT that means an entry
under *Adapted code* with the author, source URL, and licence, plus a one-line comment
above the adapted block in the source file. Attribution lives in this repo, not in the UI.

Fonts have their own licence files in `fonts/`.

## Adapted code (licence obligations)

- **CRT Screen Effect v1.5.0** — vendored without modification from the separately versioned
  `crt-screen` project at commit `e5414d24022d696b3d39005bbf29318a5eac97b0`, licensed under MIT.
  The required notice and immutable file hashes live in [`vendor/crt-screen/`](vendor/crt-screen/).
  Project-specific loading and settings integration remain in `crt-screen-integration.js`.

## Technique inspiration (no obligation — listed as a courtesy)

- **Vault-Tec cog loader** — the data-loading indicator (a central ring throwing radar pings,
  flanked by gear-tooth cog bars). Technique studied from the "Vaut-Tec Fallout loader" pen;
  reimplemented from scratch in our own tokens and tinted to the active theme colour (the
  `.vault-loader` block in styles.css), not the pen's fixed `#43FF03`.
- **Embossed label-tape text** — effect studied from "Dymo style embossed text" by
  gillesv (codepen.io/gillesv/pen/WbeZXyb) and "Punch Label Dymo Effect" by getwestfall
  (codepen.io/getwestfall/pen/WNyzZOL); implemented from scratch with our own shadow
  stack and tokens (`.brand small` in the Chassis frame mode, styles.css).
- **Chassis metal panels** — the metal in the Chassis frame mode (masthead, nav buttons, frame)
  is now **flat pixel-art**: solid `--panel-*` colour blocks with hard stepped bevels and flat
  pixel bolts, no soft gradients. (An earlier version used a brushed-grain + raking-sheen
  treatment studied from "Skeuomorphic Spacecraft Control Panel" by Margarita-the-solid,
  codepen.io/Margarita-the-solid/pen/qENzBWN; that treatment was retired in the pixel-art rework,
  so no external technique remains in the current chassis.)
- **CRT screen glass (reflection + curvature) + phosphor text-glow** — the always-on screen
  treatment: a layered light-catch near the top suggesting curved glass, soft edge-curvature
  shading inside the jet-black bezel, and a two-layer text glow (a soft coloured bloom + a tight
  bright core that keeps text crisp). Techniques studied from "Fallout 3 Terminal" by 32bitkid
  (codepen.io/32bitkid/pen/DrXOVg); reimplemented from scratch with our own tokens (the
  `body::before`/`body::after` screen layers + `--glow` in styles.css/app.js). Our fill stays
  far darker than the pen's `#131`, and the glow uses each theme's own colours (not fixed `#3f3`).
- **Theme-tinting monochrome images with one CSS filter** — tinting portraits + doc images to
  the active phosphor colour via `sepia()` + `hue-rotate()` (instead of a multiply overlay).
  Technique studied from "Working Fallout New Vegas Pip-Boy" by carterfromsl
  (codepen.io/carterfromsl/pen/OJjxXKJ); implemented our own way — the hue-rotate is computed
  from each theme's colour at runtime (`hslOf` → `--img-hue`/`--img-sat` in app.js), not a
  hard-coded per-theme class as in the pen.

## Icons (adapted from libraries)

- **Caesar's Legion "bull" icon** — adapted from *"bull"* by **Lorc** on
  [game-icons.net](https://game-icons.net/1x1/lorc/bull.html), licensed
  **CC BY 3.0** (https://creativecommons.org/licenses/by/3.0/). Recoloured to `currentColor`
  (fill via CSS); the path is otherwise unmodified. All other faction / nav / weapon icons are
  original hand-authored SVGs. (See `docs/LEGAL-SWEEP.md` for the icon-sourcing policy.)

## Fonts

Web-embedded font licences are tracked in `docs/LEGAL-SWEEP.md`. Attributions required by their licences:

- **Fallouty 1.7209** — © Sébastien Caisse ("Red!"), 2002. Used under the font's own licence,
  transcribed in [`fonts/Fallouty-LICENSE.txt`](fonts/Fallouty-LICENSE.txt). The unmodified
  [original font file](fonts/Fallouty.woff2) is shipped with the application as required.
- Additional bundled faces are SIL OFL / CC0 / Apache (see `docs/LEGAL-SWEEP.md` for the per-font table).
