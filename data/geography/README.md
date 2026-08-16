# Geographic base data

**Two scales ship and the renderer switches between them at zoom 4.** The 1:110m files are
unmodified and carry the zoomed-out view; the 1:10m files are clipped, simplified derivatives and
carry everything above zoom 4. That split is why 1:110m does not have to be survey-grade and why
1:10m does not have to cover the globe.

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
  --skip-class apps/misfits-react/web/public/data/route-classes.json
```

Sources, and the result each one must hash to:

- `natural-earth-10m-rivers.geojson` — `a12987e3811efd3ad1115ca328252df0d4b3391d55d201da091164a6c4444092`
  produces `smoothed/natural-earth-10m-rivers.geojson` — `735b66f9ad4772fb861c0388be255c231fce7c364789fee8a731b6dd8210185e`
  (50,178 vertices to 122,372; 1,064 KB to 2,437 KB raw)
- `kml/routes-and-regions.geojson` — `a87a27228e0db167efe266052b591a095de5f2f18e5efd3a2fdf5209ad936713`
  produces `smoothed/atlas-routes.geojson` — `3364547e45dc38dc5018a90d018216bf245ebb682c2355634755a15b2504fd48`
  (14,699 vertices to 26,249; 588 KB to 669 KB raw)

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
