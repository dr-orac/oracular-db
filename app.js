/* ====================================================================
   MISFITS DATABASE  —  multi-faction live read-only viewer for Google Sheets
   (umbrella brand; each faction keeps its own brand — see FACTIONS below)
   --------------------------------------------------------------------
   Reads the public sheet via the gviz CSV endpoint (CORS-enabled for
   "anyone with link -> Viewer" sheets). No API key required to read.
   To point at a different sheet/tab, change CONFIG below.

   MODULE MAP (search these banners to jump around):
     · CONFIG / EXTRA_CHARACTERS / MEDIA   — data sources & code-defined entries
     · FACTIONS / FACTION_ICONS / FACTION_WIKI — the faction skins + per-faction prefs/appearance
     · themes (colour / background / font) — CSS-variable presets + persistence
     · CRT icon library                    — inline SVG sigils + spirit matcher
     · data fetch / parseCSV / buildModel  — load + normalise the sheet
     · rendering                           — dossier, portrait, cards, roster, home
     · hash router                         — #home · #<faction>/<section>[/<target>] · #wiki/<Page>
     · section nav / doc reader            — DOCS tabs; fetch + re-theme Google Docs (docClean/styleTOC)
     · WIKI reader                         — loadWiki/renderWiki: re-skin a MediaWiki page in-theme
     · photo upload                        — single-photo upload modal + write-back
     · edit mode / icon picker             — write-back UIs (gated by passphrase)
     · events / keyboard / load / init     — wiring and startup
   All write actions go through CONFIG.webAppUrl (Apps Script); reads never write.
   ==================================================================== */

const CONFIG = {
  // The tribe's ORIGINAL sheet — the community's source of truth, shared
  // "anyone with the link → Viewer". The site READS it; never write to it
  // (by hand, tool, or script — standing directive).
  sheetId: "10n4TFnuMWekZLD3pucKS050h1cNItcYmL9v0ciuBsSY",
  // Parked private working copy (only relevant if write-back is ever deployed):
  //   1649xQIHyrZtJWbVdTcg_ll7yS2ee_V9jGPtHLdgbyDQ
  gid: "",                 // optional: a specific tab's gid. "" = first sheet
  defaultSection: "The Tribe",
  // Paste the deployed Google Apps Script /exec URL here to enable image
  // upload + write-back. Leave "" and the upload button explains how to set up.
  webAppUrl: "",
};

/* ── Factions ──────────────────────────────────────────────────────────────
   A "faction" is a server variant of this same app: ONE codebase + ONE data
   schema, differing only by a config *skin* — a name, a colour/style, and its own
   data sheet. A contributor adds a variant by appending ONE entry here (plus their
   own Google Sheet, shared "anyone with the link → Viewer") — no code fork. When two
   or more factions exist, the masthead title becomes a switcher (see renderBrand).
     name    — short label shown in the switcher menu
     brand   — the masthead title (big text)
     tagline — the // sub-label after it
     theme   — a { color, bg } pair of keys from the Settings palette (THEMES / BGS)
     data    — { sheetId, gid } for THIS faction's roster (gid "" = the first tab) */
/* The faction roster mirrors the Misfits wiki's own faction listing (each with its signature colour),
   plus the Unity. tribe + brotherhood have live sheet data; the rest are "coming soon" until linked.
   No per-faction FONT: switching faction changing the interface typeface read as jumpy — every faction
   uses the classic Fallout font (FACTION_FONT_DEFAULT). Per-faction differences live in the CONTENT
   (data, colour, docs). Users can still pick fonts in Settings (remembered per faction). */
const FACTIONS = {
  tribe:       { name:"The Tribe",                   brand:"THE TRIBE DATABASE",      tagline:"// PIP-LINK",     theme:{color:"rust",    bg:"warm"},     data:{sheetId:CONFIG.sheetId, gid:CONFIG.gid}, docs:[] /* set to DOCS below */ },
  brotherhood: { name:"Brotherhood of Steel",        brand:"BROTHERHOOD OF STEEL",    tagline:"// CODEX-LINK",   theme:{color:"blue",    bg:"cool"},     data:{sheetId:"1hG6V1ddnlr8jZZm8Rg0jJ4360WrH7zUD-TvNqaPkuUg", gid:"735572717"}, docs:[] },
  ncr:         { name:"New California Republic",      brand:"NEW CALIFORNIA REPUBLIC", tagline:"// RANGER-NET",   theme:{color:"gold",    bg:"warm"},     data:{sheetId:"", gid:""}, docs:[] },
  legion:      { name:"Caesar's Legion",             brand:"CAESAR'S LEGION",         tagline:"// TRVE-NET",     theme:{color:"red",     bg:"warm"},     data:{sheetId:"", gid:""}, docs:[] },
  enclave:     { name:"The Enclave",                 brand:"THE ENCLAVE",             tagline:"// EYEBOT-NET",   theme:{color:"white",   bg:"slate"},    data:{sheetId:"", gid:""}, docs:[] },
  vault:       { name:"Vault Dwellers",              brand:"VAULT DWELLERS",          tagline:"// VAULT-NET",    theme:{color:"purple",  bg:"cool"},     data:{sheetId:"", gid:""}, docs:[] },
  followers:   { name:"Followers of the Apocalypse", brand:"FOLLOWERS OF THE APOCALYPSE", tagline:"// SCRIBE-NET", theme:{color:"cyan",  bg:"cool"},     data:{sheetId:"", gid:""}, docs:[] },
  townsfolk:   { name:"Townsfolk",                   brand:"TOWNSFOLK",               tagline:"// BAZAAR-NET",   theme:{color:"white",   bg:"slate"},    data:{sheetId:"", gid:""}, docs:[] },
  wastelanders:{ name:"Wastelanders",                brand:"WASTELANDERS",            tagline:"// DRIFTER-NET",  theme:{color:"amber",   bg:"warm"},     data:{sheetId:"", gid:""}, docs:[] },
  outlaws:     { name:"Outlaws",                     brand:"OUTLAWS",                 tagline:"// RAIDER-NET",   theme:{color:"orange",  bg:"warm"},     data:{sheetId:"", gid:""}, docs:[] },
  synthetics:  { name:"Synthetics",                  brand:"SYNTHETICS",              tagline:"// AUTO-NET",     theme:{color:"magenta", bg:"black"},    data:{sheetId:"", gid:""}, docs:[] },
  supermutants:{ name:"Super Mutants",               brand:"SUPER MUTANTS",           tagline:"// MUTANT-NET",   theme:{color:"green",   bg:"phosphor"}, data:{sheetId:"", gid:""}, docs:[] },
  unity:       { name:"The Unity",                   brand:"THE UNITY",               tagline:"// FEV-NET",      theme:{color:"green",   bg:"phosphor"}, data:{sheetId:"", gid:""}, docs:[] },
};
/* each faction's page on the Misfits wiki (the wiki's own faction listing) — used to offer a
   "read about this faction on the wiki" link even before its roster is linked. Unity has no page. */
const FACTION_WIKI = {
  tribe:"Wasteland_Tribes", brotherhood:"Brotherhood_of_Steel", ncr:"New_California_Republic",
  legion:"Caesar's_Legion", enclave:"The_Enclave", vault:"Vault_Dwellers",
  followers:"Followers_of_the_Apocalypse", townsfolk:"Townsfolk", wastelanders:"Wastelanders",
  outlaws:"Outlaws", synthetics:"Synthetics", supermutants:"Super_Mutants",
};
/* fallback if a faction ever lacks a `font` (mirrors the Tribe's iconic Fallouty pairing) */
const FACTION_FONT_DEFAULT = { head:"fallout", body:"fallout" };
function factionFont(f){ return (f && f.font) || FACTION_FONT_DEFAULT; }
/* ---- per-faction preferences (colour / bg / font are all remembered PER FACTION) ----
   One key builder + one resolver, so the "stored override, else this faction's signature"
   logic lives in ONE place instead of being re-spelled in applyFaction / init / refreshCur. */
function fkey(aspect, f){ return "mdb-"+aspect+"-"+(f||currentFaction); }
function factionAppearance(id){
  const f = FACTIONS[id] || activeFaction(), ff = factionFont(f);
  return {
    color: localStorage.getItem(fkey("color",     id)) || f.theme.color,
    bg:    localStorage.getItem(fkey("bg",        id)) || f.theme.bg,
    head:  localStorage.getItem(fkey("font-head", id)) || ff.head,
    body:  localStorage.getItem(fkey("font-body", id)) || ff.body,
  };
}
/* Switcher order (top→bottom in the dropdown). Add each new faction id here too.
   docs: a faction's own doc tabs — [] until linked (the Tribe's are wired below to DOCS).
   data.sheetId: "" = "not linked yet" → the app shows a themed coming-soon roster. */
const FACTION_ORDER = ["tribe","brotherhood","ncr","legion","enclave","vault","followers","townsfolk","wastelanders","outlaws","synthetics","supermutants","unity"];
const DEFAULT_FACTION = "tribe";   // the only faction with data today — new visitors start here
let currentFaction = DEFAULT_FACTION;
try{ const _f = localStorage.getItem("mdb-faction"); if(_f && FACTIONS[_f]) currentFaction = _f; }catch(e){}
function activeFaction(){ return FACTIONS[currentFaction] || FACTIONS[DEFAULT_FACTION]; }
function factionDocs(){ return activeFaction().docs || []; }         // this faction's doc tabs
function factionLinked(f){ return /^[A-Za-z0-9_-]{20,}$/.test((f && f.data && f.data.sheetId) || ""); }
/* switch faction: apply its skin (colour + bg + brand), persist it, and reload the
   roster only if this faction's data sheet differs from the current one. */
function applyFaction(id){
  if(!FACTIONS[id]) return;
  currentFaction = id;
  try{ localStorage.setItem("mdb-faction", id); }catch(e){}
  const f = FACTIONS[id], ap = factionAppearance(id);   // this faction's look: its overrides, else its signature
  applyColor(ap.color); applyBg(ap.bg); applyFontHead(ap.head); applyFontBody(ap.body);
  renderBrand();
  renderNav();                                       // this faction's doc tabs (may be none)
  // if the doc tab we were on doesn't exist for this faction, fall back to the roster
  // (home + roster are universal, so they survive a faction switch)
  if(currentSection==="home") setSection("home");     // re-render the tiles for this faction's docs
  else if(currentSection!=="roster" && !factionDocs().some(d=>d.id===currentSection)) setSection("roster");
  else if(currentSection==="roster") showRosterFor(f);
  writeRoute();   // the URL carries the faction, so a switch updates it (e.g. #brotherhood/roster)
}
/* show the roster for a faction: its live data if the sheet is linked, else a themed
   "coming soon" placeholder (so an unlinked faction never renders blank or another
   faction's data). */
function showRosterFor(f){
  if(!factionLinked(f)){ showFactionComingSoon(f); return; }
  document.body.classList.remove("coming-soon");
  if(!state.model || state.loadedSheet !== f.data.sheetId) load(false);   // (re)fetch this faction's sheet
  else render();                                                          // already in memory → instant
}
function showFactionComingSoon(f){
  document.body.classList.add("coming-soon");
  $("#roster").classList.add("hidden"); $("#cards").classList.add("hidden");
  $("#state").classList.remove("hidden");
  $("#loadermsg").innerHTML = "⚑ " + esc(f.name.toUpperCase());
  const poss = /s$/i.test(f.name) ? "’" : "’s";   // "Outlaws’ archive", not "Outlaws’s"
  const wpage = FACTION_WIKI[currentFaction];      // most factions have a wiki page → offer it meanwhile
  const wlink = wpage
    ? `<div class="coming-wiki"><a href="#wiki/${encodeURIComponent(wpage)}" data-wiki="${escAttr(wpage)}">▸ Read about ${esc(f.name)} on the wiki</a></div>`
    : "";
  $("#statesub").innerHTML = `Roster not linked yet — <b>${esc(f.name)}</b>${poss} archive will be connected soon.${wlink}`;
}
/* Original, in-house SVG glyph per faction (flat single-colour silhouettes, fill:currentColor so they
   tint to the active theme — NOT the trademarked Fallout logos). Each evokes the faction distinctly:
   Brotherhood=gear+sword · Vault=vault door+wheel · Legion=the Bull · Tribe=campfire · Enclave=eagle ·
   NCR=bear paw · Unity=DNA helix · Followers=medical cross · Townsfolk=bazaar stall (they're the
   bazaar folk) · Wastelanders=compass · Outlaws=skull · Synthetics=robot head · Super Mutants=fist.
   Shown in the faction picker + home. */
const FACTION_ICONS = {
  brotherhood:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M13.3 2.3h-2.6l-.34 2.02c-.52.14-1.02.35-1.48.61L7.24 3.9 5.4 5.74l1.06 1.65c-.26.46-.47.96-.61 1.48L3.83 9.2v2.6l2.02.34c.14.52.35 1.02.61 1.48l-1.06 1.65 1.84 1.84 1.65-1.06c.46.26.96.47 1.48.61l.34 2.02h2.6l.34-2.02c.52-.14 1.02-.35 1.48-.61l1.65 1.06 1.84-1.84-1.06-1.65c.26-.46.47-.96.61-1.48l2.02-.34V9.2l-2.02-.34a6.4 6.4 0 0 0-.61-1.48l1.06-1.65-1.84-1.84-1.65 1.06a6.4 6.4 0 0 0-1.48-.61L13.3 2.3Zm-1.3 5.4a3.4 3.4 0 1 1 0 6.8 3.4 3.4 0 0 1 0-6.8Z"/><path d="M9.1 7.1h5.8v1.5H9.1z"/><path d="M11.2 8.6h1.6v9.6l-.8 3-.8-3V8.6Z"/></svg>',
  vault:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2.6a7.4 7.4 0 1 1 0 14.8 7.4 7.4 0 0 1 0-14.8Z"/><circle cx="12" cy="3.6" r="1"/><circle cx="12" cy="20.4" r="1"/><circle cx="3.6" cy="12" r="1"/><circle cx="20.4" cy="12" r="1"/><circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M12 9v6M9.4 10.5l5.2 3M14.6 10.5l-5.2 3" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
  legion:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.3 5.2c2 .2 3.3 1.5 3.9 3.2C8.5 7.2 10.1 6.8 12 6.8s3.5.4 4.8 1.6c.6-1.7 1.9-3 3.9-3.2-.4 2.9-2 4.7-4.2 5.4.3.9.5 1.9.5 2.9a5 5 0 0 1-10 0c0-1 .2-2 .5-2.9-2.2-.7-3.8-2.5-4.2-5.4Z"/></svg>',
  followers:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.4 2.6h5.2v6.8h6.8v5.2h-6.8v6.8H9.4v-6.8H2.6V9.4h6.8z"/></svg>',
  townsfolk:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3.5h18v3H3z"/><path d="M3 6.5h18l-1.8 2.2-1.8-2.2-1.8 2.2-1.8-2.2-1.8 2.2-1.8-2.2-1.8 2.2-1.8-2.2-1.8 2.2L3 6.5Z"/><path d="M4.3 6.5h1.5v13H4.3zM18.2 6.5h1.5v13h-1.5z"/></svg>',   /* the bazaar market stall — townsfolk are the bazaar folk */
  wastelanders:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2.3a7.7 7.7 0 1 1 0 15.4 7.7 7.7 0 0 1 0-15.4Z"/><path d="m12 6 2 5 4 1-4 1-2 5-2-5-4-1 4-1z"/></svg>',
  outlaws:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M12 2.6c-4.5 0-7.6 3.1-7.6 7.4 0 2.4 1.1 4.1 2.5 5.3v2.3c0 .8.6 1.4 1.4 1.4h.4v1.2c0 .8.6 1.4 1.4 1.4s1.4-.6 1.4-1.4v-1.2h.9v1.2c0 .8.6 1.4 1.4 1.4s1.4-.6 1.4-1.4v-1.2h.4c.8 0 1.4-.6 1.4-1.4v-2.3c1.4-1.2 2.5-2.9 2.5-5.3 0-4.3-3.1-7.4-7.5-7.4ZM9 9.5a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4Zm6 0a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4Z"/></svg>',
  synthetics:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 2.3h2v2.2h-2z"/><path d="M6 6h12a1.6 1.6 0 0 1 1.6 1.6v8.8A1.6 1.6 0 0 1 18 18H6a1.6 1.6 0 0 1-1.6-1.6V7.6A1.6 1.6 0 0 1 6 6Z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="9" cy="11.5" r="1.7"/><circle cx="15" cy="11.5" r="1.7"/><path d="M2.4 10v4M21.6 10v4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  supermutants:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10.5V6.9a1.6 1.6 0 0 1 3.2 0M10.2 9.4V5.4a1.6 1.6 0 0 1 3.2 0v4M13.4 9.4V6.4a1.6 1.6 0 0 1 3.2 0v6.1a7 7 0 0 1-7 7 6.6 6.6 0 0 1-6.6-6.6V11.1a1.6 1.6 0 0 1 3.2 0v.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  tribe:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2.2c.6 3-2.3 4.3-2.3 6.9 0 1.1.8 1.8 1.6 1.8s1.3-.8 1.3-1.7c1.4 1.2 2.2 2.8 2.2 4.6a5.3 5.3 0 0 1-10.6 0c0-2.6 1.7-4.6 3.5-6.1-.4 1.7.3 2.7 1.1 2.9C8.5 8.9 8.1 6.9 9.9 4.8c1.3-1.1 2.1-1.5 3.1-2.6Z"/><path d="M3.8 18.8l16.4-3.5.42 2-16.4 3.5zM4.2 15.9l15.6 3.3-.42 2L3.8 17.9z"/></svg>',
  enclave:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6a1.4 1.4 0 0 0-1.4 1.4c0 .55.32 1.02.78 1.25l-.48 1.1C8.3 6.2 5 6.1 2 7.2c2.1.7 3.6 2 4.4 3.6-1.1-.2-2.2-.1-3.3.3 1.5 1 3.2 1.4 4.9 1.1-.7.6-1.2 1.5-1.4 2.5 1.1-.8 2.4-1.2 3.8-1.2h.2v5.8h2.8v-5.8h.2c1.4 0 2.7.4 3.8 1.2-.2-1-.7-1.9-1.4-2.5 1.7.3 3.4-.1 4.9-1.1-1.1-.4-2.2-.5-3.3-.3.8-1.6 2.3-2.9 4.4-3.6-3-1.1-6.3-1-9.1.15l-.48-1.1c.46-.23.78-.7.78-1.25A1.4 1.4 0 0 0 12 2.6Z"/></svg>',
  unity:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 3c0 3.7 7 4.8 7 9s-7 5.3-7 9M15.5 3c0 3.7-7 4.8-7 9s7 5.3 7 9" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M9.3 6.6h5.4M8.7 9.6h6.6M8.7 14.4h6.6M9.3 17.4h5.4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
  ncr:'<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="15.6" rx="4.6" ry="4"/><circle cx="6.4" cy="10.6" r="1.9"/><circle cx="10.3" cy="7.4" r="2"/><circle cx="13.7" cy="7.4" r="2"/><circle cx="17.6" cy="10.6" r="1.9"/></svg>',
};
/* the masthead FACTION selector: a labelled box showing the current faction + a big Fallout arrow;
   the whole box is the dropdown trigger. (Single faction → a static plate, no menu.) */
const FACTION_ARROW = `<span class="faction-arrow" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M2 5.5h16L10 15z"/></svg></span>`;
function renderBrand(){
  const el = document.querySelector(".brand"); if(!el) return;
  const f = activeFaction();
  document.title = f.brand;                                        // browser tab = the faction's brand (tagline dropped)
  el.classList.remove("open");                                    // a re-render always starts closed
  const ico = FACTION_ICONS[currentFaction] ? `<span class="faction-ico" aria-hidden="true">${FACTION_ICONS[currentFaction]}</span>` : "";
  const inner = ico + `<span class="faction-legend">Faction</span><span class="faction-name">${esc(f.name)}</span>`;
  if(FACTION_ORDER.length < 2){                                    // single faction → static plate, no menu
    el.classList.remove("has-switch");
    el.innerHTML = `<span class="faction-box faction-box--static">${inner}</span>`;
    return;
  }
  el.classList.add("has-switch");
  el.innerHTML =
    `<button class="faction-box" id="faction-btn" type="button" aria-haspopup="listbox" aria-expanded="false" title="Switch faction">`+
      inner + FACTION_ARROW +
    `</button>`+
    `<div class="faction-menu" id="faction-menu" role="listbox" aria-label="Faction">`+
      FACTION_ORDER.map((id,i) =>
        `<button class="faction-opt${id===currentFaction?' active':''}" style="--i:${i}" type="button" role="option" aria-selected="${id===currentFaction}" data-faction="${escAttr(id)}">`+
          `<span class="faction-opt-ico" aria-hidden="true">${FACTION_ICONS[id]||""}</span><span>${esc(FACTIONS[id].name)}</span>`+
        `</button>`
      ).join("")+
    `</div>`;
}
/* one-time delegated wiring for the switcher — open/close the menu + select a faction. */
function wireFactionMenu(){
  const closeMenu = () => { const el=document.querySelector(".brand.open"); if(el){ el.classList.remove("open");
    const b=document.querySelector("#faction-btn"); if(b) b.setAttribute("aria-expanded","false"); } };
  document.addEventListener("click", e => {
    const opt = e.target.closest(".faction-opt");
    if(opt){ closeMenu(); applyFaction(opt.dataset.faction); return; }
    const btn = e.target.closest("#faction-btn");
    const el = document.querySelector(".brand.has-switch");
    if(btn && el){ const open = el.classList.toggle("open"); btn.setAttribute("aria-expanded", open?"true":"false"); return; }
    if(!e.target.closest(".faction-menu")) closeMenu();     // outside click
  });
  document.addEventListener("keydown", e => { if(e.key==="Escape") closeMenu(); });
}

/* Extra top-nav sections that embed a Google Doc (read-only, in the terminal frame).
   Each doc must be shared "Anyone with the link -> Viewer" to render in the iframe.
   To add another: append { id, label, docId } (docId = the long string in the doc URL,
   .../document/d/<docId>/edit). `label` is what shows on the nav tab. */
const DOCS = [
  { id: "lore",     label: "Tribe Lore",     docId: "1N_gne2LAWEJpjp6CfLhtvuHHD8bm97d64V0dHoXnlIE" },
  { id: "roleplay", label: "Roleplay Guide", docId: "1lQrOZ-UPOR8-FP58l8ZFMvSPOyYDb5BYvvkwg0dR1oU" },
];
FACTIONS.tribe.docs = DOCS;   // the Tribe's doc tabs (other factions start with none — link later)

/* Code-defined entries that aren't rows in the sheet (e.g. visiting characters).
   Each: { name, section, fields:{ usename, honorific, ... image, icon } }. */
const EXTRA_CHARACTERS = [{"name": "Dr Orac Piyre", "section": "Visitors to the Tribe", "fields": {"discord": "", "usename": "Dr Orac Piyre", "honorific": "The First Doctor", "truename": "(sealed \u2014 \u201cthat man ended in the vat\u201d)", "birth": "His pre-mutation human name, kept private \u2014 a sealed chapter from Vault 13.", "address": "\u201cDoctor.\u201d He addresses humans as \u201cprecursors,\u201d first-generation mutants as \u201cbrethren,\u201d and second-generation as \u201ccousins.\u201d", "species": "Super Mutant (first-generation, FEV-dipped) \u2014 rare, near-uniform deep blue-black / jet-black skin.", "role": "Visitor to the tribe \u00b7 itinerant field surgeon, theologian & FEV researcher (not a member).", "appearance": "Male. A towering ~2.5m first-generation super mutant with rare, near-uniform jet-black (deep blue-black) skin \u2014 smooth where most mutants are mottled, the result of a clean FEV expression in a low-radiation vault dweller. Heavy, bone-dense build; slow to bleed or bruise; hands large enough to palm a human skull. Strikingly human grey eyes that observe before they engage. He wears a faded Vault 13 jumpsuit collar sewn around his left upper arm and a well-maintained pre-war surgical kit on his right hip.\nMannerisms: observant stillness; a slow head-tilt that serves as both invitation and warning; he smiles only with the lower half of his face. Dipped circa 2161 \u2014 active for over 130 years.", "spirit": "", "relationships": "BIG BROM MATLOK: A theological counterpart. Orac is drawn to the Chief-Shaman as a mind worth debating \u2014 a potential clash, or dialogue, between two very different faiths.\nTHE MASTER: Revered (privately). Orac holds that the Master\u2019s diagnosis of the wastes was correct \u2014 only the execution was a terrible misapplication of FEV.\nTHE LIEUTENANT (\u2018THE LOU\u2019): Deeply respected preceptor who oversaw his dipping at Mariposa and treated him as a peer.\nTHE VAULT DWELLER: Diagnosed, coldly, as \u2018a dangerous iatrogenic complication.\u2019\nBROTHERHOOD OF STEEL: A respected enemy that hunted his band of mutants for over a century.\nNCR: A frustrating impediment that killed many of his best troops.", "plot": "VAULT 13: Rose to Chief Medical Officer of Vault 13.\nTHE DIPPING (c.2161): Captured on a surface survey by Unity recruiters who prized a low-radiation vault doctor; carried to Mariposa and dipped under the Master\u2019s program. The clean FEV expression granted enhanced cognition and his signature jet-black skin.\nTHE FIRST DOCTOR: Served ~six months as clinical advisor \u2014 the self-styled \u2018First Doctor\u2019 \u2014 to the Master\u2019s program.\nFALL OF THE MASTER (2162): Away on inspection when the Vault Dweller destroyed the Master\u2019s forces; he survived.\nTHE REMNANT CHURCH: Gathered ~40 first-generation survivors and led them for over a century under attrition from Brotherhood patrols and NCR Rangers; by 2295 only three remained.\nTHE CANCER PHENOMENON: Now moving between the factions with a proposal \u2014 a plant/animal hybrid that is driving regional cancers toward near zero. He claims the FE virus lies at its heart, and campaigns to lift the stigma around FEV.", "notes": "A VISITOR, not a member of the tribe.\nTWO FACES: Publicly he decries the Unity\u2019s acts as \u2018a terrible misapplication of the medical potential of FEV\u2019 and champions the virus\u2019s healing promise. Privately he still reveres the Master\u2019s diagnosis and dreams of a refined \u2018Second Unity\u2019 \u2014 the Master was right about the disease, he believes, and wrong only about the cure.\nBELIEFS: Pre-war humanity was \u2018a chronic, terminal condition.\u2019 Dipping is \u2018a merciful procedure.\u2019 Mutants are not superior \u2014 they are \u2018humanity at its next phase.\u2019 He applies primum non nocere to the species, not the individual, and styles himself \u2018physician to the body politic.\u2019\nVOICE: Velvet, clinical, vault-educated \u2014 Charles Dance / David Warner. Medical metaphors for everything; slips into medical Latin under stress. He never says \u2018abomination\u2019 or \u2018monster,\u2019 only clinical terms.\nHe carries a faded Vault 13 jumpsuit collar sewn around his left arm, an immaculate pre-war surgical kit, and the names of every fallen mutant sibling.", "tastes": "A bitter medicinal tisane he distils himself; the clean sting of antiseptic. He does not so much eat at the fire as observe it \u2014 and quietly diagnose everyone around it.", "activities": "Diagnosing strangers on sight; cataloguing wasteland flora for medicinal properties; long \u2018teaching\u2019 monologues; maintaining his surgical kit; long stretches of observant stillness.", "image": "", "icon": "radiation"}}, {"name": "Azalea Webb", "section": "Sage's Goobers", "fields": {"discord": "Sage", "usename": "Azalea Webb", "species": "Human", "role": "NCR combat medic (NCRA) \u00b7 stationed at Wendover", "appearance": "29. Grew up in Shady Sands. Enlisted as a combat medic at 25 to make her son proud \u2014 and drew the worst posting, Wendover. Captured and enslaved by the Legion for a month; torturers poured boiling water down her throat, leaving her partially mute. She speaks slowly, in broken sentences, and prefers sign language.", "relationships": "SHANNON WEBB: Older sister (by two years).\nBRANDON WEBB: Her son (born when she was 19) \u2014 a father's boy, obsessed with soldiers and the NCRA.\nJUSTIN 'JJ' JENNINGS: Ex-husband; Brandon's father.", "notes": "Married JJ at 18, had Brandon at 19. Feeling her life going nowhere, she enlisted to become a 'superhero' to her son.\nQUOTE: \u201c\u2026\u201d", "special": "4 4 4 3 10 10 5", "address": "Partially mute \u2014 prefers sign language."}}, {"name": "Shannon Webb", "section": "Sage's Goobers", "fields": {"discord": "Sage", "usename": "Shannon Webb", "species": "Human", "role": "NCR Captain \u00b7 platoon commanding officer, Wendover", "appearance": "Azalea's older sister. Loud and impulsive, but always tries to do the right thing. Enlisted at 18, rose through the ranks and earned her commission as a Squad Leader.", "relationships": "AZALEA WEBB: Younger sister (by two years).", "notes": "Now Captain Webb, commanding the platoon deployed at Wendover.\nQUOTE: \u201cA true leader leads their men into battle themselves.\u201d", "special": "4 6 5 5 5 10 5"}}, {"name": "Stacey Webb", "section": "Sage's Goobers", "fields": {"discord": "Sage", "usename": "Stacey Webb", "species": "Human", "role": "Mercenary \u2014 self-proclaimed 'Best Merc in Wendover'", "appearance": "Abandoned at birth by two drug addicts and raised by the Followers of the Apocalypse in Wendover. Took to linguistics and philosophy \u2014 speaks Latin, Chinese, Spanish and sign language, and studied the pantheons of China, Rome, Greece and Egypt. Never seen without a 7.62 rifle on her back; loves the C70 and the Marksman carbine.", "relationships": "ORAC: Met this super mutant and his talk of Unity, Vault 13 and FEV \u2014 didn't believe much of it, but got dragged into his mess and is along for the ride, even if it costs her life.", "notes": "Left on her own at 18; learned to handle herself on the streets and finds work doing almost everything but actual merc work.\nQUOTE: \u201c7.62 is a god given gift, if such a thing even exists.\u201d", "special": "4 6 6 4 5 10 5"}}, {"name": "Lily Weaver", "faction": "brotherhood", "section": "Sage's Goobers", "fields": {"discord": "Sage", "usename": "Lily Weaver", "species": "Human", "role": "Brotherhood of Steel \u2014 Head Knight, 509th Chapter", "appearance": "29. Born to a Shi family in San Francisco; paler than her kin, with white hair (she refers to her 'condition'). Carries her family heirloom \u2014 a finely crafted double-edged sword.", "relationships": "BROTHERHOOD OF STEEL: Found passed out in the sand west of Lost Hills, taken in, and rose to Knighthood.\nNCR: Sympathised with the Republic's values as a teenager.", "notes": "Fled home at 18 after an argument with her parents, taking the family sword, and barely survived the wasteland until a Brotherhood patrol found her. Deployed to the Mojave Chapter and then the 509th, where she now serves as Head Knight \u2014 a middle ground between the paladins and the scribes.\nQUOTE: \u201cI cope with the stress of my job by goofing off more than I should.\u201d\nOOC: Sage's self-insert (carried over from earlier SS14/RMC characters in the Slimeweaver / Lightweaver line).", "special": "4 6 5 4 10 7 5"}}, {"name": "Scratchy", "section": "The Tribe", "fields": {"usename": "Scratchy", "species": "Super Mutant", "role": "Tribal", "appearance": "A super mutant who walks with the Tribe.", "notes": "Another tribal mutant of the Tribe. (Bio to be expanded.)"}}];

/* Code-defined portraits for characters whose images aren't in the sheet.
   slug -> { front, side }, values are file paths under media/ (extracted from
   what used to be inline base64). Merged into c.photos at build time (see ~L404). */
const MEDIA = {"big-brom-matlok": {"front": "media/big-brom-matlok-front.png"}, "dr-orac-piyre": {"front": "media/dr-orac-piyre-front.png", "side": "media/dr-orac-piyre-side.png"}};

/* ------------------------ themes (text colour + background) ------------------------ */
/* `dim` is used for SECONDARY TEXT (labels, role sub-lines, meta), so each value is
   tuned to clear WCAG AA (≥4.5:1) against every background incl. the lightest (slate).
   `faint` is borders/rules ONLY — never text. (See the legibility-floor convention.) */
/* `dim` is the DIMMEST colour used for TEXT (secondary/captions) — it carries a readability floor
   (~6.5:1 on its bg, comfortably past WCAG AA 4.5), staying below `primary` for hierarchy. `faint`
   is NON-TEXT only (borders/rules); it is intentionally sub-legible and must never colour prose. */
const THEMES = {
  green:   { name:"Green",   primary:"#3cff7a", bright:"#b6ffce", dim:"#26aa56", faint:"#0f3a22", glow:"rgba(60,255,122,.55)" },
  amber:   { name:"Amber",   primary:"#ffb642", bright:"#ffe0a3", dim:"#c3892e", faint:"#3a2a0e", glow:"rgba(255,182,66,.5)" },
  gold:    { name:"Gold",    primary:"#e3c074", bright:"#ffe9b0", dim:"#ab9154", faint:"#3a3018", glow:"rgba(227,192,116,.45)" },
  blue:    { name:"Blue",    primary:"#5db4ff", bright:"#c8e8ff", dim:"#4698dd", faint:"#10304a", glow:"rgba(93,180,255,.5)" },
  cyan:    { name:"Cyan",    primary:"#3ce0e0", bright:"#bdffff", dim:"#27a3a3", faint:"#0f3a3a", glow:"rgba(60,224,224,.5)" },
  white:   { name:"White",   primary:"#dbe3df", bright:"#ffffff", dim:"#97a19d", faint:"#2b322f", glow:"rgba(219,227,223,.35)" },
  magenta: { name:"Magenta", primary:"#ff6cc0", bright:"#ffc8e8", dim:"#ea5eb0", faint:"#3a1028", glow:"rgba(255,108,192,.5)" },
  red:     { name:"Red",     primary:"#ff6a5c", bright:"#ffc6bf", dim:"#f05f52", faint:"#3a1410", glow:"rgba(255,106,92,.5)" },
  orange:  { name:"Orange",  primary:"#ff8a3c", bright:"#ffceaa", dim:"#df7830", faint:"#3a2210", glow:"rgba(255,138,60,.5)" },
  purple:  { name:"Purple",  primary:"#b98cff", bright:"#e2ccff", dim:"#a87ced", faint:"#271042", glow:"rgba(185,140,255,.5)" },
  rust:    { name:"Rust",    primary:"#e0a338", bright:"#ffd992", dim:"#bc8b30", faint:"#382a10", glow:"rgba(224,163,56,.5)" },
};
const COLOR_ORDER = ["green","amber","gold","rust","orange","red","magenta","purple","blue","cyan","white"];
const BGS = {
  phosphor:{ name:"Phosphor",  bg:"#050a06", panel:"#07140c", panel2:"#0a1d11" },
  warm:    { name:"Warm Dark", bg:"#0a0704", panel:"#15100a", panel2:"#1f1810" },
  cool:    { name:"Cool Dark", bg:"#04060a", panel:"#0b1018", panel2:"#131c28" },
  black:   { name:"Black",     bg:"#050505", panel:"#101010", panel2:"#1a1a1a" },
  slate:   { name:"Slate",     bg:"#15171c", panel:"#1c1f26", panel2:"#262a33" },
};
const BG_ORDER = ["phosphor","warm","cool","black","slate"];
/* Typeface catalogue. Headings and body text are picked SEPARATELY (two radio groups
   in the Theme popover), so the picker states exactly what each choice affects —
   replacing the old fixed head+body preset pairs.
   `css` = the applied font-family stack. `preview` (optional) = stack used to render
   the option's own name in the picker when it differs from `css`. */
const LEGIBLE='"IBM Plex Mono", ui-monospace, monospace';
const FACES = {
  /* the primary/iconic face — "Fallouty" (Sébastien Caisse / "Red!", 2002): the real, widely-known
     fan recreation of the Fallout 1/2 title lettering. A clean, even pixel face whose glyphs fill
     ~58% of the em, so it reads bigger without the heavy/irregular look of the chunkier JH face.
     ("Fallout"=Fallout12 and VT323 are only fallbacks.) Internal key stays `fallout` — renaming it
     would churn stored prefs, PRESET_MIGRATE, the font orders and the body[data-font-*] CSS hooks. */
  fallout:   { name:"Fallouty",    css:'"Fallouty", "Fallout", "VT323", monospace' },
  /* Workbench is a wide display face: as a HEADINGS pick it styles the brand + character
     name plates only (via body[data-font-head="workbench"] CSS); other headings stay
     Fallout. Too loud for every label — this is the curated behaviour it always had. */
  workbench: { name:"Workbench",   css:'"Fallouty", "Fallout", "VT323", monospace',
               preview:'"Workbench", monospace', note:"name plates only" },
  overseer:  { name:"Overseer",   css:'"Overseer", "VT323", monospace' },
  monofonto: { name:"Monofonto",  css:'"Monofonto", monospace' },
  terminal:  { name:"Terminal",   css:'"VT323", monospace' },
  fixedsys:  { name:"Fixedsys",   css:'"Fixedsys Excelsior", monospace' },
  plex:      { name:"Plex",       css:LEGIBLE },
  sharetech: { name:"Share Tech", css:'"Share Tech Mono", ui-monospace, monospace' },
  ticker:    { name:"Ticker",     css:'"DotGothic16", monospace' },
  typewriter:{ name:"Typewriter", css:'"Special Elite", monospace' },
  block:     { name:"Block",      css:'"Pixelify Sans", monospace' },
  gothic:    { name:"Gothic 821", css:'"Gothic 821", "Oswald", sans-serif' },   // METALWORK ONLY — the faded-yellow FO1 chassis signage (body[data-frame="border"] .brand). Deliberately not in any picker order: it is a metal face, never a screen/phosphor one.
};
/* "typewriter" (paper sections) and "overseer" (metalwork) are reserved for surfaces not built
   yet — kept in FACES but out of the pickers for now. */
const HEAD_ORDER = ["fallout","workbench","monofonto","terminal","fixedsys","plex","ticker","block"];
const BODY_ORDER = ["fallout","plex","sharetech","monofonto","terminal","fixedsys","block"];
/* Doc-reader fonts are picked separately from the app's (a Google Doc reads differently
   from the roster chrome). Three tiers → CSS vars --doc-font-title/head/body. Defaults:
   Overseer masthead · Fallout section headings · Plex prose — all phosphor-screen faces.
   'gothic' and 'workbench' are excluded on purpose: Gothic 821 is metalwork-only (the FO1
   chassis signage), and workbench's css is just Fallouty (an app name-plate special) —
   both misleading in a doc picker, which sets a SCREEN surface. */
const DOC_HEAD_FACES = ["fallout","monofonto","terminal","fixedsys","block","ticker"];
const DOC_BODY_FACES = ["plex","sharetech","fallout","monofonto","terminal","fixedsys","block"];
const DOC_FONT_ORDERS = { title:DOC_HEAD_FACES, head:DOC_HEAD_FACES, body:DOC_BODY_FACES };
const DOC_FONT_DEFAULT = { title:"block", head:"fallout", body:"plex" };
/* full swatch-container ids (kept as complete literals so tools/selfcheck.py can verify
   them, and so no partial "#docfont-" string trips its id-reference check) */
const DOC_FONT_WRAP = { title:"docfont-title-swatches", head:"docfont-head-swatches", body:"docfont-body-swatches" };
/* legacy single-preset key (pre-rebuild "mdb-font") → [head, body] migration */
const PRESET_MIGRATE = {
  fallout:["fallout","fallout"], falloutplex:["fallout","plex"], fixedsys:["fixedsys","fixedsys"],
  monofonto:["monofonto","plex"], terminal:["terminal","sharetech"], plex:["plex","plex"],
  ticker:["ticker","plex"], workbench:["workbench","fallout"], overseer:["overseer","sharetech"],
  typewriter:["typewriter","typewriter"], block:["block","block"],
};

/* "#3cff7a" -> "60,255,122" so rgba(var(--fg-rgb), a) tracks the active preset. */
function hexToRgbTriplet(hex){
  let h=(hex||"").replace("#","").trim();
  if(h.length===3) h=h.split("").map(c=>c+c).join("");
  const n=parseInt(h,16);
  return isNaN(n) ? "60,255,122" : `${(n>>16)&255},${(n>>8)&255},${n&255}`;
}
/* hue (deg) + saturation (0–1) of a hex — used to tint monochrome images to the theme colour
   (a single sepia+hue-rotate filter, cribbed from carterfromsl's NV Pip-Boy pen). */
function hslOf(hex){
  let h=(hex||"").replace("#","").trim();
  if(h.length===3) h=h.split("").map(c=>c+c).join("");
  const n=parseInt(h,16); if(isNaN(n)) return {h:0, s:0};
  const r=((n>>16)&255)/255, g=((n>>8)&255)/255, b=(n&255)/255;
  const mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn, l=(mx+mn)/2;
  let hu=0, s=0;
  if(d){ s=d/(1-Math.abs(2*l-1));
    if(mx===r) hu=((g-b)/d)%6; else if(mx===g) hu=(b-r)/d+2; else hu=(r-g)/d+4;
    hu=hu*60; if(hu<0) hu+=360; }
  return {h:hu, s};
}
let _curColor = "green";   // remembered so a contrast-mode change can re-derive the palette
function applyColor(key){
  const t=THEMES[key]||THEMES.green, r=document.documentElement.style;
  _curColor = key;
  const hc = document.body.dataset.contrast==="high";   // High-Contrast: lift the dim/faint tiers
  /* --fg = the theme's FOREGROUND / phosphor colour (pairs with --bg). It's whatever hue the
     chosen theme sets — amber, rust, blue, green… — so it's named for its ROLE, not a colour.
       --fg        the phosphor colour (primary text, accents, borders-lit)
       --fg-bright brighter tint — headings, hovers, the "lit" state
       --fg-dim    dimmer shade — secondary text (min ≈4.6:1, the legibility floor)
       --fg-faint  faintest — hairlines/borders/box-shadows ONLY, never type
       --fg-rgb    the same colour as an "r,g,b" triplet, for rgba(var(--fg-rgb), a) fills/glows */
  r.setProperty("--fg",t.primary);  r.setProperty("--fg-bright",t.bright);
  r.setProperty("--fg-dim", hc ? t.primary : t.dim);    // HC: secondary text → full phosphor
  r.setProperty("--fg-faint", hc ? t.dim : t.faint);    // HC: hairlines/borders one step brighter
  r.setProperty("--fg-rgb", hexToRgbTriplet(t.primary));   // translucent fills/glows follow the preset
  /* Two glow levels. --glow is the DEFAULT: a subtle tight halo that stays crisp on dark/secondary
     text (a wide bloom there just reads muddy). --glow-strong is the rich two-layer phosphor bloom
     (F3-terminal style) reserved for big BRIGHT display text, where the glow actually looks good. */
  r.setProperty("--glow","0 0 2px "+t.glow);
  r.setProperty("--glow-strong","0 0 1px "+t.bright+", 0 0 7px "+t.glow);
  /* image tint: rotate a sepia base (~40°) to THIS theme's hue; near-grey themes (white) desaturate */
  const {h:_hu, s:_sat}=hslOf(t.primary);
  r.setProperty("--img-hue", Math.round(_hu-40)+"deg");
  r.setProperty("--img-sat", _sat<0.2 ? "0" : "2.1");   // near-grey themes (white) desaturate rather than mis-tint
  localStorage.setItem(fkey("color"), key);   // colour override is remembered PER FACTION
  document.querySelectorAll("#color-swatches .swatch").forEach(s=>s.classList.toggle("active",s.dataset.key===key));
}
function applyBg(key){
  const b=BGS[key]||BGS.phosphor, r=document.documentElement.style;
  r.setProperty("--bg",b.bg); r.setProperty("--bg-panel",b.panel); r.setProperty("--bg-panel-2",b.panel2);
  localStorage.setItem(fkey("bg"), key);   // bg override is remembered PER FACTION
  document.querySelectorAll("#bg-swatches .swatch").forEach(s=>s.classList.toggle("active",s.dataset.key===key));
  /* keep the browser chrome (mobile tab bar, PWA splash) in sync with the picked background */
  const tc = document.querySelector('meta[name="theme-color"]'); if(tc) tc.setAttribute("content", b.bg);
}
function applyFontHead(key){
  const f=FACES[key]||FACES.fallout;
  document.documentElement.style.setProperty("--font-head", f.css);
  document.body.dataset.fontHead=key;      // CSS hook: body[data-font-head="workbench"] name plates
  localStorage.setItem(fkey("font-head"), key);   // font override remembered PER FACTION
  document.querySelectorAll("#fonthead-swatches .swatch").forEach(s=>s.classList.toggle("active",s.dataset.key===key));
}
function applyFontBody(key){
  const f=FACES[key]||FACES.fallout;
  document.documentElement.style.setProperty("--font-body", f.css);
  document.body.dataset.fontBody=key;      // CSS hook: body[data-font-body="fallout"] line-height tuning
  localStorage.setItem(fkey("font-body"), key);   // font override remembered PER FACTION
  document.querySelectorAll("#fontbody-swatches .swatch").forEach(s=>s.classList.toggle("active",s.dataset.key===key));
  // re-derive the size if it's on Auto (pixel faces size up so they stay legible); a manual px stays put
  renderTextSize();
}
/* doc-reader fonts: kind ∈ {title, head, body} → sets --doc-font-<kind>, which the
   .docreader CSS reads (title = masthead + h1; head = subtitle + h2; body = prose + h3/h4). */
function applyDocFont(kind, key){
  /* coerce any unknown/retired key (e.g. a persisted "gothic" from when it was a title
     option — it's metalwork-only now) back to the default, so screen faces stay screen. */
  if(!DOC_FONT_ORDERS[kind].includes(key)) key=DOC_FONT_DEFAULT[kind];
  const f=FACES[key]||FACES[DOC_FONT_DEFAULT[kind]];
  document.documentElement.style.setProperty("--doc-font-"+kind, f.css);
  localStorage.setItem("mdb-docfont-"+kind, key);
  const wrap=document.getElementById(DOC_FONT_WRAP[kind]);
  if(wrap) wrap.querySelectorAll(".swatch").forEach(s=>s.classList.toggle("active",s.dataset.key===key));
}
/* Live hover-preview for the font pickers: hovering a swatch applies that face immediately
   (WITHOUT persisting); leaving the group restores the committed face (the .active swatch);
   clicking commits via the existing click handler. So you SEE each face in place before
   choosing — and it reveals exactly which text a category controls. */
function wireFontPreview(wrap, cssVar, dataAttr){
  if(!wrap) return;
  const show=key=>{ const f=FACES[key]; if(!f) return;
    document.documentElement.style.setProperty(cssVar, f.css);
    if(dataAttr) document.body.dataset[dataAttr]=key; };
  wrap.addEventListener("mouseover", e=>{ const b=e.target.closest(".swatch"); if(b) show(b.dataset.key); });
  wrap.addEventListener("mouseleave", ()=>{ const a=wrap.querySelector(".swatch.active"); if(a) show(a.dataset.key); });
}
function applyFrame(key){
  if(key!=="border") key="screen";                 // only two modes; default clean screen
  document.body.dataset.frame = key;
  localStorage.setItem("mdb-frame", key);
  document.querySelectorAll("#frame-swatches .swatch").forEach(s=>s.classList.toggle("active",s.dataset.key===key));
}
function applyFrameTint(key){
  if(key!=="theme") key="olive";                    // olive = authentic fixed palette
  document.body.dataset.frametint = key;
  localStorage.setItem("mdb-frametint", key);
  document.querySelectorAll("#frametint-swatches .swatch").forEach(s=>s.classList.toggle("active",s.dataset.key===key));
}
function applyGlass(key){
  if(key!=="on") key="off";                         // off by default (legibility)
  document.body.dataset.sheen = key;
  localStorage.setItem("mdb-sheen", key);
  document.querySelectorAll("#glass-swatches .swatch").forEach(s=>s.classList.toggle("active",s.dataset.key===key));
}
/* dossier "focus panel" — the soft pool of light behind the dossier header. On by default;
   off gives a pure flat screen (body[data-dosspanel="off"] hides the .doss-head::before). */
function applyDossPanel(key){
  if(key!=="off") key="on";
  document.body.dataset.dosspanel = key;
  localStorage.setItem("mdb-dosspanel", key);
  document.querySelectorAll("#dosspanel-swatches .swatch").forEach(s=>s.classList.toggle("active",s.dataset.key===key));
}
/* Cards view — how many cards per row. "auto" = responsive fill; 2/3/4 = fixed (wide screens
   only, see the @media guard in styles.css so phones never get tiny cards). */
function applyCards(key){
  if(!["auto","2","3","4"].includes(key)) key="auto";
  document.body.dataset.cards = key;
  localStorage.setItem("mdb-cards", key);
  document.querySelectorAll("#cards-swatches .swatch").forEach(s=>s.classList.toggle("active",s.dataset.key===key));
}
/* Image colour — "screen" (default: phosphor monochrome, matching the terminal) or
   "original" (true colour). Applies to doc images + character portraits. */
function applyImgColor(key){
  if(key!=="original") key="screen";
  document.body.dataset.imgcolor = key;
  localStorage.setItem("mdb-imgcolor", key);
  document.querySelectorAll("#imgcolor-swatches .swatch").forEach(s=>s.classList.toggle("active",s.dataset.key===key));
}
/* the always-on jet-black monitor bezel (screen mode) — toggleable off for a flush, borderless screen. */
function applyBezel(key){
  if(key!=="off") key="on";
  document.body.dataset.bezel = key;
  localStorage.setItem("mdb-bezel", key);
  document.querySelectorAll("#bezel-swatches .swatch").forEach(s=>s.classList.toggle("active",s.dataset.key===key));
}
/* BODY faces whose glyphs render small per-px → default to the "large" text size.
   (The user's explicit Text Size choice is persisted and wins over this default.
   Fallouty fills most of the em, so it reads large already at "comfortable".) */
const SMALL_FONTS = new Set(["fixedsys","terminal","sharetech","ticker","block"]);
/* Text size is a numeric px stepper with a hard legibility floor. Stored ("mdb-textsize") as
   "auto" (font-aware default — pixel faces render small, so they START larger) or an ABSOLUTE px
   string. Absolute sizes are decoupled from the font, so switching face never swings the size. */
const TS_MIN=17, TS_MAX=30;
function autoSizeForFont(bodyKey){ return SMALL_FONTS.has(bodyKey) ? 22 : 19; }
/* the live body face (set by applyFontBody), used to derive the auto text size. Falls back to
   this faction's stored override, then its signature body. (Fonts are per-faction now.) */
function bodyFontKey(){ return document.body.dataset.fontBody
  || localStorage.getItem(fkey("font-body"))
  || factionFont(activeFaction()).body; }
/* the effective root font-size (px): "auto" → font-derived, else the clamped stored number */
function effectiveTextPx(){
  const s=localStorage.getItem("mdb-textsize");
  if(!s || s==="auto") return autoSizeForFont(bodyFontKey());
  const n=parseInt(s,10);
  return isNaN(n) ? autoSizeForFont(bodyFontKey()) : Math.min(TS_MAX, Math.max(TS_MIN, n));
}
/* apply the size to the page (--root-fs drives body font-size) + refresh the stepper UI */
function renderTextSize(){
  const px=effectiveTextPx(), isAuto=(localStorage.getItem("mdb-textsize")||"auto")==="auto";
  document.documentElement.style.setProperty("--root-fs", px+"px");
  const v=$("#textsize-value"); if(v) v.textContent = isAuto ? px+"px · Auto" : px+"px";
  const dec=$("#textsize-dec"), inc=$("#textsize-inc"), au=$("#textsize-auto");
  if(dec) dec.disabled = px<=TS_MIN;
  if(inc) inc.disabled = px>=TS_MAX;
  if(au) au.classList.toggle("active", isAuto);
}
/* ± commits an ABSOLUTE size (so a later font change won't move it); floored at TS_MIN */
function stepTextSize(delta){
  const px=Math.min(TS_MAX, Math.max(TS_MIN, effectiveTextPx()+delta));
  localStorage.setItem("mdb-textsize", String(px)); renderTextSize();
}
/* kept for init/reset: pass "auto" or an absolute px */
function applyTextSize(choice){
  localStorage.setItem("mdb-textsize", (choice==null ? "auto" : String(choice)));
  renderTextSize();
}
function buildSettings(){
  // face pickers: each option's name renders IN its own typeface (the name is the
  // preview), with an optional scope note. All values are trusted constants.
  const faceBtn = k => {
    const f=FACES[k];
    return `<button class="swatch faceopt" data-key="${k}" role="radio">`+
      `<span class="fname" style='font-family:${f.preview||f.css}'>${f.name}</span>`+
      (f.note?`<span class="fnote">${f.note}</span>`:"")+
      `</button>`;
  };
  document.querySelector("#fonthead-swatches").innerHTML = HEAD_ORDER.map(faceBtn).join("");
  document.querySelector("#fonthead-swatches").addEventListener("click",e=>{ const b=e.target.closest(".swatch"); if(b) applyFontHead(b.dataset.key); });
  wireFontPreview(document.querySelector("#fonthead-swatches"), "--font-head", "fontHead");
  document.querySelector("#fontbody-swatches").innerHTML = BODY_ORDER.map(faceBtn).join("");
  document.querySelector("#fontbody-swatches").addEventListener("click",e=>{ const b=e.target.closest(".swatch"); if(b) applyFontBody(b.dataset.key); });
  wireFontPreview(document.querySelector("#fontbody-swatches"), "--font-body", "fontBody");
  // doc-reader font pickers (title / head / body)
  ["title","head","body"].forEach(kind=>{
    const wrap=document.getElementById(DOC_FONT_WRAP[kind]); if(!wrap) return;
    wrap.innerHTML = DOC_FONT_ORDERS[kind].map(faceBtn).join("");
    wrap.addEventListener("click",e=>{ const b=e.target.closest(".swatch"); if(b) applyDocFont(kind, b.dataset.key); });
    wireFontPreview(wrap, "--doc-font-"+kind, null);
  });
  // text size = a − / + stepper (even 1px steps, hard legibility floor) + an Auto reset that
  // follows the font's default. Replaces the old jumpy Cozy/Comfortable/Large/X-Large tiers.
  document.querySelector("#textsize-swatches").innerHTML =
    `<div class="stepper" role="group" aria-label="Text size">`+
      `<button class="swatch stepbtn" id="textsize-dec" type="button" aria-label="Smaller text" title="Smaller">−</button>`+
      `<span class="stepval" id="textsize-value" aria-live="polite"></span>`+
      `<button class="swatch stepbtn" id="textsize-inc" type="button" aria-label="Larger text" title="Larger">+</button>`+
      `<button class="swatch stepauto" id="textsize-auto" type="button" title="Match the font's default size">Auto</button>`+
    `</div>`;
  $("#textsize-dec").addEventListener("click",()=>stepTextSize(-1));
  $("#textsize-inc").addEventListener("click",()=>stepTextSize(+1));
  $("#textsize-auto").addEventListener("click",()=>applyTextSize("auto"));
  renderTextSize();
  document.querySelector("#frame-swatches").innerHTML =
    [["screen","Screen only"],["border","Chassis"]].map(([k,l])=>`<button class="swatch" data-key="${k}">${l}</button>`).join("");
  document.querySelector("#frame-swatches").addEventListener("click",e=>{ const b=e.target.closest(".swatch"); if(b) applyFrame(b.dataset.key); });
  document.querySelector("#frametint-swatches").innerHTML =
    [["olive","Olive"],["theme","Theme tint"]].map(([k,l])=>`<button class="swatch" data-key="${k}">${l}</button>`).join("");
  document.querySelector("#frametint-swatches").addEventListener("click",e=>{ const b=e.target.closest(".swatch"); if(b) applyFrameTint(b.dataset.key); });
  document.querySelector("#glass-swatches").innerHTML =
    [["off","Off"],["on","Subtle"]].map(([k,l])=>`<button class="swatch" data-key="${k}">${l}</button>`).join("");
  document.querySelector("#glass-swatches").addEventListener("click",e=>{ const b=e.target.closest(".swatch"); if(b) applyGlass(b.dataset.key); });
  document.querySelector("#dosspanel-swatches").innerHTML =
    [["on","On"],["off","Off"]].map(([k,l])=>`<button class="swatch" data-key="${k}">${l}</button>`).join("");
  document.querySelector("#dosspanel-swatches").addEventListener("click",e=>{ const b=e.target.closest(".swatch"); if(b) applyDossPanel(b.dataset.key); });
  document.querySelector("#cards-swatches").innerHTML =
    [["auto","Auto"],["2","2"],["3","3"],["4","4"]].map(([k,l])=>`<button class="swatch" data-key="${k}">${l}</button>`).join("");
  document.querySelector("#cards-swatches").addEventListener("click",e=>{ const b=e.target.closest(".swatch"); if(b) applyCards(b.dataset.key); });
  document.querySelector("#imgcolor-swatches").innerHTML =
    [["screen","Screen"],["original","Original"]].map(([k,l])=>`<button class="swatch" data-key="${k}">${l}</button>`).join("");
  document.querySelector("#imgcolor-swatches").addEventListener("click",e=>{ const b=e.target.closest(".swatch"); if(b) applyImgColor(b.dataset.key); });
  document.querySelector("#bezel-swatches").innerHTML =
    [["on","On"],["off","Off"]].map(([k,l])=>`<button class="swatch" data-key="${k}">${l}</button>`).join("");
  document.querySelector("#bezel-swatches").addEventListener("click",e=>{ const b=e.target.closest(".swatch"); if(b) applyBezel(b.dataset.key); });
  document.querySelector("#color-swatches").innerHTML = COLOR_ORDER.map(k=>
    `<button class="swatch" data-key="${k}">${THEMES[k].name}</button>`).join("");
  document.querySelector("#bg-swatches").innerHTML = BG_ORDER.map(k=>
    `<button class="swatch bg" data-key="${k}">${BGS[k].name}</button>`).join("");
  document.querySelector("#color-swatches").addEventListener("click",e=>{ const b=e.target.closest(".swatch"); if(b) applyColor(b.dataset.key); });
  document.querySelector("#bg-swatches").addEventListener("click",e=>{ const b=e.target.closest(".swatch"); if(b) applyBg(b.dataset.key); });
  // after ANY click in the popover, refresh the collapsed-group value lines + radio a11y
  // state. Synchronous is safe: this listener is on an ANCESTOR, so the per-group apply
  // handler (on the swatch container) has already run by the time the event bubbles here.
  // (Not rAF — rAF callbacks are suspended in hidden tabs.)
  document.querySelector("#settings-pop").addEventListener("click", refreshCur);
}

/* Collapsed-group summaries show their CURRENT values (Apple Settings style), so the
   popover communicates state without opening every group. Also syncs aria-checked. */
function refreshCur(){
  const headK=document.body.dataset.fontHead||"fallout", bodyK=document.body.dataset.fontBody||"fallout";
  const ap=factionAppearance(currentFaction), colorK=ap.color, bgK=ap.bg;
  const set=(id,txt)=>{ const el=document.querySelector(id); if(el) el.textContent=txt; };
  set("#cur-type", (FACES[headK]||FACES.fallout).name + (bodyK!==headK ? " / "+(FACES[bodyK]||FACES.fallout).name : ""));
  set("#cur-colour", (THEMES[colorK]||THEMES.green).name + " · " + (BGS[bgK]||BGS.phosphor).name);
  set("#cur-screen", "CRT " + (document.body.classList.contains("crt") ? "on" : "off"));
  set("#cur-layout", (document.body.dataset.frame==="border" ? "Chassis" : "Screen")
        + (document.body.dataset.frametint==="theme" ? " · tinted" : ""));
  document.querySelectorAll("#settings-pop .swatch[role=radio]")
    .forEach(b=>b.setAttribute("aria-checked", b.classList.contains("active")));
}

/* ------------------------ CRT icon library ------------------------ */
/* Each entry is the inner markup of a 0 0 24 24 SVG; strokes use currentColor,
   so icons take on whatever terminal colour is active. */
const ICONS = {
  paw:`<circle cx="12" cy="15.5" r="3.4"/><circle cx="6.8" cy="11" r="1.4"/><circle cx="10.6" cy="8" r="1.4"/><circle cx="14" cy="8" r="1.4"/><circle cx="17.4" cy="11" r="1.4"/>`,
  canine:`<path d="M5 5l3 4.4M19 5l-3 4.4"/><path d="M8 9c1.2-1 6.8-1 8 0 .7 4-1.6 7.7-4 9.7-2.4-2-4.7-5.7-4-9.7z"/><path d="M10.6 16.6 12 18.2l1.4-1.6"/><circle cx="10.2" cy="12" r=".55" fill="currentColor" stroke="none"/><circle cx="13.8" cy="12" r=".55" fill="currentColor" stroke="none"/>`,
  raptor:`<path d="M3 9c4 3 6.5 3 9 1 2.5 2 5 2 9-1"/><path d="M12 10.5v3.5"/><path d="M10.5 14h3"/>`,
  vulture:`<path d="M8.5 6c-2 .4-3.2 2-3.2 4 0 1.4.7 2.6 1.9 3.2"/><path d="M7.2 13.2C5.2 14.2 4 16.2 4.6 18.5H13c3 0 5-2 5-4.6 0-2-1.4-3.6-3.4-3.9"/><path d="M8.5 6 5.4 4.8 7.7 7"/><circle cx="7.4" cy="7.4" r=".45" fill="currentColor" stroke="none"/>`,
  owl:`<circle cx="12" cy="12.5" r="7"/><path d="M5.5 6.5 8 9M18.5 6.5 16 9"/><circle cx="9.2" cy="11.5" r="2"/><circle cx="14.8" cy="11.5" r="2"/><circle cx="9.2" cy="11.5" r=".5" fill="currentColor" stroke="none"/><circle cx="14.8" cy="11.5" r=".5" fill="currentColor" stroke="none"/><path d="M11 15l1 1 1-1"/>`,
  spider:`<circle cx="12" cy="13" r="2.6"/><path d="M9.6 11.6 4 8M9.4 13 3.5 13M9.7 14.6 4.5 18M10.9 10.6 8.6 4.5M14.4 11.6 20 8M14.6 13 20.5 13M14.3 14.6 19.5 18M13.1 10.6 15.4 4.5"/>`,
  scorpion:`<ellipse cx="11.5" cy="13" rx="2" ry="3"/><path d="M9.6 11 7 9 5 9.5M13.4 11 16 9l2 .5"/><path d="M11.5 16c.2 2 1 3 2.6 3.4 1.8.4 2.9-.7 2.9-2.2l-.6-.5"/>`,
  crab:`<path d="M5.5 13c0-3.2 3-5.2 6.5-5.2s6.5 2 6.5 5.2c0 2-2.6 3.3-6.5 3.3S5.5 15 5.5 13z"/><path d="M7 8.5 4 5.5M4 5.5 2.7 7l1.6-.2M17 8.5l3-3M20 5.5l1.3 1.5-1.6-.2"/><path d="M8 16.3 6.5 19M11 17v2.3M13 17v2.3M16 16.3 17.5 19"/>`,
  wasp:`<ellipse cx="12" cy="14.5" rx="2" ry="3.6"/><path d="M12 11V6.5"/><path d="M12 6.5 10 4.5M12 6.5 14 4.5"/><path d="M10.2 12.2C6.2 10.4 4 11.6 5 14.6M13.8 12.2c4-1.8 6.2-.6 5.2 2.4"/><path d="M10.4 13.5h3.2M10.4 15.4h3.2"/><path d="M12 18.1v1.8"/>`,
  worm:`<path d="M14.5 5c-4 0-4 4.2 0 4.2s4 4.2 0 4.2-4 3.4 0 3.4"/><circle cx="14.5" cy="5" r="1.5"/>`,
  brahmin:`<path d="M8 9 6 5.8M10.2 9 9.4 5M16 9l2-3.2M13.8 9l.8-4"/><path d="M6 11.2c0-2 1.8-3.2 3-3.2 1.3 0 2.3 1 3 2.1.7-1.1 1.7-2.1 3-2.1 1.2 0 3 1.2 3 3.2 0 5-3 8-6 9.2-3-1.2-6-4.2-6-9.2z"/><circle cx="9" cy="12.2" r=".5" fill="currentColor" stroke="none"/><circle cx="15" cy="12.2" r=".5" fill="currentColor" stroke="none"/>`,
  bull:`<path d="M5 8.5C3.6 5.5 7 5 8 7.2M19 8.5c1.4-3-2-3.5-3-1.3"/><path d="M8 7.2c1.2-1 6.8-1 8 0 1 1.6 1 6.2-4 8.4-5-2.2-5-6.8-4-8.4z"/><circle cx="10" cy="11" r=".5" fill="currentColor" stroke="none"/><circle cx="14" cy="11" r=".5" fill="currentColor" stroke="none"/><circle cx="12" cy="15.6" r="1.3"/>`,
  bear:`<circle cx="7" cy="7.5" r="2.1"/><circle cx="17" cy="7.5" r="2.1"/><path d="M7 9.5c1.2-1.2 8.8-1.2 10 0 1.4 1.6 1.2 7-5 9.2-6.2-2.2-6.4-7.6-5-9.2z"/><circle cx="9.8" cy="11.8" r=".5" fill="currentColor" stroke="none"/><circle cx="14.2" cy="11.8" r=".5" fill="currentColor" stroke="none"/><circle cx="12" cy="14.8" r="1.2"/>`,
  frog:`<circle cx="8" cy="8" r="2.2"/><circle cx="16" cy="8" r="2.2"/><circle cx="8" cy="8" r=".5" fill="currentColor" stroke="none"/><circle cx="16" cy="8" r=".5" fill="currentColor" stroke="none"/><path d="M5.8 10c-1.2 4 2 8 6.2 8s7.4-4 6.2-8"/><path d="M9 18l-2.2 2.2M15 18l2.2 2.2"/>`,
  fish:`<path d="M4 12c3-4.2 9-4.2 12 0-3 4.2-9 4.2-12 0z"/><path d="M16 12 21 8.5v7z"/><circle cx="7.8" cy="11" r=".6" fill="currentColor" stroke="none"/>`,
  snake:`<circle cx="7" cy="6" r="1.6"/><path d="M7.2 7.6c0 3 10 2 10 6.2s-7.5 2.8-7.5 5.2"/><path d="M5.6 5 4 4.4 5.6 6"/>`,
  cat:`<path d="M6 5l2 4.2.6-.6M18 5l-2 4.2-.6-.6"/><path d="M7 8.2c1.2-1 8.8-1 10 0 1 4-1.6 8-5 9.6C8.6 16.2 6 12.2 7 8.2z"/><circle cx="10" cy="11.6" r=".5" fill="currentColor" stroke="none"/><circle cx="14" cy="11.6" r=".5" fill="currentColor" stroke="none"/><path d="M12 13.6v1.4M9.2 14.4 12 15.4l2.8-1"/><path d="M8.2 13.4 5.2 12.8M8.2 14.6 5.2 15.2M15.8 13.4l3-.6M15.8 14.6l3 .6"/>`,
  mars:`<circle cx="10" cy="14" r="5"/><path d="M13.5 10.5 19 5M14.5 5H19v4.5"/>`,
  cross:`<path d="M12 4v16M7 9.5h10"/><path d="M12 3.5V2M9.6 4.2 8.8 2.9M14.4 4.2l.8-1.3"/>`,
  hourglass:`<path d="M6 4h12M6 20h12"/><path d="M7.5 4c0 4 4.5 5 4.5 8s-4.5 4-4.5 8M16.5 4c0 4-4.5 5-4.5 8s4.5 4 4.5 8"/>`,
  skull:`<path d="M6 10.5a6 6 0 0 1 12 0V13a2 2 0 0 1-2 2h-.8l-1 3h-4.4l-1-3H8a2 2 0 0 1-2-2z"/><circle cx="9.5" cy="10.5" r="1.6"/><circle cx="14.5" cy="10.5" r="1.6"/><path d="M11 14h2"/>`,
  radiation:`<circle cx="12" cy="12" r="1.7"/><path d="M12 12 8 5.2a8 8 0 0 1 8 0z" fill="currentColor"/><path d="M12 12 4.2 14a8 8 0 0 0 4 6.4z" fill="currentColor"/><path d="M12 12 19.8 14a8 8 0 0 1-4 6.4z" fill="currentColor"/>`,
  star:`<path d="M12 3l2.6 6.2 6.7.5-5.1 4.3 1.6 6.5L12 16.8 6.2 20l1.6-6.5L2.7 9.7l6.7-.5z"/>`,
  eye:`<path d="M2.5 12s4-6.2 9.5-6.2S21.5 12 21.5 12s-4 6.2-9.5 6.2S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6"/><circle cx="12" cy="12" r=".6" fill="currentColor" stroke="none"/>`,
  muffalo:`<path d="M5 9C2.4 8.2 2.6 5 5 5.6M19 9c2.6-.8 2.4-4 0-3.4"/><path d="M5 9c2-1.4 5-1.4 7 .1 2-1.5 5-1.5 7-.1"/><path d="M6 10.2c0 5 2.4 8 6 9.6 3.6-1.6 6-4.6 6-9.6z"/><circle cx="9.6" cy="12.4" r=".5" fill="currentColor" stroke="none"/><circle cx="14.4" cy="12.4" r=".5" fill="currentColor" stroke="none"/><path d="M9 16.4q3 1.8 6 0"/>`,
  nightstalker:`<path d="M5 6l2.4 3.4M13 6l-1.6 3.4"/><path d="M6 9.4c1-1 5-1 6 0 .8 3.4-1.2 6.4-3 7.8-1.8-1.4-3.4-4.4-3-7.8z"/><circle cx="7.6" cy="11.4" r=".45" fill="currentColor" stroke="none"/><circle cx="10.4" cy="11.4" r=".45" fill="currentColor" stroke="none"/><path d="M12 16c3 .8 5 0 6 2s-1.2 3-2.6 2.3"/><path d="M18 20l1.6.4-1 1.1"/>`,
  yaoguai:`<circle cx="6.6" cy="7" r="2"/><circle cx="17.4" cy="7" r="2"/><path d="M6.6 9c1.2-1.2 9.6-1.2 10.8 0 1.2 1.6 1 7-5.4 9.6C5.6 16 5.4 10.6 6.6 9z"/><circle cx="9.6" cy="11.4" r=".5" fill="currentColor" stroke="none"/><circle cx="14.4" cy="11.4" r=".5" fill="currentColor" stroke="none"/><path d="M9.4 15l1 1.6.8-1.1m1.6 0l.8 1.1 1-1.6"/>`,
  ogua:`<path d="M3 13c0-2.2 3.4-4 7.5-4s7.5 1.6 7.5 4c0 1.1-1 2-2.2 2"/><path d="M3 13c0 2.2 3.4 3.2 7.5 3.2 2.2 0 4.2-.5 5.3-1.1"/><path d="M2 12l1 1-1 1"/><path d="M5 13l1 1m2-1l1 1m2-1l1 1m2-1l1 1"/><circle cx="14.5" cy="11.4" r=".5" fill="currentColor" stroke="none"/>`,
  mongoose:`<path d="M3 14.5c1-2 3.2-2 5.2-1.4 2 .5 3-.6 4-2.2 1.4-2.2 4.2-2.2 6.4-1.4"/><path d="M3 14.5c0 1.6 1.6 2.1 3.2 1.5"/><path d="M18.6 9c1.6-.5 2.6.6 2 1.7"/><circle cx="19" cy="9.6" r=".4" fill="currentColor" stroke="none"/><path d="M6 16.4v2.2m4-2.4v2.4m6-3v2.2"/>`,
  mirelurk:`<path d="M5 13c0-3.4 3.2-5.4 7-5.4s7 2 7 5.4c0 1.8-2.4 3-7 3s-7-1.2-7-3z"/><path d="M5 12.5 2.6 9.5 4 13.5M19 12.5l2.4-3 -1.4 4"/><path d="M2.6 9.5 1.6 8l2 .6M21.4 9.5l1-1.5-2 .6"/><path d="M8 16.2v2.4m4-2.2v2.4m4-2.6v2.4"/>`,
  centaur:`<path d="M9 5.2c0-2 6-2 6 0 0 1.6-1.5 2.6-3 2.6S9 6.8 9 5.2z"/><circle cx="10.6" cy="5" r=".4" fill="currentColor" stroke="none"/><circle cx="13.4" cy="5" r=".4" fill="currentColor" stroke="none"/><path d="M6 11c0-2.4 12-2.4 12 0 0 3-2 5-6 5s-6-2-6-5z"/><path d="M7 14.5l-2.5 5m5-4v5m5-5l1.2 5m4-6l2.4 4.4"/>`,
  silhouette:`<circle cx="12" cy="8.6" r="3.7" fill="currentColor" stroke="none"/><path d="M4.8 20c0-4 3.2-6.6 7.2-6.6s7.2 2.6 7.2 6.6z" fill="currentColor" stroke="none"/>`,
};
const ICON_ORDER = ["paw","canine","nightstalker","cat","mongoose","bear","yaoguai","ogua","brahmin","bull","muffalo",
  "frog","fish","snake","worm","spider","scorpion","crab","mirelurk","wasp","raptor","owl","vulture","centaur",
  "eye","mars","cross","hourglass","skull","radiation","star"];

/* map a spirit-animal description to an icon key (specific terms first) */
const SPIRIT_MAP = [
  ["nightstalker","nightstalker"],["centaur","centaur"],["brahmin","brahmin"],["muffalo","muffalo"],["bull","bull"],
  ["radscorpion","scorpion"],["scorpion","scorpion"],["cazador","wasp"],["hornet","wasp"],["wasp","wasp"],
  ["mirelurk","mirelurk"],["crab","crab"],["yao","yaoguai"],["ogua","ogua"],["bear","bear"],
  ["owl","owl"],["vulture","vulture"],["falcon","raptor"],["hawk","raptor"],["eagle","raptor"],
  ["wolf","canine"],["hound","canine"],["coyote","canine"],["puppy","canine"],["dog","canine"],
  ["spider","spider"],["frog","frog"],["fish","fish"],["serpent","snake"],["snake","snake"],
  ["lynx","cat"],["wildcat","cat"],["mongoose","mongoose"],["cat","cat"],["worm","worm"],
  ["mars","mars"],["christ","cross"],["cross","cross"],["past","hourglass"],
];
function spiritIconKey(text){
  // whole-word match (so prose like "communicated" can't match "cat").
  // try the heading line first, then fall back to the whole text (catches e.g. Xiu Xiu's "Centaur").
  const t=(text||"").toLowerCase();
  const scan=s=>{ for(const [kw,key] of SPIRIT_MAP){
      if(new RegExp("\\b"+kw.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\b").test(s)) return key; } return null; };
  return scan(t.split("\n")[0]) || scan(t) || "paw";
}
function svgIcon(key, cls){
  return `<svg class="ic ${cls||''}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[key]||ICONS.paw}</svg>`;
}
/* the empty-photo placeholder. Priority:
   1) an explicitly chosen sigil (sheet Icon column or local pick)
   2) the character's spirit-animal sigil (derived from the Spirit Animal text)
   3) only if there's nothing to go on, the stamped "NO PHOTO ID" card.
   The emblem is wrapped so CSS can render it as an illuminated medallion. */
function portraitSigil(ch){
  const key = explicitIcon(ch)
            || ((ch.fields.spirit||"").trim() ? spiritIconKey(ch.fields.spirit) : "");
  return key
    ? `<span class="sig-emblem">${svgIcon(key)}</span>`
    : `${svgIcon('silhouette','figure')}<span class="noid"><b>No ID</b></span>`;
}
/* per-character icon: explicit (sheet Icon column or local pick) else spirit-derived */
function localIcons(){ try{ return JSON.parse(localStorage.getItem("mdb-icons")||"{}"); }catch{ return {}; } }
function setLocalIcon(slug,key){ const m=localIcons(); m[slug]=key; lsSetData("mdb-icons", JSON.stringify(m)); }
function iconForChar(ch){
  return explicitIcon(ch) || spiritIconKey(ch.fields.spirit||"");
}
/* only a deliberately-chosen icon (sheet Icon column or picker) — no spirit fallback */
function explicitIcon(ch){
  const ex=((ch.fields.icon||"").trim().toLowerCase()) || localIcons()[ch.slug];
  return (ex && ICONS[ex]) ? ex : "";
}

/* Field definitions, in dossier display order.
   `match` = substrings tested against the normalised header text. */
const FIELDS = {
  discord:      { match:["discord"],                          label:"Player (Discord)" },
  usename:      { match:["use-name","use name","full name"],  label:"Use-Name" },
  honorific:    { match:["honorific","brave"],                label:"Brave-Name / Honorific" },
  truename:     { match:["true name"],                        label:"True Name" },
  birth:        { match:["birth","original name"],            label:"Birth Name" },
  address:      { match:["mode of address","favoured mode","address"], label:"Address As" },
  species:      { match:["species"],                          label:"Species" },
  role:         { match:["usual role","caste and rank","caste","rank","role"], label:"Role" },
  appearance:   { match:["appearance","age /","age/"],        label:"Age / Sex / Appearance", type:"block" },
  /* fields specific to the Brotherhood roster (unmatched on the tribe sheet → simply not shown) */
  origin:       { match:["origin"],                           label:"Origin", type:"block" },
  armament:     { match:["preferred armament","armament"],    label:"Preferred Armament", type:"block" },
  talents:      { match:["talents"],                          label:"Talents", type:"block" },
  medical:      { match:["medical history","medical"],        label:"Medical History", type:"block" },
  accomplishments:{ match:["accomplishments"],                label:"Accomplishments", type:"block" },
  status:       { match:["status"],                           label:"Status" },
  spirit:       { match:["spirit animal"],                    label:"Spirit Animal", type:"block" },
  relationships:{ match:["relationship"],                     label:"Relationships", type:"lead" },
  plot:         { match:["plot"],                             label:"Key Plot Moments", type:"lead" },
  notes:        { match:["notes"],                            label:"Notes", type:"block" },
  tastes:       { match:["favourite herb","herb /","drink"],  label:"At The Fire", type:"block" },
  activities:   { match:["favourite activ","activities"],     label:"Off-Duty", type:"block" },
  shots:        { match:["screenshots","screenshot","gallery","moments","in-game"], label:"Screenshots" },
  log:          { match:["personal log","log","journal","diary","stories"], label:"Personal Log" },
  imageside:    { match:["image side","side view","side","profile"], label:"Image (side)" },
  image:        { match:["image front","front view","front","image","portrait","photo","picture","avatar","mugshot"], label:"Image (front)" },
  special:      { match:["s.p.e.c.i.a.l","special","stats"], label:"S.P.E.C.I.A.L" },
  tags:         { match:["tags","labels","keywords"], label:"Tags" },
  icon:         { match:["icon","sigil","emblem","glyph"], label:"Icon" },
};
/* order shown in the dossier body (identity fields handled separately) */
const ID_ORDER   = ["truename","birth","address","species","status","discord"];
const BLOCK_ORDER = ["appearance","origin","armament","talents","medical","accomplishments","spirit","relationships","plot","notes","tastes","activities"];
/* fields offered in edit mode; ta=true -> multi-line textarea. Image is handled by upload. */
const EDIT_FIELDS = [
  ["usename",false],["honorific",false],["truename",false],["birth",false],
  ["address",false],["species",false],["role",false],["appearance",true],
  ["spirit",true],["relationships",true],["plot",true],["notes",true],
  ["tastes",true],["activities",true],["discord",false],["special",false],["tags",false],
];

/* ------------------------ data fetch ------------------------ */
/* Effective sheet id. A `?sheet=<id>` URL param (or a 'mdb-sheet-override' localStorage
   value) takes precedence over CONFIG.sheetId. This lets the PREVIEW point at a public
   mirror sheet WITHOUT editing the source file — so syncing app.js can no longer clobber
   the real sheet id. Production deploys just use CONFIG.sheetId (no param = no override).
   The id is validated (Google sheet ids are long base64url-ish strings) so junk is ignored. */
function effectiveSheetId(){
  const ok = v => typeof v === "string" && /^[A-Za-z0-9_-]{20,}$/.test(v);
  try{
    // injected by tools/preview.py into the SERVED copy only — never present in the repo file
    if(ok(window.MDB_SHEET_OVERRIDE)) return window.MDB_SHEET_OVERRIDE;
    // ?sheet= / localStorage overrides are DEV-ONLY. Honouring them on the deployed site would
    // let a crafted link render an arbitrary spreadsheet under this site's own URL (content
    // spoofing on a trusted origin), so they only apply when served from localhost.
    if(/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)){
      const p = new URLSearchParams(location.search).get("sheet");
      if(ok(p)) return p;                                // explicit per-load override
      const ls = localStorage.getItem("mdb-sheet-override");
      if(ok(ls)) return ls;
    }
  }catch(e){ /* sandboxed / no storage — fall through to the faction / configured id */ }
  try{ const fs = activeFaction().data.sheetId; if(ok(fs)) return fs; }catch(e){}   // active faction's sheet (yuma = CONFIG.sheetId)
  return CONFIG.sheetId;
}
function sheetUrl(){
  let u = `https://docs.google.com/spreadsheets/d/${effectiveSheetId()}/gviz/tq?tqx=out:csv`;
  const gid = (activeFaction().data.gid) || CONFIG.gid;
  if (gid) u += `&gid=${encodeURIComponent(gid)}`;
  u += `&_=${Date.now()}`;          // cache-buster
  return u;
}

/* RFC-4180-ish CSV parser: handles quotes, "" escapes, commas + newlines in fields */
function parseCSV(text){
  const rows=[]; let row=[]; let field=""; let i=0; let inQ=false;
  const n=text.length;
  while(i<n){
    const c=text[i];
    if(inQ){
      if(c==='"'){
        if(text[i+1]==='"'){ field+='"'; i+=2; continue; }
        inQ=false; i++; continue;
      }
      field+=c; i++; continue;
    }
    if(c==='"'){ inQ=true; i++; continue; }
    if(c===','){ row.push(field); field=""; i++; continue; }
    if(c==='\r'){ i++; continue; }
    if(c==='\n'){ row.push(field); rows.push(row); row=[]; field=""; i++; continue; }
    field+=c; i++;
  }
  // last field/row
  row.push(field); rows.push(row);
  // drop a trailing fully-empty row
  if(rows.length && rows[rows.length-1].every(c=>c==="")) rows.pop();
  return rows;
}

const norm = s => (s||"").replace(/\s+/g," ").trim().toLowerCase();
const norm0 = s => (s||"").replace(/\s+/g," ").trim();   // collapse whitespace, keep case
const clean = s => (s||"").replace(/ /g," ").trim();

/* map sheet columns -> field keys using the header row */
function mapColumns(headerRow){
  const map={};            // fieldKey -> colIndex
  headerRow.forEach((h,idx)=>{
    const hn=norm(h);
    if(!hn) return;
    for(const [key,def] of Object.entries(FIELDS)){
      if(map[key]!==undefined) continue;
      if(def.match.some(m=>hn.includes(m))){ map[key]=idx; break; }
    }
  });
  return map;
}

/* turn raw rows into structured entries (sections + characters) */
/* display rebrand: "the Yuma Tribe" → "the Tribe" everywhere it's shown (the underlying sheet
   keeps its own wording; this only relabels for display). Scoped to the phrase, so place-name
   "Yuma" on its own is left untouched. */
/* the "Yuma Tribe" → "Tribe" display rebrand is tribe-specific — don't rewrite other factions' data */
const relabelTribe = s => (currentFaction==="tribe" ? (s||"").replace(/\bYuma Tribe\b/g, "Tribe") : (s||""));
function buildModel(rows){
  // find header row: the one containing "discord" (or "use-name")
  let hIdx = rows.findIndex(r=>r.some(c=>{const x=norm(c);return x.includes("discord")||x.includes("use-name");}));
  if(hIdx<0) hIdx=1;
  const colmap = mapColumns(rows[hIdx]);
  const usenameCol = colmap.usename ?? 1;
  const discordCol = colmap.discord ?? 0;

  // data begins after header + the description row beneath it
  const dataRows = rows.slice(hIdx+2);

  const characters=[];
  const sections=[];           // ordered list of section names (for grouping)
  let current=activeFaction().name || CONFIG.defaultSection;   // default section = the active faction's name
  sections.push(current);

  for(const r of dataRows){
    const filled = r.filter(c=>clean(c)!=="").length;
    if(filled===0) continue;
    const useName = clean(r[usenameCol]);
    const discord = clean(r[discordCol]);

    // section divider: only a single cell filled (a bare heading) -> new section
    if(filled<=1){
      const raw = useName || discord || r.map(clean).find(x=>x) || "";
      const name = raw.replace(/^[^A-Za-z0-9]+/,"").replace(/[^A-Za-z0-9]+$/,"").trim();
      if(name){ current=relabelTribe(name); if(!sections.includes(current)) sections.push(current); }
      continue;
    }

    // build a character object
    const fields={};
    for(const [key,col] of Object.entries(colmap)){
      const v=clean(r[col]);
      if(v) fields[key]=relabelTribe(v);
    }
    const displayName = fields.usename || fields.discord || "(unnamed)";
    characters.push({ name:displayName, section:current, fields, search:norm(r.join(" ")) });
  }

  // merge in code-defined extra characters (visitors etc. not present in the sheet). Each extra
  // belongs to ONE faction (ex.faction, default "tribe"), gated on the CHARACTER's affiliation —
  // so e.g. a Brotherhood knight only appears in the Brotherhood roster, never leaks into the Tribe.
  for(const ex of (EXTRA_CHARACTERS||[])){
    if((ex.faction||"tribe")!==currentFaction) continue;
    const fields={}; for(const k in ex.fields) fields[k]=relabelTribe(ex.fields[k]);
    const sec=relabelTribe(ex.section||CONFIG.defaultSection);
    characters.push({ name: ex.name||fields.usename||"(unnamed)", section:sec, fields,
      search: norm((ex.name||"")+" "+Object.values(fields).join(" ")) });
    if(!sections.includes(sec)) sections.push(sec);
  }

  // assign stable, unique URL slugs (used for permalinks)
  const seen={};
  for(const c of characters){
    let base = (c.name||"unit").toLowerCase()
      .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"") || "unit";
    let slug=base, n=2;
    while(seen[slug]) slug=base+"-"+(n++);
    seen[slug]=true; c.slug=slug;
  }

  // remember each field's *actual* sheet header text (whitespace-collapsed) so
  // write-back can target the right column
  const headersByKey={};
  for(const [key,col] of Object.entries(colmap)) headersByKey[key]=norm0(rows[hIdx][col]);

  // attach photos / logs / screenshots: local additions merge with code MEDIA + the sheet
  for(const c of characters){
    for(const k in c.fields) if(k!=="image" && k!=="imageside" && k!=="shots") c.fields[k]=cleanField(c.fields[k]);
    const lp=localPhotos()[c.slug]||{}, m=MEDIA[c.slug]||{};
    c.photos = {
      front: lp.front || m.front || imageSrc(c.fields.image)     || "",
      side:  lp.side  || m.side  || imageSrc(c.fields.imageside) || "",
    };
    // personal log: sheet cell split on a dashed line or blank line, then local entries
    const sheetLogs=(c.fields.log||"").split(/\n-{3,}\n|\n{2,}/).map(s=>s.trim()).filter(Boolean).map(s=>({s}));
    c.logs = sheetLogs.concat(localLogs()[c.slug]||[]);
    // screenshots: sheet cell (URLs) + local uploads
    const sheetShots=(c.fields.shots||"").split(/[\n,]+/).map(s=>imageSrc(s.trim())).filter(Boolean);
    c.shots = sheetShots.concat(localShots()[c.slug]||[]);
  }

  return { characters, sections, headersByKey };
}

/* locally-saved additions (used when there's no write-back backend configured) */
/* quota-safe write: image data URLs are big, and localStorage is ~5MB — a full store throws
   QuotaExceededError mid-save. Catch it and TELL the user (the on-screen copy already shows
   optimistically, so without this the save silently evaporates on reload). */
function lsSetData(key, val){
  try{ localStorage.setItem(key, val); return true; }
  catch(e){ toast("⚠ Device storage is full — this won't survive a reload. Remove some saved photos/screenshots first."); return false; }
}
function localPhotos(){ try{ return JSON.parse(localStorage.getItem("mdb-photos")||"{}"); }catch{ return {}; } }
function setLocalPhoto(slug, slot, src){
  const m=localPhotos(); (m[slug]=m[slug]||{})[slot]=src;
  lsSetData("mdb-photos", JSON.stringify(m));
}
function clearLocalPhoto(slug, slot){            // after a successful sheet write, the sheet is canonical
  const m=localPhotos(); if(m[slug]){ delete m[slug][slot]; lsSetData("mdb-photos", JSON.stringify(m)); }
}
function localLogs(){ try{ return JSON.parse(localStorage.getItem("mdb-logs")||"{}"); }catch{ return {}; } }
function addLocalLog(slug, entry){
  const m=localLogs(); (m[slug]=m[slug]||[]).push(entry);
  lsSetData("mdb-logs", JSON.stringify(m));
}
function localShots(){ try{ return JSON.parse(localStorage.getItem("mdb-shots")||"{}"); }catch{ return {}; } }
function addLocalShot(slug, src){
  const m=localShots(); (m[slug]=m[slug]||[]).push(src);
  lsSetData("mdb-shots", JSON.stringify(m));
}

/* ------------------------ rendering ------------------------ */
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);
const esc = s => (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

/* transient status toast + global error surfacing (never fail silently) */
let _toastTimer=null;
function toast(msg){
  let t=document.getElementById("toast");
  if(!t){ t=document.createElement("div"); t.id="toast"; document.body.appendChild(t); }
  t.textContent=msg; t.classList.add("show");
  clearTimeout(_toastTimer); _toastTimer=setTimeout(()=>t.classList.remove("show"), 3200);
}
window.addEventListener("error", e=>{ toast("⚠ "+((e&&e.message)||"script error")); });
window.addEventListener("unhandledrejection", e=>{ toast("⚠ "+((e&&e.reason&&e.reason.message)||"async error")); });
const escAttr = s => esc(s).replace(/"/g,"&quot;");        // for use inside attributes
/* Friendly empty-state block — explains WHY nothing matched and offers a way out. */
function emptyStateHTML(q){
  const term = (q||"").trim();
  return term
    ? `<div class="empty-doss termbox" style="padding:18px 18px 16px; margin:14px;">
         <div class="empty-title">// NO UNITS MATCH “${esc(term)}”</div>
         <p class="empty-sub">Try a shorter search, or <a href="#" class="empty-clear">clear the filter</a> to see all ${state.model ? state.model.characters.length : ""} units.</p>
       </div>`
    : `<div class="empty-doss termbox" style="padding:18px 18px 16px; margin:14px;">
         <div class="empty-title">// NO UNITS IN THIS VIEW</div>
         <p class="empty-sub">The current filters returned nothing. Adjust the section / rank dropdowns above.</p>
       </div>`;
}

/* Highlight a search match inside a piece of text, returning safe HTML.
   Wraps the matched substring in <mark class="hl">. Falls back to plain esc()
   when q is empty / no match. Caller passes the already-trimmed query. */
function highlightMatch(text, q){
  text = text || ""; q = q || "";
  if(!q) return esc(text);
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if(i < 0) return esc(text);
  return esc(text.slice(0, i))
       + '<mark class="hl">' + esc(text.slice(i, i + q.length)) + '</mark>'
       + esc(text.slice(i + q.length));
}
const sectionLabel = s => (s||"").split(":")[0].trim();    // drop ": subtitle" for short headers
/* tidy a field value: strip RP "(suggestion)" tags + collapse stray whitespace runs */
function cleanField(v){
  if(!v) return v;
  return String(v)
    .replace(/\s*\(\s*suggestion\s*\)/ig,"")     // "THE SPIDER (Suggestion)" -> "THE SPIDER"
    .replace(/^\s*suggestion\s*:\s*/i,"")        // "Suggestion: The Owl" -> "The Owl"
    .split("\n").map(l=>l.replace(/[ \t]{2,}/g," ").replace(/\s+$/,"")).join("\n")
    .replace(/\n{3,}/g,"\n\n")                   // at most one blank line
    .trim();
}
/* a short role preview (keeps ~2 clauses; truncates long ones at a separator) */
function shortRole(role){
  role=(role||"").replace(/\s+/g," ").trim();
  if(role.length<=54) return role;
  const cut=role.slice(0,54);
  const i=Math.max(cut.lastIndexOf("·"),cut.lastIndexOf(","),cut.lastIndexOf(";"),cut.lastIndexOf("."));
  return (i>20?cut.slice(0,i):cut).trim()+"…";
}

/* build a name->slug index + matching regex (called after each model load) */
function buildNameIndex(model){
  const map={}, names=[];
  for(const c of model.characters){
    const n=(c.name||"").trim();
    if(n.length>=4){ map[n.toLowerCase()]=c.slug; names.push(n); }
  }
  names.sort((a,b)=>b.length-a.length);                 // longest first (match full names before parts)
  const reEsc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  state._nameMap=map;
  state._nameRe = names.length ? new RegExp("\\b(?:"+names.map(reEsc).join("|")+")\\b","g") : null;
}
function nameSlug(s){ return state._nameMap ? state._nameMap[(s||"").trim().toLowerCase()] : ""; }

/* derive who-mentions-whom from relationships + plot (uses the name regex) */
function buildConnections(model){
  const out={}, inc={};
  model.characters.forEach(c=>{ out[c.slug]=new Set(); inc[c.slug]=new Set(); });
  const re=state._nameRe;
  if(re){
    for(const c of model.characters){
      const text=(c.fields.relationships||"")+"\n"+(c.fields.plot||"");
      re.lastIndex=0; let m;
      while((m=re.exec(text))){
        if(!/^[A-Z]/.test(m[0])) continue;                 // proper-noun usage only
        const slug=state._nameMap[m[0].toLowerCase()];
        if(slug && slug!==c.slug){ out[c.slug].add(slug); inc[slug].add(c.slug); }
      }
    }
  }
  const conn={};
  model.characters.forEach(c=>{ conn[c.slug]={ out:[...out[c.slug]], in:[...inc[c.slug]] }; });
  model.connections=conn;
}

/* escape text + wrap character-name mentions (capitalised only) as cross-links.
   selfSlug = the dossier being viewed; that character's own name is NOT linked. */
function linkifyText(text, selfSlug){
  const re=state._nameRe;
  if(!re) return esc(text);
  let out="", last=0, m; re.lastIndex=0;
  while((m=re.exec(text))){
    out += esc(text.slice(last, m.index));
    let slug = /^[A-Z]/.test(m[0]) ? state._nameMap[m[0].toLowerCase()] : null;  // only proper-noun usage
    if(slug===selfSlug) slug=null;                                               // don't link to self
    out += slug ? `<span class="xref" role="button" tabindex="0" data-slug="${slug}" aria-label="Go to ${esc(m[0])}">${esc(m[0])}</span>` : esc(m[0]);
    last = m.index + m[0].length;
    if(m[0].length===0) re.lastIndex++;
  }
  return out + esc(text.slice(last));
}

/* highlight an ALLCAPS lead token before a colon (NAME: …); link it if it's a (different) character */
function renderLead(text, selfSlug){
  // each non-empty line is one discrete entry → its own block so 2-column flow
  // (.lead-list) can keep entries whole (break-inside:avoid).
  return (text||"").split("\n").map(line=>{
    if(!line.trim()) return "";
    const m = line.match(/^(\s*)([^a-z:]{2,}?):(\s*)(.*)$/);
    let inner;
    if(m && /[A-Z0-9]/.test(m[2])){
      const slug=nameSlug(m[2]);
      const lead = (slug && slug!==selfSlug)
        ? `<span class="lead xref" data-slug="${slug}">${esc(m[2])}:</span>`
        : `<span class="lead">${esc(m[2])}:</span>`;
      // description hangs (indents) beneath the name lead → glossary look
      inner = `${esc(m[1])}${lead}<span class="lead-desc">${linkifyText(m[4], selfSlug)}</span>`;
    } else {
      inner = linkifyText(line, selfSlug);
    }
    return `<div class="lead-entry">${inner}</div>`;
  }).join("");
}

function fieldBlock(key, value, selfSlug){
  const def=FIELDS[key]; if(!value) return "";
  const body = def.type==="lead" ? renderLead(value, selfSlug) : esc(value);
  const labelIcon = key==="spirit" ? svgIcon(spiritIconKey(value))+" " : "";
  // columnise lead lists only when there are several entries — a single long entry
  // reads better full-width than crammed into one narrow column.
  const entryCount = def.type==="lead" ? value.split("\n").filter(s=>s.trim()).length : 0;
  const bodyCls = def.type==="lead" ? (entryCount>=3 ? "body lead-list lead-list--multi" : "body lead-list") : "body";
  return `<div class="field"><div class="label">${labelIcon}${esc(def.label)}</div><div class="${bodyCls}">${body}</div></div>`;
}

/* dossier narrative blocks in BLOCK_ORDER, with ONE special case: "At The Fire"
   (tastes) and "Off-Duty" (activities) are short blocks that each ate a full-width
   row for a couple of lines — paired side-by-side on very wide screens only (see
   .field-pair; narrow/normal screens are byte-for-byte the same markup+spacing as
   before pairing). Deliberately not generalised to any other block pair. */
function narrativeBlocksHTML(ch){
  const f=ch.fields, out=[];
  for(const k of BLOCK_ORDER){
    if(k==="activities") continue;                 // emitted paired with "tastes" below
    if(k==="tastes"){
      const tastes=fieldBlock("tastes", f.tastes, ch.slug);
      const activities=fieldBlock("activities", f.activities, ch.slug);
      out.push(tastes && activities ? `<div class="field-pair">${tastes}${activities}</div>` : tastes+activities);
      continue;
    }
    out.push(k==="spirit" ? spiritSectionHTML(ch) : fieldBlock(k, f[k], ch.slug));
  }
  return out.join("");
}

/* turn a sheet cell (full URL, Drive link, or bare Drive id) into an <img> src */
function imageSrc(val){
  if(!val) return "";
  val=val.trim();
  if(/^(data:|blob:)/i.test(val)) return val;     // already an inline/blob image — never rewrite
  const driveId =
    (val.match(/\/d\/([a-zA-Z0-9_-]{20,})/)||[])[1] ||
    (val.match(/[?&]id=([a-zA-Z0-9_-]{20,})/)||[])[1] ||
    (/^[a-zA-Z0-9_-]{25,}$/.test(val) ? val : "");
  if(driveId) return "https://lh3.googleusercontent.com/d/"+driveId;
  return val;                       // assume a direct image URL
}

/* flat Pip-Boy glyphs for the portrait actions (fill:currentColor). */
/* the portrait "add your own picture" affordance — a simple PLUS (reads as "add", clearer than a camera) */
const IC_PLUS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 3h3v7.5H21v3h-7.5V21h-3v-7.5H3v-3h7.5z"/></svg>';
const IC_EMBLEM = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l7.5 2.8v5.5c0 4.6-3.2 7.9-7.5 9.7-4.3-1.8-7.5-5.1-7.5-9.7V5.3L12 2.5Z"/></svg>';
/* CRT-treated portrait frame (used in dossier + cards). cls = size modifier. */
function portraitHTML(ch, cls){
  const src=(ch.photos&&(ch.photos.front||ch.photos.side)) || imageSrc(ch.fields.image);
  const img = src
    ? `<img src="${escAttr(src)}" alt="${escAttr(ch.name)}" loading="lazy" decoding="async"
         onload="this.classList.add('imgok')"
         onerror="this.closest('.portrait').classList.add('noimg')">`
    : "";
  return `<div class="portrait ${cls||''} ${src?'':'noimg'}">
      ${img}<span class="tint"></span>
      <span class="sigil">${portraitSigil(ch)}</span>
      <button class="upbtn" data-slug="${esc(ch.slug)}" title="Add / change photo" aria-label="Add or change photo">${IC_PLUS}</button>
      <button class="iconbtn" data-slug="${esc(ch.slug)}" title="Choose a sigil icon" aria-label="Choose a sigil icon">${IC_EMBLEM}</button>
    </div>`;
}

/* parse a SPECIAL value (object or any string with 7 numbers) -> {S,P,E,C,I,A,L} */
function parseSpecial(v){
  if(!v) return null;
  if(typeof v==="object"){ return v.S!=null ? v : null; }
  const nums=String(v).match(/\d+/g);
  if(!nums || nums.length<7) return null;
  const keys=["S","P","E","C","I","A","L"], o={};
  keys.forEach((k,i)=> o[k]=Math.max(1,Math.min(10, parseInt(nums[i],10)||1)));
  return o;
}
/* optional S.P.E.C.I.A.L stat block (Fallout-style bars) */
function specialSectionHTML(ch){
  const s=parseSpecial(ch.fields.special); if(!s) return "";
  const rows=[["S","Strength"],["P","Perception"],["E","Endurance"],["C","Charisma"],
              ["I","Intelligence"],["A","Agility"],["L","Luck"]];
  const body=rows.map(([k,lab])=>{
    const n=s[k];
    return `<div class="spec-row"><span class="spec-k">${lab}</span>`+
           `<span class="spec-bar"><span style="width:${n*10}%"></span></span>`+
           `<span class="spec-n">${n}</span></div>`;
  }).join("");
  return `<div class="field"><div class="label">S.P.E.C.I.A.L</div><div class="specgrid">${body}</div></div>`;
}

/* spirit animal: big borderless sigil, animal name as a subheading, then the text */
function spiritSectionHTML(ch){
  const v=ch.fields.spirit; if(!v) return "";
  const key=spiritIconKey(v);
  // split the animal NAME (heading) from the description
  let name="", rest=v.trim();
  const nl=v.indexOf("\n");
  if(nl>=0){ name=v.slice(0,nl).trim(); rest=v.slice(nl+1).trim(); }
  else {
    const m=v.match(/^\s*(the\s+[a-z][a-z'’-]*(?:\s*\/\s*[a-z'’-]+)?(?:\s*\([^)]*\))?)/i);
    if(m){ name=m[1].trim(); rest=v.slice(m[0].length).trim(); }
  }
  if(name.length>40){ rest=v.trim(); name=""; }          // not really a short name → all body
  const glyph = `<span class="spirit-glyph">${svgIcon(key)}</span>`;
  return `<div class="field"><div class="label">Spirit Animal</div>
    ${name
      ? `<div class="spirit-name">${esc(name)}${glyph}</div>`
      : `<div class="spirit-name spirit-name--notitle">${glyph}</div>`}
    ${rest?`<div class="body spirit-body">${esc(rest)}</div>`:""}
  </div>`;
}

/* tags: explicit "Tags" field, else auto-derived from role + species */
const ROLE_TAGS=["chief","shaman","hunter","warrior","brave","healer","medic","farmer","gunner",
  "scout","captain","knight","merc","priest","elder","trader","teacher","translator","raider","slave","rider"];
function getTags(ch){
  if(ch.fields.tags) return ch.fields.tags.split(/[,]+/).map(s=>s.trim()).filter(Boolean).slice(0,6);
  const tags=[], role=(ch.fields.role||"").toLowerCase();
  ROLE_TAGS.forEach(t=>{ if(new RegExp("\\b"+t+"s?\\b").test(role)) tags.push(t[0].toUpperCase()+t.slice(1)); });
  if(ch.fields.species){ const sp=ch.fields.species.split(/[(,/]/)[0].trim(); if(sp) tags.push(sp); }
  return [...new Set(tags)].slice(0,5);
}

/* connections: clickable chips for who this character mentions / is mentioned by */
function connectionsSectionHTML(ch){
  const conn = state.model.connections && state.model.connections[ch.slug];
  if(!conn || (!conn.out.length && !conn.in.length)) return "";
  const chip = slug => {
    const c=state.model.characters.find(x=>x.slug===slug);
    return c ? `<span class="xref chip" data-slug="${slug}">${esc(c.name)}</span>` : "";
  };
  let html=`<div class="field"><div class="label">Connections</div>`;
  if(conn.out.length) html+=`<div class="conn-row"><span class="conn-k">Mentions</span><span>${conn.out.map(chip).join("")}</span></div>`;
  if(conn.in.length)  html+=`<div class="conn-row"><span class="conn-k">Mentioned&nbsp;by</span><span>${conn.in.map(chip).join("")}</span></div>`;
  return html+`</div>`;
}

/* personal-log: just a label + ＋ when empty; entries + hidden composer when used */
function logSectionHTML(ch){
  const entries=(ch.logs||[]);
  const items = entries.map(e=>{
    const when = e.t ? new Date(e.t).toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"}) : "ENTRY";
    return `<div class="logentry"><div class="logmeta">▶ ${esc(when)}</div><div class="logbody">${esc(e.s)}</div></div>`;
  }).join("");
  return `<div class="field">
    <div class="label">Personal Log <button class="mini addlog" data-slug="${esc(ch.slug)}" title="Add an entry">＋</button></div>
    ${items?`<div class="loglist">${items}</div>`:""}
    <div class="composer hidden" data-slug="${esc(ch.slug)}">
      <textarea class="logtext" rows="4" placeholder="A short story / journal entry from the game…"></textarea>
      <div class="composer-row">
        <button class="btn logsave" data-slug="${esc(ch.slug)}">Save</button>
        <button class="btn logcancel">Cancel</button>
        <span class="composer-note">${CONFIG.webAppUrl?"Saved to the sheet (passphrase required)":"Saved on this device"}</span>
      </div>
    </div></div>`;
}

/* screenshots: label + ＋ when empty; CRT grid when there are shots */
function shotsSectionHTML(ch){
  const shots=(ch.shots||[]);
  const tiles = shots.map((s,i)=>
    `<div class="screenshot" role="button" tabindex="0" data-slug="${esc(ch.slug)}" data-shotidx="${i}" title="View full" aria-label="View screenshot ${i+1}">
       <img src="${escAttr(s)}" loading="lazy" alt=""><span class="scan"></span></div>`).join("");
  return `<div class="field">
    <div class="label">Screenshots <button class="mini addshot" data-slug="${esc(ch.slug)}" title="Add a screenshot">＋</button></div>
    ${shots.length?`<div class="shotgrid">${tiles}</div>`:""}</div>`;
}

function permalink(slug){
  return location.origin + location.pathname + "#c=" + slug;
}

/* edit form for one character (only columns that exist in the sheet are shown) */
function editFormHTML(ch){
  const H = state.model.headersByKey || {};
  let html=`<div class="doss-head"><div class="doss-headtext">
    <div class="doss-name">EDIT</div>
    <div class="doss-role">${esc(ch.name)} · ${esc(ch.section)}</div>
    <div class="editbar">
      <button class="btn savebtn" data-slug="${esc(ch.slug)}">✓ Save to sheet</button>
      <button class="btn cancelbtn" data-slug="${esc(ch.slug)}">✕ Cancel</button>
      <span class="editnote">writes back to the working copy · passphrase required</span>
    </div></div></div>`;
  html+=`<form class="editform" data-slug="${esc(ch.slug)}">`;
  for(const [key,ta] of EDIT_FIELDS){
    if(!H[key]) continue;                       // no such column in the sheet
    const val=ch.fields[key]||"";
    html+=`<label class="efield"><span class="elabel">${esc(FIELDS[key].label)}</span>`;
    html+= ta
      ? `<textarea name="${escAttr(key)}" rows="4">${esc(val)}</textarea>`
      : `<input type="text" name="${escAttr(key)}" value="${escAttr(val)}">`;
    html+=`</label>`;
  }
  html+=`</form>`;
  return html;
}

function dossierHTML(ch){
  const f=ch.fields;
  let html="";
  html+=`<div class="doss-head">`;
  // portrait beside the name block; the "More" overflow menu tucks into the top-right of THIS
  // row (not a floating row of its own). The old "Unit Dossier · <section>" eyebrow was dropped
  // as redundant — affiliation shows in the role line + the roster's section grouping.
  html+=`<div class="doss-headmain">`;
  html+=portraitHTML(ch, "lg");        // single portrait (front photo, or spirit sigil if none)
  html+=`<div class="doss-headtext">`;
  html+=`<div class="doss-name">${esc(ch.name)}</div>`;
  if(f.honorific) html+=`<div class="doss-hon">“${esc(f.honorific)}”</div>`;
  const sr=shortRole(f.role);
  html+=`<div class="doss-role">${esc(sr || sectionLabel(ch.section))}</div>`;
  const tags=getTags(ch);
  if(tags.length) html+=`<div class="tags">${tags.map(t=>`<span class="tag" role="button" tabindex="0" data-tag="${escAttr(t)}" aria-label="Filter by ${escAttr(t)}">${esc(t)}</span>`).join("")}</div>`;
  html+=`</div>`;  // close headtext
  // "More" overflow menu — top-right of the name row, aligned with the portrait/name top
  html+=`<div class="doss-actions"><div class="morewrap">`+
        `<button class="btn morebtn" aria-haspopup="true" aria-expanded="false" title="More actions">⋯ More</button>`+
        `<div class="moremenu" role="menu">`+
          `<button class="btn linkbtn" role="menuitem" data-slug="${esc(ch.slug)}" title="Copy a direct link to this dossier">⧉ Copy link</button>`+
          `<button class="btn exportbtn" role="menuitem" data-slug="${esc(ch.slug)}" title="Print / export this dossier (PDF)">⎙ Export PDF</button>`+
          (CONFIG.webAppUrl?`<button class="btn editbtn" role="menuitem" data-slug="${esc(ch.slug)}" title="Edit this dossier and save to the sheet">✎ Edit</button>`:"")+
        `</div></div></div>`;   // close moremenu, morewrap, doss-actions
  html+=`</div>`;  // close headmain (still inside doss-head panel)

  // identity grid — lives INSIDE the head panel so the whole top area shares one dim
  // background; a single hairline (CSS) separates the stat grid from the name block.
  const cells = ID_ORDER.map(k=>{
    if(!f[k]) return "";
    const secret = /held secret|secret|unknown/i.test(f[k]);
    return `<div class="idcell"><div class="k">${esc(FIELDS[k].label)}</div>`+
           `<div class="v${secret?' secret':''}">${esc(f[k])}</div></div>`;
  }).join("");
  if(cells.trim()) html+=`<div class="idgrid">${cells}</div>`;
  html+=`</div>`;        // close doss-head panel

  // full role kept in the body when the header preview was truncated
  if(f.role && f.role.replace(/\s+/g," ").trim()!==sr)
    html+=`<div class="field"><div class="label">Role</div><div class="body">${esc(f.role)}</div></div>`;

  // optional S.P.E.C.I.A.L block
  const spec=specialSectionHTML(ch);
  if(spec){ html+=`<div class="rule"><span>S.P.E.C.I.A.L</span></div>`+spec; }

  // block fields — the identity data-panel's own (feathered) edge already separates
  // the at-a-glance record from the narrative, so no extra "FILE" divider is needed.
  html+=narrativeBlocksHTML(ch);
  html+=connectionsSectionHTML(ch);    // labels carry the sections now — no extra dividers
  html+=logSectionHTML(ch);
  html+=shotsSectionHTML(ch);
  return html;
}

function cardHTML(ch, idx){
  const f=ch.fields;
  const q = norm(state.query);
  const hl = t => highlightMatch(t || "", q);
  let meta="";
  if(f.species) meta+=`<b>Species:</b> ${hl(f.species)} `;
  if(f.spirit){ const first=f.spirit.split("\n")[0]; meta+=`&nbsp; <b>Spirit:</b> ${hl(first)}`; }
  return `<div class="card" data-idx="${idx}" role="button" tabindex="0" aria-label="Open dossier: ${escAttr(ch.name)}">
    <div class="card-top">
      ${portraitHTML(ch, "sm")}
      <div class="card-id">
        <div class="cname">${hl(ch.name)}</div>
        ${f.honorific?`<div class="chon">“${hl(f.honorific)}”</div>`:""}
        ${f.role?`<div class="crole">${hl(shortRole(f.role))}</div>`:""}
      </div>
    </div>
    ${meta?`<div class="cmeta">${meta}</div>`:""}
    ${f.appearance?`<div class="capp">${hl(f.appearance)}</div>`:""}
    ${(()=>{ const t=getTags(ch); return t.length?`<div class="tags">${t.map(x=>`<span class="tag">${esc(x)}</span>`).join("")}</div>`:""; })()}
    ${f.discord?`<div class="cplayer">PLAYER · ${hl(f.discord)}</div>`:""}
  </div>`;
}

/* ------------------------ app state ------------------------ */
const state = { model:null, view:"roster", query:"", selected:0, sortBy:"rank", filterSection:"all" };

function filtered(){
  const q=norm(state.query);
  if(!q) return state.model.characters;
  return state.model.characters.filter(c=>c.search.includes(q));
}

/* ---- in-theme custom dropdown ----------------------------------------------------------
   A themed replacement for native <select>, so the popup list renders in the terminal theme
   (phosphor panel + options) instead of the OS chrome. One delegated handler drives every
   .selctl on the page; markup built by buildSelect(); value read/set via data-value. */
function buildSelect(id, value, options, ariaLabel){
  const cur = options.find(o=>o.value===value) || options[0] || {label:""};
  const opts = options.map(o=>
    `<button class="selctl-opt${o.value===value?' active':''}" type="button" role="option" aria-selected="${o.value===value}" data-value="${escAttr(o.value)}">${esc(o.label)}</button>`
  ).join("");
  return `<div class="selctl" id="${escAttr(id)}" data-value="${escAttr(value)}">`+
    `<button class="selctl-btn" type="button" aria-haspopup="listbox" aria-expanded="false" aria-label="${escAttr(ariaLabel||"")}">`+
      `<span class="selctl-label">${esc(cur.label)}</span><span class="selctl-caret" aria-hidden="true">▼</span>`+
    `</button>`+
    `<div class="selctl-menu" role="listbox" aria-label="${escAttr(ariaLabel||"")}">${opts}</div>`+
  `</div>`;
}
/* set a custom-select's value programmatically (label + active option follow) */
function setSelectValue(id, value){
  const sel=document.getElementById(id); if(!sel) return;
  sel.dataset.value=value;
  const opt=sel.querySelector(`.selctl-opt[data-value="${(window.CSS&&CSS.escape)?CSS.escape(value):value}"]`);
  if(opt) sel.querySelector(".selctl-label").textContent=opt.textContent;
  sel.querySelectorAll(".selctl-opt").forEach(o=>{ const on=o.dataset.value===value; o.classList.toggle("active",on); o.setAttribute("aria-selected",on); });
}
function closeAllSelects(except){
  document.querySelectorAll(".selctl.open").forEach(s=>{ if(s!==except){ s.classList.remove("open");
    const b=s.querySelector(".selctl-btn"); if(b) b.setAttribute("aria-expanded","false"); } });
}
/* what a committed selection does, keyed by the select's id (the two roster filters) */
function onSelectChange(id, val){
  if(id==="filter-section"){ state.filterSection=val; renderRoster(); }
  else if(id==="sort-by"){ state.sortBy=val; renderRoster(); }
}
document.addEventListener("click", e=>{
  const opt=e.target.closest(".selctl-opt");
  if(opt){ const sel=opt.closest(".selctl");
    setSelectValue(sel.id, opt.dataset.value); closeAllSelects();
    onSelectChange(sel.id, opt.dataset.value); return; }
  const btn=e.target.closest(".selctl-btn"), sel=btn && btn.closest(".selctl");
  closeAllSelects(sel);                                   // clicking any trigger closes the others
  if(btn && sel){ const open=sel.classList.toggle("open"); btn.setAttribute("aria-expanded", open?"true":"false"); return; }
  if(!e.target.closest(".selctl-menu")) closeAllSelects();   // outside click
});
document.addEventListener("keydown", e=>{ if(e.key==="Escape") closeAllSelects(); });

/* build the roster filter + sort controls from the loaded model (once per load) */
function renderListControls(model){
  if(state.filterSection!=="all" && !model.sections.includes(state.filterSection)) state.filterSection="all";
  const secOpts = [{value:"all", label:"All sections"}]
    .concat(model.sections.map(s=>({value:s, label:sectionLabel(s)})));
  const sortOpts = [["rank","Chiefs first"],["sheet","Sheet order"],["name","Name A–Z"],["role","By role"]]
    .map(([value,label])=>({value,label}));
  const ctl=$("#listctl");
  // only show the section filter when there's actually more than one section to pick
  // (a lone section makes the dropdown a no-op — drop the clutter).
  const showSecFilter = model.sections.length > 1;
  ctl.innerHTML =
    (showSecFilter ? buildSelect("filter-section", state.filterSection, secOpts, "Filter roster by section") : "") +
    buildSelect("sort-by", state.sortBy, sortOpts, "Sort roster");
}

function rankOf(ch){
  const r=(ch.fields.role||"").toLowerCase();
  if(/\bchief\b/.test(r)) return 0;                 // \b so "chieftain step-in" doesn't count
  if(/\bshamans?\b|\bshamen\b/.test(r)) return 1;
  return 2;                         // everyone else
}
function sortChars(arr){
  const by=state.sortBy;
  if(by==="name") return arr.slice().sort((a,b)=>a.name.localeCompare(b.name));
  if(by==="role") return arr.slice().sort((a,b)=>(a.fields.role||"~").localeCompare(b.fields.role||"~"));
  if(by==="rank"){                  // chiefs first, shamans next, then sheet order
    return arr.map((c,i)=>[c,i]).sort((a,b)=> (rankOf(a[0])-rankOf(b[0])) || (a[1]-b[1])).map(x=>x[0]);
  }
  return arr;                       // "sheet" = preserve original order
}
function renderRoster(){
  const chars=filtered();
  const q=norm(state.query);                 // used to highlight matched substrings in rows
  const list=$("#list");
  const sections = state.filterSection==="all"
    ? state.model.sections
    : state.model.sections.filter(s=>s===state.filterSection);
  let html="";
  for(const sec of sections){
    const inSec = sortChars(chars.filter(c=>c.section===sec));
    if(!inSec.length) continue;
    html+=`<div class="sectionhdr">${esc(sectionLabel(sec))}</div>`;
    for(const c of inSec){
      const gi = state.model.characters.indexOf(c);
      const sub = shortRole(c.fields.role) || c.fields.species || "";
      html+=`<div class="row${gi===state.selected?' active':''}" data-idx="${gi}"
        id="row-${gi}" role="option" aria-selected="${gi===state.selected}">
        <span class="row-name">${highlightMatch(c.name, q)}</span>
        ${sub?`<span class="row-sub">${highlightMatch(sub, q)}</span>`:""}
      </div>`;
    }
  }
  list.innerHTML = html || emptyStateHTML(state.query);
  // tell assistive tech which option is current (listbox pattern)
  list.setAttribute("aria-activedescendant",
    state.model.characters[state.selected] ? "row-"+state.selected : "");

  // dossier for current selection (if it's in the filtered set, else first match)
  let sel = state.model.characters[state.selected];
  if(!chars.includes(sel)) sel=chars[0];
  const doss=$("#dossier");
  doss.innerHTML = sel ? dossierHTML(sel)
    : `<div class="empty-doss termbox">// NO UNIT SELECTED</div>`;
  openPendingChar();   // a deep-linked character opens once the model has rendered (no-op otherwise)
}

function renderCards(){
  const chars=filtered();
  const wrap=$("#cards");
  if(!chars.length){ wrap.innerHTML=emptyStateHTML(state.query); return; }
  wrap.innerHTML = chars.map(c=>cardHTML(c, state.model.characters.indexOf(c))).join("");
}

function render(){
  if(!state.model) return;
  try{
    $("#state").classList.add("hidden");
    if(currentSection!=="roster"){
      /* a doc section owns the main area — leave roster/cards hidden */
    }else if(state.view==="roster"){
      $("#roster").classList.remove("hidden");
      $("#cards").classList.add("hidden");
      renderRoster();
    }else{
      $("#cards").classList.remove("hidden");
      $("#roster").classList.add("hidden");
      renderCards();
    }
  }catch(err){
    console.error("render failed:", err);
    toast("Render error — see console");
  }
}

/* ------------------------ events ------------------------ */
$("#list").addEventListener("click", e=>{
  const row=e.target.closest(".row"); if(!row) return;
  selectIndex(+row.dataset.idx);
});
function selectIndex(i){
  state.selected=i; renderRoster();
  $("#dossier").scrollTop=0;
  const c=state.model.characters[i];
  if(c) writeRoute(c.slug);
}

$("#cards").addEventListener("click", e=>{
  if(e.target.closest(".upbtn") || e.target.closest(".iconbtn")) return;  // handled separately
  const card=e.target.closest(".card"); if(!card) return;
  const ch=state.model.characters[+card.dataset.idx];
  $("#modalbody").innerHTML=dossierHTML(ch);
  $("#modalback").classList.add("open");
});

/* delegated: copy-link, upload, edit/save/cancel (appear in dossier, cards, modal) */
document.addEventListener("click", e=>{
  const ec=e.target.closest(".empty-clear"); if(ec){ e.preventDefault(); const s=$("#search"); if(s){ s.value=""; state.query=""; s.closest(".search").classList.remove("has-value"); render(); s.focus(); } return; }
  const mb=e.target.closest(".morebtn");   if(mb){ const w=mb.closest(".morewrap"); const op=w.classList.toggle("open"); mb.setAttribute("aria-expanded", op); closeMoreMenus(w); return; }
  const link=e.target.closest(".linkbtn"); if(link){ copyPermalink(link); return; }   /* keep menu open so the "Copied" pill is visible */
  const up=e.target.closest(".upbtn");     if(up){ triggerUpload(up.dataset.slug); return; }
  const ic=e.target.closest(".iconbtn");   if(ic){ openIconPicker(ic.dataset.slug); return; }
  const ed=e.target.closest(".editbtn");   if(ed){ enterEdit(ed.dataset.slug, containerOf(ed)); return; }
  const sv=e.target.closest(".savebtn");   if(sv){ saveEdit(sv.dataset.slug, containerOf(sv)); return; }
  const cx=e.target.closest(".cancelbtn"); if(cx){ exitEdit(cx.dataset.slug, containerOf(cx)); return; }
  const al=e.target.closest(".addlog");    if(al){ const c=al.closest(".field").querySelector(".composer"); if(c){ c.classList.toggle("hidden"); const t=c.querySelector(".logtext"); if(!c.classList.contains("hidden")&&t) t.focus(); } return; }
  const lc=e.target.closest(".logcancel"); if(lc){ const c=lc.closest(".composer"); if(c){ c.classList.add("hidden"); const t=c.querySelector(".logtext"); if(t) t.value=""; } return; }
  const ls=e.target.closest(".logsave");   if(ls){ saveLog(ls.dataset.slug, containerOf(ls)); return; }
  const as=e.target.closest(".addshot");   if(as){ triggerShot(as.dataset.slug); return; }
  const ss=e.target.closest(".screenshot");if(ss){ openShot(ss.dataset.slug, +ss.dataset.shotidx); return; }
  const ex=e.target.closest(".exportbtn"); if(ex){ closeMoreMenus(); exportDossier(ex.dataset.slug); return; }
  const xr=e.target.closest(".xref");      if(xr){ gotoChar(xr.dataset.slug); return; }
  const tg=e.target.closest(".tag");       if(tg){ filterByTag(tg.dataset.tag); return; }
});

/* clicking a tag filters the roster (reuses the search box) */
function filterByTag(tag){
  ["#modalback","#shotback"].forEach(id=>$(id).classList.remove("open"));
  if(state.view!=="roster") setView("roster");
  state.query=tag;
  state.filterSection="all";                         // tag search spans all sections
  const s=$("#search"); if(s){ s.value=tag; s.closest(".search").classList.add("has-value"); }
  setSelectValue("filter-section", "all");   // keep the dropdown in sync
  render();
}

/* print/export: show the dossier in the roster pane, then print (PDF) just that panel */
function exportDossier(slug){
  gotoChar(slug);                          // ensures the roster #dossier shows this character
  document.body.classList.add("printing");
  setTimeout(()=>{ window.print(); document.body.classList.remove("printing"); }, 150);
}
function containerOf(el){ return el.closest("#modalbody") || el.closest("#dossier"); }

/* jump to a character's dossier (from a cross-link) */
function gotoChar(slug){
  const idx=state.model.characters.findIndex(c=>c.slug===slug);
  if(idx<0) return;
  ["#modalback","#shotback","#iconback","#uploadback"].forEach(id=>$(id).classList.remove("open"));
  if(state.view!=="roster") setView("roster");
  // make sure the target isn't hidden by an active section filter
  if(state.filterSection!=="all" && state.model.characters[idx].section!==state.filterSection){
    state.filterSection="all"; setSelectValue("filter-section", "all");
  }
  selectIndex(idx);
  const a=$("#list .row.active"); if(a) a.scrollIntoView({block:"nearest"});
  $("#dossier").scrollTop=0;
}

/* shared edit passphrase, kept per-tab; the real secret lives in the Apps Script */
function getPass(force){
  let p = force ? null : sessionStorage.getItem("mdb-pass");
  if(!p){ p = prompt("Enter the tribe edit passphrase to make changes:") || ""; if(p) sessionStorage.setItem("mdb-pass", p); }
  return p;
}

function enterEdit(slug, container){
  const ch=state.model.characters.find(c=>c.slug===slug); if(!ch||!container) return;
  container.innerHTML=editFormHTML(ch); container.scrollTop=0;
}
function exitEdit(slug, container){
  const ch=state.model.characters.find(c=>c.slug===slug); if(!ch||!container) return;
  container.innerHTML=dossierHTML(ch);
}
async function saveEdit(slug, container){
  const ch=state.model.characters.find(c=>c.slug===slug); if(!ch) return;
  const form=container && container.querySelector(".editform"); if(!form) return;
  const changes={}, localUpdates={};
  for(const [key] of EDIT_FIELDS){
    const hdr=state.model.headersByKey[key]; if(!hdr) continue;
    const el=form.elements[key]; if(!el) continue;
    const val=el.value, cur=ch.fields[key]||"";
    if(val!==cur){ changes[hdr]=val; localUpdates[key]=val; }
  }
  if(!Object.keys(changes).length){ exitEdit(slug, container); return; }
  if(!CONFIG.webAppUrl){ toast("Editing needs the Apps Script web app (set CONFIG.webAppUrl)."); return; }
  const pass=getPass(); if(!pass) return;
  setLink("SAVING…");
  try{
    const res=await fetch(CONFIG.webAppUrl, { method:"POST", body:JSON.stringify({
      action:"setFields", usename: ch.fields.usename || ch.name, pass, fields:changes
    })});
    const out=await res.json();
    if(out.error==="unauthorized"){ sessionStorage.removeItem("mdb-pass"); throw new Error("wrong passphrase — try again"); }
    if(!out.ok) throw new Error(out.error||("could not write: "+(out.missed||[]).join(", ")));
    Object.assign(ch.fields, localUpdates);
    if(localUpdates.usename) ch.name=localUpdates.usename;
    ch.search=Object.values(ch.fields).join(" ").toLowerCase();
    setLink("ONLINE");
    exitEdit(slug, container);
    state.view==="roster" ? renderRoster() : renderCards();
  }catch(err){ setLink("OFFLINE", true); toast("Save failed: "+err.message); }
}

async function copyPermalink(btn){
  const url=permalink(btn.dataset.slug);
  try{ await navigator.clipboard.writeText(url); }
  catch{ const t=document.createElement("textarea"); t.value=url; document.body.appendChild(t); t.select(); try{document.execCommand("copy");}catch{} t.remove(); }
  const old=btn.textContent; btn.textContent="✓ Copied"; btn.classList.add("copied");
  setTimeout(()=>{ btn.textContent=old; btn.classList.remove("copied"); }, 1400);
}

/* ---------- photo upload (single "front" slot; write-back to sheet) ----------
   The data model still READS a "side" image from the sheet/MEDIA as a fallback
   (see buildModel ~L405), but the upload UI only writes the front slot. */
let uploadSlug=null, uploadSlot=null, uploadKind="photo";
function triggerUpload(slug){ openUpload(slug); }
function openUpload(slug){
  const ch=state.model.characters.find(c=>c.slug===slug); if(!ch) return;
  uploadSlug=slug;
  $("#uploadhead").innerHTML=`<div class="doss-role" style="margin:0 0 4px">PHOTO · ${esc(ch.name)}</div>`;
  $("#uploaddest").textContent = CONFIG.webAppUrl
    ? "Saved to the sheet (passphrase required)."
    : "No write-back configured — photo is saved on this device only.";
  refreshUploadSlots();
  $("#uploadback").classList.add("open");
}
function refreshUploadSlots(){
  const ch=state.model.characters.find(c=>c.slug===uploadSlug); if(!ch) return;
  const f=$("#uslot-front"); if(!f) return;
  const src=ch.photos.front || ch.photos.side;
  f.innerHTML = src
    ? `<div class="portrait"><img src="${escAttr(src)}" alt=""><span class="tint"></span></div>`
    : `<div class="portrait noimg"><span class="sigil">${portraitSigil(ch)}</span></div>`;
}
$$("#uploadback .uslot-btn").forEach(b=>b.addEventListener("click", ()=>{
  uploadKind="photo"; uploadSlot=b.dataset.slot; $("#fileinput").click();
}));
$("#uploadclose").addEventListener("click", ()=>$("#uploadback").classList.remove("open"));
$("#uploadback").addEventListener("click", e=>{ if(e.target.id==="uploadback") $("#uploadback").classList.remove("open"); });
$("#shotclose").addEventListener("click", ()=>$("#shotback").classList.remove("open"));
$("#shotback").addEventListener("click", e=>{ if(e.target.id==="shotback") $("#shotback").classList.remove("open"); });

$("#fileinput").addEventListener("change", async e=>{
  const file=e.target.files && e.target.files[0]; e.target.value="";
  if(!file || !uploadSlug) return;
  let dataUrl;
  try{
    dataUrl = uploadKind==="shot"
      ? await fileToDataURL(file, 1280, "image/png")    // screenshots: lossless, crisp pixel art
      : await fileToDataURL(file, 1280, "image/jpeg");  // portrait crops: small
  }
  catch{ toast("Could not read that image file."); return; }
  if(uploadKind==="shot") await saveShot(uploadSlug, dataUrl, file.name);
  else if(uploadSlot)     await savePhoto(uploadSlug, uploadSlot, dataUrl, file.name);
});

async function savePhoto(slug, slot, dataUrl, filename){
  const ch=state.model.characters.find(c=>c.slug===slug); if(!ch) return;
  ch.photos[slot]=dataUrl;                            // optimistic, show immediately
  refreshUploadSlots(); refreshDossier(ch);
  if(!CONFIG.webAppUrl){ setLocalPhoto(slug, slot, dataUrl); return; }   // no backend: device only
  const pass=getPass(); if(!pass){ setLocalPhoto(slug, slot, dataUrl); return; }
  setLink("UPLOADING…");
  try{
    const res=await fetch(CONFIG.webAppUrl, { method:"POST", body:JSON.stringify({
      action:"setPhoto", pass, slot,
      usename: ch.fields.usename || ch.name, filename: filename||"photo", dataUrl
    })});
    const out=await res.json();
    if(out.error==="unauthorized"){ sessionStorage.removeItem("mdb-pass"); throw new Error("wrong passphrase"); }
    if(!out.ok) throw new Error(out.error||"upload rejected by server");
    ch.photos[slot]=out.url || dataUrl; clearLocalPhoto(slug, slot);     // sheet is now canonical
    setLink("ONLINE"); refreshUploadSlots(); refreshDossier(ch);
  }catch(err){
    setLocalPhoto(slug, slot, dataUrl);               // keep it on this device as a fallback
    setLink("OFFLINE", true);
    toast("Saved on this device, but couldn't write to the sheet: "+err.message);
  }
}
function refreshDossier(ch){
  if($("#modalback").classList.contains("open")) $("#modalbody").innerHTML=dossierHTML(ch);
  else if(state.view==="roster") renderRoster(); else renderCards();
}

/* ---------- personal log ---------- */
async function saveLog(slug, cont){
  const ch=state.model.characters.find(c=>c.slug===slug); if(!ch) return;
  const box=(cont||$("#dossier")).querySelector(".composer .logtext");
  const text=(box && box.value || "").trim(); if(!text) return;
  const entry={ t:Date.now(), s:text };
  ch.logs.push(entry);                                 // optimistic in-memory
  refreshDossier(ch);                                  // re-render clears the textarea
  if(!CONFIG.webAppUrl){ addLocalLog(slug, entry); return; }
  const pass=getPass(); if(!pass){ addLocalLog(slug, entry); return; }
  setLink("SAVING…");
  try{
    const res=await fetch(CONFIG.webAppUrl, { method:"POST", body:JSON.stringify({
      action:"addLog", pass, usename: ch.fields.usename || ch.name, text
    })});
    const out=await res.json();
    if(out.error==="unauthorized"){ sessionStorage.removeItem("mdb-pass"); throw new Error("wrong passphrase"); }
    if(!out.ok) throw new Error(out.error||"server rejected the entry");
    setLink("ONLINE");                                 // success: sheet is canonical (no local copy → no dupes)
  }catch(err){ addLocalLog(slug, entry); setLink("OFFLINE", true); toast("Log saved on this device only: "+err.message); }
}

/* ---------- screenshots ---------- */
function triggerShot(slug){ uploadSlug=slug; uploadKind="shot"; $("#fileinput").click(); }
async function saveShot(slug, dataUrl, filename){
  const ch=state.model.characters.find(c=>c.slug===slug); if(!ch) return;
  ch.shots.push(dataUrl);                              // optimistic in-memory
  refreshDossier(ch);
  if(!CONFIG.webAppUrl){ addLocalShot(slug, dataUrl); return; }
  const pass=getPass(); if(!pass){ addLocalShot(slug, dataUrl); return; }
  setLink("UPLOADING…");
  try{
    const res=await fetch(CONFIG.webAppUrl, { method:"POST", body:JSON.stringify({
      action:"addShot", pass, usename: ch.fields.usename || ch.name, filename: filename||"shot", dataUrl
    })});
    const out=await res.json();
    if(out.error==="unauthorized"){ sessionStorage.removeItem("mdb-pass"); throw new Error("wrong passphrase"); }
    if(!out.ok) throw new Error(out.error||"upload rejected by server");
    if(out.url){ const i=ch.shots.lastIndexOf(dataUrl); if(i>=0) ch.shots[i]=out.url; }
    setLink("ONLINE"); refreshDossier(ch);             // success: sheet is canonical (no local copy → no dupes)
  }catch(err){ addLocalShot(slug, dataUrl); setLink("OFFLINE", true); toast("Screenshot saved on this device only: "+err.message); }
}
function openShot(slug, idx){
  const ch=state.model.characters.find(c=>c.slug===slug); if(!ch) return;
  const src=(ch.shots||[])[idx]; if(!src) return;
  $("#shotview").innerHTML=`<div class="screen"><img src="${escAttr(src)}" alt="screenshot"><span class="scan"></span></div>`;
  $("#shotback").classList.add("open");
}

/* downscale + re-encode. mime "image/png" keeps pixel-art crisp (screenshots);
   "image/jpeg" stays small (portrait crops). Pixelated scaling preserves sprite edges. */
function fileToDataURL(file, maxDim, mime){
  mime = mime || "image/jpeg";
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file); const im=new Image();
    im.onload=()=>{
      let w=im.naturalWidth, h=im.naturalHeight;
      const s=Math.min(1, maxDim/Math.max(w,h)); w=Math.round(w*s)||1; h=Math.round(h*s)||1;
      const cv=document.createElement("canvas"); cv.width=w; cv.height=h;
      const ctx=cv.getContext("2d"); ctx.imageSmoothingEnabled = (s>=1) ? false : true;
      ctx.drawImage(im,0,0,w,h);
      URL.revokeObjectURL(url);
      resolve(cv.toDataURL(mime, mime==="image/jpeg"?0.85:undefined));
    };
    im.onerror=()=>{ URL.revokeObjectURL(url); reject(new Error("decode failed")); };
    im.src=url;
  });
}

/* ---------- URL deep-linking (hash router) ----------------------------------------------
   The URL reflects the current view so any of it can be linked to. HASH-based on purpose: it's
   entirely client-side — no server round-trip, no extra loading, no 404 on static hosting.
     #home                              the landing page
     #<faction>/<section>[/<target>]    e.g. #tribe/roster · #tribe/lore
     #tribe/roster/big-brom-matlok      a character   ·  #tribe/lore/<heading>  a doc section
   Legacy #c=<slug> / ?c=<slug> (the c/ OG stubs) still resolve. */
let _routing = false;         // true while WE apply a route → our own hash writes don't loop back
let _pendingTarget = null;    // a character/heading slug to open once its view has rendered
function slugify(s){ return (s||"").toString().toLowerCase().trim()
  .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,""); }
/* write the current view to the URL (target = character slug in roster, or heading slug in a doc) */
function writeRoute(target){
  if(_routing) return;
  // the wiki is umbrella content (not faction-scoped) → a top-level #wiki/<Page> route
  const h = currentSection==="home" ? "home"
          : currentSection==="wiki" ? "wiki" + (_wikiPage && _wikiPage!==WIKI.home ? "/"+encodeURIComponent(_wikiPage) : "")
          : currentFaction + "/" + currentSection + (target ? "/"+target : "");
  const full = "#" + h;
  if(location.hash !== full){ try{ history.replaceState(null,"",full); }catch(e){} }
}
/* parse the current hash → {faction?, section, target?} (understands the legacy #c=/?c= form) */
function parseRoute(){
  const leg = (location.hash||"").match(/^#c=([^&]+)/) || (location.search||"").match(/[?&]c=([^&]+)/);
  if(leg){ let s=""; try{ s=decodeURIComponent(leg[1]); }catch(e){} return { section:"roster", target:s }; }
  const raw = (location.hash||"").replace(/^#\/?/, "");
  if(!raw || raw==="home") return { section:"home" };
  const p = raw.split("/").filter(Boolean).map(x=>{ try{ return decodeURIComponent(x); }catch(e){ return x; } });
  return FACTIONS[p[0]] ? { faction:p[0], section:p[1], target:p[2] }
                        : { section:p[0], target:p[1] };
}
/* apply the URL to the app: faction → section → target */
function applyRoute(){
  const r = parseRoute();
  _routing = true;
  try{
    if(r.faction && FACTIONS[r.faction] && r.faction!==currentFaction) applyFaction(r.faction);
    let sec = r.section || "home";
    if(sec!=="home" && sec!=="roster" && sec!=="wiki" && !factionDocs().some(d=>d.id===sec)) sec="roster";
    if(sec==="wiki"){                        // #wiki/<Page> — the target IS the wiki page to open
      const pg = r.target || WIKI.home;
      if(sec!==currentSection){ _wikiPage = pg; setSection("wiki"); }   // setSection loads _wikiPage
      else if(pg!==_wikiPage){ loadWiki(pg); }
      _pendingTarget = null;
      return;
    }
    if(sec!==currentSection) setSection(sec);
    _pendingTarget = r.target || null;
    if(sec==="roster") openPendingChar();   // doc anchors are consumed by loadDoc when it finishes
  } finally { _routing = false; }
}
/* open the pending character once the roster model is loaded (re-tried after each roster render) */
function openPendingChar(){
  if(!_pendingTarget || currentSection!=="roster" || !state.model) return;
  const idx = state.model.characters.findIndex(c=>c.slug===_pendingTarget);
  if(idx<0){ _pendingTarget=null; return; }
  _pendingTarget=null;
  if(state.view!=="roster") setView("roster");
  state.selected=idx; renderRoster();
  const a=$("#list .row.active"); if(a) a.scrollIntoView({block:"nearest"});
  $("#dossier").scrollTop=0;
}
/* scroll a freshly-rendered doc to the heading whose slug matches the pending target */
function scrollPendingAnchor(){
  if(!_pendingTarget) return;
  const want=_pendingTarget; _pendingTarget=null;
  const h=[...$("#docreader").querySelectorAll("h1,h2,h3,h4")].find(x=>slugify(x.textContent)===want);
  if(h) requestAnimationFrame(()=>h.scrollIntoView({block:"start"}));
}
window.addEventListener("hashchange", ()=>{ if(!_routing) applyRoute(); });
$("#modalclose").addEventListener("click", ()=>$("#modalback").classList.remove("open"));
$("#modalback").addEventListener("click", e=>{ if(e.target.id==="modalback") $("#modalback").classList.remove("open"); });
document.addEventListener("keydown", e=>{
  if(e.key!=="Escape") return;
  // close any open overlay; if search is focused with text, clear it instead
  const s=$("#search");
  if(document.activeElement===s && s.value){ s.value=""; state.query=""; s.closest(".search").classList.remove("has-value"); render(); return; }
  let closed=false;
  ["#modalback","#iconback","#uploadback","#shotback"].forEach(id=>{
    const el=$(id); if(el && el.classList.contains("open")){ el.classList.remove("open"); closed=true; }
  });
  if($("#settings-pop").classList.contains("open")){ setSettingsOpen(false); closed=true; }
  if(closed && document.activeElement===s) s.blur();
});

/* ---------- modal focus management (a11y) ----------
   Driven by a MutationObserver so it needs no changes at the many open/close
   call sites: when a .modal-back gains `.open` we remember the previously-focused
   element, move focus inside, and trap Tab; when it loses `.open` we restore focus. */
(function modalFocusLayer(){
  const ids=["#modalback","#iconback","#uploadback","#shotback"];
  const FOCUSABLE='button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  let restoreTo=null;
  const openModalEl=()=> ids.map(id=>$(id)).find(el=>el && el.classList.contains("open"));
  const focusables=el=>[...el.querySelectorAll(FOCUSABLE)].filter(n=>n.offsetParent!==null);

  ids.forEach(id=>{
    const el=$(id); if(!el) return;
    new MutationObserver(()=>{
      if(el.classList.contains("open")){
        if(el.dataset.wasOpen) return;          // already handled
        el.dataset.wasOpen="1";
        restoreTo=document.activeElement;
        const f=focusables(el); (f[0]||el).focus();
      }else if(el.dataset.wasOpen){
        delete el.dataset.wasOpen;
        if(restoreTo && document.contains(restoreTo)){ restoreTo.focus(); restoreTo=null; }
      }
    }).observe(el,{attributes:true, attributeFilter:["class"]});
  });

  // trap Tab within whichever modal is open
  document.addEventListener("keydown", e=>{
    if(e.key!=="Tab") return;
    const el=openModalEl(); if(!el) return;
    const f=focusables(el); if(!f.length){ e.preventDefault(); return; }
    const first=f[0], last=f[f.length-1];
    if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
  });
})();

/* keyboard activation for clickable non-button elements (role=button + tabindex):
   tag chips, cross-links, cards, screenshot thumbs. Enter/Space → reuse the click path. */
document.addEventListener("keydown", e=>{
  if(e.key!=="Enter" && e.key!==" ") return;
  const hit=e.target.closest(".tag[role=button], .xref[role=button], .card[role=button], .screenshot[role=button]");
  if(!hit) return;
  e.preventDefault();           // Space must not scroll the page
  hit.click();
});

$("#search").addEventListener("input", e=>{
  state.query=e.target.value;
  e.target.closest(".search").classList.toggle("has-value", !!e.target.value);
  render();
});
$("#search-clear").addEventListener("click", ()=>{
  const s=$("#search"); s.value=""; state.query="";
  s.closest(".search").classList.remove("has-value");
  render(); s.focus();
});

$("#view-roster").addEventListener("click", ()=>setView("roster"));
$("#view-cards").addEventListener("click", ()=>setView("cards"));
function setView(v){
  state.view=v;
  $("#view-roster").classList.toggle("active", v==="roster");
  $("#view-cards").classList.toggle("active", v==="cards");
  localStorage.setItem("mdb-view", v);
  render();
}

/* ---------- top-level section nav: Roster + embedded Google Docs ---------- */
let currentSection = "roster";
/* flat 2D Fallout-style tab glyphs (solid silhouettes, fill:currentColor so they track the
   tab's text colour). roster = personnel bust · lore = open book · roleplay = dialogue bubble;
   any future doc tab without its own icon falls back to a document glyph. */
const NAV_ICONS = {
  home:    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2.5 11h2.3v9h5v-6h4.4v6h5v-9h2.3L12 3Z"/></svg>',
  roster:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 8c0-3.6 3.6-6 8-6s8 2.4 8 6v.6H4V20Z"/></svg>',
  lore:    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6.4C10.5 5.2 8.3 4.6 6 4.6c-1.1 0-2.1.1-3 .4v13.2c.9-.3 1.9-.4 3-.4 2.3 0 4.5.6 6 1.8V6.4Zm2 0v13.2c1.5-1.2 3.7-1.8 6-1.8 1.1 0 2.1.1 3 .4V5c-.9-.3-1.9-.4-3-.4-2.3 0-4.5.6-6 1.8Z"/></svg>',
  roleplay:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16c.55 0 1 .45 1 1v11c0 .55-.45 1-1 1H9l-4 4v-4H4c-.55 0-1-.45-1-1V5c0-.55.45-1 1-1Zm3 5h10v-2H7v2Zm0 4h7v-2H7v2Z"/></svg>',
  wiki:    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Z"/><path d="M4 12h16M12 4c2.6 2.2 2.6 13.8 0 16M12 4c-2.6 2.2-2.6 13.8 0 16" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>',
  _default:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6V3Zm7 1.5V8h3.5L13 4.5Z"/></svg>',
};
/* one-line explainer per section, shown on the home tiles */
const HOME_INFO = {
  roster:   "Every member — dossiers, appearance, and story. Search, filter, browse.",
  lore:     "The world and beliefs of the tribe — customs, spirits, and how things work.",
  roleplay: "How to play well — voice, accent, conflict, and etiquette at the fire.",
  wiki:     "The Misfits wiki — factions, gameplay, crafting, survival and more.",
  _default: "An in-world document, rendered on the terminal.",
};
/* the home landing page: a full-height tile per section (icon + title + explainer). */
const HOME_ARROW = `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 9h9.2l-3.7-3.7L11 4l6 6-6 6-1.5-1.3L13.2 11H4z"/></svg>`;
function renderHome(){
  const el=$("#home"); if(!el) return;
  const items=[{id:"roster",label:"Roster"}].concat(factionDocs().map(d=>({id:d.id,label:d.label})))
    .concat([{id:"wiki",label:"Wiki"}]);   // universal umbrella wiki, alongside the faction sections
  // FIRST box (same footprint as a section card): a titled faction picker, factions subdivided into
  // a grid inside it — "pick a faction to jump to its section". Omitted when there's only one faction.
  const facBox = FACTION_ORDER.length < 2 ? "" :
    `<div class="home-tile home-tile--factions" style="--i:0">`+
      `<div class="home-fac-head">`+
        `<span class="home-fac-title">Choose a Faction</span>`+
        `<span class="home-fac-sub">Pick a faction below to open its roster, lore and roleplay guides.</span>`+
      `</div>`+
      `<div class="home-fac-grid" role="tablist" aria-label="Choose faction">`+
        FACTION_ORDER.map(id =>
          `<button class="home-fac${id===currentFaction?' active':''}" type="button" role="tab" aria-selected="${id===currentFaction}" data-faction="${escAttr(id)}">`+
            `<span class="home-fac-ico" aria-hidden="true">${FACTION_ICONS[id]||""}</span>`+
            `<span class="home-fac-name">${esc(FACTIONS[id].name.replace(/^The\s+/i,""))}</span>`+  // compact: drop the "The" so tiles line up
          `</button>`).join("")+
      `</div>`+
    `</div>`;
  const facN = facBox ? 1 : 0;   // section-card numbering + stagger start after the faction box
  const sectionTiles = items.map((it,i)=>
    `<button class="home-tile" data-section="${escAttr(it.id)}" style="--i:${i+facN}">`+
      `<span class="home-tile-bar" aria-hidden="true"></span>`+
      `<span class="home-tile-num" aria-hidden="true">${String(i+1).padStart(2,"0")}</span>`+
      `<span class="home-tile-ico">${NAV_ICONS[it.id]||NAV_ICONS._default}</span>`+
      `<span class="home-tile-body">`+
        `<span class="home-tile-title">${esc(it.label)}</span>`+
        `<span class="home-tile-desc">${esc(HOME_INFO[it.id]||HOME_INFO._default)}</span>`+
        `<span class="home-tile-cta" aria-hidden="true">Enter ${HOME_ARROW}</span>`+
      `</span>`+
    `</button>`).join("");
  // landing hero — the umbrella brand (the per-faction masthead selector is hidden on home, so this
  // carries the identity). No section tabs here either: the cards below ARE the navigation.
  const hero = `<div class="home-hero"><span class="home-hero-brand">Misfits Database</span>`+
    `<span class="home-hero-tag">Multi-faction archive — choose a faction, then a section</span></div>`;
  el.innerHTML = hero + `<div class="home-tiles">` + facBox + sectionTiles + `</div>`;
}
/* ROW 2 (faction-scoped): this faction's own sections — Roster + its docs. Home + Wiki are umbrella
   controls that live in ROW 1 (the primary nav), not here. */
function renderNav(){
  const nav=$("#topnav"); if(!nav) return;
  const tabs=[{id:"roster", label:"Roster"}].concat(factionDocs().map(d=>({id:d.id, label:d.label})));
  nav.innerHTML = tabs.map(t=>
    `<button class="navtab${t.id===currentSection?' active':''}" role="tab" aria-selected="${t.id===currentSection}" data-section="${escAttr(t.id)}"><span class="navico">${NAV_ICONS[t.id]||NAV_ICONS._default}</span><span class="navlabel">${esc(t.label)}</span></button>`).join("");
  nav.classList.remove("hidden");
  renderPrimaryNav();
}
/* ROW 1 (umbrella): fill the HOME + WIKI boxes and mark the active one. (The FACTION box between them
   is built by renderBrand(); the cog sits at the far right.) */
function renderPrimaryNav(){
  [["home","Home"],["wiki","Wiki"]].forEach(([id,label])=>{
    const b=$("#nav-"+id); if(!b) return;
    b.innerHTML=`<span class="navico">${NAV_ICONS[id]||NAV_ICONS._default}</span><span class="navlabel">${esc(label)}</span>`;
    const on=currentSection===id;
    b.classList.toggle("active", on); b.setAttribute("aria-current", on?"page":"false");
  });
}
/* Re-render a Google Doc in the terminal theme. We fetch the doc's HTML export
   (a CORS-readable endpoint for link-shared docs) and rebuild it from a strict
   element whitelist — dropping all of Google's inline styles/classes so OUR CSS
   styles it. The whitelist walk also sanitises (no scripts/handlers/styles). */
const DOC_OK = {h1:1,h2:1,h3:1,h4:1,h5:1,h6:1,p:1,ul:1,ol:1,li:1,a:1,hr:1,br:1,
  blockquote:1,strong:1,em:1,b:1,i:1,u:1,sub:1,sup:1,table:1,thead:1,tbody:1,tr:1,td:1,th:1,img:1};
/* Google's HTML export expresses bold/italic via CSS CLASSES in a <style> block
   (e.g. .c5{font-weight:700}), not inline styles — parse those so we can detect emphasis. */
let docBoldClasses=new Set(), docItalicClasses=new Set(), docTitleCount=0;
function parseDocStyles(parsed){
  docBoldClasses=new Set(); docItalicClasses=new Set(); docTitleCount=0;
  parsed.querySelectorAll("style").forEach(st=>{
    const re=/\.([\w-]+)\s*\{([^}]*)\}/g; let m;
    while((m=re.exec(st.textContent))){
      const cls=m[1], body=m[2];
      const fw=(body.match(/font-weight:\s*(\w+)/)||[])[1];
      if(fw==="bold" || parseInt(fw,10)>=600) docBoldClasses.add(cls);
      if(/font-style:\s*italic/.test(body)) docItalicClasses.add(cls);
    }
  });
}
function docBold(el){
  if(el.style && (el.style.fontWeight==="bold" || parseInt(el.style.fontWeight,10)>=600)) return true;
  return [...el.classList].some(c=>docBoldClasses.has(c));
}
function docItalic(el){
  if(el.style && el.style.fontStyle==="italic") return true;
  return [...el.classList].some(c=>docItalicClasses.has(c));
}
/* escape text, and wrap "double-quoted" runs in a styled span so quoted speech stands out */
function docText(raw){
  raw=relabelTribe(raw);                                    // rebrand "the Yuma Tribe" → "the Tribe" in docs too
  let out="", re=/[“"][^”"\n]{1,300}?[”"]/g, last=0, m;
  while((m=re.exec(raw))){ out+=esc(raw.slice(last, m.index))+`<span class="dq">${esc(m[0])}</span>`; last=re.lastIndex; }
  return out + esc(raw.slice(last));
}
function docClean(node){
  let out="";
  node.childNodes.forEach(n=>{
    if(n.nodeType===3){ out+=docText(n.nodeValue); return; }   // text node (quotes get styled)
    if(n.nodeType!==1) return;
    const tag=n.tagName.toLowerCase();
    if(tag==="span"){                                          // unwrap; preserve bold/italic
      let inner=docClean(n);
      if(inner){ if(docBold(n)) inner=`<strong>${inner}</strong>`; if(docItalic(n)) inner=`<em>${inner}</em>`; }
      out+=inner; return;
    }
    if(!DOC_OK[tag]){ out+=docClean(n); return; }              // unknown tag → keep its children
    if(tag==="br"||tag==="hr"){ out+=`<${tag}>`; return; }
    if(tag==="a"){
      const href=n.getAttribute("href")||"";
      const inner=docClean(n);
      if(/^https?:/i.test(href)) out+=`<a href="${escAttr(href)}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
      else if(href.startsWith("#")) out+=`<a href="${escAttr(href)}" class="docanchor">${inner}</a>`;  // in-doc TOC link
      else out+=inner;
      return;
    }
    if(tag==="img"){
      const src=n.getAttribute("src")||"";                     // Docs embeds images as base64 data: PNGs
      if(/^(https?:|data:image\/)/i.test(src)){
        const alt=n.getAttribute("alt")||"";
        // base64 images are extracted into the prepared doc's side-table and hydrated
        // lazily on scroll (see hydrateDocImages) — they're ~99% of the export's bytes,
        // and inlining them all makes first paint wait on every image at once.
        const srcAttr = (_docImgSink && /^data:/i.test(src))
          ? ` data-docimg="${_docImgSink.push(src)-1}"`
          : ` src="${escAttr(src)}"`;
        out+=`<figure class="docfig"><div class="docfig-screen pending"><img${srcAttr} alt="${escAttr(alt)}" loading="lazy" decoding="async"><span class="docfig-tint"></span></div>`+
             (alt?`<figcaption class="docfig-cap">${esc(alt)}</figcaption>`:"")+`</figure>`;
      }
      return;
    }
    if(tag==="table"){
      // a single-cell table = a "line box" the author drew in the Doc around a quote (Google
      // exports a bordered box as a 1×1 table) → render it as a featured framed quote, not a
      // data table. Real data tables (≥2 cells) still render as scrollable tables.
      if(n.querySelectorAll("tr").length===1 && n.querySelectorAll("td,th").length===1){
        out+=`<blockquote class="docquote docquote-box">${docClean(n.querySelector("td,th"))}</blockquote>`;
        return;
      }
      out+=`<div class="doctable"><table>${docClean(n)}</table></div>`; return;   // wrap → scrolls on narrow screens
    }
    const inner=docClean(n);
    if(/^(p|h[1-6]|li|blockquote|td|th)$/.test(tag)){
      if(!inner.trim()) return;                          // drop empty blocks (Docs spacers)
      if(/^Tab \d+$/.test(n.textContent.trim())) return; // drop Google Docs tab-name artifacts
    }
    if(tag==="p" && /^\s*>\s/.test(n.textContent)){      // a paragraph starting "> " → featured quote block
      out+=`<blockquote class="docquote">${inner.replace(/^(\s*)&gt;\s?/, "$1")}</blockquote>`;
      return;
    }
    if(tag==="p" && (n.classList.contains("title") || n.classList.contains("subtitle"))){
      // Google Docs "Title" / "Subtitle" paragraph styles → masthead + subtitle.
      // The FIRST Title is the masthead; any later Title (docs sometimes style two
      // lines as Title) and every Subtitle render as the small-caps subtitle.
      docTitleCount++;
      out += (n.classList.contains("title") && docTitleCount===1)
        ? `<h1 class="doc-title">${inner}</h1>`
        : `<p class="doc-subtitle">${inner}</p>`;
      return;
    }
    // a bullet that is ENTIRELY one quoted phrase → the "quoted speech" style, consistently.
    // docText's inline quote-wrap only fires when a whole "…" sits in one text node, so quotes
    // Google split across spans were missed → identical quote bullets styled inconsistently.
    // Detect at the block level (full text) so every quote bullet matches.
    if(tag==="li" && /^["“”][^"“”]{1,300}["“”]$/.test(n.textContent.trim())){
      out+=`<li><span class="dq">${esc(relabelTribe(n.textContent.trim()))}</span></li>`;
      return;
    }
    const id=n.getAttribute("id");                       // keep heading anchors so the TOC can jump
    const attr=(id && /^[\w.:-]+$/.test(id) ? ` id="${escAttr(id)}"` : "")
      + (tag==="h1" && /^\s*part\b/i.test(n.textContent) ? ' class="part"' : "");
    out+=`<${tag}${attr}>${inner}</${tag}>`;
  });
  return out;
}
/* Tag Table-of-Contents entries (a paragraph that is just one in-doc link) with their
   target heading's level, so the TOC shows real hierarchy via indent + size. */
function styleTOC(reader){
  reader.querySelectorAll("p > a.docanchor").forEach(a=>{
    const p=a.parentElement;
    if(p.children.length!==1 || p.textContent.trim()!==a.textContent.trim()) return;  // whole-line entry only
    const frag=a.getAttribute("href").slice(1);
    let tgt = frag && reader.querySelector("#"+(window.CSS&&CSS.escape?CSS.escape(frag):frag));
    if(!tgt){ const t=a.textContent.trim().toLowerCase();
      tgt=[...reader.querySelectorAll("h1,h2,h3,h4")].find(h=>h.textContent.trim().toLowerCase()===t); }
    const lvl = tgt ? Math.min(parseInt(tgt.tagName[1],10), 4) : 1;
    const cls = {1:"toc-l1", 2:"toc-l2", 3:"toc-l3", 4:"toc-l4"}[lvl];
    p.classList.add("tocitem", cls);
  });
}
/* in-page outline sidebar (wide screens) — built from the doc's H1/H2 headings */
let docHeads=[];
function buildDocSidebar(reader){
  const toc=$("#doctoc");
  docHeads=[...reader.querySelectorAll("h1,h2,h3,h4")]                                     // full outline, not just h1/h2
    .filter(h=>h.textContent.trim() && !h.classList.contains("doc-title"));                // …minus the masthead title
  if(docHeads.length<3){ toc.innerHTML=""; return; }            // too short to bother
  // reuse the roster's own section-header component so the two index rails share one
  // element (»-prefix + trailing dashed rule come with the class) — not a parallel style.
  toc.innerHTML = '<div class="sectionhdr">CONTENTS</div>' + docHeads.map((h,i)=>{
    if(!h.id) h.id="doch-"+i;                                   // ensure a jump target
    return `<a href="#${escAttr(h.id)}" class="tl${h.tagName[1]}" data-h="${escAttr(h.id)}">${esc(h.textContent.trim())}</a>`;
  }).join("");
}
/* update the sticky "current section" label + sidebar highlight as the doc scrolls */
function trackDocSection(){
  if(!docHeads.length){ $("#docnow").textContent=""; return; }
  const scTop=$("#docscroll").getBoundingClientRect().top;
  let cur=null;
  for(const h of docHeads){ if(h.getBoundingClientRect().top - scTop <= 90) cur=h; else break; }
  $("#docnow").textContent = cur ? "› "+cur.textContent.trim() : "";
  const toc=$("#doctoc"); let act=null;
  toc.querySelectorAll("a").forEach(a=>{ const on = cur && a.dataset.h===cur.id; a.classList.toggle("active", on); if(on) act=a; });
  if(act) act.scrollIntoView({block:"nearest"});
  writeRoute(cur ? slugify(cur.textContent) : "");   // the URL follows the section you're reading
}
$("#doctoc").addEventListener("click", e=>{
  const a=e.target.closest("a"); if(!a) return; e.preventDefault();
  const t=document.getElementById(a.dataset.h); if(t) t.scrollIntoView({behavior:"smooth", block:"start"});
});
/* ---- doc cache (memory + IndexedDB) + lazy image hydration ----
   Google's export inlines every image as base64 — measured: ~99% of the payload is
   images, the actual text is under 100KB. Two-part strategy:
   1. PERSIST the prepared doc in IndexedDB, so the multi-MB download happens once per
      device — every later open (even after a browser restart) is served locally, with a
      background re-fetch when the copy is stale so content stays fresh.
   2. STRIP the base64 images out of the rendered HTML into a side-table and hydrate each
      one only as it scrolls near (IntersectionObserver). Text paints immediately; image
      decode never blocks reading.
   Prepared shape: { html, images:[dataURL…], t:epoch }. */
const _docCache = new Map();                                  // docId -> prepared doc
const DOC_STALE_MS = 15*60*1000;                              // background-refresh IDB copies older than this
let _docImgSink = null;                                       // collects extracted images during docClean

/* minimal IndexedDB k/v — never throws, resolves null / no-ops when unavailable */
function idbGet(key){ return new Promise(res=>{ try{
  const r=indexedDB.open("mdb-docdb",1);
  r.onupgradeneeded=()=>r.result.createObjectStore("kv");
  r.onerror=()=>res(null);
  r.onsuccess=()=>{ const db=r.result; try{
    const g=db.transaction("kv").objectStore("kv").get(key);
    g.onsuccess=()=>{ res(g.result||null); db.close(); };
    g.onerror =()=>{ res(null); db.close(); };
  }catch(e){ res(null); db.close(); } };
}catch(e){ res(null); } }); }
function idbSet(key,val){ try{
  const r=indexedDB.open("mdb-docdb",1);
  r.onupgradeneeded=()=>r.result.createObjectStore("kv");
  r.onsuccess=()=>{ const db=r.result;
    try{ db.transaction("kv","readwrite").objectStore("kv").put(val,key); }catch(e){}
    setTimeout(()=>db.close(), 1500); };
}catch(e){} }

async function prepareDoc(docId, signal){
  if(_docCache.has(docId)) return _docCache.get(docId);
  const stored = await idbGet("doc:"+docId);                  // device cache: skip the network entirely
  if(stored && stored.html){
    _docCache.set(docId, stored);
    if(Date.now()-(stored.t||0) > DOC_STALE_MS){                // refresh behind the scenes
      bgSyncStart();
      fetchAndPrepare_(docId).catch(()=>{}).finally(bgSyncEnd);
    }
    return stored;
  }
  return fetchAndPrepare_(docId, signal);
}
async function fetchAndPrepare_(docId, signal){
  const res = await fetch(`https://docs.google.com/document/d/${docId}/export?format=html`, signal ? {signal} : {});
  if(!res.ok) throw new Error("status "+res.status);
  const parsed = new DOMParser().parseFromString(await res.text(), "text/html");
  parseDocStyles(parsed);                                     // learn which classes mean bold/italic
  _docImgSink = [];
  const html = docClean(parsed.body);                         // the expensive recursive walk, off the open path
  const prepared = { html, images:_docImgSink, t:Date.now() };
  _docImgSink = null;
  _docCache.set(docId, prepared);
  idbSet("doc:"+docId, prepared);                             // persist for next session (fire-and-forget)
  return prepared;
}

/* attach lazy loading: placeholder imgs get their base64 src only when scrolled near;
   the "RECEIVING IMAGE" skeleton (CSS .pending) clears once each image has painted.
   Two mechanisms, belt + braces:
   - IntersectionObserver (primary; efficient) — but IO callbacks are SUSPENDED in
     hidden documents (background tabs, prerender), so it can't be the only path.
   - a synchronous rect-check pass at render time + on throttled doc scroll — plain
     events + getBoundingClientRect, which work everywhere. Also gives above-the-fold
     images an instant start instead of waiting for IO's async callback. */
let _docImgIO = null, _docHydrateCtx = null;
const _figDone = img => { const s=img.closest(".docfig-screen"); if(s){ s.classList.remove("pending"); classifyDocImage(img, s); } };
/* a mostly-white image with dark marks is a line-art DIAGRAM (flow chart), not a photo — it
   would render as a pale block on the dark screen. Detect it (sample a downscaled copy for the
   light-pixel ratio) and flag it so CSS inverts it to light-on-dark, then the phosphor tint
   colourises it to the theme. data: URLs are same-origin so the canvas read is untainted. */
function classifyDocImage(img, screen){
  if(!img.naturalWidth) return;
  try{
    const n=40, c=document.createElement("canvas"); c.width=c.height=n;
    const ctx=c.getContext("2d"); ctx.drawImage(img, 0, 0, n, n);
    const d=ctx.getImageData(0,0,n,n).data; let light=0;
    for(let p=0;p<d.length;p+=4){ if(d[p]>210 && d[p+1]>210 && d[p+2]>210) light++; }
    screen.classList.toggle("docfig-invert", light/(n*n) > 0.55);
  }catch(e){ /* unsupported / tainted — treat as a normal photo */ }
}
const _figArm  = img => { img.addEventListener("load", ()=>_figDone(img), {once:true});
                          img.addEventListener("error", ()=>_figDone(img), {once:true}); };
function _figSet(img, images){
  if(img.getAttribute("src")) return;                        // already hydrated
  const i=img.dataset.docimg;
  if(i!=null && images[i]){ _figArm(img); img.src=images[i]; }
  else _figDone(img);
}
function runHydratePass(margin){
  const ctx=_docHydrateCtx; if(!ctx) return;
  const m = margin==null ? 900 : margin;
  ctx.reader.querySelectorAll(".docfig-screen.pending img[data-docimg]:not([src])").forEach(img=>{
    const r=(img.closest(".docfig-screen")||img).getBoundingClientRect();
    if(r.bottom >= -m && r.top <= window.innerHeight+m) _figSet(img, ctx.images);
  });
}
function hydrateDocImages(reader, images){
  if(_docImgIO){ _docImgIO.disconnect(); _docImgIO=null; }
  _docHydrateCtx = { reader, images };
  const imgs=[...reader.querySelectorAll(".docfig img")];
  if("IntersectionObserver" in window){
    // observe the framed WRAPPER, not the img — a src-less img has zero height and a
    // zero-area target doesn't reliably intersect; the wrapper has a min-height.
    _docImgIO = new IntersectionObserver(ents=>{
      ents.forEach(en=>{
        if(!en.isIntersecting) return;
        _docImgIO.unobserve(en.target);
        const img=en.target.querySelector("img"); if(img) _figSet(img, images);
      });
    }, {rootMargin:"900px 0px"});                             // start decoding well before it's on screen
    imgs.forEach(img=>{ if(img.dataset.docimg!=null) _docImgIO.observe(img.closest(".docfig-screen")||img); });
  }
  // direct http(s) images already have src — just clear their skeleton once painted
  imgs.forEach(img=>{ if(img.dataset.docimg==null){ if(img.complete) _figDone(img); else _figArm(img); } });
  runHydratePass();                                           // hydrate what's already in/near view now
}
/* Warm ONE doc's cache on intent (tab hover / keyboard focus) rather than blanket-fetching
   every doc on load. The exports are image-heavy (multi-MB — Google inlines images as
   base64), so speculatively downloading them all would waste bandwidth, especially on
   mobile. Hover/focus = the user is about to open it, so the head start is well spent. */
function prefetchDoc(docId){ if(docId && !_docCache.has(docId)) prepareDoc(docId).catch(()=>{}); }

/* ---- fancy ASCII loader (only shown for a cold/uncached fetch; prefetched opens skip it) ----
   A RobCo archive readout: a ping-pong "comet" sweeping a shade bar, cycling status line, and a
   blinking block cursor. Glyphs are limited to block elements (░▒▓█) + a forced mono font so no
   pixel-font tofu. One interval, cleared the moment the fetch settles. */
const _LOADMSG = ["establishing archive link", "retrieving document", "decoding transmission", "rendering dossier"];
let _docLoaderTimer = null;
/* announce a STABLE doc/wiki state to screen readers (loading / error). Not the animated loader —
   that repaints 12×/s and would flood a live region; this fires once per state change. */
function announceDoc(msg){ const a=$("#doc-announce"); if(a) a.textContent = msg || ""; }
function startDocLoader(status){
  stopDocLoader();
  status.className = "docstatus loading";
  const _r=$("#docreader"); if(_r) _r.setAttribute("aria-busy","true");
  announceDoc("Loading document…");                          // once, not per animation frame
  const W = 28; let f = 0;
  const frame = () => {
    const span = W*2 - 2, ph = f % span, p = ph < W ? ph : span - ph;   // ping-pong head position
    let bar = ""; for(let i=0;i<W;i++){ const d = Math.abs(i-p); bar += d===0?"█":d===1?"▓":d===2?"▒":"░"; }
    const msg = _LOADMSG[Math.floor(f/18) % _LOADMSG.length];
    const cur = (f % 8) < 4 ? "█" : " ";
    status.innerHTML =
      `<pre class="docload" aria-hidden="true">▶ ACCESSING PIP-LINK ARCHIVE\n  ${msg}…\n  [${bar}] ${cur}</pre>`+
      `<span class="sr-only">Loading document…</span>`;
    f++;
  };
  frame();
  _docLoaderTimer = setInterval(frame, 85);
}
function stopDocLoader(){ if(_docLoaderTimer){ clearInterval(_docLoaderTimer); _docLoaderTimer = null; }
  const _r=$("#docreader"); if(_r) _r.setAttribute("aria-busy","false"); }

/* inject a prepared doc into the reader (shared by the cold + cached paths) */
function renderPreparedDoc(reader, prepared, doc){
  reader.innerHTML = prepared.html;                           // text-only markup — paints fast
  hydrateDocImages(reader, prepared.images||[]);              // images stream in on approach
  styleTOC(reader);
  buildDocSidebar(reader);
  scrollPendingAnchor();   // a deep-linked doc section scrolls into view now that the doc is rendered
  trackDocSection();
  reader.dataset.docid = doc.id;
  resetDocFind();                                             // fresh doc → clear any stale find state
  announceDoc((doc.label||"Document")+" loaded");            // screen-reader cue for the loaded doc
}
function docLoadError(status, e){
  stopDocLoader();
  status.className = "docstatus error";
  const why = e && e.name==="AbortError" ? "The document took too long to load." :
    "Couldn’t load this document. Make sure it’s shared <b>“Anyone with the link → Viewer.”</b>";
  status.innerHTML = `${why} `+
    `<a href="${escAttr($("#doclink").href)}" target="_blank" rel="noopener noreferrer">Open in Google Docs ↗</a>`;
  announceDoc(why.replace(/<[^>]+>/g,""));                    // screen-reader error cue (tags stripped)
}
async function loadDoc(doc){
  $("#doctitle").textContent = doc.label;
  $("#doclink").href = `https://docs.google.com/document/d/${doc.docId}/edit`;
  const reader=$("#docreader"), status=$("#docstatus");
  $("#docscroll").scrollTop=0;
  if(reader.dataset.docid===doc.id) return;                   // already rendered this doc
  // prepared (prefetched + cleaned) → inject immediately, no loader flash
  if(_docCache.has(doc.docId)){
    try{ renderPreparedDoc(reader, _docCache.get(doc.docId), doc); status.className="docstatus"; status.textContent=""; }
    catch(e){ docLoadError(status, e); }
    return;
  }
  // cold path → animated ASCII loader while we fetch + clean
  reader.innerHTML="";
  startDocLoader(status);
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(), 15000);            // don't hang on the loader forever
  try{
    const prepared=await prepareDoc(doc.docId, ctrl.signal);
    // stale-load guard: if the user switched to another section (or back to roster) while
    // this cold fetch was in flight, a newer loadDoc() call now owns the reader/status/
    // loader — bail out silently instead of clobbering it. Applies to BOTH outcomes:
    // a late success must not overwrite the newer doc, and a late failure must not paint
    // this doc's error over it.
    if(currentSection!==doc.id) return;
    renderPreparedDoc(reader, prepared, doc);
    status.className="docstatus"; status.textContent="";
  }catch(e){
    if(currentSection!==doc.id) return;
    docLoadError(status, e);
  }finally{
    // only stop the loader if we're still the current doc — startDocLoader shares one
    // module-level timer, so an unconditional stop here would freeze a newer doc's loader.
    if(currentSection===doc.id) stopDocLoader();
    clearTimeout(timer);
  }
}

/* ---------- WIKI reader ----------------------------------------------------------------
   The Misfits wiki is a MediaWiki whose parse API is CORS-enabled, so we fetch a page's HTML
   client-side (like the Google Docs) and re-render it in the terminal theme. Rather than flatten
   the wiki's hand-built landing structure into a wall of text, renderWiki() RECOGNISES its
   semantics (hero banner, callouts/alerts, a faction card grid, column layouts — all built with
   inline styles) and re-skins each as a native phosphor component, so the page reads better than
   the source. Leaf/prose content still goes through docClean (the strict sanitiser). Internal
   wiki links load in-app so you can browse through it. */
const WIKI = { host:"wiki.misfitsystems.net", home:"Main_Page" };
let _wikiPage = WIKI.home;
/* a block is a "styled box" if the author gave it a border/background (a banner, callout or card) */
function wikiStyled(el){ return /(?:border|background)\s*:/i.test(el.getAttribute("style")||""); }
function wikiHexRgb(c){ c=(c||"").replace("#",""); if(c.length===3) c=c.split("").map(x=>x+x).join("");
  if(!/^[0-9a-f]{6}$/i.test(c)) return null; const n=parseInt(c,16); return {r:n>>16&255,g:n>>8&255,b:n&255}; }
/* a reddish border/background marks an ALERT box (the Main Page's "MANDATORY READING") */
function wikiIsAlert(el){
  const m=(el.getAttribute("style")||"").match(/(?:border|background)[^;]*?(#[0-9a-fA-F]{3,6}|red|crimson|darkred)/);
  if(!m) return false; const c=m[1].toLowerCase();
  if(/red|crimson|darkred/.test(c)) return true;
  const rgb=wikiHexRgb(c); return !!rgb && rgb.r>90 && rgb.r>rgb.g*1.7 && rgb.r>rgb.b*1.7;
}
/* docClean drops <div>, merging sibling text runs — so convert leaf content-divs (no block child,
   and NOT a styled box) to <p> first, so a box/cell's title·body·links stack on their own lines */
function wikiLeafDivsToP(root){
  root.querySelectorAll("div").forEach(d=>{
    if(wikiStyled(d)) return;
    if(!d.querySelector("div,p,ul,ol,table,h1,h2,h3,h4,h5,h6,blockquote,hr,li")){
      const p=document.createElement("p"); while(d.firstChild) p.appendChild(d.firstChild); d.replaceWith(p);
    }
  });
}
function wikiClean(el){ wikiLeafDivsToP(el); return docClean(el); }
/* walk the parsed MediaWiki DOM and emit themed structure; recurse through plain wrapper divs */
function renderWiki(node){
  let out="";
  [...node.children].forEach(el=>{
    const tag=el.tagName.toLowerCase();
    if(tag==="div" && wikiStyled(el)){                          // banner / callout / alert
      const raw=el.getAttribute("style")+el.innerHTML;
      const cls = wikiIsAlert(el) ? "wiki-callout wiki-callout--alert"
        : (/font-size:\s*(?:1\.[5-9]|[2-9])/i.test(raw) && /text-align:\s*center/i.test(raw)) ? "wiki-hero"
        : "wiki-callout";
      out+=`<div class="${cls}">${wikiClean(el)}</div>`; return;
    }
    if(tag==="table"){
      const rows=[...el.querySelectorAll("tr")];
      const cells=[...el.querySelectorAll("tr > td, tr > th")];
      const styled=cells.filter(c=>wikiStyled(c)).length;
      const cols=Math.max(0,...rows.map(r=>r.querySelectorAll(":scope > td, :scope > th").length));
      // colour-coded cells in a ≥3-column grid → faction card grid. (A 2-column styled table is a
      // key-value infobox, e.g. a faction dossier — leave it to the data-table renderer below.)
      if(cols>=3 && styled>=Math.ceil(cells.length/2)){
        out+=`<div class="wiki-cardgrid">`+cells.map(c=>`<div class="wiki-card">${wikiClean(c)}</div>`).join("")+`</div>`; return;
      }
      if(!el.querySelector("th") && el.querySelectorAll("tr").length===1 && cells.length>=2 && cells.length<=4){
        out+=`<div class="wiki-cols" style="--n:${cells.length}">`+cells.map(c=>`<div class="wiki-col">${wikiClean(c)}</div>`).join("")+`</div>`; return;   // single-row layout table → columns
      }
      // a genuine data table / key-value infobox → let docClean render it as a .doctable. docClean
      // only wraps a <table> it meets as a CHILD node, so pass a wrapper (calling it on the table
      // itself would iterate the rows loose and collapse to text).
      const w=document.createElement("div"); w.appendChild(el.cloneNode(true)); out+=docClean(w); return;
    }
    if(tag==="div"){ out += el.querySelector("div,table") ? renderWiki(el) : wikiClean(el); return; }
    out+=docClean(el);
  });
  return out;
}
function wikiAbs(u){ if(!u) return u; if(/^https?:/i.test(u)) return u;
  if(u.startsWith("//")) return "https:"+u; if(u.startsWith("/")) return "https://"+WIKI.host+u; return u; }
function wikiPageFromHref(href){                               // wiki page title from a URL, else null
  try{ const u=new URL(href, "https://"+WIKI.host);
    if(u.host!==WIKI.host) return null;
    let m=u.pathname.match(/\/(?:wiki|index\.php)\/(.+)$/);
    if(m) return decodeURIComponent(m[1]);
    if(u.searchParams.get("title") && !u.searchParams.get("action")) return u.searchParams.get("title");
  }catch(e){}
  return null;
}
async function loadWiki(page){
  page = page || WIKI.home; _wikiPage = page;
  const reader=$("#docreader"), status=$("#docstatus");
  $("#docscroll").scrollTop=0;
  $("#doctitle").textContent = "Wiki";
  $("#doclink").href = "https://"+WIKI.host+"/index.php/"+encodeURIComponent(page);
  reader.innerHTML=""; startDocLoader(status);
  const ctrl=new AbortController(); const timer=setTimeout(()=>ctrl.abort(),15000);
  try{
    const url="https://"+WIKI.host+"/api.php?action=parse&format=json&formatversion=2&origin=*"+
      "&redirects=1&prop=text&page="+encodeURIComponent(page);
    const r=await fetch(url,{signal:ctrl.signal}); const j=await r.json();
    if(currentSection!=="wiki") return;                       // stale guard (user navigated away)
    const html = j && j.parse && j.parse.text;
    if(!html) throw new Error(j && j.error ? j.error.info : "no content");
    const tmp=document.createElement("div"); tmp.innerHTML=html;
    tmp.querySelectorAll(".mw-editsection,.toc,#toc,.mw-empty-elt,style,script,.navbox,.metadata,.noprint,sup.reference,img,figure,.thumb")
      .forEach(e=>e.remove());                                // drop MediaWiki chrome (the wiki has no images)
    tmp.querySelectorAll("a[href]").forEach(a=>a.setAttribute("href", wikiAbs(a.getAttribute("href"))));
    docBoldClasses=new Set(); docItalicClasses=new Set(); docTitleCount=0; _docImgSink=null;   // reset docClean state
    // renderWiki re-skins the wiki's hand-built structure (hero/callout/card-grid/columns) as native
    // components; the .wikibody wrapper keeps loose prose in the reader's centre measure (the reader
    // is a grid, so bare runs would otherwise fall into the narrow side column).
    reader.innerHTML = `<div class="wikibody">${renderWiki(tmp)}</div>`;
    // if this wiki page IS one of our factions, offer a jump to its roster in the Database (closes the
    // faction↔wiki loop; the coming-soon → wiki link is the other direction)
    const jumpId = Object.keys(FACTION_WIKI).find(id => FACTION_WIKI[id] === page);
    if(jumpId){
      const wb = reader.querySelector(".wikibody");
      if(wb){ const d=document.createElement("div"); d.className="wiki-factionjump";
        d.innerHTML = `<a href="#${escAttr(jumpId)}/roster">▸ View ${esc(FACTIONS[jumpId].name)} in the Database</a>`;
        wb.insertBefore(d, wb.firstChild); }
    }
    styleTOC(reader); buildDocSidebar(reader); trackDocSection();
    reader.dataset.docid = "wiki:"+page;
    $("#docnow").textContent = "› "+page.replace(/_/g," ");
    status.className="docstatus"; status.textContent="";
    announceDoc(page.replace(/_/g," ")+" loaded");           // screen-reader cue for the loaded page
    writeRoute();                                             // reflect the loaded wiki page in the URL
  }catch(e){
    if(currentSection!=="wiki") return;
    stopDocLoader(); status.className="docstatus error";
    status.innerHTML = `Couldn’t load the wiki page. <a href="${escAttr($("#doclink").href)}" target="_blank" rel="noopener noreferrer">Open the wiki ↗</a>`;
    announceDoc("Couldn’t load the wiki page.");
  }finally{ if(currentSection==="wiki") stopDocLoader(); clearTimeout(timer); }
}
/* clicking an internal wiki link browses to that page in-app instead of leaving the site */
$("#docreader").addEventListener("click", e=>{
  if(currentSection!=="wiki") return;
  const a=e.target.closest("a[href]"); if(!a) return;
  const p=wikiPageFromHref(a.href);
  if(p){ e.preventDefault();
    // push a history entry so the browser Back/Forward buttons step through visited wiki pages
    // (loadWiki's writeRoute then no-ops since the hash already matches; route/back loads don't push)
    const h="#wiki"+(p!==WIKI.home ? "/"+encodeURIComponent(p) : "");
    if(location.hash!==h){ try{ history.pushState(null,"",h); }catch(err){} }
    loadWiki(p);
  }
});

/* ---- in-document find: highlight matches, step through them ---- */
let _docFindMatches=[], _docFindIdx=-1;
function clearDocFindMarks(){
  const reader=$("#docreader"); if(!reader) return;
  const marks=reader.querySelectorAll("mark.docfind");
  marks.forEach(m=>m.replaceWith(document.createTextNode(m.textContent)));
  if(marks.length) reader.normalize();                        // merge the split text nodes back
  _docFindMatches=[]; _docFindIdx=-1;
}
function resetDocFind(){                                      // called after (re)rendering a doc
  clearDocFindMarks();
  const box=$("#docfind"); if(box) box.value="";
  const wrap=$("#docfind-wrap"); if(wrap) wrap.classList.remove("has-value","no-match");
  const c=$("#docfind-count"); if(c) c.textContent="";
}
function runDocFind(q){
  clearDocFindMarks();
  const wrap=$("#docfind-wrap"), c=$("#docfind-count");
  q=(q||"").trim();
  if(wrap) wrap.classList.toggle("has-value", !!q);
  if(!q){ if(c) c.textContent=""; if(wrap) wrap.classList.remove("no-match"); return; }
  const reader=$("#docreader");
  const walker=document.createTreeWalker(reader, NodeFilter.SHOW_TEXT,
    { acceptNode:n => n.nodeValue && n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
  const nodes=[]; let tn; while((tn=walker.nextNode())) nodes.push(tn);
  const ql=q.toLowerCase();
  for(const node of nodes){
    const text=node.nodeValue, lower=text.toLowerCase();
    if(!lower.includes(ql)) continue;
    const frag=document.createDocumentFragment();
    let last=0, idx=lower.indexOf(ql);
    while(idx>=0){
      if(idx>last) frag.appendChild(document.createTextNode(text.slice(last, idx)));
      const mk=document.createElement("mark"); mk.className="docfind"; mk.textContent=text.slice(idx, idx+q.length);
      frag.appendChild(mk); _docFindMatches.push(mk);
      last=idx+q.length; idx=lower.indexOf(ql, last);
    }
    if(last<text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.replaceWith(frag);
  }
  if(wrap) wrap.classList.toggle("no-match", _docFindMatches.length===0);
  if(_docFindMatches.length) focusDocFind(0);
  else if(c) c.textContent="0/0";
}
function focusDocFind(i){
  if(!_docFindMatches.length) return;
  _docFindMatches.forEach(m=>m.classList.remove("cur"));
  _docFindIdx=(i+_docFindMatches.length)%_docFindMatches.length;
  const m=_docFindMatches[_docFindIdx]; m.classList.add("cur");
  m.scrollIntoView({block:"center", behavior:"smooth"});
  const c=$("#docfind-count"); if(c) c.textContent=`${_docFindIdx+1}/${_docFindMatches.length}`;
}
function stepDocFind(dir){ if(_docFindMatches.length) focusDocFind(_docFindIdx+dir); }
function setSection(id){
  if(id!=="home" && id!=="roster" && id!=="wiki" && !factionDocs().some(d=>d.id===id)) id="roster";
  currentSection = id;
  document.body.setAttribute("data-section", id);
  document.querySelectorAll("#topnav .navtab").forEach(b=>{
    const on = b.dataset.section===id;
    b.classList.toggle("active", on); b.setAttribute("aria-selected", on);
  });
  renderPrimaryNav();   // sync the ROW-1 HOME/WIKI active state
  const isHome = id==="home", isRoster = id==="roster";
  const home=$("#home"); if(home) home.classList.toggle("hidden", !isHome);
  $("#docview").classList.toggle("hidden", isRoster || isHome);
  if(isHome){
    renderHome();
    $("#roster").classList.add("hidden");
    $("#cards").classList.add("hidden");
    $("#state").classList.add("hidden");
  }else if(isRoster){
    showRosterFor(activeFaction());                  // live data, or a themed coming-soon state
  }else{
    $("#roster").classList.add("hidden");
    $("#cards").classList.add("hidden");
    $("#state").classList.add("hidden");
    if(id==="wiki"){ loadWiki(_wikiPage); }
    else { const doc=factionDocs().find(d=>d.id===id); if(doc) loadDoc(doc); }
  }
  writeRoute();   // reflect the section in the URL (character/heading is added by its own handler)
}
$("#topnav").addEventListener("click", e=>{
  const b=e.target.closest(".navtab"); if(b) setSection(b.dataset.section);
});
/* ROW-1 umbrella boxes: HOME + WIKI navigate; the FACTION box is handled by wireFactionMenu */
$("#primary-nav").addEventListener("click", e=>{
  const b=e.target.closest(".navbox"); if(b) setSection(b.dataset.section);
});
/* home landing: faction boxes switch faction; section tiles navigate into their section */
$("#home").addEventListener("click", e=>{
  const fac=e.target.closest(".home-fac"); if(fac){ applyFaction(fac.dataset.faction); return; }
  const t=e.target.closest(".home-tile"); if(t) setSection(t.dataset.section);
});
/* prefetch a doc the moment its tab is hovered or focused (just-in-time cache warming) */
["pointerover","focusin"].forEach(ev => $("#topnav").addEventListener(ev, e=>{
  const b=e.target.closest(".navtab"); if(!b) return;
  const doc=factionDocs().find(d=>d.id===b.dataset.section); if(doc) prefetchDoc(doc.docId);
}));
/* on doc scroll: back-to-top visibility + sticky section / sidebar tracking (rAF-throttled)
   + the image-hydration fallback pass (timestamp-throttled — NOT rAF, which is suspended
   in hidden tabs; scroll events still fire there) */
let docScrollTick=false, _hydLast=0;
$("#docscroll").addEventListener("scroll", ()=>{
  const sc=$("#docscroll"), max=sc.scrollHeight - sc.clientHeight;
  const pct = max>0 ? sc.scrollTop/max : 0;                 // reading progress 0→1 (Medium-style)
  $("#doctop").style.setProperty("--docpct", pct.toFixed(3));
  $("#doctop").classList.toggle("show", sc.scrollTop>200);  // the progress ring doubles as back-to-top
  if(!docScrollTick){ docScrollTick=true; requestAnimationFrame(()=>{ trackDocSection(); docScrollTick=false; }); }
  const now=Date.now();
  if(now-_hydLast>120){ _hydLast=now; runHydratePass(); }
});
$("#doctop").addEventListener("click", ()=>$("#docscroll").scrollTo({top:0, behavior:"smooth"}));
/* clicking a Table-of-Contents link scrolls within the rendered doc (no hash pollution) */
$("#docreader").addEventListener("click", e=>{
  const a=e.target.closest("a.docanchor"); if(!a) return;
  e.preventDefault();
  const frag=a.getAttribute("href").slice(1);
  let target = frag && document.getElementById(frag);
  if(!target){                                          // Docs sometimes exports a bare "#" — match heading by text
    const txt=a.textContent.trim().toLowerCase();
    target=[...$("#docreader").querySelectorAll("h1,h2,h3,h4")].find(h=>h.textContent.trim().toLowerCase()===txt);
  }
  if(target) target.scrollIntoView({behavior:"smooth", block:"start"});
});

/* in-document find: debounced highlight on type; Enter / Shift+Enter step matches; Esc clears */
(function docFindWiring(){
  const box=$("#docfind"); if(!box) return;
  let t=null;
  box.addEventListener("input", ()=>{ clearTimeout(t); t=setTimeout(()=>runDocFind(box.value), 130); });
  box.addEventListener("keydown", e=>{
    if(e.key==="Enter"){ e.preventDefault(); if(_docFindMatches.length) stepDocFind(e.shiftKey?-1:1); else runDocFind(box.value); }
    else if(e.key==="Escape"){ e.preventDefault(); box.value=""; runDocFind(""); box.blur(); }
  });
  $("#docfind-next").addEventListener("click", ()=>stepDocFind(1));
  $("#docfind-prev").addEventListener("click", ()=>stepDocFind(-1));
})();

$("#crt-toggle").addEventListener("click", ()=>{
  const on=document.body.classList.toggle("crt");
  $("#crt-toggle").textContent="Scanlines: "+(on?"ON":"OFF");
  $("#crt-toggle").classList.toggle("active", on);
  localStorage.setItem("mdb-crt", on?"1":"0");
});
/* High-Contrast mode (a11y): lift the dim/faint text tiers to full phosphor + drop the scanline
   overlay + thicken focus rings (CSS keys off body[data-contrast="high"]). Auto-on when the OS
   prefers-contrast:more is set (unless the user has chosen); a Settings toggle overrides. */
function applyContrast(on, persist){
  document.body.dataset.contrast = on ? "high" : "normal";
  if(persist!==false){ try{ localStorage.setItem("mdb-contrast", on?"1":"0"); }catch(e){} }
  const b=$("#contrast-toggle"); if(b){ b.textContent="High Contrast: "+(on?"ON":"OFF"); b.classList.toggle("active", on); }
  applyColor(_curColor);   // re-derive --fg-dim / --fg-faint for the new mode
}
$("#contrast-toggle").addEventListener("click", ()=>{ applyContrast(document.body.dataset.contrast!=="high"); });

$("#refresh").addEventListener("click", ()=>load(true));

/* Reset all Theme-popover settings to defaults (font, colour, bg, text size,
   frame, frame tint, screen glass, CRT). Doesn't touch character data / icons / photos. */
$("#reset-settings").addEventListener("click", ()=>{
  ["mdb-font","mdb-font-head","mdb-font-body","mdb-docfont-title","mdb-docfont-head",
   "mdb-docfont-body","mdb-color","mdb-bg",
   "mdb-textsize","mdb-frame","mdb-frametint","mdb-sheen","mdb-crt","mdb-dosspanel","mdb-cards","mdb-imgcolor","mdb-bezel","mdb-contrast",
   fkey("font-head"),fkey("font-body")   // clear THIS faction's font override → its signature reloads
  ].forEach(k=>localStorage.removeItem(k));
  applyContrast(false);   // back to normal contrast (before applyColor so the palette is right)
  const _rf = factionFont(activeFaction());
  applyFontHead(_rf.head); applyFontBody(_rf.body);   // reset to the active faction's signature typeface
  applyTextSize("auto");                                 // size follows the font again
  ["title","head","body"].forEach(kind=>applyDocFont(kind, DOC_FONT_DEFAULT[kind]));
  applyColor("green"); applyBg("phosphor");
  applyFrame("screen"); applyFrameTint("olive"); applyGlass("off"); applyDossPanel("on");
  applyCards("auto"); applyImgColor("screen"); applyBezel("on");
  document.body.classList.add("crt");
  $("#crt-toggle").textContent="Scanlines: ON"; $("#crt-toggle").classList.add("active");
  localStorage.setItem("mdb-crt","1");
  refreshCur();
  toast("Settings reset to defaults.");
});

/* keyboard navigation: '/' focuses search; ↑/↓ or j/k step through the roster */
document.addEventListener("keydown", e=>{
  const tag=((document.activeElement&&document.activeElement.tagName)||"").toLowerCase();
  const typing = tag==="input"||tag==="textarea";
  // ignore global shortcuts while a modal is open (focus stays trapped inside it)
  const modalOpen=["#modalback","#iconback","#uploadback","#shotback"].some(id=>$(id).classList.contains("open"));
  if(modalOpen) return;
  if(e.key==="/" && !typing){
    e.preventDefault(); setSettingsOpen(false);
    // focus whichever search is in view: the doc find on a doc tab, else the roster search
    (currentSection!=="roster" ? $("#docfind") : $("#search")).focus();
    return;
  }
  if(typing || !state.model || state.view!=="roster") return;
  const down=e.key==="ArrowDown"||e.key==="j", up=e.key==="ArrowUp"||e.key==="k";
  if(!down && !up) return;
  e.preventDefault();
  const list=filtered(); if(!list.length) return;
  let pos=list.indexOf(state.model.characters[state.selected]);
  // if the current selection isn't in the filtered set, down→first, up→last
  pos = (pos<0) ? (down?0:list.length-1) : Math.max(0, Math.min(list.length-1, pos + (down?1:-1)));
  selectIndex(state.model.characters.indexOf(list[pos]));
  const a=$("#list .row.active"); if(a) a.scrollIntoView({block:"nearest"});
});

/* settings popover */
/* settings drawer (right-hand sidebar) open/close */
function setSettingsOpen(open){
  $("#settings-pop").classList.toggle("open", open);
  $("#settings-back").classList.toggle("open", open);
  $("#settings-pop").setAttribute("aria-hidden", open ? "false" : "true");
  $("#settings-back").setAttribute("aria-hidden", open ? "false" : "true");
  $("#settings-btn").setAttribute("aria-expanded", open ? "true" : "false");
  if(open) $("#settings-close").focus();
}
$("#settings-btn").addEventListener("click", ()=> setSettingsOpen(!$("#settings-pop").classList.contains("open")));
$("#settings-close").addEventListener("click", ()=> setSettingsOpen(false));
$("#settings-back").addEventListener("click", ()=> setSettingsOpen(false));
document.addEventListener("click", e=>{
  if(!e.target.closest(".morewrap")) closeMoreMenus();   // click outside any dossier "More" menu closes it
});
document.addEventListener("keydown", e=>{ if(e.key==="Escape") closeMoreMenus(); });
/* close every open dossier "More" menu except an optional one to keep open */
function closeMoreMenus(except){
  document.querySelectorAll(".morewrap.open").forEach(w=>{
    if(w===except) return;
    w.classList.remove("open");
    w.querySelector(".morebtn")?.setAttribute("aria-expanded","false");
  });
}

/* ---------- icon picker ---------- */
let iconPickSlug=null;
function openIconPicker(slug){
  const ch=state.model.characters.find(c=>c.slug===slug); if(!ch) return;
  iconPickSlug=slug;
  const cur=iconForChar(ch);
  $("#iconpickhead").innerHTML=`<div class="doss-role" style="margin:0 0 12px">CHOOSE A SIGIL · ${esc(ch.name)}</div>`;
  $("#iconpickgrid").innerHTML=ICON_ORDER.map(k=>
    `<button class="iconopt ${k===cur?'active':''}" data-key="${k}">${svgIcon(k)}<span>${esc(k)}</span></button>`).join("");
  $("#iconback").classList.add("open");
}
$("#iconclose").addEventListener("click", ()=>$("#iconback").classList.remove("open"));
$("#iconback").addEventListener("click", e=>{ if(e.target.id==="iconback") $("#iconback").classList.remove("open"); });
$("#iconpickgrid").addEventListener("click", e=>{
  const opt=e.target.closest(".iconopt"); if(!opt||!iconPickSlug) return;
  setCharacterIcon(iconPickSlug, opt.dataset.key);
});

async function setCharacterIcon(slug, key){
  const ch=state.model.characters.find(c=>c.slug===slug); if(!ch) return;
  if(CONFIG.webAppUrl){
    const pass=getPass(); if(!pass) return;
    setLink("SAVING…");
    try{
      const res=await fetch(CONFIG.webAppUrl, { method:"POST", body:JSON.stringify({
        action:"setIcon", usename: ch.fields.usename || ch.name, pass, icon:key
      })});
      const out=await res.json();
      if(out.error==="unauthorized"){ sessionStorage.removeItem("mdb-pass"); throw new Error("wrong passphrase"); }
      if(!out.ok) throw new Error(out.error||"could not save icon");
      setLink("ONLINE");
    }catch(err){
      setLink("OFFLINE", true);
      toast("Couldn't save to the sheet ("+err.message+"). Keeping it on this device for now.");
      setLocalIcon(slug, key);
    }
  } else {
    setLocalIcon(slug, key);            // no backend: remember locally
  }
  ch.fields.icon=key;                   // reflect immediately in the UI
  $("#iconback").classList.remove("open");
  state.view==="roster" ? renderRoster() : renderCards();
  if($("#modalback").classList.contains("open")) $("#modalbody").innerHTML=dossierHTML(ch);
}

/* ------------------------ load ------------------------ */
/* status line was removed; kept as a no-op so the ~18 save/upload/log/load call sites
   (setLink("SAVING…"), setLink("ONLINE"), setLink("OFFLINE", true)…) don't need touching. */
function setLink(status, warn){}
/* background-sync blip was part of the removed status line; kept as no-ops so the doc
   prefetch call sites (bgSyncStart / bgSyncEnd) don't need touching. */
function bgSyncStart(){}
function bgSyncEnd(){}
function showState(title, sub, isError){
  $("#roster").classList.add("hidden");
  $("#cards").classList.add("hidden");
  $("#state").classList.remove("hidden");
  document.body.classList.toggle("load-error", !!isError);   // hide the Vault-Tec loader on error
  $("#loadermsg").innerHTML = isError ? "⚠ LINK ERROR" : title+'<span class="cursor">&nbsp;</span>';
  $("#statesub").innerHTML = sub;
}

async function load(isRefresh){
  document.body.classList.remove("coming-soon");
  const _main=document.querySelector("main"); if(_main) _main.setAttribute("aria-busy","true");   // a11y: fetching
  if(!isRefresh) showState("ACCESSING PIP-LINK", "Establishing read-only link to the archive…");
  setLink(isRefresh?"RE-SYNCING…":"CONNECTING…");
  try{
    const res=await fetch(sheetUrl(), {cache:"no-store"});
    if(!res.ok) throw new Error("HTTP "+res.status);
    const text=await res.text();
    const rows=parseCSV(text);
    const model=buildModel(rows);
    if(!model.characters.length) throw new Error("No character rows found");
    state.model=model;
    state.loadedSheet=effectiveSheetId();  // remember which faction's sheet is in memory
    buildNameIndex(model);                 // for cross-linking names in dossiers
    buildConnections(model);               // mentions / mentioned-by graph data
    renderListControls(model);             // roster filter + sort controls
    if(state.selected>=model.characters.length) state.selected=0;
    setLink("ONLINE");
    render();
    if(!isRefresh) openPendingChar();     // honour a deep-linked character on first load
  }catch(err){
    setLink("OFFLINE", true);
    // a failed REFRESH keeps the last good roster on screen (don't blank working data
    // over a transient network error) — the full error state is for first load only
    if(isRefresh && state.model){ toast("Refresh failed ("+err.message+") — showing the last good data."); return; }
    showState("", `Could not read the sheet (<code>${esc(err.message)}</code>).<br><br>
      Make sure the Google Sheet is shared <b>“Anyone with the link → Viewer”</b>.
      Then hit <b>⟳ Refresh</b>. Nothing is ever written back to the sheet.`, true);
  }finally{ if(_main) _main.setAttribute("aria-busy","false"); }   // a11y: fetch settled
}

/* ------------------------ boot sequence ------------------------ */
/* RobCo boot sequence: type-on branding -> a brief deterministic self-test readout
   -> a one-shot block-glyph sweep bar (same visual language as the doc loader's sweep
   in startDocLoader, but linear 0->100% once, not ping-pong) -> type-on "ONLINE" ->
   fade. No live data (the sheet hasn't loaded yet at this point in init(), and keeping
   the sequence self-contained keeps its ~3.3s timing deterministic regardless of
   network conditions). Generic RobCo-terminal styling only — no Vault-Tec/Vault-Boy
   art, this ships on a public site. Skippable (click/any key) at every step; a hard
   safety timeout guarantees it can never trap the user even if a step's logic stalls. */
function runBoot(){
  const boot=$("#boot"); if(!boot) return;
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduce || sessionStorage.getItem("mdb-booted")) return;   // once per session, never if reduced-motion
  sessionStorage.setItem("mdb-booted","1");
  const el=$("#boot-text"); el.innerHTML="";
  boot.classList.add("run");
  let done=false, timers=[], sweepTimer=null;
  const later=(fn,ms)=>{ const t=setTimeout(()=>{ if(!done) fn(); }, ms); timers.push(t); return t; };
  function finish(){
    if(done) return; done=true;
    timers.forEach(clearTimeout); timers=[];
    if(sweepTimer){ clearInterval(sweepTimer); sweepTimer=null; }
    window.removeEventListener("keydown", onKey);
    boot.classList.add("done");
    setTimeout(()=>boot.classList.remove("run","done"), 450);
  }
  const onKey=()=>finish();
  boot.addEventListener("click", finish, {once:true});
  window.addEventListener("keydown", onKey);

  const CHECKS=["MEMORY CHECK".padEnd(20,".")+"OK","ARCHIVE LINK".padEnd(20,".")+"OK","SUBSYSTEMS".padEnd(20,".")+"OK"];
  // three ordered zones, each rendered in its own typeface: preLines (branding, plain
  // --font-head) -> monoLines (self-test + sweep bar, forced true monospace — same
  // reasoning .docload forces a real monospace rather than trusting --font-head, which
  // can be an uneven pixel face) -> postLines ("ONLINE", plain again). monoLines is
  // frozen once the sweep completes, so it never re-flows/snaps once typing resumes.
  const preLines=[], monoLines=[], postLines=[];
  function render(partial, partialIsMono){
    let html=preLines.map(esc).join("\n");
    const mono=partialIsMono && partial!=null ? [...monoLines, partial] : monoLines;
    if(mono.length) html += (html?"\n":"") + `<span class="bootmono">${mono.map(esc).join("\n")}</span>`;
    if(postLines.length) html += (html?"\n":"") + postLines.map(esc).join("\n");
    if(!partialIsMono && partial!=null) html += (html?"\n":"") + esc(partial);
    el.innerHTML=html;
  }

  // step 1: type the branding line
  const brand="ROBCO INDUSTRIES (TM) TERMLINK PROTOCOL";
  let ci=0;
  (function typeBrand(){
    if(done) return;
    render(brand.slice(0,ci));
    if(ci<brand.length){ ci++; later(typeBrand,16); }
    else { preLines.push(brand); render(); later(selfTest,260); }
  })();

  // step 2: a quick self-test readout, lines revealed with a short stagger (a POST
  // screen doesn't type each character — it blips lines in) rather than typed
  function selfTest(){
    let i=0;
    (function next(){
      if(done) return;
      if(i>=CHECKS.length){ later(sweep,220); return; }
      monoLines.push(CHECKS[i]); render(); i++;
      later(next,150);
    })();
  }

  // step 3: one-shot sweep bar, linear 0->100%. Narrower on phones — #boot's 8vw side
  // padding plus a 30-char bar doesn't fit a 375px viewport (verified: wraps the "]100%"
  // onto its own line). 20 chars comfortably fits down to 375px with margin.
  function sweep(){
    const narrow = window.matchMedia && matchMedia("(max-width:760px)").matches;
    const W=narrow?20:30, steps=24, stepMs=24;
    let s=0;
    sweepTimer=setInterval(()=>{
      if(done) return;
      s++;
      const filled=Math.min(W, Math.round((s/steps)*W));
      const pct=Math.min(100, Math.round((s/steps)*100));
      render("["+"█".repeat(filled)+"░".repeat(W-filled)+"] "+pct+"%", true);
      if(s>=steps){
        clearInterval(sweepTimer); sweepTimer=null;
        monoLines.push("["+"█".repeat(W)+"] 100%");
        render(); later(finalLine,200);
      }
    }, stepMs);
  }

  // step 4: type the final "online" line, brief pause, then fade
  function finalLine(){
    const text="MISFITS DATABASE — ONLINE";
    let ci2=0;
    (function typeFinal(){
      if(done) return;
      render(text.slice(0,ci2));
      if(ci2<text.length){ ci2++; later(typeFinal,16); }
      else { postLines.push(text); render(); later(finish,500); }
    })();
  }

  setTimeout(finish, 5000);            // hard safety: never trap the user
}

/* restore prefs + go */
(function init(){
  runBoot();
  buildSettings();
  /* one-time migration: old single-preset "mdb-font" key → separate head/body faces */
  const legacyFont = localStorage.getItem("mdb-font");
  if(legacyFont && !localStorage.getItem("mdb-font-head")){
    const [mh,mb] = PRESET_MIGRATE[legacyFont] || ["fallout","fallout"];
    localStorage.setItem("mdb-font-head", mh); localStorage.setItem("mdb-font-body", mb);
  }
  localStorage.removeItem("mdb-font");
  /* fonts are now remembered PER FACTION (like colours); fold any legacy GLOBAL head/body
     choice into the current faction's key once, then retire the global keys. */
  const _gH=localStorage.getItem("mdb-font-head"), _gB=localStorage.getItem("mdb-font-body");
  if(_gH && !localStorage.getItem(fkey("font-head"))) localStorage.setItem(fkey("font-head"), _gH);
  if(_gB && !localStorage.getItem(fkey("font-body"))) localStorage.setItem(fkey("font-body"), _gB);
  localStorage.removeItem("mdb-font-head"); localStorage.removeItem("mdb-font-body");
  /* the per-faction signature FONT was removed (switching faction changing the interface typeface read
     as jumpy) — every faction now uses the classic Fallout font. Clear, ONCE, the stale per-faction
     font overrides the old signature defaults auto-persisted, so the classic font takes effect for
     existing browsers too. A deliberate Settings font choice made AFTER this still persists per faction. */
  if(!localStorage.getItem("mdb-migr-fontreset")){
    Object.keys(localStorage).filter(k=>/^mdb-font-(head|body)-/.test(k)).forEach(k=>localStorage.removeItem(k));
    localStorage.setItem("mdb-migr-fontreset","1");
  }
  /* each faction loads in the classic Fallout font + its signature colour, unless a font is overridden for it */
  const _ap = factionAppearance(currentFaction);
  applyFontHead(_ap.head);
  applyFontBody(_ap.body);  /* sets a font-derived size if none stored */
  ["title","head","body"].forEach(kind=>
    applyDocFont(kind, localStorage.getItem("mdb-docfont-"+kind) || DOC_FONT_DEFAULT[kind]));
  applyTextSize(localStorage.getItem("mdb-textsize") || "auto");  /* "auto" follows the body font; a stored manual size wins */
  /* High-Contrast: a stored choice wins, else honour the OS prefers-contrast:more. Set BEFORE
     applyColor so the palette derives its dim/faint tiers correctly on first paint. */
  { const _hc=localStorage.getItem("mdb-contrast");
    const _hcOn = _hc!=null ? _hc==="1" : !!(window.matchMedia && window.matchMedia("(prefers-contrast: more)").matches);
    document.body.dataset.contrast = _hcOn ? "high" : "normal";
    const _cb=$("#contrast-toggle"); if(_cb){ _cb.textContent="High Contrast: "+(_hcOn?"ON":"OFF"); _cb.classList.toggle("active", _hcOn); } }
  applyColor(_ap.color);
  applyBg(_ap.bg);
  applyFrame(localStorage.getItem("mdb-frame") || "screen");
  applyFrameTint(localStorage.getItem("mdb-frametint") || "olive");
  applyGlass(localStorage.getItem("mdb-sheen") || "off");
  applyDossPanel(localStorage.getItem("mdb-dosspanel") || "on");
  applyCards(localStorage.getItem("mdb-cards") || "auto");
  applyImgColor(localStorage.getItem("mdb-imgcolor") || "screen");
  applyBezel(localStorage.getItem("mdb-bezel") || "on");
  const crtOn = localStorage.getItem("mdb-crt") !== "0";
  document.body.classList.toggle("crt", crtOn);
  $("#crt-toggle").textContent = "Scanlines: " + (crtOn ? "ON" : "OFF");
  $("#crt-toggle").classList.toggle("active", crtOn);
  const v=localStorage.getItem("mdb-view"); if(v) setView(v);
  refreshCur();                      // fill the popover's collapsed-group value lines
  renderBrand(); wireFactionMenu();  // masthead = plain title (1 faction) or a switcher (2+)
  renderNav();                       // build the active faction's Home + Roster + docs section tabs
  applyRoute();                      // land on the view named in the URL (defaults to #home)
})();
