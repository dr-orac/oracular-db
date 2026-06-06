/* ============================================================================
 * crt-screen-integration.js  —  OPTIONAL "Enhanced CRT" engine for the roster
 * ----------------------------------------------------------------------------
 * Adds a reversible toggle in Theme → CRT Effect that swaps the project's
 * native effect (scanlines/vignette/flicker, gated by `body.crt`) for the
 * vendored crt-screen engine (adds barrel curvature + chromatic aberration +
 * RGB phosphor mask that the native effect lacks).
 *
 * Design goals (all reversible):
 *   • Default = Native. Nothing here runs or loads until you switch to Enhanced.
 *   • crt-screen's CSS/JS are injected ONLY in Enhanced mode — so its `.crt`
 *     rules never touch the project's own `<body class="crt">` while Native.
 *   • Enhanced applies crt-screen in 'inplace' mode to .app: it filters the
 *     element WITHOUT restructuring its children, so the flex/grid layout
 *     survives with no wrapper and no layout hacks. (Modals live outside .app
 *     and stay crisp.) Requires vendored crt-screen >= 1.3.0.
 *   • Tuned for the project's legibility floor: low glow, no flicker, static
 *     scanlines, colour preserved (no monochrome override).
 *
 * Delete this file + its <script> tag + the vendor/crt-screen/ folder to remove
 * the feature entirely. AIDEV-NOTE: this is project glue; never edit the
 * vendored crt.css/crt.js — re-copy from upstream to upgrade.
 * ========================================================================== */
(function () {
  "use strict";

  var KEY = "yuma-crt-engine";              // "native" | "enhanced"
  var CSS_HREF = "vendor/crt-screen/crt.css";
  var JS_SRC = "vendor/crt-screen/crt.js";
  var TARGET_SEL = ".app";                  // whole app (in-place; layout-safe)

  // Legibility-first tuning. The roster list sits flush against the left edge,
  // and in-place mode has no overscan, so curvature is kept tiny — just a hint
  // of glass — to avoid clipping the first character of each name. The CRT look
  // is carried by glow + phosphor mask + vignette + faint scanlines/chromatic,
  // none of which distort geometry.
  var PRESET = {
    curvature: 0.03, chromatic: 0.28,
    blur: 0.25, glow: 0.25, bloom: 0.25, halation: 0,
    "scanline-opacity": 0.14, "scanline-height": 3, "scanline-speed": 0,
    "mask-opacity": 0.10, "mask-size": 3,
    vignette: 0.42, flicker: 0, noise: 0, roll: 0,
    saturate: 1.05, brightness: 1.08, contrast: 1.06, mono: 0,
  };

  var instance = null;     // the crt-screen instance when Enhanced
  var jsLoading = null;    // promise while crt.js loads

  // (No integration CSS needed: in-place mode keeps the host's layout and a
  // transparent background by default — see crt-screen .crt--inplace.)

  function loadCRTScreen() {
    if (window.CRT) return Promise.resolve();
    if (jsLoading) return jsLoading;
    jsLoading = new Promise(function (resolve, reject) {
      var sc = document.createElement("script");
      sc.id = "crtss-js"; sc.src = JS_SRC;
      sc.onload = function () { resolve(); };
      sc.onerror = function () { reject(new Error("failed to load " + JS_SRC)); };
      document.head.appendChild(sc);
    });
    return jsLoading;
  }

  function addStylesheet() {
    if (document.getElementById("crtss-css")) return;
    var l = document.createElement("link");
    l.rel = "stylesheet"; l.id = "crtss-css"; l.href = CSS_HREF;
    document.head.appendChild(l);
  }
  function removeStylesheet() {
    var l = document.getElementById("crtss-css");
    if (l) l.remove();
  }

  // Whether the project's native effect should be on (their Scanlines toggle).
  function nativeWanted() {
    return localStorage.getItem("yuma-crt") !== "0";
  }

  function enable() {
    addStylesheet();
    document.body.classList.add("crt-enhanced");
    document.body.classList.remove("crt");        // native off (no double-up)
    loadCRTScreen().then(function () {
      var target = document.querySelector(TARGET_SEL);
      if (!target || !window.CRT) return;
      if (!instance) instance = window.CRT.apply(target, { mode: "inplace", values: PRESET });
    }).catch(function (e) {
      // Fail safe: fall back to native if the vendored library can't load.
      console.warn("[crt-screen] " + e.message + " — staying on native.");
      apply("native");
    });
  }

  function disable() {
    if (instance) { instance.destroy(); instance = null; }
    removeStylesheet();
    document.body.classList.remove("crt-enhanced");
    document.body.classList.toggle("crt", nativeWanted());  // restore native
  }

  function apply(mode, persist) {
    mode = mode === "enhanced" ? "enhanced" : "native";
    if (persist !== false) localStorage.setItem(KEY, mode);
    if (mode === "enhanced") enable(); else disable();
    syncButton(mode);
  }

  /* ---- UI: an "Enhanced" toggle in the existing CRT Effect section -------- */
  var btn = null, nativeBtn = null;
  function syncButton(mode) {
    if (!btn) return;
    var on = mode === "enhanced";
    btn.textContent = "Enhanced: " + (on ? "ON" : "OFF");
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    // While Enhanced drives the screen, the native Scanlines button is moot.
    if (nativeBtn) { nativeBtn.disabled = on; nativeBtn.style.opacity = on ? "0.45" : ""; }
  }

  function mountUI() {
    nativeBtn = document.getElementById("crt-toggle");
    if (!nativeBtn) return;                  // settings panel not present
    btn = document.createElement("button");
    btn.className = "swatch";
    btn.id = "crt-engine-toggle";
    btn.type = "button";
    btn.title = "Use the crt-screen engine (curvature + chromatic + RGB mask) instead of the native scanlines";
    nativeBtn.parentNode.insertBefore(btn, nativeBtn.nextSibling);
    btn.addEventListener("click", function () {
      apply(localStorage.getItem(KEY) === "enhanced" ? "native" : "enhanced");
    });

    // Reset settings → back to native (their reset re-adds body.crt).
    var reset = document.getElementById("reset-settings");
    if (reset) reset.addEventListener("click", function () {
      localStorage.removeItem(KEY);
      apply("native", false);
    });
  }

  function init() {
    mountUI();
    apply(localStorage.getItem(KEY) === "enhanced" ? "enhanced" : "native", false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
