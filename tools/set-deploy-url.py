#!/usr/bin/env python3
"""
set-deploy-url.py — stamp the deployed site URL into index.html's social-card meta tags.

Open Graph / Twitter card images must be ABSOLUTE urls (Discord/Twitter crawlers read the
static HTML and can't resolve a relative path). The app ships with a relative og:image so it
works locally; run this once at deploy time with your live base URL:

    python3 tools/set-deploy-url.py https://<username>.github.io/<repo>/

It sets og:image + twitter:image to <base>og-card.png and og:url to <base> (inserting og:url
if absent). Idempotent — safe to re-run if the URL changes. Everything else (relative
styles.css/app.js/fonts) already works under a subpath, so this is the only deploy edit.
"""
import sys, re, os

if len(sys.argv) != 2:
    sys.exit("usage: python3 tools/set-deploy-url.py https://<username>.github.io/<repo>/")
base = sys.argv[1].strip()
if not base.startswith("http"):
    sys.exit("base URL must start with http(s)://")
if not base.endswith("/"):
    base += "/"

INDEX = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "index.html")
html = open(INDEX, encoding="utf-8").read()
img = base + "og-card.png"

def set_meta(html, attr, key, value):
    """Set content="" on the <meta {attr}="{key}"> tag; return (html, changed?)."""
    pat = re.compile(r'(<meta\s+' + attr + r'="' + re.escape(key) + r'"\s+content=")[^"]*(")')
    if pat.search(html):
        return pat.sub(lambda m: m.group(1) + value + m.group(2), html), True
    return html, False

html, _ = set_meta(html, "property", "og:image", img)
html, _ = set_meta(html, "name", "twitter:image", img)
html, had_url = set_meta(html, "property", "og:url", base)
if not had_url:                       # insert og:url right after og:type
    html = re.sub(r'(<meta property="og:type"[^>]*>)',
                  r'\1\n<meta property="og:url" content="' + base + '" />', html, count=1)

open(INDEX, "w", encoding="utf-8").write(html)
print(f"✓ stamped deploy URL into index.html:")
print(f"    og:url        = {base}")
print(f"    og:image      = {img}")
print(f"    twitter:image = {img}")
print("Commit + push, and the Discord/social card will use absolute URLs.")
