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
 *   • Enhanced wraps <main> only (not the whole app) so the toolbar/settings
 *     popover and modals stay crisp and un-clipped.
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
  var TARGET_SEL = "main";                  // the "screen" we enhance

  // Subtle, legible tuning — adds what the native effect lacks (curvature,
  // chromatic, RGB mask) without hurting small-text readability.
  var PRESET = {
    curvature: 0.10, chromatic: 0.35,
    blur: 0.25, glow: 0.25, bloom: 0.25, halation: 0,
    "scanline-opacity": 0.18, "scanline-height": 3, "scanline-speed": 0,
    "mask-opacity": 0.10, "mask-size": 3,
    vignette: 0.45, flicker: 0, noise: 0, roll: 0,
    saturate: 1.05, brightness: 1.08, contrast: 1.06, mono: 0,
  };

  var instance = null;     // the crt-screen instance when Enhanced
  var jsLoading = null;    // promise while crt.js loads

  function injectIntegrationCSS() {
    if (document.getElementById("crtss-int-css")) return;
    var s = document.createElement("style");
    s.id = "crtss-int-css";
    // Keep the app's layout + theming when crt-screen wraps <main>.
    s.textContent =
      "body.crt-enhanced " + TARGET_SEL + ".crt{background:transparent;border-radius:0;}" +
      "body.crt-enhanced " + TARGET_SEL + ".crt .crt__content{height:100%;}";
    document.head.appendChild(s);
  }

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
    injectIntegrationCSS();
    addStylesheet();
    document.body.classList.add("crt-enhanced");
    document.body.classList.remove("crt");        // native off (no double-up)
    loadCRTScreen().then(function () {
      var target = document.querySelector(TARGET_SEL);
      if (!target || !window.CRT) return;
      if (!instance) instance = window.CRT.apply(target, { values: PRESET });
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
