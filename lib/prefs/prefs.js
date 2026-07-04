/*!
 * prefs.js — a tiny, dependency-free, schema-driven preferences panel for static HTML.
 * MIT. No build step, no framework: include this file + prefs.css, hand it a mount
 * element and a schema, and it renders a themeable settings panel that persists to
 * localStorage. Reuse across projects by copying this folder and writing a new schema.
 *
 *   const prefs = Prefs({
 *     prefix: "myapp-",              // localStorage namespace
 *     mount: "#settings",            // element (or selector) to render into
 *     schema: [                      // groups → fields → options
 *       { title:"Display", open:true, summary:true, fields:[
 *         { id:"theme", type:"select", label:"Theme", default:"dark",
 *           attr:"data-theme",       // sets <body data-theme="…">
 *           options:[{value:"dark",label:"Dark"},{value:"light",label:"Light"}] },
 *         { id:"accent", type:"select", label:"Accent", default:"blue",
 *           cssVar:"--accent",       // sets :root style --accent = valueToCss(value)
 *           valueToCss:v=>({blue:"#4af",red:"#f55"}[v]),
 *           options:[{value:"blue",label:"Blue",swatch:'<i class="prefs-chip" style="background:#4af"></i>'},
 *                    {value:"red", label:"Red", swatch:'<i class="prefs-chip" style="background:#f55"></i>'}] },
 *         { id:"glow", type:"toggle", label:"Glow", default:"on",
 *           attr:"data-glow", onLabel:"On", offLabel:"Off" },
 *       ]},
 *     ],
 *     onChange:(id,value)=>{},        // fired on user commit (not on init/preview)
 *   });
 *
 *   prefs.get(id) · prefs.set(id,value) · prefs.reset() · prefs.on(cb) · prefs.refresh()
 *
 * Field options:
 *   type      "select" (pick one) | "toggle" (on/off)
 *   cssVar    a CSS custom property to set on `root` (default :root)
 *   valueToCss(value) → the string written to cssVar (else the raw value)
 *   attr      a body attribute to set (e.g. "data-theme")
 *   apply(value,{root,body,prefs})  custom side-effects (runs after cssVar/attr)
 *   preview   true → hovering an option applies it live without persisting
 *   summary   false → exclude this field from its group's summary line
 *   Option: { value, label, swatch (raw HTML), previewCss (font stack for the label),
 *             summary (short text for the group summary) }
 *   Toggle:  onValue (truthy match), onLabel, offLabel
 */
(function (global) {
  "use strict";

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function isOn(v, onValue) {
    return v === true || v === "on" || v === "1" || (onValue != null && v === onValue);
  }

  function Prefs(cfg) {
    cfg = cfg || {};
    var prefix   = cfg.prefix || "prefs-";
    var root     = cfg.root || document.documentElement;
    var body     = cfg.body || document.body;
    var mount    = typeof cfg.mount === "string" ? document.querySelector(cfg.mount) : cfg.mount;
    var schema   = cfg.schema || [];
    var onChange = typeof cfg.onChange === "function" ? cfg.onChange : function () {};
    var listeners = [];
    if (!mount) throw new Error("Prefs: mount element not found");

    // index fields by id and back-reference their group (for summaries)
    var fields = {};
    schema.forEach(function (g) {
      (g.fields || []).forEach(function (f) { fields[f.id] = f; f._group = g; });
    });

    function key(id) { return prefix + id; }

    function normalize(f, value) {
      if (!f) return value;
      if (f.type === "toggle") return isOn(value, f.onValue) ? "on" : "off";
      if (f.options && !f.options.some(function (o) { return String(o.value) === String(value); })) return f.default;
      return value;
    }
    function committed(id) {
      var f = fields[id];
      var stored = localStorage.getItem(key(id));
      return normalize(f, stored != null ? stored : f.default);
    }

    function apply(id, value, opts) {
      var f = fields[id];
      if (!f) return;
      opts = opts || {};
      value = normalize(f, value);
      if (f.cssVar) {
        var cv = f.valueToCss ? f.valueToCss(value) : value;
        if (cv != null) root.style.setProperty(f.cssVar, cv);
      }
      if (f.attr) body.setAttribute(f.attr, value);
      if (typeof f.apply === "function") f.apply(value, { root: root, body: body, prefs: api });
      if (opts.persist !== false) {
        try { localStorage.setItem(key(id), value); } catch (e) {}
      }
      reflect(id, value);
      if (opts.persist !== false && !opts.silent) {
        updateSummary(f._group);
        onChange(id, value);
        listeners.forEach(function (l) { try { l(id, value); } catch (e) {} });
      }
    }

    function reflect(id, value) {
      var wrap = mount.querySelector('[data-field="' + cssEsc(id) + '"]');
      if (!wrap) return;
      wrap.querySelectorAll(".prefs-opt").forEach(function (b) {
        b.classList.toggle("active", String(b.dataset.value) === String(value));
        b.setAttribute("aria-checked", String(b.dataset.value) === String(value) ? "true" : "false");
      });
      var tog = wrap.querySelector(".prefs-toggle");
      if (tog) {
        var f = fields[id], on = value === "on";
        tog.classList.toggle("on", on);
        tog.setAttribute("aria-pressed", on ? "true" : "false");
        tog.textContent = on ? (f.onLabel || "On") : (f.offLabel || "Off");
      }
    }
    function cssEsc(s) { return String(s).replace(/["\\]/g, "\\$&"); }

    // ---------- rendering ----------
    function optionHTML(f, o) {
      var inner = o.swatch != null ? o.swatch : esc(o.label != null ? o.label : o.value);
      var style = o.previewCss ? ' style="font-family:' + esc(o.previewCss) + '"' : "";
      return '<button type="button" class="prefs-opt" role="radio" aria-checked="false" data-value="' +
        esc(o.value) + '"' + style + ">" + inner + "</button>";
    }
    function fieldHTML(f) {
      var inner = "";
      if (f.label) inner += '<h4 class="prefs-label">' + esc(f.label) + "</h4>";
      if (f.note)  inner += '<p class="prefs-note">' + esc(f.note) + "</p>";
      if (f.type === "toggle") {
        inner += '<div class="prefs-opts"><button type="button" class="prefs-toggle" aria-pressed="false">Off</button></div>';
      } else {
        inner += '<div class="prefs-opts" role="radiogroup"' + (f.label ? ' aria-label="' + esc(f.label) + '"' : "") + ">" +
          (f.options || []).map(function (o) { return optionHTML(f, o); }).join("") + "</div>";
      }
      return '<div class="prefs-field" data-field="' + esc(f.id) + '">' + inner + "</div>";
    }
    function groupHTML(g, i) {
      return '<details class="prefs-group"' + (g.open ? " open" : "") + "><summary>" +
        esc(g.title || "") + ' <span class="prefs-cur" data-summary="' + i + '"></span></summary>' +
        (g.fields || []).map(fieldHTML).join("") + "</details>";
    }

    function updateSummary(g) {
      if (!g || !g.summary) return;
      var i = schema.indexOf(g);
      var span = mount.querySelector('[data-summary="' + i + '"]');
      if (!span) return;
      span.textContent = (g.fields || []).filter(function (f) { return f.summary !== false; }).map(function (f) {
        var v = committed(f.id);
        if (f.type === "toggle") return (f.label || f.id) + ": " + (v === "on" ? (f.onLabel || "On") : (f.offLabel || "Off"));
        var opt = (f.options || []).find(function (o) { return String(o.value) === String(v); });
        return opt ? (opt.summary || opt.label || v) : v;
      }).join(" · ");
    }
    function updateAllSummaries() { schema.forEach(function (g) { updateSummary(g); }); }

    // ---------- wiring ----------
    mount.classList.add("prefs");
    mount.innerHTML = schema.map(groupHTML).join("");

    mount.addEventListener("click", function (e) {
      var opt = e.target.closest(".prefs-opt");
      if (opt) { apply(opt.closest(".prefs-field").dataset.field, opt.dataset.value); return; }
      var tog = e.target.closest(".prefs-toggle");
      if (tog) {
        var id = tog.closest(".prefs-field").dataset.field;
        apply(id, committed(id) === "on" ? "off" : "on");
      }
    });

    // hover-preview (opt-in per field)
    schema.forEach(function (g) {
      (g.fields || []).forEach(function (f) {
        if (f.type !== "select" || !f.preview) return;
        var wrap = mount.querySelector('[data-field="' + cssEsc(f.id) + '"]');
        if (!wrap) return;
        wrap.addEventListener("mouseover", function (e) {
          var o = e.target.closest(".prefs-opt");
          if (o) apply(f.id, o.dataset.value, { persist: false });
        });
        wrap.addEventListener("mouseleave", function () { apply(f.id, committed(f.id), { persist: false }); });
      });
    });

    var api = {
      get: function (id) { return committed(id); },
      set: function (id, v) { apply(id, v); },
      reset: function () {
        schema.forEach(function (g) {
          (g.fields || []).forEach(function (f) {
            try { localStorage.removeItem(key(f.id)); } catch (e) {}
            apply(f.id, f.default);
          });
        });
      },
      on: function (cb) { if (typeof cb === "function") listeners.push(cb); return api; },
      refresh: updateAllSummaries,
      root: root, body: body
    };

    // boot: apply every committed value (silent — no onChange), then fill summaries
    schema.forEach(function (g) { (g.fields || []).forEach(function (f) { apply(f.id, committed(f.id), { silent: true }); }); });
    updateAllSummaries();
    return api;
  }

  global.Prefs = Prefs;
})(window);
