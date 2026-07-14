# Fallout 1 atlas evidence review

This review reconciles the first game-sized research delta against the map data contract. It adds a world
record for every rendered Fallout 1 marker without making the provisional dataset visible in the app.
“Matched” means a stable world record now exists; it does not mean that record is approved for display.

## Intake findings

The submitted payload covered all nine requested markers in the correct order, but it was not valid JSON:
six trailing commas had to be removed before it could be parsed. An instruction block unrelated to the data
contract was discarded, and two source entries resolving to the same URL were deduplicated during review.
The raw payload is not stored in the repository.

Its proposed points could not be accepted as a set:

- Vault 13 was described as northwest of Shady Sands, while the proposed latitude placed it south.
- The Hub was described as south of Shady Sands, while the proposed latitude placed it north.
- Necropolis was described as east or northeast of the Hub, while the proposed longitude placed it west.
- Necropolis was said to lack a named real-world identity, but the referenced material identifies it as the
  remains of Bakersfield.
- Mariposa omitted a material conflict between the game-map position, Fort Ord design inspiration, and a
  later Clouds Rest or Yosemite-area placement.
- Every contradiction list was empty despite these conflicts.

These issues do not make the research useless. The location coverage, source leads, and relative-position
notes are valuable once separated from unsupported precision.

## Reconciliation decisions

| Location | Record decision | Placement decision | Reason |
|---|---|---|---|
| Vault 13 | Updated | Provisional, 120 km | Retain the legacy candidate only for comparison; same-map directions conflict. |
| Shady Sands | Updated | Provisional, 120 km | Retain the legacy candidate only for comparison; it is not a real-world identity anchor. |
| The Boneyard | Updated | Provisional, 15 km | Los Angeles identity is explicit; the point represents the metropolitan centre. |
| The Hub | Added | Withheld | Settlement identity is clear, but no real-world city or consistent inferred point was verified. |
| Necropolis | Added | Provisional, 15 km | Bakersfield identity is explicit; the point represents the city centre. |
| Lost Hills | Added | Provisional, 80 km | The same-name California place is a useful locus, not proof of exact identity. |
| Mariposa Military Base | Added | Withheld | Competing geographic traditions cannot responsibly be collapsed into one point. |
| The Glow | Added | Withheld | Relative map evidence depends on unresolved anchors and does not fix a real-world site. |
| The Cathedral | Added | Provisional, 15 km | It belongs to the Los Angeles and Boneyard cluster; an exact building is not established. |

## Result and next gate

Fallout 1 now has nine of nine migration records, with three deliberately lacking coordinates. The app
continues to render its existing marker set; this change improves the research boundary only. Before any
Fallout 1 points move to `reviewed`, the remaining provisional candidates need a single same-game fit using
at least two explicit real-world identity anchors, documented distortion, and conservative uncertainty.

The next record-coverage batch is Fallout 2. Placement approval for Fallout 1 remains a separate open gate,
so adding records cannot be mistaken for approving coordinates.
