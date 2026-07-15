#!/usr/bin/env python3
"""
selfcheck.py — integrity linter for the Misfits Database (a no-build vanilla app).

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
import hashlib, json, os, re, sys
from urllib.parse import unquote

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
for target in re.findall(r'\b(?:src|href)\s*=\s*["\']([^"\']+)["\']', html):
    if target.startswith(("#", "//", "/", "data:")) or re.match(r"^[a-z][a-z0-9+.-]*:", target, re.I):
        continue
    local_target = target.split("#", 1)[0].split("?", 1)[0]
    if local_target and not os.path.exists(p(unquote(local_target))):
        err(f'index.html references missing local asset: {local_target}')

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

# orphan font files: shipped in fonts/ but referenced by no @font-face. Dead weight AND a
# licensing risk (an unused personal-use font is still redistributed if it's in the repo).
if os.path.isdir(p("fonts")):
    referenced = set(re.findall(r'url\(["\']?fonts/([^"\')]+)["\']?\)', css))
    for fn in sorted(os.listdir(p("fonts"))):
        if fn.lower().endswith((".woff2", ".ttf", ".woff", ".otf")) and fn not in referenced:
            warn(f'orphan font file fonts/{fn} — no @font-face references it (dead weight / license risk)')
        if fn.lower().endswith((".zip", ".tar", ".gz")):
            warn(f'font source archive fonts/{fn} is deployed but unused; keep only the extracted runtime files')

# Vendored runtime code must carry its licence and an immutable inventory. The inventory owns the expected
# hashes so an intentional upgrade updates one provenance record rather than duplicating versions here.
vendor_root = p("vendor")
if os.path.isdir(vendor_root):
    for package in sorted(os.listdir(vendor_root)):
        package_dir = os.path.join(vendor_root, package)
        if not os.path.isdir(package_dir):
            continue
        inventory_path = os.path.join(package_dir, "VENDORED.txt")
        licence_path = os.path.join(package_dir, "LICENSE")
        if not os.path.exists(inventory_path):
            err(f"vendored package vendor/{package} has no VENDORED.txt provenance record")
            continue
        if not os.path.exists(licence_path):
            err(f"vendored package vendor/{package} has no LICENSE file")
        with open(inventory_path, encoding="utf-8") as f:
            inventory = f.read()
        recorded = re.findall(r"^\s+(\S+)\s+sha256\s+([0-9a-f]{64})\s*$", inventory, flags=re.M)
        if not recorded:
            err(f"vendored package vendor/{package} records no file hashes")
        for filename, expected in recorded:
            asset_path = os.path.join(package_dir, filename)
            if not os.path.isfile(asset_path):
                err(f"vendor/{package}/VENDORED.txt references missing file {filename}")
                continue
            with open(asset_path, "rb") as f:
                actual = hashlib.sha256(f.read()).hexdigest()
            if actual != expected:
                err(f"vendor/{package}/{filename} differs from its recorded SHA-256; restore it or record a reviewed upgrade")

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
    for script in ["app.js", "map-terrain.js"]:
        if not os.path.exists(p(script)):
            continue
        r = subprocess.run([node, "--check", p(script)], capture_output=True, text=True)
        if r.returncode != 0:
            err(f"node --check failed on {script}:\n   " + (r.stderr.strip().splitlines() or ["(no detail)"])[0])
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
# Precise check: flag a hex used OUTSIDE :root that is an exact duplicate of a theme token
# (--green / -bright / -dim / -faint / --amber / the bg ladder). Those should be var(--..)
# so a theme change propagates. Legit one-off colors (shadows, the metal-frame palette) are
# NOT flagged — keeping this signal actionable rather than noisy.
root_block = re.search(r':root\{(.*?)\}', css, re.S)
token_hex = {}
if root_block:
    for name, hexv in re.findall(r'(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})', root_block.group(1)):
        token_hex[hexv.lower()] = name
# strip the :root block, then look for token-valued hexes in the rest of the CSS
body_css = css.replace(root_block.group(0), "") if root_block else css
for hexv in sorted(set(re.findall(r'#[0-9a-fA-F]{3,8}', body_css))):
    if hexv.lower() in token_hex:
        warn(f'hardcoded {hexv} duplicates token {token_hex[hexv.lower()]} — use var({token_hex[hexv.lower()]}) so theme changes propagate')

# ---------------------------------------------------------------- 8b. dead CSS classes
# class selectors defined in CSS but referenced nowhere in HTML/JS (dead style → rot).
# require a selector boundary before the dot so url("x.ttf")/format("woff2") aren't matched.
FILE_EXT = {"ttf","woff","woff2","eot","svg","png","jpg","jpeg","gif","webp","ico","css","js","json","html"}
css_classes = set(re.findall(r'(?:^|[\s,>+~({])\.([a-zA-Z][\w-]+)', css, re.M))
runtime_js = js + (read("map-terrain.js") if os.path.exists(p("map-terrain.js")) else "")
hay = html + runtime_js
dead_classes = []
for c in sorted(css_classes):
    if c in FILE_EXT or c.startswith("maplibregl-"): continue
    if re.search(r'(?<![\w-])' + re.escape(c) + r'(?![\w-])', hay): continue   # token appears in HTML/JS
    dead_classes.append(c)
for c in dead_classes:
    warn(f'CSS class ".{c}" is defined but never referenced in index.html or app.js (dead style?)')

# ---------------------------------------------------------------- 8c. doc-reader sanitiser boundary
# docClean() injects fetched HTML, so its DOC_OK whitelist is a security boundary: it must never
# admit script-bearing or framing tags. Catch a regression that loosens it (XSS hole).
m = re.search(r'\bDOC_OK\s*=\s*\{([^}]*)\}', js)
if m:
    ok_tags = set(re.findall(r'(\w+)\s*:', m.group(1)))
    danger = ok_tags & {"script","style","iframe","object","embed","form","input","button",
                        "link","meta","base","svg","math","template","portal"}
    if danger:
        err(f"doc sanitiser DOC_OK allows unsafe tag(s): {', '.join(sorted(danger))} — XSS / injection risk")
elif "docClean" in js:
    warn("DOC_OK whitelist not found but docClean() exists — verify the doc sanitiser is intact")

# ---------------------------------------------------------------- 8d. css comment balance
# selfcheck.py is not a CSS parser, so a comment whose body contains a stray "*/" (e.g. the
# text "--panel-*/--rivet-*") silently closes the comment early, turning the rest of the
# intended comment into live (garbage) CSS and breaking every rule after it. Detect this by
# stripping real comments with the SAME semantics a CSS parser uses — re.sub with a non-greedy
# `.*?` matches each "/*" to its FIRST following "*/", exactly like a parser would — then
# checking what's left over: a leftover "*/" is a stray premature closer; a leftover "/*" is
# an unterminated comment. Offsets are tracked through the substitution so line numbers in the
# error point at the ORIGINAL file, not the stripped text.
def check_css_comment_balance(css):
    stripped_parts, orig_offsets = [], []   # parallel: stripped-text chunk -> its start offset in css
    pos = 0
    for m in re.finditer(r'/\*.*?\*/', css, flags=re.DOTALL):
        stripped_parts.append(css[pos:m.start()]); orig_offsets.append(pos)
        pos = m.end()
    stripped_parts.append(css[pos:]); orig_offsets.append(pos)

    def to_original_offset(stripped_pos):
        """Map an offset in the concatenated stripped text back to an offset in css."""
        running = 0
        for chunk, orig_off in zip(stripped_parts, orig_offsets):
            if stripped_pos < running + len(chunk):
                return orig_off + (stripped_pos - running)
            running += len(chunk)
        return orig_offsets[-1] + len(stripped_parts[-1])

    stripped = "".join(stripped_parts)
    for m in re.finditer(r'\*/', stripped):
        orig_pos = to_original_offset(m.start())
        line = css.count('\n', 0, orig_pos) + 1
        err(f'stray "*/" at styles.css:{line} — a comment body probably contains "*/" '
            f'(e.g. "--panel-*/"), which closes the comment early')
    for m in re.finditer(r'/\*', stripped):
        orig_pos = to_original_offset(m.start())
        line = css.count('\n', 0, orig_pos) + 1
        err(f'unterminated "/*" comment starting at styles.css:{line} — a "/*" is never closed')

check_css_comment_balance(css)

# ---------------------------------------------------------------- 8e. documentation links
# Documentation is part of the handoff contract. Validate repository-local Markdown links so a rename or
# move cannot silently strand the next contributor. External URLs and same-page anchors are out of scope.
DOC_REQUIRED = [
    "README.md", "MAINTENANCE.md", "CONTRIBUTING.md", "STYLE-GUIDE.md", "DEPLOY.md", "CREDITS.md",
    "TASKS.md",
    "docs/README.md", "docs/HANDOFF-NEXT.md",
]
for rel in DOC_REQUIRED:
    if not os.path.exists(p(rel)):
        err(f"canonical documentation missing: {rel}")

markdown_files = []
for base, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in {".git", "added files by user"}]
    for filename in files:
        if filename.endswith(".md"):
            markdown_files.append(os.path.join(base, filename))

def check_markdown_link(source_path, raw_target):
    target = raw_target.strip()
    if target.startswith("<") and ">" in target:
        target = target[1:target.index(">")]
    else:
        # Optional Markdown titles follow the destination after whitespace.
        target = target.split()[0] if target else ""
    if not target or target.startswith(("#", "/", "//")) or re.match(r"^[a-z][a-z0-9+.-]*:", target, re.I):
        return
    target = unquote(target.split("#", 1)[0].split("?", 1)[0])
    if not target:
        return
    resolved = os.path.normpath(os.path.join(os.path.dirname(source_path), target))
    if not os.path.exists(resolved):
        rel_source = os.path.relpath(source_path, ROOT)
        err(f'{rel_source} links to missing local path "{target}"')

for source_path in sorted(markdown_files):
    with open(source_path, encoding="utf-8") as f:
        markdown = f.read()
    markdown = re.sub(r"```.*?```", "", markdown, flags=re.S)
    for raw_target in re.findall(r"!?\[[^\]]*\]\(([^)]+)\)", markdown):
        check_markdown_link(source_path, raw_target)
    for raw_target in re.findall(r"^\s*\[[^\]]+\]:\s*(\S+)", markdown, flags=re.M):
        check_markdown_link(source_path, raw_target)
    filename = os.path.basename(source_path)
    if re.fullmatch(r"HANDOFF-\d{4}-\d{2}-\d{2}\.md", filename) and not markdown.startswith(
        "> **Historical snapshot.**"
    ):
        err(f"docs/{filename} must identify itself as a historical snapshot and point to HANDOFF-NEXT.md")

# Generated social-card pages are part of the public routing surface. Require a canonical faction route;
# the legacy factionless form silently opened the remembered/default faction and broke cross-faction links.
faction_order = re.search(r"const FACTION_ORDER\s*=\s*\[([^\]]+)\]", js)
known_factions = set(re.findall(r'"([a-z0-9-]+)"', faction_order.group(1))) if faction_order else set()
stub_dir = p("c")
if os.path.isdir(stub_dir):
    for filename in sorted(os.listdir(stub_dir)):
        if not filename.endswith(".html"):
            continue
        slug = filename[:-5]
        with open(os.path.join(stub_dir, filename), encoding="utf-8") as f:
            stub = f.read()
        if "#c=" in stub:
            err(f"c/{filename} still uses a factionless legacy character route")
        routes = set(re.findall(r"#([a-z0-9-]+)/roster/([a-z0-9-]+)", stub))
        if len(routes) != 1:
            err(f"c/{filename} must contain one consistent canonical faction/roster route")
            continue
        faction, target = next(iter(routes))
        if faction not in known_factions:
            err(f'c/{filename} routes to unknown faction "{faction}"')
        if target != slug:
            err(f'c/{filename} routes to character "{target}" instead of its filename slug')

# ---------------------------------------------------------------- 9. world/map data integrity
# The map dataset is edited independently from the rendering code. Validate its internal graph here so a
# renamed or omitted location cannot silently break routes, faction zones, or event markers.
world_path = p("data", "world.json")
if os.path.exists(world_path):
    try:
        with open(world_path, encoding="utf-8") as f:
            world = json.load(f)
    except (OSError, json.JSONDecodeError) as exc:
        err(f"data/world.json cannot be read as JSON: {exc}")
        world = None

    if world is not None:
        collections = ("terrain_types", "regions", "sources", "locations", "connections", "faction_zones", "event_hooks")
        for key in collections:
            if not isinstance(world.get(key), list):
                err(f'data/world.json field "{key}" must be an array')

        def collect_ids(key):
            rows = world.get(key, []) if isinstance(world.get(key), list) else []
            found = set()
            for index, row in enumerate(rows):
                if not isinstance(row, dict):
                    err(f"data/world.json {key}[{index}] must be an object")
                    continue
                item_id = row.get("id")
                if not isinstance(item_id, str) or not item_id:
                    err(f"data/world.json {key}[{index}] has no non-empty id")
                elif item_id in found:
                    err(f'data/world.json has duplicate {key} id "{item_id}"')
                else:
                    found.add(item_id)
            return found

        terrain_ids = collect_ids("terrain_types")
        region_ids = collect_ids("regions")
        source_ids = collect_ids("sources")
        location_ids = collect_ids("locations")
        collect_ids("faction_zones")
        collect_ids("event_hooks")

        confidence_values = {"low", "medium", "high"}
        placement_bases = {"real_world_identity", "game_map_inference", "regional_inference", "project_authored", "unknown"}
        placement_statuses = {"reviewed", "provisional", "withheld"}
        source_kinds = {"official_game_material", "developer_statement", "reference_work", "community_reference"}
        evidence_supports = {"identity", "placement", "relative_position", "contradiction"}
        sources = world.get("sources", []) if isinstance(world.get("sources"), list) else []
        source_urls = set()
        for source in sources:
            if not isinstance(source, dict):
                continue
            source_id = source.get("id", "(missing id)")
            if not isinstance(source.get("title"), str) or not source.get("title"):
                err(f'data/world.json source "{source_id}" has no title')
            source_url = source.get("url")
            if not isinstance(source_url, str) or not source_url.startswith("https://"):
                err(f'data/world.json source "{source_id}" must have an https URL')
            elif source_url in source_urls:
                err(f'data/world.json source "{source_id}" duplicates URL "{source_url}"')
            else:
                source_urls.add(source_url)
            if source.get("kind") not in source_kinds:
                err(f'data/world.json source "{source_id}" has invalid kind "{source.get("kind")}"')

        locations = world.get("locations", []) if isinstance(world.get("locations"), list) else []
        for loc in locations:
            if not isinstance(loc, dict):
                continue
            loc_id = loc.get("id", "(missing id)")
            placement = loc.get("placement")
            coords = loc.get("coordinates")
            if not isinstance(coords, dict):
                if not isinstance(placement, dict) or placement.get("status") != "withheld":
                    err(f'data/world.json location "{loc_id}" may omit coordinates only when placement is withheld')
            else:
                lat, lon = coords.get("latitude"), coords.get("longitude")
                if not isinstance(lat, (int, float)) or not -90 <= lat <= 90:
                    err(f'data/world.json location "{loc_id}" has invalid latitude')
                if not isinstance(lon, (int, float)) or not -180 <= lon <= 180:
                    err(f'data/world.json location "{loc_id}" has invalid longitude')
            if loc.get("terrain_type_id") not in terrain_ids:
                err(f'data/world.json location "{loc_id}" references unknown terrain_type_id "{loc.get("terrain_type_id")}"')
            if "source_confidence" in loc and loc.get("source_confidence") not in confidence_values:
                err(f'data/world.json location "{loc_id}" has invalid source_confidence "{loc.get("source_confidence")}"')
            if placement is not None:
                if not isinstance(placement, dict):
                    err(f'data/world.json location "{loc_id}" placement must be an object')
                else:
                    if placement.get("basis") not in placement_bases:
                        err(f'data/world.json location "{loc_id}" has invalid placement basis "{placement.get("basis")}"')
                    if placement.get("status") not in placement_statuses:
                        err(f'data/world.json location "{loc_id}" has invalid placement status "{placement.get("status")}"')
                    precision = placement.get("precision_km")
                    if not isinstance(precision, (int, float)) or precision < 0:
                        err(f'data/world.json location "{loc_id}" has invalid placement precision_km')
            evidence = loc.get("evidence")
            if evidence is not None and (not isinstance(evidence, list) or not all(isinstance(item, dict) for item in evidence)):
                err(f'data/world.json location "{loc_id}" evidence must be an array of objects')
            elif isinstance(evidence, list):
                for index, item in enumerate(evidence):
                    if item.get("source_id") not in source_ids:
                        err(f'data/world.json location "{loc_id}" evidence[{index}] references unknown source "{item.get("source_id")}"')
                    if item.get("supports") not in evidence_supports:
                        err(f'data/world.json location "{loc_id}" evidence[{index}] has invalid supports "{item.get("supports")}"')
                    for field in ("locator", "note"):
                        if not isinstance(item.get(field), str) or not item.get(field):
                            err(f'data/world.json location "{loc_id}" evidence[{index}] has no {field}')

        connections = world.get("connections", []) if isinstance(world.get("connections"), list) else []
        for index, connection in enumerate(connections):
            if not isinstance(connection, dict):
                continue
            for field in ("from_id", "to_id"):
                ref = connection.get(field)
                if ref not in location_ids:
                    err(f'data/world.json connections[{index}].{field} references unknown location "{ref}"')
            for terrain_id in connection.get("terrain_profile", []):
                if terrain_id not in terrain_ids:
                    err(f'data/world.json connections[{index}] references unknown terrain "{terrain_id}"')

        zones = world.get("faction_zones", []) if isinstance(world.get("faction_zones"), list) else []
        for zone in zones:
            if not isinstance(zone, dict):
                continue
            zone_id = zone.get("id", "(missing id)")
            if zone.get("region_id") not in region_ids:
                err(f'data/world.json faction zone "{zone_id}" references unknown region "{zone.get("region_id")}"')
            for location_id in zone.get("controlled_location_ids", []):
                if location_id not in location_ids:
                    err(f'data/world.json faction zone "{zone_id}" references unknown location "{location_id}"')

        events = world.get("event_hooks", []) if isinstance(world.get("event_hooks"), list) else []
        for event in events:
            if not isinstance(event, dict):
                continue
            event_id = event.get("id", "(missing id)")
            if event.get("region_id") not in region_ids:
                err(f'data/world.json event "{event_id}" references unknown region "{event.get("region_id")}"')
            for location_id in event.get("primary_location_ids", []):
                if location_id not in location_ids:
                    err(f'data/world.json event "{event_id}" references unknown location "{location_id}"')

        status = world.get("data_status")
        if status == "provisional":
            info("data/world.json is internally valid but provisional; map placement review is still required")
        elif status == "display_ready":
            for loc in locations:
                if not isinstance(loc, dict):
                    continue
                loc_id = loc.get("id", "(missing id)")
                placement = loc.get("placement")
                if not isinstance(loc.get("canon_scope"), str) or not loc.get("canon_scope"):
                    err(f'display-ready location "{loc_id}" has no canon_scope')
                if not isinstance(placement, dict) or placement.get("status") != "reviewed":
                    err(f'display-ready location "{loc_id}" must have reviewed placement')
                elif placement.get("basis") == "unknown":
                    err(f'display-ready location "{loc_id}" cannot have unknown placement basis')
                if not isinstance(loc.get("evidence"), list) or not loc.get("evidence"):
                    err(f'display-ready location "{loc_id}" must include evidence')
        else:
            warn('data/world.json data_status should be "provisional" or "display_ready"')

        # The current US atlas still renders a legacy in-code marker list. Keep an explicit migration
        # manifest in lockstep with it until every marker is backed by a reviewed world record.
        migration_path = p("data", "atlas-migration.json")
        try:
            with open(migration_path, encoding="utf-8") as f:
                migration = json.load(f)
        except (OSError, json.JSONDecodeError) as exc:
            err(f"data/atlas-migration.json cannot be read as JSON: {exc}")
            migration = None

        if migration is not None:
            markers = migration.get("markers")
            if not isinstance(markers, list):
                err('data/atlas-migration.json field "markers" must be an array')
                markers = []

            map_block = re.search(r'const MAP_LOCATIONS\s*=\s*\[([\s\S]*?)\n\];', js)
            legacy_rows = [] if not map_block else re.findall(
                r'\{\s*id:"([^"]+)",\s*name:"([^"]+)",\s*game:"([^"]+)"', map_block.group(1)
            )
            legacy = {item_id: {"name": name, "game": game} for item_id, name, game in legacy_rows}
            if not legacy_rows:
                err("app.js MAP_LOCATIONS could not be inventoried")
            if migration.get("marker_count") != len(markers):
                err("data/atlas-migration.json marker_count does not match its markers array")
            if len(markers) != len(legacy_rows):
                err("data/atlas-migration.json does not cover every app.js MAP_LOCATIONS marker")

            migration_ids = set()
            matched = 0
            for index, marker in enumerate(markers):
                if not isinstance(marker, dict):
                    err(f"data/atlas-migration.json markers[{index}] must be an object")
                    continue
                legacy_id = marker.get("legacy_id")
                if not isinstance(legacy_id, str) or not legacy_id:
                    err(f"data/atlas-migration.json markers[{index}] has no legacy_id")
                    continue
                if legacy_id in migration_ids:
                    err(f'data/atlas-migration.json has duplicate legacy_id "{legacy_id}"')
                migration_ids.add(legacy_id)
                source = legacy.get(legacy_id)
                if source is None:
                    err(f'data/atlas-migration.json references unknown legacy marker "{legacy_id}"')
                    continue
                if marker.get("name") != source["name"]:
                    err(f'data/atlas-migration.json marker "{legacy_id}" name differs from app.js')
                expected_game = {
                    "Fallout 1": "fallout_1", "Fallout 2": "fallout_2", "New Vegas": "fallout_new_vegas"
                }.get(source["game"])
                if marker.get("game_id") != expected_game:
                    err(f'data/atlas-migration.json marker "{legacy_id}" game_id differs from app.js')
                world_id = marker.get("world_location_id")
                marker_status = marker.get("status")
                if world_id is None:
                    if marker_status != "research_required":
                        err(f'data/atlas-migration.json marker "{legacy_id}" without a world record must require research')
                else:
                    matched += 1
                    if world_id not in location_ids:
                        err(f'data/atlas-migration.json marker "{legacy_id}" references unknown world location "{world_id}"')
                    if marker_status != "matched":
                        err(f'data/atlas-migration.json marker "{legacy_id}" with a world record must be matched')

            for legacy_id in sorted(set(legacy) - migration_ids):
                err(f'data/atlas-migration.json omits legacy marker "{legacy_id}"')
            info(f"US atlas migration inventory: {matched}/{len(markers)} markers matched to world records")

# ---------------------------------------------------------------- 11. generated terrain cache
terrain_manifest_path = p("media", "map-terrain", "manifest.json")
if os.path.exists(p("map-terrain.js")):
    try:
        with open(terrain_manifest_path, encoding="utf-8") as f:
            terrain_manifest = json.load(f)
    except (OSError, json.JSONDecodeError) as exc:
        err(f"media/map-terrain/manifest.json cannot be read as JSON: {exc}")
        terrain_manifest = None

    if terrain_manifest is not None:
        scopes_data = terrain_manifest.get("scopes")
        if not isinstance(scopes_data, dict) or set(scopes_data) != {"us", "region"}:
            err('terrain manifest scopes must be exactly "us" and "region"')
            scopes_data = {}
        total_tile_bytes = 0
        total_tile_count = 0
        for scope_name, scope_data in scopes_data.items():
            tile_root = p("media", "map-terrain", scope_name)
            tile_paths = []
            for directory, _subdirs, filenames in os.walk(tile_root):
                for filename in filenames:
                    if filename.endswith(".webp"):
                        tile_paths.append(os.path.join(directory, filename))
            try:
                tile_paths.sort(key=lambda path: tuple(
                    int(part.removesuffix(".webp"))
                    for part in os.path.relpath(path, tile_root).split(os.sep)
                ))
            except ValueError:
                err(f"terrain scope {scope_name} contains a non-numeric tile path")
            recorded_count = scope_data.get("tile_count") if isinstance(scope_data, dict) else None
            if recorded_count != len(tile_paths):
                err(f"terrain scope {scope_name} has {len(tile_paths)} tiles but manifest records {recorded_count}")
            hashes = []
            for tile_path in tile_paths:
                with open(tile_path, "rb") as f:
                    tile_bytes = f.read()
                hashes.append(hashlib.sha256(tile_bytes).hexdigest())
                total_tile_bytes += len(tile_bytes)
            total_tile_count += len(tile_paths)
            combined = hashlib.sha256("".join(hashes).encode("ascii")).hexdigest()
            if isinstance(scope_data, dict) and scope_data.get("combined_tile_sha256") != combined:
                err(f"terrain scope {scope_name} differs from its recorded combined SHA-256")
        if terrain_manifest.get("total_tile_bytes") != total_tile_bytes:
            err("terrain manifest total_tile_bytes does not match the generated tile cache")

        coast = terrain_manifest.get("coast_mask")
        coast_path = coast.get("path") if isinstance(coast, dict) else None
        if not isinstance(coast_path, str) or not os.path.exists(p(coast_path)):
            err("terrain manifest coast mask is missing")
        else:
            with open(p(coast_path), "rb") as f:
                coast_hash = hashlib.sha256(f.read()).hexdigest()
            if coast.get("sha256") != coast_hash:
                err("terrain coast mask differs from its recorded SHA-256")
        info(f"terrain cache: {total_tile_count} tiles / {total_tile_bytes:,} bytes verified")

# ---------------------------------------------------------------- report
print("── Misfits Database self-check ──")
print(f"   ids: {len(ref_ids)} refs / {len(defined_ids)} defined   "
      f"css vars: {len(used_vars)} used / {len(defined_vars)} defined")
for m in infos:     print("·  " + m)
for m in warnings:  print("⚠  " + m)
for m in errors:    print("✗  " + m)
if errors:
    print(f"\nFAIL — {len(errors)} error(s), {len(warnings)} warning(s)"); sys.exit(1)
print(f"\nOK — clean ({len(warnings)} warning(s))"); sys.exit(0)
