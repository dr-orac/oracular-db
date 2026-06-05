# Go-Live Checklist — Yuma Tribe Roster

Steps 1–2 make the roster **public and viewable**. Step 3 turns on **write-back** so
uploads/logs/edits persist for everyone (not just one browser). Steps 4–5 are optional
Discord polish.

## What needs to ship

From this folder (`Yuma Tribe Roster/`):

```
index.html      styles.css      app.js
favicon.svg     (tab icon)
fonts/          (self-hosted woff2/ttf — keep the whole folder)
media/          (code-defined character portraits referenced by app.js — required)
og-card.png     (Discord/social link-preview card)
c/              (per-character Discord embed stubs — see step 5a)
```

`apps-script.gs` is **not** uploaded — it's pasted into Google Apps Script (step 3).
`tools/`, `docs/`, and `README.md` are dev/reference only; they don't need to ship
(harmless if they do).

---

## 1 · Make the sheet readable  (required)

The viewer reads the working copy sheet live. Open it → **Share** →
**General access: Anyone with the link → Viewer** → Done. Read-only; the page never
edits it directly — writes go through the Apps Script in step 3.

> **Check** — visiting
> `https://docs.google.com/spreadsheets/d/1649xQIHyrZtJWbVdTcg_ll7yS2ee_V9jGPtHLdgbyDQ/gviz/tq?tqx=out:csv`
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

## 3 · Turn on write-back  (recommended)

Without this, every visitor sees only their own uploads. With it, the working-copy
sheet becomes the shared source of truth.

1. Open the working-copy sheet → **Extensions → Apps Script**.
2. Delete the sample, paste in **`apps-script.gs`** (the whole file), Save.
3. **Deploy → New deployment → Web app:**
   - **Execute as:** *Me*
   - **Who has access:** *Anyone*  ← critical; without this you'll see a CORS error.
   - Deploy, authorise when Google warns "unverified" (it's your own script).
4. Copy the **/exec URL** Google shows.
5. **Set the edit passphrase** — Apps Script → **Project Settings → Script Properties** →
   add `WRITE_PASSPHRASE` = a word your group shares. (Keeps the secret out of the
   public page; viewers are prompted on first write.)
6. Paste the **/exec URL** into **`CONFIG.webAppUrl`** near the top of `app.js`,
   re-deploy `app.js`.

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
plain `…/index.html#c=dres` only ever shows the generic `og-card.png`. To get a
**per-character** card, each character needs its own tiny HTML stub with baked-in
`og:` tags. `tools/make-og-stubs.py` writes them into `c/`.

1. **Refresh the data** (only if the sheet has changed): open the live page,
   DevTools → Console, paste `tools/dump-roster.js`, save the clipboard output over
   `tools/roster-dump.json`.
2. **Generate the stubs with your real URL:**
   ```
   python3 tools/make-og-stubs.py --base-url "https://<you>.github.io/<repo>/"
   ```
3. **Deploy** `c/`. Share `…/c/dres.html` in Discord → rich card with Dres's name and
   blurb. Clicking redirects to `#c=dres` so it lands on his dossier.

The `c/` already in the repo uses **relative** links — click-through works on any host
already, but you must re-run step 2 with `--base-url` for Discord cards to unfurl
per-character.

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
- **Sheet ID is fixed in the source.** `CONFIG.sheetId` already points at the working
  copy — don't change it. (The original source sheet is never touched.)
- **Regenerating the OG card:** if you change the title/tagline, run
  `python3 tools/make-og-card.py` from this folder to rebuild `og-card.png`.
