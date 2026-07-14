# Map data inventory

This is the migration ledger between the 23 markers still rendered from `app.js` and the reviewed geographic
records intended to replace them in `data/world.json`. The machine-readable ledger is
`data/atlas-migration.json`; the repository self-check verifies that it covers the live marker array exactly.

## Baseline

| Game batch | Rendered markers | Matched world records | Records still required |
|---|---:|---:|---:|
| Fallout 1 | 9 | 9 | 0 |
| Fallout 2 | 3 | 3 | 0 |
| Fallout: New Vegas | 11 | 11 | 0 |
| **Total** | **23** | **23** | **0** |

All 23 legacy markers now have structural matches. “Matched” means only that the old marker has a
corresponding world record; it does **not** mean its coordinates are reviewed. Three Fallout 1 records
deliberately have no coordinates because their placement is withheld.

`data/world.json` currently has 32 locations in total. Nine are outside this 23-marker migration: Canyon,
Megaton, New Vegas Strip, Diamond City, Vault 76, and four Wendover records. All 23 migration records plus the
Strip use the placement and evidence shape required by `docs/MAP-ARCHITECTURE.md`; the other eight locations
still need that reconciliation, and every migrated placement remains provisional or withheld. The dataset
therefore remains provisional.

## Batch order

1. **Fallout 1 record coverage — complete:** all nine rendered markers have records. The evidence review is
   recorded in `docs/MAP-FALLOUT-1-REVIEW.md`; placement approval remains open and requires a consistent
   same-map anchor fit before any provisional or withheld point is promoted.
2. **Fallout 2 record coverage — complete:** New Reno, Arroyo, and Vault City are reconciled in
   `docs/MAP-FALLOUT-2-REVIEW.md`. The review uses additional shipped-map loci and documents why the map's
   distortion supports only broad regional inference for Arroyo and Vault City.
3. **New Vegas record coverage — complete:** all eleven rendered markers and the existing Strip record are
   reconciled in `docs/MAP-NEW-VEGAS-REVIEW.md`. Seven rendered markers use direct real-world identities,
   three use same-area counterparts, and fictional Novac retains a broad corridor placement.

The old `MAP_LOCATIONS` array remains the display source until a complete game-sized batch passes placement
review, so record migration cannot reduce public coverage. The next gate is to promote only defensible direct
identities, design an honest uncertainty treatment, and then migrate one game-sized renderer batch.

## Research delta contract

Research should return only new placement evidence, not repeat descriptions, timelines, terrain definitions,
regions, faction zones, or Wendover material already present. Use this compact shape:

```json
{
  "version": 1,
  "batch": "fallout_1_atlas_placement_delta",
  "sources": [
    {
      "id": "stable-source-id",
      "title": "Source title",
      "url": "https://example.invalid/direct-page",
      "kind": "official_game_material|developer_statement|reference_work|community_reference"
    }
  ],
  "locations": [
    {
      "legacy_id": "vault13",
      "world_location_id": "f1_vault_13",
      "action": "update",
      "canon_scope": "fallout_1",
      "identity_note": "What the sources explicitly identify, without geographic inference.",
      "coordinates": { "latitude": 0, "longitude": 0 },
      "placement": {
        "basis": "real_world_identity|game_map_inference|regional_inference|unknown",
        "status": "provisional|withheld",
        "precision_km": 0,
        "method_note": "How the candidate point and uncertainty were derived."
      },
      "evidence": [
        {
          "source_id": "stable-source-id",
          "supports": "identity|placement|relative_position",
          "locator": "Map label, page, section, or dialogue identifier",
          "note": "Concise statement of what this source establishes."
        }
      ],
      "alternatives": [],
      "contradictions": []
    }
  ]
}
```

Use `action: "add"` plus a new stable world id for a missing record. Omit `coordinates` when the evidence does
not justify a point. Research output never marks a placement `reviewed`; that status is set only after local
reconciliation confirms the sources, cross-map method, uncertainty, and internal references.
