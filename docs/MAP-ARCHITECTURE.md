# Map architecture

The Map tab has three deliberate scales, selected by one route-aware pill:

| Scope | Purpose | Source boundary |
|---|---|---|
| **US** | Reference atlas for established wasteland locations and timelines. | Original US outline and paraphrased, reviewed lore entries. |
| **Region** | Wider Wendover context: approaches, settlements, routes, and regional landmarks. | Original schematic informed by verified place data. |
| **Local** | The playable Wendover game space at useful encounter-planning scale. | Original cartography exported from an authorised game-grid source, with reviewed landmark names. |

`#map` opens the US atlas. `#map/region` and `#map/local` open the corresponding scale directly.
The Wendover marker on the US atlas opens **Region**, preserving the natural zoom order.

## Data boundary

Raw editor exports, screenshots, and research notes are references only. They live under the ignored
`added files by user/` folder and are never shipped or committed. Published maps use original presentation
geometry and compact reviewed data. Do not trace a game screenshot or embed its tiles/sprites.

Region map data uses a fixed `1000 × 700` schematic coordinate space. Local must preserve the authoritative
game grid's native bounds, origin, axis direction, and cell size in its export manifest. A renderer may
normalise those values internally, but stored landmarks, routes, import/export, and later shared pins must
round-trip through native grid coordinates rather than a hand-scaled illustration.

`data/world.json` is a research dataset until its top-level `data_status` becomes `display_ready`. The app
must not consume provisional coordinates merely because they are syntactically valid. A coordinate is a
displayable placement only after the identity, basis, evidence, and uncertainty have been reviewed.

## Placement evidence

Keep three different questions separate:

1. **Identity:** is the fictional location explicitly identified with a real-world place? The Boneyard as
   Los Angeles is a strong identity anchor; a generic desert vault usually is not.
2. **Placement:** is its point fixed by that identity, inferred relative to anchors on one game's world
   map, broadly constrained by several clues, or authored for this project?
3. **Precision:** how large is the plausible area? A city identity can be certain while its chosen marker
   still represents a metropolitan area rather than an exact building.

New or revised location records should replace the ambiguous `source_confidence` field with this shape:

```json
{
  "canon_scope": "fallout_1",
  "placement": {
    "basis": "real_world_identity",
    "status": "reviewed",
    "precision_km": 15,
    "method_note": "City identity is explicit; marker represents the metropolitan centre."
  },
  "evidence": [
    {
      "source_id": "stable-source-id",
      "supports": "identity",
      "locator": "page, map label, dialogue, or section",
      "note": "Concise statement of what this source establishes."
    }
  ]
}
```

Allowed placement bases are `real_world_identity`, `game_map_inference`, `regional_inference`,
`project_authored`, and `unknown`. Allowed statuses are `reviewed`, `provisional`, and `withheld`.
`precision_km` is an uncertainty radius, not a promise of survey accuracy. `unknown` placements remain in
the research set but do not receive a public marker.

For inference from a game map:

- establish at least two identity anchors from that same map; three or more are preferred;
- compare relative direction and distance to those anchors rather than tracing the source artwork;
- record contradictions and map distortion instead of forcing an exact fit;
- calculate or state a conservative uncertainty radius;
- never use one global transform across different games or continuities;
- keep alternate placements when the evidence genuinely supports more than one interpretation.

The rendered map may simplify an accepted placement, but it must not imply greater certainty than the
underlying record. The repository self-check validates graph references and coordinate ranges; evidence
review remains a separate human gate.

## Discovery references

Fan maps are indexes, not placement evidence. Use them to find candidate locations, missing coverage,
same-game relationships, contradictions, and stronger source leads. A candidate enters `world.json` only
after it is traced to game material, a direct geographic identity, or an explicitly documented inference
with conservative uncertainty. Never copy a coordinate or trace geometry merely because several fan maps
repeat it.

Two useful discovery references illustrate the boundary:

- Golbolco's [Composite Fallout Map](https://www.nma-fallout.com/threads/composite-fallout-map.219487/)
  combines shipped grids with canceled-game and mod maps. Its author describes using Google Maps, cross-grid
  comparison, visual alignment, and estimated New Vegas add-on positions. It is useful for relative-position
  diagnostics, not exact placement.
- King_Kestrel's later [Fallout faction map](https://www.reddit.com/r/ImaginaryFallout/comments/pnyati/a_map_of_the_fallout_world_for_anything_that/)
  is the user-approved broad shape guide for a project-authored territory scenario. Its published 2290 map
  selects particular game endings and mixes canon, non-canon, mod, and original factions. Redraw and
  generalise its regional relationships on the geographic base; do not reuse its pixels, trace exact edges,
  or cite those edges as canonical borders.

This policy keeps discovery cheap: investigate only a reference that exposes a concrete delta. Do not build
or retain exhaustive fan-map transcriptions.

## Faction territory overlay

A faction overlay is viable after the geographic renderer proof, but it is a separate optional layer from
location truth. Point records remain in `world.json`; territory claims will use their own versioned dataset
and review gate. The first territory work is a claims inventory, not polygon drawing. A scenario derived from
the approved shape guide must record its reference year and ending or continuity assumptions so it cannot be
mistaken for an all-period canon layer.

The eventual layer must:

- record scenario, faction, canon scope, time range, source basis, review status, and uncertainty for every
  claim;
- allow contested and overlapping extents instead of forcing every area to one owner;
- distinguish source-backed control, broad inference, and project-authored territory in both data and style;
- use labels, border treatment, and patterns as well as colour;
- generate original, generalised geometry informed by the approved broad areas rather than tracing fan
  artwork;
- remain independently toggleable on US and Region scopes and stay out of the Local gameplay schematic.

If the claims audit cannot support a meaningful boundary, publish named influence points or broad regions
instead of fabricating a precise polygon.

## Terrain underlay

The supplied North America relief image is visual direction, not a reusable asset or geographic source. Its
muted relief, readable mountain chains, and layered-paper character are useful qualities to pursue in an
original underlay. Its pixels, exact styling, labels, rivers, boundaries, and apparent post-war changes must
not be copied or traced. A perceived changed coastline or watercourse is a fan interpretation unless a
reviewed source establishes it.

The shipped map currently uses responsive SVG schematics; it does not yet include a geographic map library.
T114 is the bounded decision point for MapLibre. MapLibre can keep source data separate from presentation and
compose raster, vector, hillshade, and colour-relief layers; its raster DEM source can support hillshade
without requiring a tilted 3D camera. See the official [layer specification](https://maplibre.org/maplibre-style-spec/layers/),
[raster DEM source documentation](https://maplibre.org/maplibre-gl-js/docs/API/classes/RasterDEMTileSource/),
and [hillshade example](https://maplibre.org/maplibre-gl-js/docs/examples/add-a-hillshade-layer/).

The proposed US + Region stack, from bottom to top, is:

1. neutral ocean, land, and lake base;
2. low-saturation colour relief derived from licensed elevation data;
3. restrained hillshade derived from the same elevation data;
4. coast, major lakes, and major rivers;
5. optional post-war condition or geography-change masks;
6. optional faction territories and contested-area treatments;
7. routes, boundaries, and travel corridors;
8. locations, uncertainty symbols, and labels.

Keep physical geography and post-war interpretation in different datasets. Elevation and ordinary
hydrography belong to the factual base. A dried lake, irradiated zone, redirected river, or altered coastline
belongs to a separately toggleable scenario layer with a reference year, continuity, placement basis,
evidence, review status, and uncertainty. Where the evidence is insufficient, use broad condition shading or
withhold the feature instead of editing the base terrain.

Keep the geographic production view two-dimensional (`pitch: 0`). Relief should add orientation and atmosphere without
distorting marker relationships, hiding territory overlaps, or competing with labels. Use transparent fills,
patterns, borders, and restrained faction hues above it. Local does not inherit continental terrain or its
geographic coordinate system.

A single georeferenced image is technically possible through MapLibre's
[image source](https://maplibre.org/maplibre-gl-js/docs/API/classes/ImageSource/), but it is not the preferred
production design: it becomes soft at zoom, bakes several meanings together, resists theme adaptation, and
can hide unsupported geography inside the artwork. Prefer renderer-native DEM relief plus original vector
overlays. Retain the SVG atlas during the proof and lazy-load MapLibre only when Map opens. The dependency
earns inclusion only if self-hosting, transfer cost, narrow-screen containment, accessibility, failure
fallback, and label clarity pass T114's recorded gates without requiring a client token or paid tile service.

## Local game-map pipeline

The current `Wendover.yml` establishes the scale of the problem: approximately 40 MB, 1.79 million lines,
206,710 entities, and 1,998 occupied `16 × 16` chunks spanning chunk coordinates `[-33,-21]` to `[30,19]`.
It is a rich editor source, not a web payload. Loading it in the browser, rendering every entity into the DOM,
or manually painting a replacement would create unnecessary cost and immediate drift.

T116 makes the separate map-editor project the preferred source adapter. After access is provided, audit its
existing parser and renderer before writing another YAML implementation. The ideal editor-side export is
deterministic and produces two kinds of output:

- a compact semantic manifest in native grid coordinates, containing source hash, source format, bounds,
  axis convention, palette version, layer registry, and reviewed landmarks;
- generated presentation assets: initially one responsive overview raster, with a multiresolution tile
  pyramid or semantic canvas data added only if the viewer proof earns the extra complexity.

Raw tile IDs and hundreds of thousands of entities do not deserve equal visual weight. The cartographic
export should classify them into a small project-owned vocabulary: open terrain, water, roads, walls and
buildings, major compounds, hazards, and selected landmarks. Minor furniture, loot, effects, and runtime
objects remain absent until a demonstrated use case needs them. Original colours, fills, patterns, outlines,
and labels should make the layout readable without reproducing game sprites or textures. Confirm permission
for the map layout and record the licence of any retained source-derived data before publishing it.

### Local renderer decision

| Candidate | Strength | Cost or risk | Decision gate |
|---|---|---|---|
| Responsive WebP/PNG + vector labels | Fastest, smallest system, excellent overview. | Deep zoom eventually softens; one large image may be heavy. | Build first as the baseline and fallback. |
| Multiresolution raster tiles + vector labels | Crisp progressive zoom and visible-area loading. | Export, cache, request, and viewer complexity. | Adopt only if the baseline cannot preserve district detail within its weight budget. |
| Semantic canvas renderer | Themeable, selective detail, native interaction. | Highest rendering, testing, and accessibility burden. | Adopt only if the editor already exposes clean semantic layers and measured interaction value justifies it. |
| MapLibre image/raster source | Reuses the geographic renderer and its controls. | Local coordinates are not geographic; projection is artificial and couples unrelated systems. | Prototype only if reuse materially lowers total complexity without coordinate distortion. |

The recommended product boundary is one map shell with two renderer families: MapLibre may earn US + Region,
while Local uses native game-grid coordinates behind the same zoom, reset, selection, loading, and error
contract. Moving from Region to Local is a short labelled scale transition, not a claim of continuous
geographic zoom. This preserves a coherent experience without pretending the playable grid is a survey map.

```json
{
  "version": 1,
  "scope": "local",
  "coordinate_system": "ss14_grid",
  "source": {
    "hash": "sha256-of-authorised-source",
    "format": 7
  },
  "grid": {
    "chunk_size": 16,
    "min_chunk": [-33, -21],
    "max_chunk": [30, 19],
    "axis": "confirm-during-editor-audit"
  },
  "layers": [
    { "id": "terrain", "asset": "generated-overview.webp", "palette_version": 1 }
  ],
  "landmarks": [
    {
      "id": "stable-kebab-id",
      "name": "Published name",
      "grid_x": 0,
      "grid_y": 0,
      "kind": "settlement",
      "summary": "Original concise description",
      "status": "verified"
    }
  ],
  "routes": [
    { "id": "route-id", "from": "landmark-id", "to": "landmark-id", "kind": "road" }
  ]
}
```

Use stable lowercase kebab IDs. Keep `name`, `summary`, and route labels concise and original. A landmark
must be confirmed against the supplied in-game reference or user direction before its status becomes
`verified`; uncertain findings stay out of the published data.

## Delivery order

1. **Scope foundation** — three panels, direct links, accessible tab state, and this contract. Complete.
2. **Regional base** — original regional schematic plus a small reviewed landmark and route registry.
   Complete with the initial four orientation anchors; extend only with reviewed sources.
3. **US data migration** — the 23-marker baseline is inventoried in `data/atlas-migration.json`, guarded by
   selfcheck, and fully matched to world records. Placement approval remains open. Promote only defensible
   records, then preserve coverage while replacing hand-positioned pins in bounded game-by-game sets.
4. **Terrain and renderer proof** — run T114's 2D US + Region proof with separate physical and post-war
   layers, measured loading cost, and the existing SVG fallback. Keep Local in game-space coordinates.
5. **Faction claims proof** — after the geographic renderer passes, inventory a small source-backed set and
   test overlapping, uncertain, independently toggleable territories without changing location records.
6. **Local export proof** — run T116 against the map editor: preserve native coordinates, generate original
   cartography and a compact manifest, prove a labelled raster baseline, then earn tiles or canvas by
   measurement. Confirm landmark names and categories before publishing them.
7. **Personal pins** — versioned browser-local store keyed by scope, create/edit/delete, validation, and
   JSON export/import. Keep one storage seam so a shared source can replace it later.
8. **Navigation** — pan/zoom with mouse, keyboard, and touch support; reduced-motion-safe transitions.
9. **Shared canon, only when needed** — add a reviewed external source after its ownership and moderation
   rules are decided. Do not overload the roster sheet as an incidental map database.

Each step must preserve the three-scope URLs, work at narrow widths, and pass the repository self-check.

## Regional orientation sources

The first Region schematic uses only broad, verified orientation anchors: Wendover, the Bonneville Salt
Flats, the I-80 corridor, the Silver Island Mountains, and southern salt works. It is intentionally not a
survey and reuses no source geometry or imagery. These anchors were checked against the [Bureau of Land
Management's Bonneville Salt Flats overview](https://www.blm.gov/visit/bonneville-salt-flats) and the
[Utah Geological Survey's field guide](https://geology.utah.gov/map-pub/survey-notes/geosights/bonneville-salt-flats/).
Future additions need a similarly direct source or explicit user confirmation.
