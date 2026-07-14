# Map data inventory

This is the migration ledger between the 23 markers still rendered from `app.js` and the reviewed geographic
records intended to replace them in `data/world.json`. The machine-readable ledger is
`data/atlas-migration.json`; the repository self-check verifies that it covers the live marker array exactly.

## Baseline

| Game batch | Rendered markers | Matched world records | Records still required |
|---|---:|---:|---:|
| Fallout 1 | 9 | 3 | 6 |
| Fallout 2 | 3 | 1 | 2 |
| Fallout: New Vegas | 11 | 0 | 11 |
| **Total** | **23** | **4** | **19** |

The four structural matches are Vault 13, Shady Sands, the Boneyard, and New Reno. “Matched” means only that
the old marker has a corresponding world record; it does **not** mean its coordinates are reviewed.

`data/world.json` currently has 13 locations in total. Nine are outside this 23-marker migration: Canyon,
Megaton, New Vegas Strip, Diamond City, Vault 76, and four Wendover records. All 13 imported locations still
lack the `placement` and `evidence` fields required by `docs/MAP-ARCHITECTURE.md`, so the dataset remains
provisional.

## Batch order

1. **Fallout 1:** review placement for all nine rendered markers and add the six missing records. Establish
   several same-map identity anchors before inferring the Hub, Vault 13, Shady Sands, Mariposa, or the Glow.
2. **Fallout 2:** review New Reno and add Arroyo and Vault City. Gather additional named real-world anchors
   from the Fallout 2 map even when they are not yet rendered; three displayed points alone are not enough
   to justify a transform.
3. **New Vegas:** add the eleven rendered markers and review the existing Strip record. Prefer explicit
   real-world identities for named towns, roads, mountains, the airport, and Hoover Dam; use inference only
   where the fictional site is not directly identified.

Each accepted batch updates `world.json` and then changes the corresponding migration rows from
`research_required` to `matched`. The old `MAP_LOCATIONS` array remains the display source until a complete
game-sized batch passes evidence review, so migration cannot reduce public coverage.

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
