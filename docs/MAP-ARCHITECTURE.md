# Map architecture

The Map tab has three deliberate scales, selected by one route-aware pill:

| Scope | Purpose | Source boundary |
|---|---|---|
| **US** | Reference atlas for established wasteland locations and timelines. | Original US outline and paraphrased, reviewed lore entries. |
| **Region** | Wider Wendover context: approaches, settlements, routes, and regional landmarks. | Original schematic informed by verified place data. |
| **Local** | The playable Wendover game space at useful encounter-planning scale. | Original schematic informed by supplied game references and confirmed landmark names. |

`#map` opens the US atlas. `#map/region` and `#map/local` open the corresponding scale directly.
The Wendover marker on the US atlas opens **Region**, preserving the natural zoom order.

## Data boundary

Raw editor exports, screenshots, and research notes are references only. They live under the ignored
`added files by user/` folder and are never shipped or committed. Published maps use original vector
geometry and compact reviewed data. Do not trace a game screenshot or embed its tiles/sprites.

Region and Local map data will use a fixed `1000 × 700` coordinate space. This keeps coordinates stable
across responsive rendering and makes pins, routes, import/export, and a later shared store independent
of the artwork implementation.

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

```json
{
  "version": 1,
  "scope": "local",
  "viewBox": [0, 0, 1000, 700],
  "landmarks": [
    {
      "id": "stable-kebab-id",
      "name": "Published name",
      "x": 500,
      "y": 350,
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
4. **Faction claims proof** — after the geographic renderer passes, inventory a small source-backed set and
   test overlapping, uncertain, independently toggleable territories without changing location records.
5. **Local base** — original playable-area schematic, using a cleaner in-game overview as spatial reference;
   confirm landmark names and categories before publishing them.
6. **Personal pins** — versioned browser-local store keyed by scope, create/edit/delete, validation, and
   JSON export/import. Keep one storage seam so a shared source can replace it later.
7. **Navigation** — pan/zoom with mouse, keyboard, and touch support; reduced-motion-safe transitions.
8. **Shared canon, only when needed** — add a reviewed external source after its ownership and moderation
   rules are decided. Do not overload the roster sheet as an incidental map database.

Each step must preserve the three-scope URLs, work at narrow widths, and pass the repository self-check.

## Regional orientation sources

The first Region schematic uses only broad, verified orientation anchors: Wendover, the Bonneville Salt
Flats, the I-80 corridor, the Silver Island Mountains, and southern salt works. It is intentionally not a
survey and reuses no source geometry or imagery. These anchors were checked against the [Bureau of Land
Management's Bonneville Salt Flats overview](https://www.blm.gov/visit/bonneville-salt-flats) and the
[Utah Geological Survey's field guide](https://geology.utah.gov/map-pub/survey-notes/geosights/bonneville-salt-flats/).
Future additions need a similarly direct source or explicit user confirmation.
