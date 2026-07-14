# Deployment and recovery — Misfits Database

## Current repository configuration (reconciled 2026-07-14)

- **Live URL:** https://dr-orac.github.io/oracular-db/
- **Repo:** `dr-orac/oracular-db` (public) · Pages serves `main` branch root ·
  every `git push` redeploys in ~1 min. `og:url`/`og:image` already stamped
  (`tools/set-deploy-url.py` has been run — only re-run if the URL ever changes).
- **Data:** the site reads the tribe's **ORIGINAL sheet** (`CONFIG.sheetId` = `10n4T…`)
  read-only — community edits appear on next load automatically, no sync involved.
  **Never write to that sheet** (standing directive). The private working copy
  (`1649x…`) is a parked write-back sandbox; nothing reads it.
- **Not yet done:** §3 write-back — PARKED on a data-flow decision (see MAINTENANCE.md
  → "Open / future work"); uploads/edits persist per-browser only · §5a per-character
  Discord stubs with the real base URL · §5b webhook.

The sections below are the reference procedure — for a redeploy elsewhere, or to finish
the unchecked steps.

---

Steps 1–2 make the roster **public and viewable**. Step 3 turns on **write-back** so
uploads/logs/edits persist for everyone (not just one browser). Steps 4–5 are optional
Discord polish.

## What needs to ship

From the repository root:

The safest deployment is the repository root. A minimal runtime copy must include:

```
index.html      styles.css      app.js      crt-screen-integration.js
favicon.svg     og-card.png
fonts/          media/          c/          vendor/
```

Keep `data/` with the project even though the current legacy atlas has not yet migrated to it; it is the
guarded source for the next map renderer. GitHub Pages already publishes the whole repository root.

`apps-script.gs` is source/reference code only: a static host does not execute it. Enabling write-back means
pasting it into Google Apps Script and following the gated procedure in step 3.
`tools/`, `docs/`, and the root Markdown files are operational/reference material rather than browser
runtime dependencies. Preserve them in every source clone even if a separate minimal host omits them.

---

## Fast path — GitHub Pages via the CLI  (recommended)

The repo is already a clean git repo on `main`, paths are subpath-safe, and mobile +
widescreen are verified. So the whole deploy is:

```bash
# 0. one-time: log in (interactive — run in your own terminal)
gh auth login                       # GitHub.com · HTTPS · login with browser

# 1. create the public repo from this folder and push main in one step
gh repo create <repo-name> --public --source=. --remote=origin --push

# 2. turn on Pages (branch main, root)
gh api -X POST repos/{owner}/<repo-name>/pages -f 'source[branch]=main' -f 'source[path]=/' || \
  echo "if that errors, enable it in the web UI: Settings → Pages → Deploy from a branch → main / root"

# 3. stamp the live URL into the social-card tags (absolute og:image for Discord), then push
python3 tools/set-deploy-url.py https://<owner>.github.io/<repo-name>/
git commit -am "chore: set deploy URL for social cards" && git push
```

Site goes live at `https://<owner>.github.io/<repo-name>/` within a minute or two.

**Before it shows data, do §1 (share the sheet).** If you've added Google Docs as nav
tabs (the **Guide** tab etc.), each of those docs also needs **Anyone with the link →
Viewer** or the tab shows a "not shared yet" message.

The manual / no-git hosting options and the optional write-back + Discord pieces are
detailed below.

---

## 1 · Make the sheet readable  (required)

The deployed viewer reads the tribe's **original sheet** (`CONFIG.sheetId`) read-only.
It must be shared **Anyone with the link → Viewer** (it already is). Never write to it.

> Same applies to any **Google Doc added as a nav tab** (the Guide tab, etc.): set each
> to *Anyone with the link → Viewer*, or its tab shows a "not shared yet" message.
> (Docs are configured by faction in `FACTION_DOCS` near the top of `app.js`.)

> **Check** — visiting
> `https://docs.google.com/spreadsheets/d/10n4TFnuMWekZLD3pucKS050h1cNItcYmL9v0ciuBsSY/gviz/tq?tqx=out:csv`
> should download a CSV (not an HTML login page).

## 2 · Host it  (required)  — pick one

**GitHub Pages (recommended).** Create a repo; commit `index.html`, `styles.css`,
`app.js`, the whole `fonts/` folder, `og-card.png`, and (optionally) `c/`. Then
**Settings → Pages → Source: Deploy from a branch → main / root**.
Live at `https://<you>.github.io/<repo>/`.

**No-git alternatives:** drag the folder into **Netlify Drop** (`app.netlify.com/drop`)
or **Cloudflare Pages → Upload assets** — both give you a URL in under a minute.

At this point the roster is **live and readable**. Themes/font/density/permalinks/
sharing all work. Uploads & edits work too but persist only in each visitor's browser
until step 3.

## 3 · Turn on write-back  (⚠ PARKED — read this first)

**Do not deploy this yet.** The script binds to the private working copy, but the live
site reads the tribe's ORIGINAL sheet — deployed as-is, edits would never appear on
the site. It needs a data-flow decision first (options in MAINTENANCE.md → "Open /
future work"). The steps below are the reference procedure for once that's decided.

Without write-back, every visitor sees only their own uploads (per-browser), which is
safe and is the current live behaviour.

1. Open the working-copy sheet → **Extensions → Apps Script**.
2. Delete the sample, paste in **`apps-script.gs`** (the whole file), Save.
3. **Set the edit passphrase FIRST** — **Project Settings → Script Properties** →
   add `WRITE_PASSPHRASE` = a word your group shares. The script **fails closed**:
   until this exists, every write is rejected (that's deliberate — see
   docs/AUDIT-2026-07-02.md).
4. **Deploy → New deployment → Web app:**
   - **Execute as:** *Me*
   - **Who has access:** *Anyone*  ← critical; without this you'll see a CORS error.
   - Deploy, authorise when Google warns "unverified" (it's your own script).
5. Copy the **/exec URL** Google shows.
6. Paste the **/exec URL** into **`CONFIG.webAppUrl`** near the top of `app.js`,
   commit + push (Pages redeploys).
7. **Only in a copy-based architecture** (site reading a disposable copy): set
   `MIRROR_SHEET_ID` in the script to that copy and add a trigger — Triggers → Add
   Trigger → function `syncToMirror`, time-driven, hourly. **Never point it at the
   original sheet** — `syncToMirror` REPLACES the target's first tab.

Now uploads (portraits + screenshots), icon picks, log entries, and dossier edits
write back to the sheet (creating the columns `Image`, `Image Side`, `Icon`,
`Personal Log`, `Screenshots` as needed).

## 4 · Test the live write path

On the hosted page: pick a character → ▲ upload a photo → enter the passphrase →
confirm it appears, then check the sheet got the URL. Try a log entry and an edit too.

If a write fails with a CORS error, almost always it's step 3.3 — the deployment's
"Who has access" isn't set to **Anyone**.

---

## 5 · Discord integration  (optional but cool)

Two independent pieces. Use either or both.

### 5a. Rich per-character link previews

**The catch:** Discord's unfurler doesn't run JavaScript and ignores `#hash`, so a
plain `…/index.html#tribe/roster/dres` only ever shows the generic `og-card.png`. To get a
**per-character** card, each character needs its own tiny HTML stub with baked-in
`og:` tags. `tools/make-og-stubs.py` writes them into `c/`.

1. **Refresh one faction's data** (only if its sheet has changed): open that faction's live roster,
   DevTools → Console, paste `tools/dump-roster.js`, save the clipboard output over
   `tools/roster-dump.json`.
2. **Generate the stubs with your real URL:**
   ```
   python3 tools/make-og-stubs.py --base-url "https://<you>.github.io/<repo>/"
   ```
3. Repeat steps 1–2 for each linked faction, then **deploy** `c/`. The generator preserves other
   factions' existing stubs and refuses a cross-faction slug collision instead of silently overwriting it.
   Share `…/c/dres.html` in Discord → rich card with Dres's name and blurb. Clicking redirects to the
   canonical faction/roster/character route.

The committed `c/` pages are stamped with this project's live URL. Re-run step 2 with
`--base-url` when deploying to another host so both click-through and preview metadata
point at that host.

### 5b. Channel notification on edits (webhook)

Post a one-line note to a Discord channel after every successful edit/upload.

1. Discord → **Server Settings → Integrations → Webhooks** → New Webhook → channel →
   **Copy Webhook URL**.
2. Apps Script → **Project Settings → Script Properties** → add
   `DISCORD_WEBHOOK_URL` = that URL. (Optional: also add `PUBLIC_URL` =
   `https://<you>.github.io/<repo>/` so the notice deep-links to the dossier.)
3. Done. Next upload posts e.g. *"📟 Roster update: someone updated the portrait for
   **Dres**."* A webhook failure can never block the actual sheet write.

---

### Notes

- **Auth reality:** the passphrase is light deterrence, not real security (anyone who
  has it can write). Fine for a trusted group; for stronger control add Google sign-in.
- **Data freshness:** Google caches a few minutes, so edits appear on next load /
  Refresh, not instantly.
- **Fonts:** if `fonts/` is missing entirely, the page falls back to system mono — it
  still works, just loses the in-game look.
- **Sheet ID is fixed in the source.** `CONFIG.sheetId` points at the tribe's
  **original sheet** — don't change it, and never write to that sheet by any means.
- **Regenerating the OG card:** if you change the title/tagline, run
  `python3 tools/make-og-card.py` from this folder to rebuild `og-card.png`.
- **Character share pages:** files under `c/` are stamped with the current live URL. Run the roster-dump
  and stub-generation steps again when deploying to a different host.
