/* ==========================================================================
   crt.js — CRT screen simulator engine + tuning panel
   --------------------------------------------------------------------------
   Usage (auto):
     <link rel="stylesheet" href="crt.css">
     <script src="crt.js" defer></script>
     <div class="crt" data-crt data-crt-panel>...your content...</div>

   Usage (API):
     const screen = CRT.apply('#app', { panel: true, preset: 'green' });
     screen.set('curvature', 0.3);
     screen.preset('amber');
     screen.power(false);            // off / on
     screen.exportCSS();             // -> string of :root vars

   Every effect is a CSS custom property on the .crt element (see crt.css).
   Two effects need SVG filters and are injected per-instance:
     - chromatic aberration (channel split via feColorMatrix + feOffset)
     - barrel distortion    (feDisplacementMap fed a canvas radial map)
   ========================================================================== */
(function (global) {
  "use strict";

  /* ---- Parameter schema: drives both the API and the slider panel ------ */
  // type: 'var'  -> plain CSS custom property (number + unit)
  //       'svg'  -> handled specially (chromatic, curvature)
  const PARAMS = [
    { group: "Signal", key: "brightness", label: "Brightness", min: 0.5, max: 2,   step: 0.01, unit: "",   def: 1.18 },
    { group: "Signal", key: "contrast",   label: "Contrast",   min: 0.5, max: 2,   step: 0.01, unit: "",   def: 1.12 },
    { group: "Signal", key: "saturate",   label: "Saturation", min: 0,   max: 3,   step: 0.01, unit: "",   def: 1.25 },
    { group: "Signal", key: "blur",       label: "Phosphor blur", min: 0, max: 3,  step: 0.05, unit: "px",  def: 0.55 },

    { group: "Glow",   key: "glow",       label: "Glow",       min: 0,   max: 2,   step: 0.01, unit: "",   def: 0.6 },
    { group: "Glow",   key: "bloom",      label: "Bloom",      min: 0,   max: 1,   step: 0.01, unit: "",   def: 0.45 },
    { group: "Glow",   key: "bloom-blur", label: "Bloom blur", min: 0,   max: 24,  step: 0.5,  unit: "px",  def: 8, api: "bloomBlur" },
    { group: "Glow",   key: "halation",   label: "Halation",   min: 0,   max: 1,   step: 0.01, unit: "",   def: 0 },

    { group: "Scanlines", key: "scanline-opacity", label: "Scanline depth", min: 0, max: 1, step: 0.01, unit: "", def: 0.30, api: "scanlines" },
    { group: "Scanlines", key: "scanline-height",  label: "Scanline pitch", min: 1, max: 12, step: 0.5, unit: "px", def: 3, api: "scanlineSize" },
    { group: "Scanlines", key: "scanline-speed",   label: "Scanline roll",  min: 0, max: 30, step: 0.5, unit: "s", def: 9, api: "scanlineSpeed" },
    { group: "Scanlines", key: "mask-opacity",     label: "RGB mask",       min: 0, max: 0.8, step: 0.01, unit: "", def: 0.18, api: "mask" },
    { group: "Scanlines", key: "mask-size",        label: "Mask pitch",     min: 2, max: 12, step: 0.5, unit: "px", def: 3, api: "maskSize" },
    { group: "Scanlines", key: "mask-type",        label: "Mask type",      type: "select", options: ["aperture", "shadow"], def: "aperture" },

    { group: "Geometry", key: "curvature", label: "Curvature",  min: 0, max: 1,   step: 0.01, unit: "", def: 0.18, type: "svg" },
    { group: "Geometry", key: "chromatic", label: "Chromatic ab.", min: 0, max: 4, step: 0.05, unit: "", def: 0.5, type: "svg" },
    { group: "Geometry", key: "vignette",  label: "Vignette",   min: 0, max: 1,   step: 0.01, unit: "", def: 0.55 },
    { group: "Geometry", key: "radius",    label: "Corner round", min: 0, max: 8, step: 0.1, unit: "%", def: 1.6 },

    { group: "Motion", key: "flicker", label: "Flicker", min: 0, max: 0.4, step: 0.005, unit: "", def: 0.06 },
    { group: "Motion", key: "noise",   label: "Static",  min: 0, max: 0.4, step: 0.005, unit: "", def: 0.04 },
    { group: "Motion", key: "roll",    label: "Roll bar", min: 0, max: 0.25, step: 0.005, unit: "", def: 0.04 },

    { group: "Phosphor", key: "mono",       label: "Monochrome", min: 0, max: 1, step: 0.01, unit: "", def: 0 },
    { group: "Phosphor", key: "tint-color", label: "Phosphor color", type: "color", def: "#6cff7c", api: "tint" },
  ];

  /* ---- Presets ----------------------------------------------------------- */
  const PRESETS = {
    "Color TV (default)": {},
    "Green terminal": {
      mono: 1, "tint-color": "#39ff5b", "glow-color": "rgba(80,255,120,0.6)",
      glow: 0.9, bloom: 0.55, "scanline-opacity": 0.35, "mask-opacity": 0.1,
      saturate: 1, brightness: 1.15, curvature: 0.22, flicker: 0.07,
    },
    "Amber terminal": {
      mono: 1, "tint-color": "#ffb000", "glow-color": "rgba(255,176,0,0.55)",
      glow: 0.85, bloom: 0.5, "scanline-opacity": 0.32, "mask-opacity": 0.08,
      saturate: 1, brightness: 1.12, curvature: 0.2, flicker: 0.06,
    },
    "Trinitron (sharp)": {
      curvature: 0.06, "scanline-opacity": 0.22, "scanline-height": 2,
      "mask-opacity": 0.22, "mask-size": 3, blur: 0.3, glow: 0.45,
      bloom: 0.35, chromatic: 0.3, saturate: 1.35, vignette: 0.4,
    },
    "Arcade (heavy)": {
      curvature: 0.32, "scanline-opacity": 0.45, "scanline-height": 4,
      "mask-opacity": 0.3, blur: 0.8, glow: 1.1, bloom: 0.65, halation: 0.3,
      chromatic: 1.2, saturate: 1.5, brightness: 1.25, vignette: 0.7, flicker: 0.1,
    },
    "VHS / worn": {
      curvature: 0.12, "scanline-opacity": 0.25, blur: 1.4, glow: 0.7,
      bloom: 0.5, halation: 0.18, chromatic: 2.2, saturate: 1.6, noise: 0.14,
      flicker: 0.12, roll: 0.12, vignette: 0.5,
    },
    "Black & white": {
      mono: 1, "tint-color": "#dfe7ff", "glow-color": "rgba(220,230,255,0.5)",
      glow: 0.6, bloom: 0.45, "scanline-opacity": 0.3, "mask-opacity": 0,
      saturate: 0, curvature: 0.18, noise: 0.06,
    },
    "Subtle (modern UI)": {
      curvature: 0.04, "scanline-opacity": 0.12, "scanline-height": 2,
      "mask-opacity": 0.06, blur: 0.25, glow: 0.3, bloom: 0.25,
      chromatic: 0.2, flicker: 0.02, noise: 0.015, vignette: 0.3, "scanline-speed": 0,
    },

    // --- Authentic display types -----------------------------------------
    // Sony PVM broadcast monitor: near-flat, very sharp, fine aperture grille,
    // strong scanlines, vibrant and clean.
    "PVM (broadcast)": {
      curvature: 0.05, "scanline-opacity": 0.42, "scanline-height": 2,
      "mask-opacity": 0.16, "mask-size": 2, blur: 0.25, glow: 0.5, bloom: 0.4,
      halation: 0.12, chromatic: 0.2, saturate: 1.4, contrast: 1.18,
      brightness: 1.2, vignette: 0.35, flicker: 0.03, noise: 0.02,
    },
    // Consumer shadow-mask TV: rounder tube, softer/coarser triads, warmer
    // glow, gentle wobble.
    "Shadow-mask TV": {
      "mask-type": "shadow",
      curvature: 0.26, "scanline-opacity": 0.28, "scanline-height": 3,
      "mask-opacity": 0.28, "mask-size": 5, blur: 0.85, glow: 0.8,
      "glow-color": "rgba(255,220,180,0.5)", bloom: 0.6, halation: 0.35,
      chromatic: 0.9, saturate: 1.45, contrast: 1.1, brightness: 1.18,
      vignette: 0.6, noise: 0.06, flicker: 0.07, roll: 0.06,
    },
    // Game Boy DMG: not a CRT — a 4-shade reflective green LCD. No scanlines,
    // no curvature, no glow; just the pea-green monochrome wash.
    "Game Boy DMG": {
      mono: 1, "tint-color": "#9bbc0f", "glow-color": "rgba(120,150,20,0.3)",
      "scanline-opacity": 0, "scanline-speed": 0, "mask-opacity": 0,
      curvature: 0, blur: 0.3, glow: 0.2, bloom: 0.15, chromatic: 0,
      saturate: 1, contrast: 1.15, brightness: 1.1, vignette: 0.35,
      flicker: 0, noise: 0, roll: 0,
    },

    // --- Legible presets (tuned so text stays readable; flicker off) ------
    // Larger scanline pitch lets lines fall between text rows; low blur keeps
    // glyphs crisp; no curvature so clickable text doesn't drift.
    "Readable green": {
      mono: 1, "tint-color": "#62ff7a", "glow-color": "rgba(120,255,150,0.4)",
      "scanline-opacity": 0.12, "scanline-height": 5, "scanline-speed": 0,
      "mask-opacity": 0.06, blur: 0.2, glow: 0.5, bloom: 0.3, curvature: 0.06,
      chromatic: 0.15, saturate: 1, brightness: 1.12, contrast: 1.1,
      vignette: 0.3, flicker: 0, noise: 0, roll: 0,
    },
    "Readable amber": {
      mono: 1, "tint-color": "#ffc04d", "glow-color": "rgba(255,180,60,0.4)",
      "scanline-opacity": 0.12, "scanline-height": 5, "scanline-speed": 0,
      "mask-opacity": 0.05, blur: 0.2, glow: 0.5, bloom: 0.3, curvature: 0.06,
      chromatic: 0.15, saturate: 1, brightness: 1.12, contrast: 1.1,
      vignette: 0.3, flicker: 0, noise: 0, roll: 0,
    },
    // Full-colour, no distortion — a tasteful CRT sheen safe over real app text.
    "Readable light": {
      curvature: 0, "scanline-opacity": 0.08, "scanline-height": 4,
      "scanline-speed": 0, "mask-opacity": 0.04, blur: 0.15, glow: 0.25,
      bloom: 0.2, chromatic: 0.1, saturate: 1.15, brightness: 1.12,
      contrast: 1.06, vignette: 0.22, flicker: 0, noise: 0, roll: 0,
    },
  };

  let uid = 0;
  let noiseDataURL = null;

  /* ---- Generate a tiling noise texture once ----------------------------- */
  function getNoiseURL() {
    if (noiseDataURL) return noiseDataURL;
    const s = 80, c = document.createElement("canvas");
    c.width = c.height = s;
    const ctx = c.getContext("2d");
    const img = ctx.createImageData(s, s);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    noiseDataURL = c.toDataURL("image/png");
    return noiseDataURL;
  }

  /* ---- Shadow-mask texture (RGB dot triad, offset rows) ----------------- */
  // The default mask is a CSS aperture-grille gradient (vertical stripes). The
  // "shadow" mask type swaps in this canvas tile of staggered RGB dots — the
  // other real CRT family. One triad is 3u wide x 2u tall (aspect 2/3); the
  // mask layer's background-size scales it from --crt-mask-size.
  let shadowMaskURL = null;
  function getShadowMaskURL() {
    if (shadowMaskURL) return shadowMaskURL;
    const u = 10, W = 3 * u, H = 2 * u;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const x = c.getContext("2d");
    x.fillStyle = "#000"; x.fillRect(0, 0, W, H);
    const r = u * 0.4;
    function dot(cx, cy, color) {
      x.fillStyle = color;
      [-W, 0, W].forEach((ox) => [-H, 0, H].forEach((oy) => {
        x.beginPath(); x.arc(cx + ox, cy + oy, r, 0, 7); x.fill();
      }));
    }
    dot(0.5 * u, 0.5 * u, "#f00"); dot(1.5 * u, 0.5 * u, "#0f0"); dot(2.5 * u, 0.5 * u, "#00f");
    dot(2.0 * u, 1.5 * u, "#f00"); dot(3.0 * u, 1.5 * u, "#0f0"); dot(1.0 * u, 1.5 * u, "#00f");
    shadowMaskURL = c.toDataURL("image/png");
    return shadowMaskURL;
  }

  /* ---- Build a radial displacement map for barrel distortion ------------ */
  // feDisplacementMap: P'(x,y) = P(x + scale*(R-0.5), y + scale*(G-0.5)).
  // To bulge the image (center magnified, edges pulled in) we sample inward,
  // with magnitude growing as r^2 -> proper barrel curvature.
  function curvatureMapURL(amount) {
    const n = 128, c = document.createElement("canvas");
    c.width = c.height = n;
    const ctx = c.getContext("2d");
    const img = ctx.createImageData(n, n);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const u = (x / (n - 1)) * 2 - 1;   // -1..1
        const v = (y / (n - 1)) * 2 - 1;
        const r2 = u * u + v * v;
        // sample inward (negative) scaled by distance^2
        let dx = -u * r2 * amount;
        let dy = -v * r2 * amount;
        const R = Math.max(0, Math.min(1, 0.5 + dx)) * 255;
        const G = Math.max(0, Math.min(1, 0.5 + dy)) * 255;
        const i = (y * n + x) * 4;
        img.data[i] = R; img.data[i + 1] = G; img.data[i + 2] = 0; img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL("image/png");
  }

  const SVGNS = "http://www.w3.org/2000/svg";
  const XLINK = "http://www.w3.org/1999/xlink";

  /* ---- Inject the per-instance SVG <filter>s ----------------------------- */
  function buildSVGFilters(id) {
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.setAttribute("aria-hidden", "true");
    svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;";

    // --- Chromatic aberration: split channels, offset R left / B right ---
    const chroma = document.createElementNS(SVGNS, "filter");
    chroma.setAttribute("id", "crt-chroma-" + id);
    chroma.setAttribute("x", "-10%");
    chroma.setAttribute("y", "-10%");
    chroma.setAttribute("width", "120%");
    chroma.setAttribute("height", "120%");
    chroma.setAttribute("color-interpolation-filters", "sRGB");
    chroma.innerHTML =
      '<feColorMatrix in="SourceGraphic" type="matrix" result="r" values="' +
        '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/>' +
      '<feOffset in="r" dx="0" dy="0" result="rS" class="crt-ca-r"/>' +
      '<feColorMatrix in="SourceGraphic" type="matrix" result="g" values="' +
        '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"/>' +
      '<feColorMatrix in="SourceGraphic" type="matrix" result="b" values="' +
        '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"/>' +
      '<feOffset in="b" dx="0" dy="0" result="bS" class="crt-ca-b"/>' +
      '<feBlend in="rS" in2="g" mode="screen" result="rg"/>' +
      '<feBlend in="rg" in2="bS" mode="screen"/>';

    // --- Barrel distortion via displacement map ---
    const curve = document.createElementNS(SVGNS, "filter");
    curve.setAttribute("id", "crt-curve-" + id);
    curve.setAttribute("x", "0%");
    curve.setAttribute("y", "0%");
    curve.setAttribute("width", "100%");
    curve.setAttribute("height", "100%");
    curve.setAttribute("color-interpolation-filters", "sRGB");
    const feImage = document.createElementNS(SVGNS, "feImage");
    feImage.setAttribute("result", "map");
    // AIDEV-NOTE: feImage must be sized in px by _sizeCurve(); a % resolves vs the viewport, stranding the map in a corner.
    // Stretch the small radial map across the whole screen. width/height are
    // set in user-space px by _sizeCurve() (a % here would resolve against the
    // viewport, not the element, leaving the map stuck in the corner).
    feImage.setAttribute("preserveAspectRatio", "none");
    feImage.setAttribute("x", "0"); feImage.setAttribute("y", "0");
    feImage.setAttribute("width", "0"); feImage.setAttribute("height", "0");
    const feDisp = document.createElementNS(SVGNS, "feDisplacementMap");
    feDisp.setAttribute("in", "SourceGraphic");
    feDisp.setAttribute("in2", "map");
    feDisp.setAttribute("xChannelSelector", "R");
    feDisp.setAttribute("yChannelSelector", "G");
    feDisp.setAttribute("scale", "0");
    curve.appendChild(feImage);
    curve.appendChild(feDisp);

    const defs = document.createElementNS(SVGNS, "defs");
    defs.appendChild(chroma);
    defs.appendChild(curve);
    svg.appendChild(defs);
    document.body.appendChild(svg);

    return { svg, feImage, feDisp, chroma };
  }

  /* ====================================================================== */
  /*  CRTScreen instance                                                    */
  /* ====================================================================== */
  function CRTScreen(el, options) {
    options = options || {};
    this.el = el;
    el.classList.add("crt");
    this.id = ++uid;
    this.values = {};
    this._powered = true;
    // 'wrap' (default): move children into a filtered screen, overlays above.
    // 'inplace': filter the element itself, overlays in one out-of-flow host —
    // for laying the effect over an existing app without breaking its layout.
    this.mode = options.mode === "inplace" ? "inplace" : "wrap";
    if (this.mode === "inplace") el.classList.add("crt--inplace");

    var LAYERS = ["bloom", "halation", "tint", "mask", "scanlines", "noise",
                  "flicker", "vignette", "glare"];
    function addLayers(host) {
      LAYERS.forEach(function (name) {
        var d = document.createElement("div");
        d.className = "crt__" + name;
        host.appendChild(d);
      });
    }

    // SVG filters (per-instance)
    const f = buildSVGFilters(this.id);
    this.f = f;
    this.caR = f.chroma.querySelector(".crt-ca-r");
    this.caB = f.chroma.querySelector(".crt-ca-b");

    // AIDEV-NOTE: keep var() refs live in the filter chains — never freeze via getComputedStyle; that kills the colour/blur/glow sliders. Tested.
    var GRADE =
      "grayscale(var(--crt-mono)) saturate(var(--crt-saturate)) " +
      "contrast(var(--crt-contrast)) brightness(var(--crt-brightness)) " +
      "blur(var(--crt-blur)) " +
      "drop-shadow(0 0 calc(var(--crt-glow) * 3px) var(--crt-glow-color))";
    var CHROMA = "url(#crt-chroma-" + this.id + ")";
    var CURVE = "url(#crt-curve-" + this.id + ")";

    if (this.mode === "wrap") {
      // Wrap children into screen > content; overlays are siblings above content.
      const screen = document.createElement("div");
      screen.className = "crt__screen";
      const content = document.createElement("div");
      content.className = "crt__content";
      while (el.firstChild) content.appendChild(el.firstChild);
      screen.appendChild(content);
      addLayers(screen);
      el.appendChild(screen);
      this.screen = screen;
      this.content = content;
      this.fx = screen;
      content.style.filter = CHROMA + " " + GRADE;
      screen.style.filter = CURVE;
    } else {
      // AIDEV-NOTE: inplace must NOT restructure children — wrapping breaks flex/grid. Overlays go in one absolute host; the whole filter chain goes on el.
      if (getComputedStyle(el).position === "static") {
        el.style.position = "relative";
        this._setPosition = true;
      }
      const fx = document.createElement("div");
      fx.className = "crt__fx";
      addLayers(fx);
      el.appendChild(fx);
      this.screen = el;
      this.content = el;
      this.fx = fx;
      // One element carries the whole chain: grade -> chroma -> curve (outermost).
      el.style.filter = GRADE + " " + CHROMA + " " + CURVE;
    }

    // Noise texture (in whichever host holds the overlay layers)
    this.fx.querySelector(".crt__noise").style.backgroundImage =
      "url(" + getNoiseURL() + ")";

    // Keep the displacement map stretched to the element's pixel size.
    this._sizeCurve();
    if (typeof ResizeObserver !== "undefined") {
      this._ro = new ResizeObserver(() => this._sizeCurve());
      this._ro.observe(el);
    } else {
      this._resizeHandler = () => this._sizeCurve();
      window.addEventListener("resize", this._resizeHandler);
    }

    // Initialise all params to defaults, then apply preset/overrides
    PARAMS.forEach((p) => this.set(p.key, p.def, true));
    this.set("glow-color", "rgba(180,235,255,0.55)", true);
    if (options.preset) this.preset(options.preset, true);
    if (options.values) Object.entries(options.values).forEach(([k, v]) => this.set(k, v, true));
    this._refreshSVG();

    if (options.panel || el.hasAttribute("data-crt-panel")) this.mountPanel();
    if (options.powerOn) this.power(true);
  }

  CRTScreen.prototype.set = function (key, value, defer) {
    this.values[key] = value;
    const p = PARAMS.find((x) => x.key === key);
    if (p && p.type === "svg") {
      if (!defer) this._refreshSVG();
      return this;
    }
    // Enumerated options (not CSS vars) — e.g. mask-type swaps the mask texture.
    if (p && p.type === "select") {
      if (key === "mask-type") this._applyMaskType(value);
      return this;
    }
    // glow-color is a raw color string
    if (key === "tint-color" || key === "glow-color") {
      this.el.style.setProperty("--crt-" + key, value);
      return this;
    }
    const unit = p ? p.unit : "";
    this.el.style.setProperty("--crt-" + key, value + unit);
    // AIDEV-NOTE: halation backdrop-filter is costly — gate the layer via .crt--halation, enabled only when amount > 0.
    if (key === "halation") this.el.classList.toggle("crt--halation", parseFloat(value) > 0);
    return this;
  };

  CRTScreen.prototype.get = function (key) { return this.values[key]; };

  // Swap the RGB mask between the CSS aperture-grille gradient (default) and the
  // canvas shadow-mask dot texture.
  CRTScreen.prototype._applyMaskType = function (type) {
    const mask = this.fx && this.fx.querySelector(".crt__mask");
    if (!mask) return;
    if (type === "shadow") {
      mask.style.backgroundImage = "url(" + getShadowMaskURL() + ")";
      // tile is 3:2, so scale height to 2/3 of the pitch to keep dots round
      mask.style.backgroundSize =
        "var(--crt-mask-size) calc(var(--crt-mask-size) * 0.667)";
    } else {
      mask.style.removeProperty("background-image"); // fall back to CSS aperture
      mask.style.removeProperty("background-size");
    }
  };

  CRTScreen.prototype._sizeCurve = function () {
    const w = this.el.clientWidth || this.el.offsetWidth;
    const h = this.el.clientHeight || this.el.offsetHeight;
    if (!w || !h) return;
    this.f.feImage.setAttribute("width", w);
    this.f.feImage.setAttribute("height", h);
  };

  CRTScreen.prototype._refreshSVG = function () {
    const ca = parseFloat(this.values["chromatic"]) || 0;
    if (this.caR) this.caR.setAttribute("dx", (-ca).toString());
    if (this.caB) this.caB.setAttribute("dx", (ca).toString());
    const cv = parseFloat(this.values["curvature"]) || 0;
    // AIDEV-NOTE: perf hot path — rebuild the curvature map only when curvature changes; _refreshSVG runs on every slider drag.
    // Rebuilding the displacement map (canvas + PNG dataURL) is expensive, and
    // _refreshSVG runs on every SVG-param slider drag — including `chromatic`,
    // which doesn't affect curvature. So only regenerate when curvature itself
    // changed, and compute the URL exactly once.
    if (cv !== this._curveCache) {
      this._curveCache = cv;
      const url = curvatureMapURL(cv);
      this.f.feImage.setAttributeNS(XLINK, "href", url);
      this.f.feImage.setAttribute("href", url);
      // A fixed scale; magnitude lives in the map. Tie overscan to curvature.
      this.f.feDisp.setAttribute("scale", (cv > 0 ? 120 : 0).toString());
      this.el.style.setProperty("--crt-overscan", (1 + cv * 0.12).toFixed(3));
    }
    this._sizeCurve();
  };

  CRTScreen.prototype.preset = function (name, defer) {
    // resolve case-insensitively / by short alias
    let p = PRESETS[name];
    if (!p) {
      const k = Object.keys(PRESETS).find(
        (x) => x.toLowerCase().startsWith((name || "").toLowerCase())
      );
      p = k ? PRESETS[k] : null;
    }
    if (!p) return this;
    // reset to defaults first
    PARAMS.forEach((x) => this.set(x.key, x.def, true));
    this.set("glow-color", "rgba(180,235,255,0.55)", true);
    Object.entries(p).forEach(([k, v]) => this.set(k, v, true));
    if (!defer) { this._refreshSVG(); this._syncPanel(); }
    this._lastPreset = name;
    return this;
  };

  CRTScreen.prototype.power = function (on) {
    this.el.classList.remove("crt--on", "crt--off");
    // force reflow so the animation restarts
    void this.screen.offsetWidth;
    this.el.classList.add(on ? "crt--on" : "crt--off");
    return this;
  };

  // Fully tear down: restore the original DOM and release every resource
  // (ResizeObserver, listeners, injected SVG, panel, CSS vars). Safe to call
  // more than once. Essential for SPAs that mount/unmount the screen.
  CRTScreen.prototype.destroy = function () {
    if (this._destroyed) return;
    this._destroyed = true;
    if (this._ro) { this._ro.disconnect(); this._ro = null; }
    if (this._resizeHandler) {
      window.removeEventListener("resize", this._resizeHandler);
      this._resizeHandler = null;
    }
    if (this._panelKeyHandler) {
      document.removeEventListener("keydown", this._panelKeyHandler);
      this._panelKeyHandler = null;
    }
    if (this.panel && this.panel.parentNode) this.panel.parentNode.removeChild(this.panel);
    this.panel = null;
    if (this.f && this.f.svg && this.f.svg.parentNode) this.f.svg.parentNode.removeChild(this.f.svg);
    if (this.mode === "wrap") {
      // Move the user's content back out, then drop our wrapper + overlays.
      if (this.content && this.screen) {
        while (this.content.firstChild) this.el.insertBefore(this.content.firstChild, this.screen);
      }
      if (this.screen && this.screen.parentNode) this.screen.parentNode.removeChild(this.screen);
    } else {
      // inplace: children were never moved — just remove the overlay host.
      if (this.fx && this.fx.parentNode) this.fx.parentNode.removeChild(this.fx);
      if (this._setPosition) this.el.style.removeProperty("position");
    }
    this.el.classList.remove("crt", "crt--on", "crt--off", "crt--no-bloom", "crt--no-svg", "crt--halation", "crt--inplace");
    PARAMS.forEach((p) => this.el.style.removeProperty("--crt-" + p.key));
    ["--crt-glow-color", "--crt-overscan"].forEach((v) => this.el.style.removeProperty(v));
    this.el.style.removeProperty("filter");
    delete this.el._crt;
    const i = CRT.instances.indexOf(this);
    if (i >= 0) CRT.instances.splice(i, 1);
    return this;
  };

  CRTScreen.prototype.exportCSS = function () {
    let out = ".crt {\n";
    PARAMS.forEach((p) => {
      let v = this.values[p.key];
      if (p.type === "color") { out += "  --crt-" + p.key + ": " + v + ";\n"; return; }
      if (p.type === "select") { out += "  /* " + p.key + ": " + v + " (set via JS/panel) */\n"; return; }
      out += "  --crt-" + p.key + ": " + v + (p.unit || "") + ";\n";
    });
    out += "  --crt-glow-color: " + (this.values["glow-color"] || "rgba(180,235,255,0.55)") + ";\n";
    out += "}\n";
    out += "/* chromatic aberration (" + this.values["chromatic"] +
      "px) and curvature (" + this.values["curvature"] +
      ") also require crt.js for their SVG filters. */";
    return out;
  };

  /* ---- Control panel ----------------------------------------------------- */
  function injectPanelStyles() {
    if (document.getElementById("crt-panel-styles")) return;
    const css = `
.crt-panel{position:fixed;top:14px;right:14px;z-index:2147483000;width:268px;
  font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#cfe;
  background:rgba(14,18,26,.92);border:1px solid #2a3a52;border-radius:10px;
  box-shadow:0 10px 40px rgba(0,0,0,.55);backdrop-filter:blur(8px);
  -webkit-backdrop-filter:blur(8px);user-select:none;overflow:hidden}
.crt-panel__head{display:flex;align-items:center;gap:6px;padding:8px 10px;
  background:linear-gradient(180deg,#1a2436,#141c2a);border-bottom:1px solid #243348;cursor:default}
.crt-panel__title{font-weight:700;letter-spacing:.12em;color:#7fe9ff;flex:0 0 auto}
.crt-panel__preset{flex:1 1 auto;min-width:0;background:#0d1420;color:#cfe;
  border:1px solid #2a3a52;border-radius:6px;padding:3px 4px;font:inherit}
.crt-panel__btn{background:#1d2a3e;color:#cfe;border:1px solid #2f4664;
  border-radius:6px;padding:3px 8px;cursor:pointer;font:inherit}
.crt-panel__btn:hover{background:#27384f}
.crt-panel__btn.wide{flex:1;padding:6px}
.crt-panel__body{max-height:62vh;overflow-y:auto;padding:6px 10px 10px}
.crt-panel__group{margin-top:8px}
.crt-panel__glabel{text-transform:uppercase;letter-spacing:.1em;font-size:10px;
  color:#5f7da0;margin:6px 0 3px;border-top:1px dashed #243348;padding-top:6px}
.crt-panel__group:first-child .crt-panel__glabel{border-top:0}
.crt-panel__row{display:grid;grid-template-columns:96px 1fr 34px;align-items:center;
  gap:6px;margin:3px 0}
.crt-panel__row>span{color:#aebfd6;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.crt-panel__row output{text-align:right;color:#7fe9ff;font-variant-numeric:tabular-nums}
.crt-panel__row input[type=range]{width:100%;accent-color:#39d6ff;height:14px}
.crt-panel__row input[type=color]{grid-column:2/4;width:100%;height:20px;
  background:none;border:1px solid #2a3a52;border-radius:5px;padding:0}
.crt-panel__row select{grid-column:2/4;width:100%;background:#0d1420;color:#cfe;
  border:1px solid #2a3a52;border-radius:5px;padding:2px 4px;font:inherit}
.crt-panel__foot{display:flex;gap:6px;padding:8px 10px;border-top:1px solid #243348;
  background:#11192700}
.crt-panel--collapsed .crt-panel__body,
.crt-panel--collapsed .crt-panel__foot{display:none}`;
    const s = document.createElement("style");
    s.id = "crt-panel-styles";
    s.textContent = css;
    document.head.appendChild(s);
  }

  CRTScreen.prototype.mountPanel = function () {
    if (this.panel) return this.panel;
    injectPanelStyles();
    const self = this;
    const panel = document.createElement("div");
    panel.className = "crt-panel";
    panel.innerHTML =
      '<div class="crt-panel__head">' +
        '<span class="crt-panel__title">CRT</span>' +
        '<select class="crt-panel__preset"></select>' +
        '<button class="crt-panel__btn" data-act="power" title="Power cycle">⏻</button>' +
        '<button class="crt-panel__btn" data-act="collapse" title="Collapse (`)">–</button>' +
      '</div>' +
      '<div class="crt-panel__body"></div>' +
      '<div class="crt-panel__foot">' +
        '<button class="crt-panel__btn wide" data-act="copy">Copy CSS</button>' +
        '<button class="crt-panel__btn wide" data-act="reset">Reset</button>' +
      '</div>';

    const presetSel = panel.querySelector(".crt-panel__preset");
    Object.keys(PRESETS).forEach((name) => {
      const o = document.createElement("option");
      o.value = name; o.textContent = name;
      presetSel.appendChild(o);
    });
    presetSel.addEventListener("change", () => self.preset(presetSel.value));

    const body = panel.querySelector(".crt-panel__body");
    let lastGroup = null, groupBox = null;
    this._controls = {};
    PARAMS.forEach((p) => {
      if (p.group !== lastGroup) {
        lastGroup = p.group;
        groupBox = document.createElement("div");
        groupBox.className = "crt-panel__group";
        groupBox.innerHTML = '<div class="crt-panel__glabel">' + p.group + "</div>";
        body.appendChild(groupBox);
      }
      const row = document.createElement("label");
      row.className = "crt-panel__row";
      if (p.type === "color") {
        row.innerHTML = '<span>' + p.label + '</span>' +
          '<input type="color" value="' + p.def + '">';
        const input = row.querySelector("input");
        input.addEventListener("input", () => self.set(p.key, input.value));
        this._controls[p.key] = { input };
      } else if (p.type === "select") {
        row.innerHTML = '<span>' + p.label + '</span><select>' +
          p.options.map((o) => '<option value="' + o + '">' + o + '</option>').join("") +
          '</select>';
        const input = row.querySelector("select");
        input.value = p.def;
        input.addEventListener("change", () => self.set(p.key, input.value));
        this._controls[p.key] = { input };
      } else {
        row.innerHTML = '<span>' + p.label + '</span>' +
          '<input type="range" min="' + p.min + '" max="' + p.max +
          '" step="' + p.step + '" value="' + p.def + '">' +
          '<output>' + p.def + '</output>';
        const input = row.querySelector("input");
        const out = row.querySelector("output");
        input.addEventListener("input", () => {
          self.set(p.key, parseFloat(input.value));
          out.textContent = (+input.value).toString();
        });
        this._controls[p.key] = { input, out };
      }
      groupBox.appendChild(row);
    });

    panel.querySelector('[data-act="collapse"]').addEventListener("click", () =>
      panel.classList.toggle("crt-panel--collapsed"));
    panel.querySelector('[data-act="power"]').addEventListener("click", () => {
      self._powered = !self._powered;
      self.power(self._powered);
    });
    panel.querySelector('[data-act="reset"]').addEventListener("click", () =>
      self.preset(presetSel.value || "Color TV (default)"));
    panel.querySelector('[data-act="copy"]').addEventListener("click", (e) => {
      const txt = self.exportCSS();
      navigator.clipboard && navigator.clipboard.writeText(txt);
      const b = e.target; const old = b.textContent;
      b.textContent = "Copied!"; setTimeout(() => (b.textContent = old), 1200);
    });

    // ` toggles the whole panel (handler stored so destroy() can remove it)
    this._panelKeyHandler = (ev) => {
      if (ev.key === "`") panel.classList.toggle("crt-panel--collapsed");
    };
    document.addEventListener("keydown", this._panelKeyHandler);

    document.body.appendChild(panel);
    this.panel = panel;
    this._syncPanel();
    return panel;
  };

  CRTScreen.prototype._syncPanel = function () {
    if (!this._controls) return;
    Object.entries(this._controls).forEach(([key, c]) => {
      const v = this.values[key];
      if (v == null) return;
      c.input.value = v;
      if (c.out) c.out.textContent = (+v).toString();
    });
    const gc = this.panel && this.panel.querySelector(".crt-panel__preset");
    if (gc && this._lastPreset && PRESETS[this._lastPreset]) gc.value = this._lastPreset;
  };

  /* ---- Capability detection (graceful degradation) ---------------------- */
  // Returns a report of which optional features the current browser supports.
  // Nothing here throws or hard-fails — missing features just look a little
  // flatter (e.g. no bloom). We warn once so the cause is never a mystery.
  let _capsWarned = false;
  function capabilities() {
    const sup = (typeof CSS !== "undefined" && CSS.supports) ? CSS.supports.bind(CSS) : () => true;
    return {
      backdropFilter: sup("backdrop-filter", "blur(1px)") || sup("-webkit-backdrop-filter", "blur(1px)"),
      cssFilter: sup("filter", "blur(1px)"),
      mixBlend: sup("mix-blend-mode", "screen"),
      svgFilter: typeof document !== "undefined" &&
        "createElementNS" in document && typeof SVGFEDisplacementMapElement !== "undefined",
    };
  }
  function warnCapabilities(el) {
    const c = capabilities();
    if (!c.backdropFilter) el.classList.add("crt--no-bloom");
    if (!c.svgFilter) el.classList.add("crt--no-svg");
    if (_capsWarned) return;
    _capsWarned = true;
    const missing = Object.keys(c).filter((k) => !c[k]);
    if (missing.length) {
      console.warn("[CRT] degraded: this browser lacks " + missing.join(", ") +
        " — the effect still works but some layers are simplified.");
    }
  }

  /* ====================================================================== */
  /*  Public API                                                            */
  /* ====================================================================== */
  const CRT = {
    version: "1.4.0",
    PARAMS, PRESETS,
    instances: [],
    capabilities,
    apply(target, options) {
      const el = typeof target === "string" ? document.querySelector(target) : target;
      if (!el) throw new Error("CRT.apply: target not found: " + target);
      if (el._crt) return el._crt;
      warnCapabilities(el);
      const inst = new CRTScreen(el, options || {});
      el._crt = inst;
      this.instances.push(inst);
      return inst;
    },
    auto() {
      document.querySelectorAll("[data-crt]").forEach((el) => {
        if (el._crt) return;
        const opts = {};
        if (el.hasAttribute("data-crt-preset")) opts.preset = el.getAttribute("data-crt-preset");
        if (el.hasAttribute("data-crt-panel")) opts.panel = true;
        this.apply(el, opts);
      });
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => CRT.auto());
  } else {
    CRT.auto();
  }

  global.CRT = CRT;
})(window);
