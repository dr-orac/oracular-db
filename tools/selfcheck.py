#!/usr/bin/env python3
"""
selfcheck.py — integrity linter for the Yuma Tribe Roster (a no-build vanilla app).

Without a compiler or test runner, this is the safety net that catches the kinds of rot
that creep in as the project evolves:

  • an element id is referenced in app.js ($("#x")) but no element with that id exists
  • a CSS var(--token) is used but never defined
  • an @font-face / url("fonts/..") / media file is referenced but missing on disk
  • app.js looks truncated or has unbalanced braces/brackets/parens/backticks
  • index.html stops loading styles.css or app.js

Run it before every deploy or commit:   python3 tools/selfcheck.py
Exit code 0 = clean, 1 = errors found.  Warnings never fail the build.

Stdlib only. Safe to run anywhere python3 exists.
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def p(*a): return os.path.join(ROOT, *a)
def read(rel):
    with open(p(rel), encoding="utf-8") as f: return f.read()

errors, warnings, infos = [], [], []
def err(m): errors.append(m)
def warn(m): warnings.append(m)
def info(m): infos.append(m)

# ---------------------------------------------------------------- load files
REQUIRED = ["index.html", "styles.css", "app.js"]
for rel in REQUIRED:
    if not os.path.exists(p(rel)):
        err(f"required file missing: {rel}")
if errors:
    print("\n".join("✗ "+e for e in errors)); sys.exit(1)

html = read("index.html")
css  = read("styles.css")
js   = read("app.js")

# ---------------------------------------------------------------- 1. wiring
if "styles.css" not in html: err("index.html does not reference styles.css")
if "app.js"     not in html: err("index.html does not reference app.js")

# ---------------------------------------------------------------- 2. element ids
# All ids that actually exist somewhere (static in HTML, or emitted in JS templates).
defined_ids = set(re.findall(r'\bid\s*=\s*["\']([A-Za-z][\w-]*)["\']', html))
defined_ids |= set(re.findall(r'\bid\s*=\s*["\']([A-Za-z][\w-]*)["\']', js))   # template-string ids
# Static id references in JS we can verify (ignore dynamic "row-"+i style refs).
ref_ids = set()
ref_ids |= set(re.findall(r'getElementById\(\s*["\']([\w-]+)["\']', js))
ref_ids |= set(re.findall(r'\$\(\s*["\']#([\w-]+)["\']\s*\)', js))
# querySelector("#foo ...") — take the leading #id token only
for sel in re.findall(r'querySelector(?:All)?\(\s*["\']([^"\']+)["\']', js):
    m = re.match(r'#([\w-]+)', sel.strip())
    if m: ref_ids.add(m.group(1))
missing_ids = sorted(i for i in ref_ids if i not in defined_ids)
for i in missing_ids:
    err(f'element id "#{i}" is referenced in app.js but never defined in index.html or a JS template')

# ---------------------------------------------------------------- 3. css custom properties
# Definitions: anything declared as `--name:` in CSS, plus any --name touched from JS
# (setProperty / inline style strings set custom props at runtime).
defined_vars = set(re.findall(r'(--[\w-]+)\s*:', css))
defined_vars |= set(re.findall(r'setProperty\(\s*["\'](--[\w-]+)["\']', js))
defined_vars |= set(re.findall(r'(--[\w-]+)\s*:', js))     # inline style="...--x:.." in templates
used_vars = set(re.findall(r'var\(\s*(--[\w-]+)', css))
used_vars |= set(re.findall(r'var\(\s*(--[\w-]+)', js))
# var(--x, fallback) is fine even if --x is undefined (the fallback covers it)
has_fallback = set(re.findall(r'var\(\s*(--[\w-]+)\s*,', css)) | set(re.findall(r'var\(\s*(--[\w-]+)\s*,', js))
undefined_vars = sorted(v for v in used_vars if v not in defined_vars and v not in has_fallback)
for v in undefined_vars:
    err(f'CSS variable {v} is used but never defined (and has no fallback)')

# ---------------------------------------------------------------- 4. font files
for fam, url in re.findall(r'@font-face\{[^}]*?font-family:\s*"([^"]+)"[^}]*?url\("([^"]+)"', css, re.S):
    if not os.path.exists(p(url)):
        err(f'@font-face "{fam}" references missing file: {url}')
# every fonts/ url() in CSS resolves
for url in re.findall(r'url\(["\']?(fonts/[^"\')]+)["\']?\)', css):
    if not os.path.exists(p(url)):
        err(f'CSS url() references missing font: {url}')

# ---------------------------------------------------------------- 5. media files
# the MEDIA map in app.js: "slug":{"front":"media/..png", ...}
for path in re.findall(r'["\'](media/[^"\']+\.(?:png|jpg|jpeg|webp|gif|svg))["\']', js):
    if not os.path.exists(p(path)):
        err(f'app.js MEDIA references missing file: {path}')
for asset in ["favicon.svg"]:
    if asset in html and not os.path.exists(p(asset)):
        warn(f'index.html references {asset} but it is missing')

# ---------------------------------------------------------------- 6. JS structural sanity
import shutil, subprocess
def strip_js(src):
    """Remove comments, strings, template literals AND regex literals so the remainder can
    be brace-balanced. Regex-vs-division is disambiguated by the previous significant char
    (a `/` after a value → division; after an operator/keyword/open-bracket → regex)."""
    out = []; i = 0; n = len(src)
    def prev_sig():
        for ch in reversed(out):
            if not ch.isspace(): return ch
        return ""
    while i < n:
        c = src[i]; nxt = src[i+1] if i+1 < n else ""
        if c == "/" and nxt == "/":
            j = src.find("\n", i);  i = n if j == -1 else j;  continue
        if c == "/" and nxt == "*":
            j = src.find("*/", i+2); i = n if j == -1 else j+2; continue
        if c == "/":
            ps = prev_sig()
            is_regex = ps == "" or ps in "=(,[{;:!&|?+-*%~^<>"   # not after a value → regex literal
            if is_regex:
                i += 1
                while i < n:
                    if src[i] == "\\": i += 2; continue
                    if src[i] == "[":                      # char class: ] inside is literal
                        while i < n and src[i] != "]":
                            if src[i] == "\\": i += 1
                            i += 1
                    if i < n and src[i] == "/": i += 1; break
                    i += 1
                out.append(" "); continue
            out.append(c); i += 1; continue
        if c in "\"'`":
            q = c; i += 1
            while i < n:
                if src[i] == "\\": i += 2; continue
                if src[i] == q: i += 1; break
                if q == "`" and src[i] == "$" and i+1 < n and src[i+1] == "{":
                    depth = 1; i += 2
                    while i < n and depth:
                        if src[i] == "{": depth += 1
                        elif src[i] == "}": depth -= 1
                        out.append(src[i] if src[i] in "{}()[]" else " ")
                        i += 1
                    continue
                i += 1
            out.append(" "); continue
        out.append(c); i += 1
    return "".join(out)

node = shutil.which("node")
if node:
    # authoritative: a real parser
    r = subprocess.run([node, "--check", p("app.js")], capture_output=True, text=True)
    if r.returncode != 0:
        err("node --check failed on app.js:\n   " + (r.stderr.strip().splitlines() or ["(no detail)"])[0])
else:
    # heuristic fallback (no node here) — imbalance is a warning, not a hard fail
    pairs = {")": "(", "]": "[", "}": "{"}; opens = set(pairs.values()); stack = []; ok = True
    for ch in strip_js(js):
        if ch in opens: stack.append(ch)
        elif ch in pairs:
            if not stack or stack[-1] != pairs[ch]: ok = False; break
            stack.pop()
    if not ok or stack:
        warn(f"app.js brackets look unbalanced via heuristic (leftover depth {len(stack)}); "
             "install node to confirm with `node --check`")
if not js.rstrip().endswith(("}", ";", ")")):
    warn("app.js does not end with } ; or ) — possible truncation")

# ---------------------------------------------------------------- 7. soft: token drift
# component hex colors that aren't part of the token palette (encourage var(--..) use)
root_block = re.search(r':root\{(.*?)\}', css, re.S)
token_hexes = set(re.findall(r'#[0-9a-fA-F]{3,8}', root_block.group(1))) if root_block else set()
all_hexes = re.findall(r'#[0-9a-fA-F]{3,8}', css)
stray = sorted({h for h in all_hexes if h not in token_hexes})
# many are legit (shadows, masks #000). only flag opaque-ish greens that look like dupes.
green_dupes = [h for h in stray if re.match(r'#[0-9a-fA-F]', h) and h.lower() not in ("#000","#000000","#fff","#ffffff")]
if len(green_dupes) > 12:
    info(f"{len(green_dupes)} hardcoded hex colors outside :root — consider tokenizing recurring ones")

# ---------------------------------------------------------------- report
print("── Yuma Roster self-check ──")
print(f"   ids: {len(ref_ids)} refs / {len(defined_ids)} defined   "
      f"css vars: {len(used_vars)} used / {len(defined_vars)} defined")
for m in infos:     print("·  " + m)
for m in warnings:  print("⚠  " + m)
for m in errors:    print("✗  " + m)
if errors:
    print(f"\nFAIL — {len(errors)} error(s), {len(warnings)} warning(s)"); sys.exit(1)
print(f"\nOK — clean ({len(warnings)} warning(s))"); sys.exit(0)
