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
3. **Local base** — original playable-area schematic, using a cleaner in-game overview as spatial reference;
   confirm landmark names and categories before publishing them.
4. **Personal pins** — versioned browser-local store keyed by scope, create/edit/delete, validation, and
   JSON export/import. Keep one storage seam so a shared source can replace it later.
5. **Navigation** — pan/zoom with mouse, keyboard, and touch support; reduced-motion-safe transitions.
6. **Shared canon, only when needed** — add a reviewed external source after its ownership and moderation
   rules are decided. Do not overload the roster sheet as an incidental map database.

Each step must preserve the three-scope URLs, work at narrow widths, and pass the repository self-check.
