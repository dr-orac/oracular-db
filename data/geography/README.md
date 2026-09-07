# Geographic base data

**The renderer draws two scales and switches at zoom 3: 1:50m below, 1:10m above.**

**CORRECTED 2026-08-18, twice, and both corrections were being repeated in several places.**

*The swap zoom.* This file and `tools/clip-geography.py` both said **zoom 4** and had done since the
detail scale landed. The style says `3` — `maxzoom: 3` on the coarse layers and `minzoom: 3` on the
fine ones, at about twenty declarations. Nothing had moved; the number was simply written down wrong
and then quoted onward, including into a defect diagnosis. It is stated once here now.

*The coarse scale.* It was 1:110m until 2026-08-18. Owner: *"on the higher level of zoom out the
coastlines jump from looking refined and detailed to suddently looking blocky as you zoom out
further"*. The diagnosis in hand called this a hard swap between two datasets and proposed 1:50m as
a **third** rung between them. **Measurement changed the shape of the answer**: a middle rung must
cover the world or leave holes wherever it is shown, and once 1:50m covers the world at a
zoom-appropriate tolerance it is simply better than 1:110m everywhere, so it REPLACES the coarse rung
rather than joining it. Two scales, one swap — the same structure as before, with a coarse scale that
is not an outline.

**And "blocky" understated it.** The 1:110m set is whole-globe overview geometry, and the counts are
the real finding:

| layer | 1:110m features | 1:50m features | vertices 110m → 50m |
|---|---|---|---|
| land | 127 | 1,420 | 5,143 → 60,669 |
| lakes | **24** | 412 | 465 → 19,778 |
| rivers | **13** | 461 | 1,147 → 25,641 |

Twenty-four lakes and thirteen rivers *for the entire world*. Below the swap the map was not drawing
a simplified world, it was drawing a world with almost nothing in it — so what happened at the swap
was features **appearing**, not detail arriving, which is why it read as a jump rather than as a
sharpening.

**The disagreement across the swap, measured** as symmetric difference against the 1:10m land inside
the window the fine set covers: **131.8 sq deg (3.6% of land area) before, 47.3 sq deg (1.3%)
after.**

The 1:110m files are **still tracked and still unmodified**. Five build tools derive from them —
`build-arctic-fill.py`, `build-map-terrain.py`, `fit-political-to-land.py`,
`build-influence-corridors.py` and `hydrography-gate.mjs`'s overview comparison — and none of that
changed. They are simply no longer what the renderer draws.

## 1:50m — the coarse scale, world coverage, simplified for the zooms it is shown at

Added 2026-08-18, from the **same pinned commit** `ca96624a56bd078437bca8184e78163e5039ad19` as both
other scales, so all three are one release of one dataset and cannot drift apart. Public domain.

Derived by `tools/clip-geography.py` with a **world** bbox rather than the North America window, a
tolerance of `0.02` degrees, and **three** decimal places. Those two numbers are set by the deepest
zoom this rung is ever shown at, which is 3: one screen pixel there spans about **0.088 degrees**, so
0.02 is under a quarter of a pixel and 0.001 is a eighty-eighth of one. The 1:10m values (0.002 and
four decimals) are set by zoom 9 and would store roughly 800 pixels of precision per pixel here.

The `--bbox` and `--precision` flags were added to that tool for this. **The default path is
unchanged and that was proven rather than assumed**: the pre-change tool and the post-change tool
were both run over two committed layers and the outputs hash identically.

Upstream, unmodified (checksums of what was fetched, not of what ships):

- `ne_50m_land.geojson` — `e874b27a51d146452be360cafb3cc50c86001074a67d534113e6534682f9826b`
- `ne_50m_lakes.geojson` — `d350b75978b26fe839b797c2c529b2fb8f47fb3983c03f4964e36d5df9378a52`
- `ne_50m_rivers_lake_centerlines.geojson` — `f286e0ce978fde999ca2d7a78c764be08542e19b63cded52b05c12d5173ccc51`

Shipped, derived:

- `natural-earth-50m-land.geojson` — `560c0da6c4773caf9656f4fbcc44cdc1c2b8756848ec0bd64a68d2aaad676012`
- `natural-earth-50m-lakes.geojson` — `d0226f7f76ea86c544a131b6ace139366c2e6b30887eee9bcda2f08596a0e8e2`
- `natural-earth-50m-rivers.geojson` — `1aa6ec3aa605d17360f589a195a0a82c2db6ac6c3ba8496b538e576803f36e1b`

Generator commands:

```sh
python3 tools/clip-geography.py ne_50m_land.geojson \
  apps/misfits-react/web/public/data/geography/natural-earth-50m-land.geojson \
  0.02 --bbox=-180,-90,180,90 --precision=3
python3 tools/clip-geography.py ne_50m_lakes.geojson \
  apps/misfits-react/web/public/data/geography/natural-earth-50m-lakes.geojson \
  0.02 --bbox=-180,-90,180,90 --precision=3
python3 tools/clip-geography.py ne_50m_rivers_lake_centerlines.geojson \
  apps/misfits-react/web/public/data/geography/natural-earth-50m-rivers.geojson \
  0.02 --bbox=-180,-90,180,90 --precision=3 \
  --props=scalerank,featurecla,name,min_zoom
```

**The river property list is SHORTER than the 1:10m one, and the tool refused the long one rather
than writing nulls.** `dissolve` and `rivernum` do not exist at 1:50m. That refusal is the
`--props` guard working: a version that quietly wrote missing columns as null would have produced a
file whose contract looked satisfied and whose values were empty. One of 462 river features is
dropped as empty after simplification.

**Cost: 76 KiB gzipped for the three 1:110m layers, 356 KiB for the three at 1:50m.** Against the
1:10m set's 1,232 KiB that is proportionate, and it is paid at the zoom where the map is first
looked at.

**A measurement that proved nothing, recorded so it is not repeated.** Before committing to moving
lakes and rivers as well as land, the question asked was whether 1:110m lakes would spill outside a
1:50m shoreline. Measured: 0.00% outside, for the new pairing AND for the existing one. **That is a
void result, not a green light** — Natural Earth's land polygons do not have lakes cut out of them,
so a lake is inside land by construction and the probe could not have detected the fault it was
aimed at. The three layers move together on the argument the counts above make instead.

## 1:110m — the overview scale, unmodified

The three GeoJSON files are unmodified 1:110m Natural Earth layers from
[Natural Earth Vector](https://github.com/nvkelso/natural-earth-vector), pinned to commit
`ca96624a56bd078437bca8184e78163e5039ad19` and retrieved 2026-07-15.

Natural Earth releases all raster and vector map data in the public domain. Credit is optional, but the
application records the source because geographic provenance still matters when no attribution is legally
required. The runtime file is deliberately the 1:110m overview geometry: it supplies a clean land/water
boundary, major lakes, and major rivers beneath/above the relief without pretending to be survey-grade
hydrography.

SHA-256:

- `natural-earth-110m-land.geojson` — `9e0729ee253ca7d7a5c4ae9395fb1902264c5377c52e224d13dd85010e2835d9`
- `natural-earth-110m-lakes.geojson` — `eb02ecc86c82004fccbf979058bfabbbd6c2d07968c7844d38eb1c9152d2ffc9`
- `natural-earth-110m-rivers.geojson` — `55aa4497405afc07cdc931b7fbe062c4d6693ba2a550c0d24899953f5d507c8d`

Source file:

The original filenames at that commit are `ne_110m_land.geojson`, `ne_110m_lakes.geojson`, and
`ne_110m_rivers_lake_centerlines.geojson` under `geojson/`.

## 1:10m — the detail scale, clipped and simplified

Added 2026-08-02, from the **same pinned commit** `ca96624a56bd078437bca8184e78163e5039ad19`, so
both scales are the same release of the same dataset and cannot drift apart. Also public domain.

These are **derived files, not unmodified sources.** `tools/clip-geography.py` produced each one by
clipping to lon/lat `(-172, -10, -40, 75)`, simplifying with Douglas–Peucker at a tolerance of
`0.002` degrees preserving topology, and rounding coordinates to **four** decimals. Land and lakes
drop their unused attribute columns. Rivers retain the narrow source contract needed for truthful
line hierarchy: `scalerank`, `featurecla`, `name`, `dissolve`, `rivernum`, and `min_zoom`.

Two corrections were made to that pipeline on 2026-08-02, both worth stating because the files
before them were wrong in ways that looked right:

- **The rounding never ran.** `round_geom` was called with `mapping(geom)`, which returns a *dict*,
  and the function only recursed into lists and tuples — so it returned its argument untouched.
  Every file it produced carried full source precision while this document claimed five decimals.
  Found by reading a shipped coordinate, not by trusting the tool.
- **The west edge sliced Alaska.** At `-150` the clip cut through it at about `-168`, and the cut
  rendered as a 754px dead-straight line across the map — a clip boundary being read as a
  coastline, which is the most misleading thing a clipped dataset can do.

Four decimals is about 11 metres here. That sounds coarse and is not: one screen pixel at zoom 9,
the deepest this map reaches, spans roughly 0.0027 degrees, so 0.0001 is a twenty-seventh of a
pixel. Three decimals was measured and rejected at a third of a pixel, where a coastline begins to
look faceted. The two fixes together took the three layers from 1,529 KB gzipped to **1,232 KB**,
while *adding* Alaska.

Both steps are about what a screen can show rather than about saving space for its own sake. The
three source layers are 22.5 MB together, which no browser should fetch to look at Utah; at zoom 5
one screen pixel spans roughly 0.034 degrees of longitude at these latitudes, and 0.002 degrees is
under a pixel even at zoom 9, the deepest this map goes. The result is 3.8 MB, about 1.2 MB gzipped, and loads only when the terrain mode is opened.

Upstream, unmodified (checksums of what was fetched, not of what ships):

- `ne_10m_land.geojson` — `1ac90796408bc6ad6911d69448485d3c4dbf2190370080368a09976e1c9f7416`
- `ne_10m_lakes.geojson` — `2d036f53dedec578001c5c30c2959ee7d4eebc1306900fa4367c49929ec8f2d9`
- `ne_10m_rivers_lake_centerlines.geojson` — `bb854a900ecbd3b408df46d5e16e3e0f974ba55993f9d8b5c26e855273c0905a`

Shipped, derived:

- `natural-earth-10m-land.geojson` — `c0e4a7867a51dbebc5356dca8f2892e570a374f8781a8506d0fc801874185897`
- `natural-earth-10m-lakes.geojson` — `50e05c03d8113dda4329d190e58d56f10baf31e5f7180a166b6f633362e5d8d4`
- `natural-earth-10m-rivers.geojson` — `a12987e3811efd3ad1115ca328252df0d4b3391d55d201da091164a6c4444092`

The river properties were restored on 2026-08-13 before the water styling pass. The clipped set is
432 features: 332 `River`, 100 `Lake Centerline`; scaleranks 1–10 occur in counts
`8, 6, 12, 19, 29, 74, 111, 146, 26, 1`. Against the previous property-free tracked file, the
properties add **47,733 bytes raw and 9,336 bytes under deterministic `gzip -n`**, not the earlier
72 KB / 17 KB estimate. That comparison uses byte-identical geometry on both sides. It is the full
data cost of letting line weight mean source rank instead of an invented visual class.
`tools/hydrography-gate.mjs` holds the distribution and raw/smoothed property parity. The generator
command is:

```sh
python3 tools/clip-geography.py ne_10m_rivers_lake_centerlines.geojson \
  apps/misfits-react/web/public/data/geography/natural-earth-10m-rivers.geojson \
  --props=scalerank,featurecla,name,dissolve,rivernum,min_zoom
```

Recording both means the derivation is checkable: fetch the upstream file, run the tool with the
values above, and the result should hash to the shipped line. That is the property the 1:110m files
get for free by being unmodified, and it should not be lost just because these are processed.

### `natural-earth-10m-coastline.geojson` — the same shore, as a line, without the clip box

Added 2026-08-17 by `tools/build-coastline.py`, derived from `natural-earth-10m-land.geojson` in
this directory rather than from the Natural Earth download, so it can be regenerated from a clone.
Same provenance and licence as its parent.

**Why it exists.** A MapLibre `line` layer strokes the *whole* ring, and the 10m land is clipped to
`(-172, -10, -40, 75)` — so six stroke layers were drawing the clip rectangle as if it were shore:
38.58 degrees along the north edge, 38.22 along the south, 16.88 east, 1.42 west. Owner, 2026-08-17,
with a screenshot: *"at a certain level of zoom that square happens but if you zoom out more it
corrects itself"*. It corrects below zoom 3 because `coast` takes over there on the 1:110m source,
which is the unclipped world and measures `0.0` on every side.

**No filter could have fixed it.** A filter selects *features*, and the offending segments share a
ring with real coastline. The split has to happen in the data, which is why this is a file and not a
paint property.

**What the generator does, and only this:** every ring becomes a LineString, minus the 22 segments
whose *both* endpoints sit on the same edge of the clip rectangle. 1,725 rings in, 1,731 lines out —
the six extra are rings that the removal opened into two runs. Vertex order is preserved, so the
one-sided `line-offset` the waterlines depend on still falls on the seaward side.

**Consumers:** `coast-hi`, `coast-tint`, `coast-shelf`, `coast-waterline-1/2/3`. The *fills* keep the
box edge deliberately — in the vector plot `land-hi` is not drawn at all, and with the relief on the
DEM covers it, so the edge survives only where nothing can see it.

**Cost:** 1.96 MB raw, 0.62 MB gzipped, against a 1.96 MB parent it does not replace —
`land-hi` is still needed for the fill. Six layers repaired by one file is what justifies it; the
alternative of shipping only the 14 affected rings saves half of it and costs a restructured land
file, because those rings are the continental ones and hold 49% of the vertices.

**Verified by `tools/clip-edge-gate.py`**, which measures exactly this and already existed: the
product records `0.0` on all four sides, and the same generator with its segment test disabled
reproduces the parent's `1.422 / 38.221 / 16.881 / 38.58` exactly.

## `smoothed/` — the same lines with their curvature put back

Added 2026-08-03. **Derived a second time, from the files above rather than from upstream**, by
`tools/smooth-lines.mjs`. The simplification that made those files also made them angular: the 1:10m
rivers turn a median of 22.1 degrees every 2.7 km, which reads as a polygon rather than a river.
Smoothing resamples each line through a centripetal Catmull-Rom spline, which passes through every
source vertex, so no surveyed point is moved.

Three guards keep it from inventing geography, and the tool's header carries the measurements behind
each. Turns of 60 degrees or more are preserved exactly, because a right angle in a road or a cusp in
a canyon is a fact. The configured chord clamp is **180 m** in the tool's local metric; measured
geodesically after coordinate rounding, the current worst inserted point is **187.2 m** from the
source line. That 7.2 m distinction is recorded rather than calling the configuration an observed
hard maximum. Route classes `subsurface` and `bridge` are skipped entirely: a
sewer's angles are pipe joints and a bridge is a straight span.

The **1:110m rivers are deliberately not smoothed.** Measured, the pass removes 8% of their visible
corners, because their segments are 30 km long and the 180 m budget has nothing to spend. Removing
that angularity would mean moving the line by kilometres, which is drawing hydrography nobody
surveyed. At the overview scale the polygonal look is the truth about the data's resolution.

The cost is real and is the reason this is a separate directory rather than a replacement: the ranked
rivers go from 346 KB gzipped to 760 KB (`gzip -n`: 346,381 to 759,832 bytes).

Commands, which are also what the `smoothed lines` gate runs:

```sh
node tools/smooth-lines.mjs \
  apps/misfits-react/web/public/data/geography/natural-earth-10m-rivers.geojson \
  apps/misfits-react/web/public/data/geography/smoothed/natural-earth-10m-rivers.geojson

node tools/smooth-lines.mjs \
  apps/misfits-react/web/public/data/geography/kml/routes-and-regions.geojson \
  apps/misfits-react/web/public/data/geography/smoothed/atlas-routes.geojson \
  --skip-class apps/misfits-react/web/public/data/route-classes.json \
  --step 4 --max-subdiv 16
```

**The routes are subdivided four times as finely as the rivers, and the reason is that they can
afford it.** `--step` is degrees of bend earning one inserted point, and its cost curve is set by
how long the source segments are: the rivers' are 2.6 km apart, so halving the step buys vertices
everywhere, while a hand trace's are 895 m and adaptive subdivision has little left to add. Measured
on this file at the default corner and drift guards:

| setting | vertices | gzip KB | seen kinks |
|---|---|---|---|
| `--step 12 --max-subdiv 8` (the tool defaults) | 26,239 | 163 | 1,525 |
| `--step 6 --max-subdiv 12` | 30,839 | 189 | 859 |
| `--step 4 --max-subdiv 16` (used here) | 32,403 | 197 | 627 |

About 353 of the residual are the corners at or above 60 degrees that Guard 1 preserves on purpose,
so the part this dial can reach falls from roughly 1,172 to 274. **It buys that without loosening
either honesty guard**: worst drift from the source line stays at 187 m and worst source vertex
moved stays at 7 m, because a smaller step samples the same clamped curve more finely rather than
permitting a different one. Raising `--max-subdiv` past 16 changes nothing at all (859 kinks at both
12 and 16 on `--step 6`); below `--step 4` the return flattens while the bytes do not.

The defect this fixed, and why the corner guard was the wrong suspect: 57.6% of the visible kinks in
the previous output were gentle turns of 15 to 30 degrees, not preserved corners. Subdivision is
driven by bend alone, so a 20-degree turn earned a single inserted point however long its segments
were — and on a 5 km segment that leaves both halves well above the 1,150 m at which a corner
becomes visible, so the kink simply moved to the inserted point. Turning `--corner` down would have
blunted real right angles and left this untouched.

Sources, and the result each one must hash to:

- `natural-earth-10m-rivers.geojson` — `a12987e3811efd3ad1115ca328252df0d4b3391d55d201da091164a6c4444092`
  produces `smoothed/natural-earth-10m-rivers.geojson` — `735b66f9ad4772fb861c0388be255c231fce7c364789fee8a731b6dd8210185e`
  (50,178 vertices to 122,372; 1,064 KB to 2,437 KB raw)
- `kml/routes-and-regions.geojson` — `a87a27228e0db167efe266052b591a095de5f2f18e5efd3a2fdf5209ad936713`
  produces `smoothed/atlas-routes.geojson` — `ecd96ae80be0b6c0efcaf0a934aa84ad2738dd8e4dc69a7536cec3d0571da5cc`
  (14,699 vertices to 32,403; 588 KB to 786 KB raw, 163 KB to 198 KB gzipped)

`smoothed/atlas-routes.geojson` carries all 601 `routes-and-regions` LineStrings with their ids and
properties unchanged, so every id still joins to `route-classes.json`. The complete KML import stays
canonical and is never edited by this step, exactly as `route-classes.json` keeps its inference out
of it.

**Mixed coordinate precision in that file is expected.** Features whose class is skipped or that
have fewer than three points are copied through verbatim, and a feature the tool declined to touch
keeps its source precision rather than being quietly rewritten. The generated file records the
current count in its own `_doc`, rather than pinning a stale count in the tool. This is called out
because the one rounding defect this directory has already suffered looked exactly like the
opposite case.

## `natural-earth-10m-roads.geojson` — the surveyed skeleton behind the traced network

Added 2026-08-19, from the **same pinned commit** `ca96624a56bd078437bca8184e78163e5039ad19` as the
land, lakes and rivers, so every Natural Earth layer here is one release of one dataset. Public
domain. Source file `geojson/ne_10m_roads.geojson`, SHA-256
`66a0c7b438e92fd124822cc5921cfa11042f48c294ade5e0f03f2c6640fd0248`.

**Why it exists, measured.** The hand-traced network "cuts off hard, especially in the north"
(owner). That cut is not a clip edge and not a rendering artefact: five routes — US Route 89, 93,
95, 395 and Interstate 15 — end within **two metres of latitude 49.0000**, spread across 6.3
degrees of longitude. That is the United States border, and it is there because the traces were made
from a US-only source. The map was drawing a political boundary as the end of the road.

```sh
python3 tools/clip-geography.py \
  <ne_10m_roads.geojson> \
  apps/misfits-react/web/public/data/geography/natural-earth-10m-roads.geojson \
  --props=type,prefix,name,scalerank,min_zoom \
  --select=sov_a3=USA\|CAN\|MEX \
  --select='type=Major Highway|Secondary Highway|Beltway|Bypass' \
  --drop=sov_a3=USA --drop='type=Secondary Highway'
```

produces `natural-earth-10m-roads.geojson` —
`b66575341feb0810549e8eaa886471fef615040d7e53be7de34ce79f4597b298`
(56,600 features to 3,856; 2,412 Major Highway, 1,273 Secondary Highway, 166 Beltway, 5 Bypass;
1.60 MB raw, 343 KB gzipped).

**THE FILTER IS THE WHOLE DESIGN, AND THE OBVIOUS ONE IS WRONG.**
[roadmap-continental-network.md](../../../../../../docs/changes/map-timeline/roadmap-continental-network.md)
recommended **Major Highway / Beltway / Bypass only**, at 2,583 features and 191 KB gzipped, on a
table that compared candidates by **file size**. Built that way and put on the map, it changed almost
nothing north of the border, because **Natural Earth classes almost all Canadian roads as
`Secondary Highway`**: of 581 features reaching north of 49 in this window, 460 are Secondary and
only 34 are Major. The recommended cut filtered out very nearly the exact roads the layer was added
to draw. The measurement in that document was correct and the conclusion did not follow from it —
nothing there checked the class distribution of the region the gap was in.

Taking Secondary everywhere costs 8,966 features and 789 KB gzipped, and it would also thicken the
United States, where the traced network is already dense and the owner has already asked for less
road clutter. `--drop` states the cut that is actually wanted: **every major highway, plus secondary
roads only where the traced network does not reach.** 3,856 features, 343 KB. North of 50 degrees
the layer goes from 156 vertices to 6,781.

Latitude coverage, in vertices per five-degree band. The traced network spans 32.487 to 49.001, so
every band outside that range is ground it could not reach at all:

| band | vertices | | band | vertices |
|---|---:|---|---|---:|
| 65–70 | 238 | | 35–40 | 6,009 |
| 60–65 | 999 | | 30–35 | 4,141 |
| 55–60 | 1,526 | | 25–30 | 2,411 |
| 50–55 | 4,018 | | 20–25 | 3,086 |
| 45–50 | 6,975 | | 15–20 | 4,017 |
| 40–45 | 7,562 | | 10–15 | 22 |

**One honest limitation, inherited from the source.** Natural Earth roads is generalised for world
mapping: it is an interstate-and-major-highway network, not a street network. It will not draw the
road to a named ruin and should not be zoomed into as though it could. `ROAD_SKELETON` in
`terrain-style.ts` holds the styling and the reason it is deliberately quieter than the fiction it
sits behind.

## `physical-landmarks.geojson` — the permanent skeleton

327 named physical features across the map's window, built by
`tools/build-physical-landmarks.py`. Public domain, so no new credit obligation and no new licence
question — the Natural Earth credit already carried by the land, lakes and rivers covers it.

**Two sources, one file.** 232 features survive from four Natural Earth 1:10m physical label
datasets, culled 56% from 529 raw in-window candidates. 95 more are curated in the builder itself:
passes, salt flats, canyons, caves, hot springs, volcanic fields and buttes, none of which Natural
Earth carries at any useful density — it has exactly ONE pass in the whole window.

Natural Earth sources, from `naciscdn.org/naturalearth/10m/physical/`, not committed:
`ne_10m_geography_regions_polys`, `ne_10m_geography_regions_points`,
`ne_10m_geography_regions_elevation_points`, `ne_10m_geography_marine_polys`.

Every feature carries `name`, `kind`, `use` and `tier`, plus `elev` where known, `note` on curated
entries, and `src` saying which half it came from. `use` is the layer's argument — `route`,
`barrier`, `hazard`, `shelter`, `water`, `landmark` — and the renderer colours by it.

```sh
python3 tools/build-physical-landmarks.py <dir-of-unzipped-shapefiles> --write
python3 tools/build-physical-landmarks.py --check   # ratchet; needs no source
```

The `--check` ratchet guards feature count, the affordance vocabulary, gzipped size, and — the
bound that matters — **tier 1 may not grow**. This layer's risk is not bytes (9.0 KB gzipped), it is
more names arriving at continental zoom on a map whose labels already collide.

## `ice.geojson` and `sea-ice.geojson` — the two kinds of ice

**They are two files because they are two things.** `ice.geojson` is Natural Earth's *glaciated
areas*: ice sheets and glaciers ON LAND. `sea-ice.geojson` is frozen ocean, which no land dataset
can contain — at the pole there is no land to be glaciated. They share one chip in the renderer,
because to a reader they are one thing, and `sea-ice` is declared first so the glacier paints over
the pack where the two overlap along the shore.

### `ice.geojson` — global, and it has no clip window

`tools/build-ice.py`, from `ne_10m_glaciated_areas` (`naciscdn.org/naturalearth/10m/physical/`, not
committed). **Public domain**; the Natural Earth credit already carried by the land, lakes and
rivers covers it.

It carried the shared North American window `-172,-10,-40,75` until 2026-08-14, when that box was
found amputating Greenland's ice sheet on two straight lines
([ice-clip-2026-08-14.md](../../../../../docs/changes/map-timeline/ice-clip-2026-08-14.md)); it was
widened, and then the window was removed entirely on the owner's *"do it for the whole globe"*
([global-ice-2026-08-14.md](../../../../../docs/changes/map-timeline/global-ice-2026-08-14.md)).
**A layer with no clip has no clip edge to be misread as a coastline.** 475 parts, 43,591 vertices,
**160.1 KB gzipped**, at 25% Visvalingam retention, 0.01-degree precision and a 200 km² island
floor.

The other six layers built from that shared window — land, lakes, rivers, biomes, the sandy coast,
the forest field — are unchanged and still agree with each other at `-172,-10,-40,75`.

### `sea-ice.geojson` — NSIDC, September, and one constant carries the worldbuilding

`tools/build-sea-ice.py`, from NSIDC's **Sea Ice Index, G02135 v4.0** monthly extent shapefiles
(`noaadata.apps.nsidc.org`, no account needed, not committed). NSIDC asks to be cited, so this layer
carries its own attribution rather than riding Natural Earth's.

**September 2016**: the annual minimum — the ice that survives the melt season and is therefore
there all year, on a map that has no season. 4.53 million km², the closest single year to the
2016–2025 September mean of 4.583, and 29% below the 1981–2010 September mean of 6.413. The warm
lean is an **owner ruling** of 2026-08-15; the argument, and the one constant that reverses it to a
March maximum, are in the builder's own header. 15 parts, 1,038 vertices, **4.9 KB gzipped**.

The source is a 25 km polar-stereographic raster, so the builder does three things nothing else in
this directory needs: it reprojects with its own Snyder inverse (mapshaper silently drops every ring
enclosing the pole), it cuts the polar disc out and puts a lon/lat band back over it, and it rounds
the raster staircase off the ice edge with a morphological close-then-open.

```sh
python3 tools/build-ice.py <ne_10m_glaciated_areas.shp> --write
python3 tools/build-ice.py --check          # ratchet; needs no source
python3 tools/build-sea-ice.py <extent_N_201609_polygon_v4.0.shp> --write
python3 tools/build-sea-ice.py --check      # ratchet; needs no source
python3 tools/build-sea-ice.py --self-test  # the projection maths
```
