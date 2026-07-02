#!/usr/bin/env python3
"""
make-og-stubs.py — generate per-character Open Graph "unfurl" pages for Discord.

WHY THIS EXISTS
  Discord's link preview crawler does NOT run JavaScript and ignores the URL #hash.
  So a pasted link like  https://site/#c=dres  only ever shows the generic site card.
  To get a rich PER-CHARACTER card (name + blurb + image), each character needs its
  own tiny HTML page with real <meta property="og:*"> tags baked in. This script
  writes one such stub per character into ./c/<slug>.html. Each stub instantly
  redirects a human on to the real app at  index.html#c=<slug>.
  Works on any static host (GitHub Pages, Netlify, …) — no server needed.

INPUT
  tools/roster-dump.json — the authoritative roster, exported straight from the app
  (so slugs/names match exactly). To refresh it after the sheet changes, open the
  app, open the browser console, and run the one-liner in tools/dump-roster.js,
  then save the output over roster-dump.json.

USAGE
  python3 tools/make-og-stubs.py --base-url "https://you.github.io/yuma/"
  # omit --base-url for relative links (click-through works, but Discord needs the
  # absolute --base-url form to show per-character cards).

OPTIONS
  --base-url  Absolute deployed URL ending in '/'. Needed for real Discord cards.
  --dump      Path to the roster JSON   (default: tools/roster-dump.json)
  --out       Output folder for stubs   (default: c)
  --image     Default OG image, relative to base or absolute (default: og-card.png)
"""
import argparse, html, json, os, re, sys

def relabel(s):
    # display rebrand, mirroring app.js relabelTribe(): "…Yuma Tribe…" → "…Tribe…".
    # Applied here too so a dump taken before the rebrand still yields clean cards.
    return re.sub(r"\bYuma Tribe\b", "Tribe", s or "")

def clip(s, n):
    s = re.sub(r"\s+", " ", (s or "").strip())
    return s if len(s) <= n else s[:n - 1].rstrip() + "…"

def describe(c):
    bits = []
    if c.get("honorific"): bits.append('“%s”' % c["honorific"].strip())
    if c.get("role"):      bits.append(c["role"].strip())
    line = " · ".join(bits)
    app = (c.get("appearance") or "").strip()
    if app:
        line = (line + " — " + app) if line else app
    return clip(line, 190) or "A member of the Tribe."

STUB = """<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{name} // The Tribe Database</title>
<meta name="description" content="{desc}">
<meta property="og:type" content="profile">
<meta property="og:site_name" content="The Tribe Database">
<meta property="og:title" content="{name} — The Tribe Database">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{image}">
<meta property="og:url" content="{ogurl}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0a1a0f">
<link rel="canonical" href="{appurl}">
<meta http-equiv="refresh" content="0; url={appurl}">
<script>location.replace({appurl_js});</script>
<style>body{{background:#04060a;color:#3cff7a;font-family:ui-monospace,monospace;padding:2rem;line-height:1.6}}a{{color:#b6ffce}}</style>
</head><body>
<p>&gt; OPENING DOSSIER: <strong>{name}</strong>…</p>
<p>If you are not redirected, <a href="{appurl}">open the roster</a>.</p>
</body></html>
"""

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-url", default="")
    ap.add_argument("--dump", default=os.path.join("tools", "roster-dump.json"))
    ap.add_argument("--out", default="c")
    ap.add_argument("--image", default="og-card.png")
    a = ap.parse_args()

    base = a.base_url
    if base and not base.endswith("/"):
        base += "/"

    with open(a.dump, encoding="utf-8") as f:
        chars = json.load(f)

    os.makedirs(a.out, exist_ok=True)
    n = 0
    for c in chars:
        slug = c["slug"]
        name = relabel(c["name"])
        desc = relabel(c.get("desc") or describe(c))   # prefer the app-built description
        # human redirect target — relative so it works on any host
        appurl = (base + "index.html#c=" + slug) if base else ("../index.html#c=" + slug)
        ogurl  = (base + a.out + "/" + slug + ".html") if base else (slug + ".html")
        # per-character image if the sheet had a real http(s) URL, else the default card
        img = c.get("img") or ""
        if not re.match(r"^https?:", img):
            img = (base + a.image) if base else a.image
        page = STUB.format(
            name=html.escape(name),
            desc=html.escape(desc),
            image=html.escape(img),
            ogurl=html.escape(ogurl),
            appurl=html.escape(appurl),
            appurl_js=json.dumps(appurl),
        )
        with open(os.path.join(a.out, slug + ".html"), "w", encoding="utf-8") as f:
            f.write(page)
        n += 1

    print("wrote %d stub(s) to %s/  (base-url=%r)" % (n, a.out, base or "(relative)"))
    if not base:
        print("note: pass --base-url for absolute og:url/og:image so Discord shows "
              "per-character cards; relative stubs still give working click-through.")

if __name__ == "__main__":
    sys.exit(main())
