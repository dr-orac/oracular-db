# prefs.js — a tiny reusable preferences window

A **dependency-free, schema-driven** settings panel for static HTML projects. Describe your
settings as data; it renders a themeable panel, persists choices to `localStorage`, applies
them live, supports hover-preview, and fires change events. No build step, no framework.
**MIT.**

Built because the good off-the-shelf options (Tweakpane, lil-gui) are *developer parameter
GUIs* — great, but styled and scoped for debug panels, not brandable end-user preferences.
This takes their best idea (a schema → generated UI) without the dependency or the look.

See **[demo.html](demo.html)** for a working example (theme, accent chips, font-in-face
preview, size, toggles) that restyles a page live and persists across reloads.

## Install

Copy this folder into your project and include the two files:

```html
<link rel="stylesheet" href="prefs/prefs.css" />
<div id="settings"></div>
<script src="prefs/prefs.js"></script>
```

## Use

```js
const prefs = Prefs({
  prefix: "myapp-",            // localStorage namespace  → "myapp-theme", …
  mount:  "#settings",         // element or selector to render into
  root:   document.documentElement,  // where cssVar fields write (default :root)
  body:   document.body,       // where attr fields write (default <body>)
  onChange: (id, value) => {}, // fired on user commit (not on init or hover-preview)
  schema: [
    { title: "Appearance", open: true, summary: true, fields: [

      // a select that sets <body data-theme="…">
      { id: "theme", type: "select", label: "Theme", default: "dark", attr: "data-theme",
        options: [ {value:"dark", label:"Dark"}, {value:"light", label:"Light"} ] },

      // a select that sets a CSS var, with colour chips
      { id: "accent", type: "select", label: "Accent", default: "blue",
        cssVar: "--accent", valueToCss: v => ({blue:"#4af", red:"#f55"}[v]),
        options: [
          {value:"blue", label:"Blue", swatch:'<i class="prefs-chip" style="background:#4af"></i>Blue'},
          {value:"red",  label:"Red",  swatch:'<i class="prefs-chip" style="background:#f55"></i>Red'} ] },

      // a font picker with live hover-preview + each option shown in its own face
      { id: "font", type: "select", label: "Font", default: "mono", cssVar: "--font",
        preview: true, valueToCss: v => FONTS[v],
        options: Object.keys(FONTS).map(k => ({ value:k, label:k, previewCss: FONTS[k] })) },

      // an on/off toggle
      { id: "glow", type: "toggle", label: "Glow", default: "on",
        attr: "data-glow", onLabel: "On", offLabel: "Off" },
    ]},
  ],
});
```

### API

| Call | Does |
|---|---|
| `prefs.get(id)` | current committed value |
| `prefs.set(id, value)` | set + persist + apply |
| `prefs.reset()` | clear all keys, re-apply defaults |
| `prefs.on(cb)` | add a `(id, value)` change listener |
| `prefs.refresh()` | recompute the group summary lines |

### Field reference

- **type** — `"select"` (pick one) or `"toggle"` (on/off).
- **cssVar** — a CSS custom property set on `root`. The written value is `valueToCss(value)` if
  given, else the raw value.
- **attr** — a `<body>` attribute set to the value (e.g. `data-theme="dark"`).
- **apply(value, {root, body, prefs})** — custom side-effects, run after `cssVar`/`attr`. Use for
  anything the declarative hooks can't express (deriving several vars, etc.).
- **preview** *(select)* — `true` → hovering an option applies it live without persisting; leaving
  the group restores the committed value.
- **summary** — `false` to exclude a field from its group's summary line.
- **Option** — `{ value, label, swatch, previewCss, summary }`. `swatch` is raw HTML (chips,
  icons); `previewCss` renders the option label in that font stack; `summary` is a short label
  for the group summary.
- **Toggle** — `onValue`, `onLabel`, `offLabel`.

## Theming

Everything is styled through `--prefs-*` custom properties (with fallbacks) scoped under
`.prefs`. Override them on your mount element to match any project:

```css
#settings {
  --prefs-fg: #cfefd8;  --prefs-muted: #6f9a7f;
  --prefs-border: #12351f;  --prefs-accent: #3cff7a;
  --prefs-accent-bg: rgba(60,255,122,.16);  --prefs-accent-ink: #050a06;
  --prefs-opt-bg: rgba(10,29,17,.6);  --prefs-radius: 8px;
}
```

Full list at the top of [prefs.css](prefs.css): fonts, foreground/muted, panel/border,
accent (+ bg/fg/ink), option background, and radii.

## Notes

- Persistence is `localStorage` under `prefix + id`. Unknown/retired stored values coerce back
  to the field default automatically.
- Accessibility: options are `role="radio"` in a `radiogroup`; toggles expose `aria-pressed`.
- No external requests, no cookies, ~6 KB unminified.
