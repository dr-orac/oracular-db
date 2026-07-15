# Geographic base data

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
