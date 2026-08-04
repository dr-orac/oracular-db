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
`0.002` degrees preserving topology, rounding coordinates to **four** decimals, and dropping the
attribute columns, none of which the renderer reads.

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
- `natural-earth-10m-rivers.geojson` — `65cbaa65c9275f0fa44294de3de04938644b96e39244730cdbf958a79b7acf0f`

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
a canyon is a fact. No inserted point may sit more than **180 m** from the source line, which is the
same Douglas-Peucker tolerance already spent above, so the pass invents no error the files did not
already carry. Route classes `subsurface` and `bridge` are skipped entirely, 48 of 580 routes: a
sewer's angles are pipe joints and a bridge is a straight span.

The **1:110m rivers are deliberately not smoothed.** Measured, the pass removes 8% of their visible
corners, because their segments are 30 km long and the 180 m budget has nothing to spend. Removing
that angularity would mean moving the line by kilometres, which is drawing hydrography nobody
surveyed. At the overview scale the polygonal look is the truth about the data's resolution.

The cost is real and is the reason this is a separate directory rather than a replacement: the rivers
go from 329 KB gzipped to 730 KB.

Commands, which are also what the `smoothed lines` gate runs:

```sh
node tools/smooth-lines.mjs \
  apps/misfits-react/web/public/data/geography/natural-earth-10m-rivers.geojson \
  apps/misfits-react/web/public/data/geography/smoothed/natural-earth-10m-rivers.geojson

node tools/smooth-lines.mjs \
  apps/misfits-react/web/public/data/atlas-geo-registry.geojson \
  apps/misfits-react/web/public/data/geography/smoothed/atlas-routes.geojson \
  --layer routes-and-regions \
  --skip-class apps/misfits-react/web/public/data/route-classes.json
```

Sources, and the result each one must hash to:

- `natural-earth-10m-rivers.geojson` — `65cbaa65c9275f0fa44294de3de04938644b96e39244730cdbf958a79b7acf0f`
  produces `smoothed/natural-earth-10m-rivers.geojson` — `f4c0794e1ddb188dc7a932bb10359a1210b1a108cfaeb8f3aaf97a6f56a2bf5c`
  (50,178 vertices to 122,372; 992 KB to 2,334 KB raw)
- `../atlas-geo-registry.geojson` — `598c5a22ccac46a007032878e041950493a9d9d272a64e9384257c737195a5e4`
  produces `smoothed/atlas-routes.geojson` — `f31639b63e4a134fc198dab509bf645246275465b22ec77840683f1beb1dad5e`
  (13,512 vertices to 24,113; 471 KB to 622 KB raw)

`smoothed/atlas-routes.geojson` carries all 580 `routes-and-regions` LineStrings with their ids and
properties unchanged, so it is a drop-in for the filter the renderer performs over the registry and
every id still joins to `route-classes.json`. The registry itself stays canonical and is never edited
by this step, exactly as `route-classes.json` keeps its inference out of it.

**Mixed coordinate precision in that file is expected.** 139 of the 580 routes are copied through
verbatim, because their class is skipped or they have fewer than three points, and a feature the
tool declined to touch keeps its source precision rather than being quietly rewritten. The file says
so in its own `_doc`. This is called out because the one rounding defect this directory has already
suffered looked exactly like the opposite case.
