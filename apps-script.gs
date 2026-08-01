/* ============================================================================
   YUMA TRIBE ROSTER — write-back web app (Google Apps Script)
   ----------------------------------------------------------------------------
   Enables the viewer (index.html) to upload a character image and write its
   URL back into the working-copy sheet. Runs as YOU, so it can edit the sheet
   and save files to your Drive. The static page itself never gets credentials.

   ONE-TIME SETUP
   1. Open the WORKING-COPY sheet in your browser.
   2. Extensions -> Apps Script. Delete any sample code.
   3. Paste this whole file in. Save.
   4. REQUIRED — set the edit passphrase:
      Project Settings -> Script Properties -> add WRITE_PASSPHRASE = your chosen
      word. (Or set the constant below, but Script Properties keeps it out of the
      public repo.) Writes are REJECTED until one is configured — the script
      fails closed, never open.
   5. Deploy -> New deployment -> type "Web app".
        - Description:        mdb-roster
        - Execute as:         Me
        - Who has access:     Anyone            <-- required for the page to call it
      Deploy, authorise when prompted (it'll warn it's "unverified" — that's your
      own script; continue).
   6. Copy the Web app URL (ends in /exec).
   7. Paste it into CONFIG.webAppUrl near the top of app.js. Done.

   NOTE ON THE PASSPHRASE MODEL: one shared passphrase for the whole tribe is
   light deterrence, not real security — anyone holding it can write any field of
   any character. The guards below (rate limit, size caps, fail lockout) bound
   the blast radius of a leaked passphrase; they don't make it per-user auth.

   CORS NOTE (do not "fix" the client): the page POSTs with NO Content-Type
   header, which makes it a CORS "simple request" that needs no preflight.
   Adding `Content-Type: application/json` on the client would trigger a
   preflight that Apps Script does not answer, and every write would fail.

   ARCHITECTURE — decided by the repo owner 2026-07-19, superseding the previous
   "the original is read-only by standing directive" rule:

     * This script now binds to the tribe's ORIGINAL sheet, so edits appear on the
       live site instead of landing in a working copy nobody reads.
     * Player-submitted NEW entries do NOT go into the roster tab. They append to a
       separate SUBMISSIONS tab in the same spreadsheet, and a human moves approved
       rows across. Appending cannot overwrite anyone; editing can.
     * Consequently `addEntry` is the ONE action that needs no passphrase. Every
       other action still requires it, because every other action mutates a row
       that already exists.

   Two safety properties follow, and both must be preserved by any future change:
     1. The unauthenticated path may ONLY append to SUBMISSIONS_TAB. It must never
        reach locate_(), which resolves the roster.
     2. Submissions have their own rate budget, so a flood of them cannot exhaust
        the shared budget and lock legitimate editors out.

   MIRROR SYNC (dormant): syncToMirror() copies this sheet's first tab over
   MIRROR_SHEET_ID's first tab. Only relevant in a copy-based architecture;
   MIRROR_SHEET_ID ships empty and the function throws until it is set.

   To test without the page: Run -> selfTest (check the Execution log).
   ============================================================================ */

// The sheet this script writes to. "" = the sheet this script is bound to.
var SHEET_ID = "";
// The roster tab, BY NAME. Leave "" to use the first tab — but set it as soon as the
// spreadsheet has more than one tab. locate_() used to take getSheets()[0] blindly, so
// adding a Submissions tab (or a per-faction tab) that sorts first would silently point
// every edit at the wrong sheet.
var ROSTER_TAB = "";
// Where player-submitted entries land. Created on first use. NEVER set this to the
// roster tab: it is the one surface an unauthenticated caller can write to.
var SUBMISSIONS_TAB = "Submissions";
// syncToMirror TARGET — LEAVE "" unless the architecture ever becomes copy-based
// (site reading a disposable copy that this working copy overwrites).
// ⚠ NEVER set this to 10n4TFnuMWekZLD3pucKS050h1cNItcYmL9v0ciuBsSY. The original is
// now WRITTEN to (see the architecture note above), but syncToMirror does not write —
// it REPLACES the target's first tab wholesale, which would destroy the roster.
var MIRROR_SHEET_ID = "";
// Drive folder where uploaded portraits are stored (created if missing).
var IMAGE_FOLDER = "Yuma Roster Portraits";
// Header text to use if the sheet has no image column yet.
var IMAGE_HEADER = "Image";
// Shared edit passphrase. Prefer the Script Property of the same name (see above).
// If NEITHER is set, all writes are rejected (fail closed).
var WRITE_PASSPHRASE = "";

// Abuse guards — sized for a small RP community, not a public API.
var MAX_IMAGE_BYTES   = 4 * 1024 * 1024;  // decoded upload cap (4MB)
var RATE_MAX_WRITES   = 30;               // successful writes allowed per window (global)
var RATE_WINDOW_SEC   = 60;
var AUTH_MAX_FAILS    = 10;               // bad-passphrase attempts per window before lockout
var AUTH_WINDOW_SEC   = 600;
// Submissions are UNAUTHENTICATED, so they get their own tighter budget. Sharing the
// write budget would let a flood of submissions lock out legitimate editors.
var SUBMIT_MAX        = 8;                // submissions accepted per window (global)
var SUBMIT_WINDOW_SEC = 300;
var SUBMIT_MAX_FIELD  = 2000;             // per-field character cap
var SUBMIT_MAX_TOTAL  = 8000;             // whole-submission character cap
// Only these may be submitted. An allowlist, not a blocklist: an open endpoint must not
// be able to invent columns, and "Image"/"Icon" are deliberately absent (no Drive writes
// on the unauthenticated path).
var SUBMIT_FIELDS = ["Discord Name", "Use-Name", "Honorific / Brave-Name", "Role",
                     "Species", "Appearance", "Relationships", "Notes"];

// OPTIONAL Discord webhook: posts a one-line note to a channel after each successful
// edit/upload. Prefer the Script Property DISCORD_WEBHOOK_URL (keeps it out of the repo).
// Leave empty to disable. To make the note link straight to the dossier, also add a
// Script Property PUBLIC_URL = the deployed page URL (e.g. https://you.github.io/misfits/).
var DISCORD_WEBHOOK_URL = "";

function doGet() {
  return json_({ ok: true, msg: "Yuma roster web app is live. POST actions: addEntry (open), setPhoto, addLog, addShot, setIcon, setFields (passphrase)." });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    if (!e || !e.postData || !e.postData.contents) return json_({ ok: false, error: "empty request" });
    var req = JSON.parse(e.postData.contents);

    // addEntry is the ONLY action exempt from the passphrase, because it is the only one
    // that cannot touch existing data — it appends to the submissions tab and nothing else.
    // Stated as an allowlist of ONE so that adding a case below never silently opens it up.
    var isOpen = (req.action === "addEntry");

    if (!isOpen) {
      // The lockout counter is global (Apps Script exposes no caller identity), so it is a DoS primitive:
      // ten bad-passphrase POSTs from anyone would freeze every editor for AUTH_WINDOW_SEC. Only count a
      // failure when the caller at least SUPPLIED a passphrase, and let a caller holding the correct one
      // through a lockout — otherwise an anonymous attacker can disable editing for the cost of a loop.
      var supplied = typeof req.pass === "string" && req.pass.length > 0;
      var authorised = supplied && passOK_(req.pass);
      if (!authorised && authLocked_()) return json_({ ok: false, error: "too many failed attempts — try again later" });
      if (!authorised) { if (supplied) countAuthFail_(); return json_({ ok: false, error: "unauthorized" }); }
      if (!rateOK_())     return json_({ ok: false, error: "rate limit — slow down and try again in a minute" });
    } else if (!submitOK_()) {
      return json_({ ok: false, error: "too many submissions just now — please try again in a few minutes" });
    }

    // serialise writes: read-modify-write on the sheet (and column creation) races otherwise
    if (!lock.tryLock(10000)) return json_({ ok: false, error: "busy — another write is in progress, try again" });

    var result;
    switch (req.action) {
      case "addEntry":    result = addEntry_(req);    break;   // OPEN — appends to SUBMISSIONS_TAB only
      case "uploadImage": result = setPhoto_(req);    break;   // legacy alias
      case "setPhoto":    result = setPhoto_(req);    break;
      case "addLog":      result = addLog_(req);      break;
      case "addShot":     result = addShot_(req);     break;
      case "setIcon":     result = setIcon_(req);     break;
      case "setField":    result = setField_(req);    break;
      case "setFields":   result = setFields_(req);   break;
      default:            return json_({ ok: false, error: "unknown action: " + req.action });
    }
    // Release BEFORE notifying: the webhook is an outbound HTTP round-trip, and holding the script lock
    // across it let a burst of submissions starve editors on tryLock(10000) even though their rate
    // budgets are separate.
    try { lock.releaseLock(); } catch (ignored) {}
    notifyDiscord_(req.action, req, result);   // best-effort; never blocks the write
    return json_(result);
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}

/* ---- auth: fail CLOSED, digest compare, lockout after repeated failures ---- */
function passOK_(pass) {
  var expected = PropertiesService.getScriptProperties().getProperty("WRITE_PASSPHRASE") || WRITE_PASSPHRASE;
  if (!expected) return false;           // nothing configured -> REJECT all writes
  return sha256_(String(pass)) === sha256_(String(expected));
}
function sha256_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)
    .map(function (b) { return ((b & 255) + 256).toString(16).slice(1); }).join("");
}
/* Coarse global counters via CacheService. Apps Script gives us no caller IP, so
   these are per-deployment, not per-user — good enough to stop a runaway loop or
   a brute-force script, which is the realistic abuse at this scale. */
function bumpCounter_(key, windowSec) {
  var cache = CacheService.getScriptCache();
  var n = parseInt(cache.get(key) || "0", 10) + 1;
  cache.put(key, String(n), windowSec);
  return n;
}
function countAuthFail_() { bumpCounter_("authfails", AUTH_WINDOW_SEC); }
function authLocked_() {
  return parseInt(CacheService.getScriptCache().get("authfails") || "0", 10) >= AUTH_MAX_FAILS;
}
function rateOK_() { return bumpCounter_("writes", RATE_WINDOW_SEC) <= RATE_MAX_WRITES; }
function submitOK_() { return bumpCounter_("submits", SUBMIT_WINDOW_SEC) <= SUBMIT_MAX; }

/* OPTIONAL: announce a successful write to a Discord channel via webhook.
   Wrapped so a webhook failure can never break the actual sheet write. */
function notifyDiscord_(action, req, result) {
  try {
    if (!result || result.ok === false) return;
    var url = PropertiesService.getScriptProperties().getProperty("DISCORD_WEBHOOK_URL") || DISCORD_WEBHOOK_URL;
    if (!url) return;
    // Anything interpolated here comes from a request, and addEntry is unauthenticated. Take only the
    // allowlisted Use-Name for that action, and strip markdown/newlines so a submission cannot forge a
    // multi-line announcement — allowed_mentions blocks the ping, not the text.
    var who = action === "addEntry"
      ? String((req.fields && req.fields["Use-Name"]) || "someone")
      : String(req.usename || req.name || req.slug || "a character");
    who = who.replace(/[\r\n]+/g, " ").replace(/[*_`~|@<>]/g, "").slice(0, 60);
    var verb = {
      uploadImage: "updated the portrait for",
      setPhoto:    "set a photo for",
      addLog:      "added a log entry for",
      addShot:     "added a screenshot for",
      setIcon:     "changed the sigil for",
      setField:    "edited",
      setFields:   "edited",
      addEntry:    "submitted a new entry for"
    }[action] || ("updated " + action + " for");
    var msg = "📟 Roster update: someone " + verb + " **" + who + "**.";
    var pub = PropertiesService.getScriptProperties().getProperty("PUBLIC_URL");
    if (pub && req.slug) msg += "\n" + pub + (pub.indexOf("?") >= 0 ? "&" : "?") + "c=" + encodeURIComponent(req.slug);
    UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      muteHttpExceptions: true,
      payload: JSON.stringify({ content: msg, username: "Yuma Roster", allowed_mentions: { parse: [] } })
    });
  } catch (e) { /* swallow: notifications are non-critical */ }
}

/* ---- decode + validate an uploaded image (size cap, image/* only) ---- */
function imageBlob_(req, nameHint) {
  var m = String(req.dataUrl || "").match(/^data:([^;]+);base64,(.*)$/);
  if (!m) return { error: "bad data URL" };
  var mime = m[1].toLowerCase();
  if (!/^image\/(png|jpe?g|gif|webp)$/.test(mime)) return { error: "not an image (" + mime + ")" };
  // base64 length check BEFORE decoding — don't materialise oversized payloads
  if (m[2].length > MAX_IMAGE_BYTES * 4 / 3) return { error: "image too large (max " + (MAX_IMAGE_BYTES / 1048576) + "MB)" };
  var ext = { "image/png": ".png", "image/gif": ".gif", "image/webp": ".webp" }[mime] || ".jpg";
  var safe = String(nameHint || "image").replace(/[^\w\-]+/g, "_");
  return { blob: Utilities.newBlob(Utilities.base64Decode(m[2]), mime, safe + ext) };
}
/* Drive files are only created AFTER the target row is confirmed to exist —
   otherwise junk requests would fill Drive with orphaned images forever. */
function saveImageFor_(req, nameHint) {
  var loc = locate_(req.usename);
  if (!loc || loc.row < 0) return { error: "row not found for use-name: " + (req.usename || "(none)") };
  var v = imageBlob_(req, nameHint);
  if (v.error) return { error: v.error };
  var file = getFolder_().createFile(v.blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { loc: loc, file: file, url: "https://lh3.googleusercontent.com/d/" + file.getId() };
}

/* ---- save an uploaded FRONT or SIDE photo to Drive + write its URL to the row ---- */
function setPhoto_(req) {
  var header = (req.slot === "side") ? "Image Side" : IMAGE_HEADER;
  var s = saveImageFor_(req, (req.usename || "photo") + "_" + (req.slot || "front"));
  if (s.error) return { ok: false, error: s.error };
  var wrote = writeCell_(s.loc, header, s.url, /*createCol*/ true, /*fuzzy*/ true);
  return { ok: wrote, url: s.url, fileId: s.file.getId(), slot: req.slot || "front",
           error: wrote ? "" : "could not write the image column" };
}

/* ---- append a personal-log entry to a "Personal Log" column ---- */
function addLog_(req) {
  if (!req.text) return { ok: false, error: "no text" };
  var loc = locate_(req.usename);
  if (!loc || loc.row < 0) return { ok: false, error: "row not found" };
  var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  var ok = appendCell_(loc, "Personal Log", "[" + stamp + "] " + req.text, "\n---\n");
  return { ok: ok, error: ok ? "" : "could not write the log column" };
}

/* ---- upload a screenshot to Drive + append its URL to a "Screenshots" column ---- */
function addShot_(req) {
  var s = saveImageFor_(req, (req.usename || "shot") + "_shot");
  if (s.error) return { ok: false, error: s.error };
  var ok = appendCell_(s.loc, "Screenshots", s.url, "\n");
  return { ok: ok, url: s.url, fileId: s.file.getId(),
           error: ok ? "" : "could not write the screenshots column" };
}

/* ---- save a chosen sigil icon key into an "Icon" column (created if missing) ---- */
function setIcon_(req) {
  if (!req.usename) return { ok: false, error: "usename required" };
  var loc = locate_(req.usename);
  if (!loc || loc.row < 0) return { ok: false, error: "row not found" };
  var wrote = writeCell_(loc, "Icon", req.icon || "", /*createCol*/ true, /*fuzzy*/ true);
  return { ok: wrote, error: wrote ? "" : "could not write the icon column" };
}

/* ---- generic single-field write-back (matched by Use-Name) ----
   Client-supplied headers get EXACT (normalised) matching only. Fuzzy substring
   matching here would let a header like "name" silently target the "use-name"
   column and clobber a character's identity key. */
function setField_(req) {
  if (!req.usename || !req.header) return { ok: false, error: "usename + header required" };
  var loc = locate_(req.usename);
  if (!loc || loc.row < 0) return { ok: false, error: "row not found" };
  var wrote = writeCell_(loc, req.header, req.value || "", /*createCol*/ false, /*fuzzy*/ false);
  return { ok: wrote, error: wrote ? "" : "column not found: " + req.header };
}

/* ---- batch write-back: { fields: { "<sheet header>": value, ... } } ---- */
function setFields_(req) {
  if (!req.usename || !req.fields) return { ok: false, error: "usename + fields required" };
  var loc = locate_(req.usename);
  if (!loc || loc.row < 0) return { ok: false, error: "row not found" };
  var wrote = 0, missed = [];
  for (var header in req.fields) {
    if (writeCell_(loc, header, req.fields[header], false, /*fuzzy*/ false)) wrote++;
    else missed.push(header);
  }
  return { ok: missed.length === 0, wrote: wrote, missed: missed };
}

/* ---- OPEN: append a player-submitted entry to the submissions tab ----
   Deliberately does NOT call locate_(): the unauthenticated path must have no way to reach the
   roster. It only ever appends, so it cannot overwrite an existing row even within its own tab.
   Values are capped and matched against an allowlist so an open endpoint cannot invent columns
   or store unbounded text. */
function addEntry_(req) {
  var fields = req.fields;
  if (!fields || typeof fields !== "object") return { ok: false, error: "no fields" };

  var name = String(fields["Use-Name"] || "").replace(/\s+/g, " ").trim();
  if (!name) return { ok: false, error: "a use-name is required" };

  var total = 0, clean = {};
  for (var i = 0; i < SUBMIT_FIELDS.length; i++) {
    var key = SUBMIT_FIELDS[i];
    var raw = String(fields[key] == null ? "" : fields[key]);
    if (raw.length > SUBMIT_MAX_FIELD) return { ok: false, error: key + " is too long (max " + SUBMIT_MAX_FIELD + " characters)" };
    total += raw.length;
    // A leading =, +, -, @ or | makes Sheets (and Excel, on export) treat the value as a formula or a
    // DDE payload. Anchoring on character 0 was not enough: a leading tab, CR or non-breaking space
    // sails past it, stays inert in-cell, and then goes live the moment the row is exported to CSV or an
    // admin copies the DISPLAYED text into the roster. Trim first, then test, then prefix.
    var trimmed = raw.replace(/^[\s\u0000-\u001F\u00A0\uFEFF]+/, "");
    clean[key] = /^[=+\-@|]/.test(trimmed) ? "'" + trimmed : trimmed;
  }
  if (total > SUBMIT_MAX_TOTAL) return { ok: false, error: "submission is too long overall" };

  var book = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  var tab = book.getSheetByName(SUBMISSIONS_TAB);
  if (!tab) {
    // Append, never insert at 0. Without the index this lands at the active sheet's position, which in a
    // headless doPost is index 0 — and rosterSheet_() then throws for every authenticated action until a
    // human edits the script. One anonymous request would have caused a persistent outage.
    tab = book.insertSheet(SUBMISSIONS_TAB, book.getNumSheets());
    tab.appendRow(["Submitted"].concat(SUBMIT_FIELDS).concat(["Status"]));
    tab.setFrozenRows(1);
  }
  var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
  var row = [stamp];
  for (var j = 0; j < SUBMIT_FIELDS.length; j++) row.push(clean[SUBMIT_FIELDS[j]]);
  row.push("pending");
  tab.appendRow(row);
  return { ok: true, name: name, tab: SUBMISSIONS_TAB };
}

/* ---- shared locator: sheet + header row + headers + use-name column + target row ---- */
function rosterSheet_() {
  var book = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  if (ROSTER_TAB) {
    var named = book.getSheetByName(ROSTER_TAB);
    if (!named) throw new Error("ROSTER_TAB is set to '" + ROSTER_TAB + "' but no such tab exists");
    return named;
  }
  var first = book.getSheets()[0];
  // Fail loudly rather than editing submissions as if they were the roster. This is reachable
  // only by misconfiguration, and silently corrupting the intake tab is the worse outcome.
  if (first.getName() === SUBMISSIONS_TAB)
    throw new Error("the first tab is '" + SUBMISSIONS_TAB + "' — set ROSTER_TAB to the roster's tab name");
  return first;
}
function locate_(useName) {
  var sheet = rosterSheet_();
  var data = sheet.getDataRange().getValues();
  var hRow = -1;
  for (var r = 0; r < data.length; r++) {
    var joined = data[r].join("|").toLowerCase();
    if (joined.indexOf("discord") >= 0 || joined.indexOf("use-name") >= 0) { hRow = r; break; }
  }
  if (hRow < 0) return null;
  var headers = data[hRow].map(function (h) { return String(h).replace(/\s+/g, " ").trim().toLowerCase(); });
  var useCol = indexOfMatch_(headers, ["use-name", "use name"]);
  if (useCol < 0) useCol = 1;
  var row = -1;
  var want = String(useName || "").trim().toLowerCase();
  if (want) {
    // data rows start two below the header (header row + description row)
    for (var i = hRow + 2; i < data.length; i++) {
      if (String(data[i][useCol]).trim().toLowerCase() === want) { row = i; break; }
    }
  }
  return { sheet: sheet, data: data, hRow: hRow, headers: headers, useCol: useCol, row: row };
}

/* ---- set a cell in the located row. fuzzy=substring header match — TRUSTED
   (script-internal) header names only, never client-supplied ones. ---- */
function writeCell_(loc, header, value, createCol, fuzzy) {
  var want = String(header).replace(/\s+/g, " ").trim().toLowerCase();
  var col = loc.headers.indexOf(want);
  if (col < 0 && fuzzy) col = indexOfMatch_(loc.headers, [want]);
  if (col < 0) {
    if (!createCol) return false;
    col = loc.headers.length;
    loc.sheet.getRange(loc.hRow + 1, col + 1).setValue(header);
    loc.headers.push(want);                          // keep loc reusable within a request
  }
  loc.sheet.getRange(loc.row + 1, col + 1).setValue(value);
  return true;
}

/* ---- read the located row's cell, append value (with separator), write back ---- */
function appendCell_(loc, header, value, sep) {
  var want = String(header).replace(/\s+/g, " ").trim().toLowerCase();
  var col = loc.headers.indexOf(want);
  if (col < 0) col = indexOfMatch_(loc.headers, [want]);
  if (col < 0) {
    col = loc.headers.length;
    loc.sheet.getRange(loc.hRow + 1, col + 1).setValue(header);
    loc.headers.push(want);
  }
  var cur = String(loc.data[loc.row][col] || "");
  loc.sheet.getRange(loc.row + 1, col + 1).setValue(cur ? cur + sep + value : value);
  return true;
}

function indexOfMatch_(headers, needles) {
  for (var i = 0; i < headers.length; i++)
    for (var j = 0; j < needles.length; j++)
      if (headers[i].indexOf(needles[j]) >= 0) return i;
  return -1;
}

function getFolder_() {
  var it = DriveApp.getFoldersByName(IMAGE_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(IMAGE_FOLDER);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ============================================================================
   MIRROR SYNC — copy the working copy's first tab (values only) to the public
   mirror the deployed site reads. Add an hourly time-driven trigger on this
   function (see setup notes at the top), and/or run it manually after edits.
   ============================================================================ */
function syncToMirror() {
  if (!MIRROR_SHEET_ID) throw new Error("MIRROR_SHEET_ID is not set");
  var src = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID).getSheets()[0]
                     : SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var dst = SpreadsheetApp.openById(MIRROR_SHEET_ID).getSheets()[0];
  var values = src.getDataRange().getValues();
  dst.clearContents();                               // values only; mirror needs no formatting
  if (values.length) dst.getRange(1, 1, values.length, values[0].length).setValues(values);
  Logger.log("synced " + values.length + " rows to the mirror");
}

// Quick manual check from the Apps Script editor.
function selfTest() {
  Logger.log("roster tab: " + rosterSheet_().getName());
  var loc = locate_("Big Brom Matlok");
  Logger.log(loc && loc.row >= 0
    ? "row found (sheet row " + (loc.row + 1) + ") — locator OK"
    : "no match — check the sheet has a Use-Name column and that row");
  Logger.log(passOK_("") ? "PASSPHRASE NOT SET — writes would be open" : "passphrase configured — edits are gated");
}
