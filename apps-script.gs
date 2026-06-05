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
   4. Deploy -> New deployment -> type "Web app".
        - Description:        yuma-roster
        - Execute as:         Me
        - Who has access:     Anyone            <-- required for the page to call it
      Deploy, authorise when prompted (it'll warn it's "unverified" — that's your
      own script; continue).
   5. Copy the Web app URL (ends in /exec).
   6. Paste it into CONFIG.webAppUrl near the top of index.html. Done.

   SET THE EDIT PASSPHRASE (soft gate on all writes)
   - Either set the WRITE_PASSPHRASE constant below, OR (better, keeps it out of
     your public repo) Project Settings -> Script Properties -> add a property
     named WRITE_PASSPHRASE with your chosen word. People must type this in the
     viewer to upload or edit. NOTE: this is light deterrence, not real security
     (a determined user who has the passphrase can write anything).

   To test without the page: Run -> selfTest (check the Execution log).
   ============================================================================ */

// The sheet this script writes to. "" = the sheet this script is bound to.
var SHEET_ID = "";
// Drive folder where uploaded portraits are stored (created if missing).
var IMAGE_FOLDER = "Yuma Roster Portraits";
// Header text to use if the sheet has no image column yet.
var IMAGE_HEADER = "Image";
// Shared edit passphrase. Prefer the Script Property of the same name (see above).
// If both are empty, writes are OPEN to anyone — set one before going live.
var WRITE_PASSPHRASE = "";

// OPTIONAL Discord webhook: posts a one-line note to a channel after each successful
// edit/upload. Prefer the Script Property DISCORD_WEBHOOK_URL (keeps it out of the repo).
// Leave empty to disable. To make the note link straight to the dossier, also add a
// Script Property PUBLIC_URL = the deployed page URL (e.g. https://you.github.io/yuma/).
var DISCORD_WEBHOOK_URL = "";

function doGet() {
  return json_({ ok: true, msg: "Yuma roster web app is live. POST actions: uploadImage." });
}

function doPost(e) {
  try {
    var req = JSON.parse(e.postData.contents);
    if (!passOK_(req.pass)) return json_({ ok: false, error: "unauthorized" });
    var result;
    switch (req.action) {
      case "uploadImage": result = uploadImage_(req); break;
      case "setPhoto":    result = setPhoto_(req);    break;
      case "addLog":      result = addLog_(req);      break;
      case "addShot":     result = addShot_(req);     break;
      case "setIcon":     result = setIcon_(req);     break;
      case "setField":    result = setField_(req);    break;
      case "setFields":   result = setFields_(req);   break;
      default:            return json_({ ok: false, error: "unknown action: " + req.action });
    }
    notifyDiscord_(req.action, req, result);   // best-effort; never blocks the write
    return json_(result);
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/* OPTIONAL: announce a successful write to a Discord channel via webhook.
   Wrapped so a webhook failure can never break the actual sheet write. */
function notifyDiscord_(action, req, result) {
  try {
    if (!result || result.ok === false) return;
    var url = PropertiesService.getScriptProperties().getProperty("DISCORD_WEBHOOK_URL") || DISCORD_WEBHOOK_URL;
    if (!url) return;
    var who = req.name || req.slug || "a character";
    var verb = {
      uploadImage: "updated the portrait for",
      setPhoto:    "set a photo for",
      addLog:      "added a log entry for",
      addShot:     "added a screenshot for",
      setIcon:     "changed the sigil for",
      setField:    "edited",
      setFields:   "edited"
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

/* soft passphrase gate — secret lives here / in Script Properties, not in the page */
function passOK_(pass) {
  var expected = PropertiesService.getScriptProperties().getProperty("WRITE_PASSPHRASE") || WRITE_PASSPHRASE;
  if (!expected) return true;            // nothing configured -> open (set one before going live)
  return String(pass) === String(expected);
}

/* ---- save an uploaded image to Drive, write its URL into the row ---- */
function uploadImage_(req) {
  if (!req.dataUrl) return { ok: false, error: "no image data" };
  var m = String(req.dataUrl).match(/^data:([^;]+);base64,(.*)$/);
  if (!m) return { ok: false, error: "bad data URL" };

  var safe = (req.usename || "portrait").replace(/[^\w\-]+/g, "_");
  var blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], safe + ".jpg");

  var file = getFolder_().createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var url = "https://lh3.googleusercontent.com/d/" + file.getId();

  var wrote = writeCellForUseName_(req.usename, IMAGE_HEADER, url, /*createCol*/ true);
  return { ok: true, url: url, fileId: file.getId(), rowUpdated: wrote };
}

/* ---- save an uploaded FRONT or SIDE photo to Drive + write its URL to the row ---- */
function setPhoto_(req) {
  if (!req.dataUrl) return { ok: false, error: "no image data" };
  var m = String(req.dataUrl).match(/^data:([^;]+);base64,(.*)$/);
  if (!m) return { ok: false, error: "bad data URL" };
  var header = (req.slot === "side") ? "Image Side" : "Image";
  var safe = ((req.usename || "photo") + "_" + (req.slot || "front")).replace(/[^\w\-]+/g, "_");
  var blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], safe + ".jpg");
  var file = getFolder_().createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var url = "https://lh3.googleusercontent.com/d/" + file.getId();
  writeCellForUseName_(req.usename, header, url, /*createCol*/ true);
  return { ok: true, url: url, fileId: file.getId(), slot: req.slot || "front" };
}

/* ---- append a personal-log entry to a "Personal Log" column ---- */
function addLog_(req) {
  if (!req.text) return { ok: false, error: "no text" };
  var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  var ok = appendCellForUseName_(req.usename, "Personal Log", "[" + stamp + "] " + req.text, "\n---\n");
  return { ok: ok, error: ok ? "" : "row not found" };
}

/* ---- upload a screenshot to Drive + append its URL to a "Screenshots" column ---- */
function addShot_(req) {
  if (!req.dataUrl) return { ok: false, error: "no image data" };
  var m = String(req.dataUrl).match(/^data:([^;]+);base64,(.*)$/);
  if (!m) return { ok: false, error: "bad data URL" };
  var safe = ((req.usename || "shot") + "_shot").replace(/[^\w\-]+/g, "_");
  var blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], safe + ".jpg");
  var file = getFolder_().createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var url = "https://lh3.googleusercontent.com/d/" + file.getId();
  appendCellForUseName_(req.usename, "Screenshots", url, "\n");
  return { ok: true, url: url, fileId: file.getId() };
}

/* ---- read a row's cell, append value (with separator), write it back ---- */
function appendCellForUseName_(useName, header, value, sep) {
  var sheet = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID).getSheets()[0]
                       : SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var data = sheet.getDataRange().getValues();
  var hRow = -1;
  for (var r = 0; r < data.length; r++) {
    var joined = data[r].join("|").toLowerCase();
    if (joined.indexOf("discord") >= 0 || joined.indexOf("use-name") >= 0) { hRow = r; break; }
  }
  if (hRow < 0) return false;
  var headers = data[hRow].map(function (h) { return String(h).replace(/\s+/g, " ").trim().toLowerCase(); });
  var useCol = indexOfMatch_(headers, ["use-name", "use name"]); if (useCol < 0) useCol = 1;
  var want = String(header).replace(/\s+/g, " ").trim().toLowerCase();
  var col = headers.indexOf(want); if (col < 0) col = indexOfMatch_(headers, [want]);
  if (col < 0) { col = headers.length; sheet.getRange(hRow + 1, col + 1).setValue(header); }
  for (var i = hRow + 2; i < data.length; i++) {
    if (String(data[i][useCol]).trim().toLowerCase() === String(useName).trim().toLowerCase()) {
      var cur = String(data[i][col] || "");
      sheet.getRange(i + 1, col + 1).setValue(cur ? cur + sep + value : value);
      return true;
    }
  }
  return false;
}

/* ---- save a chosen sigil icon key into an "Icon" column (created if missing) ---- */
function setIcon_(req) {
  if (!req.usename) return { ok: false, error: "usename required" };
  var wrote = writeCellForUseName_(req.usename, "Icon", req.icon || "", /*createCol*/ true);
  return { ok: wrote, error: wrote ? "" : "row not found" };
}

/* ---- generic single-field write-back (matched by Use-Name) ---- */
function setField_(req) {
  if (!req.usename || !req.header) return { ok: false, error: "usename + header required" };
  var wrote = writeCellForUseName_(req.usename, req.header, req.value || "", /*createCol*/ false);
  return { ok: wrote, error: wrote ? "" : "row or column not found" };
}

/* ---- batch write-back: { fields: { "<sheet header>": value, ... } } ---- */
function setFields_(req) {
  if (!req.usename || !req.fields) return { ok: false, error: "usename + fields required" };
  var wrote = 0, missed = [];
  for (var header in req.fields) {
    if (writeCellForUseName_(req.usename, header, req.fields[header], false)) wrote++;
    else missed.push(header);
  }
  return { ok: missed.length === 0, wrote: wrote, missed: missed };
}

/* ---- locate the row by Use-Name and set a column's cell ---- */
function writeCellForUseName_(useName, header, value, createCol) {
  var sheet = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID).getSheets()[0]
                       : SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var data = sheet.getDataRange().getValues();

  // header row = first row containing "discord" or "use-name"
  var hRow = -1;
  for (var r = 0; r < data.length; r++) {
    var joined = data[r].join("|").toLowerCase();
    if (joined.indexOf("discord") >= 0 || joined.indexOf("use-name") >= 0) { hRow = r; break; }
  }
  if (hRow < 0) return false;

  var headers = data[hRow].map(function (h) { return String(h).replace(/\s+/g, " ").trim().toLowerCase(); });
  var useCol = indexOfMatch_(headers, ["use-name", "use name"]);
  if (useCol < 0) useCol = 1;

  // normalise the requested header the same way (collapse newlines/spaces), exact match first
  var want = String(header).replace(/\s+/g, " ").trim().toLowerCase();
  var targetCol = headers.indexOf(want);
  if (targetCol < 0) targetCol = indexOfMatch_(headers, [want]);

  if (targetCol < 0) {
    if (!createCol) return false;
    targetCol = headers.length;                          // append a new column
    sheet.getRange(hRow + 1, targetCol + 1).setValue(header);
  }

  // data rows start two below the header (header row + description row)
  for (var i = hRow + 2; i < data.length; i++) {
    if (String(data[i][useCol]).trim().toLowerCase() === String(useName).trim().toLowerCase()) {
      sheet.getRange(i + 1, targetCol + 1).setValue(value);
      return true;
    }
  }
  return false;
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

// Quick manual check from the Apps Script editor.
function selfTest() {
  Logger.log(writeCellForUseName_("Big Brom Matlok", IMAGE_HEADER,
    "https://example.com/test.jpg", true) ? "row found + written" : "no match");
}
