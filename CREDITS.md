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

*(none yet)*

## Technique inspiration (no obligation — listed as a courtesy)

- **Embossed label-tape text** — effect studied from "Dymo style embossed text" by
  gillesv (codepen.io/gillesv/pen/WbeZXyb) and "Punch Label Dymo Effect" by getwestfall
  (codepen.io/getwestfall/pen/WNyzZOL); implemented from scratch with our own shadow
  stack and tokens (`.brand small` in the Chassis frame mode, styles.css).
- **Brushed-metal surface treatment** — the metal panels in the Chassis frame mode
  (masthead, nav buttons, frame) use a brushed-grain `repeating-linear-gradient` overlay +
  raking sheen + off-centre-lit dimensional screws. Techniques studied from "Skeuomorphic
  Spacecraft Control Panel" by Margarita-the-solid
  (codepen.io/Margarita-the-solid/pen/qENzBWN); reimplemented from scratch in our own olive
  `--panel-*` token palette (`--metal-brush`/`--metal-sheen` and the `--rv` stud in
  styles.css).
- **CRT screen glass (reflection + curvature)** — the always-on screen treatment: a faint
  top reflection suggesting curved glass and soft edge-curvature shading inside the jet-black
  bezel. Techniques studied from "Fallout 3 Terminal" by 32bitkid
  (codepen.io/32bitkid/pen/DrXOVg); reimplemented from scratch with our own tokens (the
  `body::before`/`body::after` screen layers in styles.css). Our fill stays far darker than
  the pen's `#131`.
