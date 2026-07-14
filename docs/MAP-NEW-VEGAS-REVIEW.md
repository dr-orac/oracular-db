# Fallout: New Vegas atlas evidence review

This review reconciles all eleven rendered New Vegas markers and the existing Strip record without changing
the public map. “Matched” means that a stable world record exists; every coordinate remains provisional until
its evidence and visual treatment pass the display gate.

## Evidence method

New Vegas uses recognisable southern Nevada geography but compresses and rearranges travel space for play.
The records therefore prefer a direct real-world identity over a transform of the game map. Where the game
uses a fictional site in a known real area, the point is only a regional locus and carries a wider radius.

The evidence falls into three tiers:

1. **Direct identities:** Goodsprings, Primm, Boulder City, Hoover Dam, Camp McCarran, Cottonwood Cove, and
   Nelson are identified with real places or infrastructure. The existing Strip record belongs to this tier.
2. **Same-area counterparts:** the Fort, Jacobstown, and Black Mountain occupy the Fortification Hill, Mount
   Charleston, and Sloan Canyon Black Mountain areas respectively. Their real landmarks constrain the region
   but do not make the fictional structures exact matches.
3. **Fictional corridor placement:** Novac has no real town identity. Its point represents a broad Highway 95
   corridor near the Nelson junction. The real roadside dinosaurs that influenced its sign are not treated as
   the location of the settlement.

Government geographic references provide independent point checks for
[Goodsprings](https://tigerweb.geo.census.gov/tigerwebmain/Files/bas26/tigerweb_bas26_cdp_nv.html),
[the Las Vegas airport](https://www.airnav.com/airport/LAS),
[Cottonwood Cove](https://data.usbr.gov/location/3535), and
[Fortification Hill](https://www.nps.gov/lake/learn/nature/fortification-hill.htm). The source registry in
`data/world.json` keeps these geographic references distinct from the secondary indexes used to find game,
guide, dialogue, and design statements.

## Reconciliation decisions

| Location | Basis | Candidate point | Radius | Decision |
|---|---|---:|---:|---|
| New Vegas Strip | Real-world identity | `36.1147,-115.1728` | 8 km | Updated the existing record to the evidence shape. |
| Goodsprings | Real-world identity | `35.8319,-115.4353` | 4 km | Uses the government geographic centre, not an individual building. |
| Primm | Real-world identity | `35.6127,-115.3906` | 4 km | Uses the real town centre beside Interstate 15. |
| Novac | Regional inference | `35.7200,-114.9400` | 25 km | Broad Highway 95 corridor hypothesis; no real settlement identity is claimed. |
| Boulder City | Real-world identity | `35.9781,-114.8464` | 5 km | Represents the real city rather than the compressed ruin layout. |
| Hoover Dam | Real-world identity | `36.0156,-114.7378` | 2 km | Uses the real dam complex, the strongest exact anchor in the batch. |
| The Fort | Regional inference | `36.0442,-114.6814` | 8 km | Fortification Hill is the area locus, not an exact camp coordinate. |
| Camp McCarran | Real-world identity | `36.0803,-115.1524` | 5 km | Uses the published airport reference point. |
| Cottonwood Cove | Real-world identity | `35.4941,-114.6803` | 3 km | Uses the published cove location, not fictional fortification geometry. |
| Nelson | Real-world identity | `35.7086,-114.8310` | 5 km | Represents the small real settlement area. |
| Jacobstown | Regional inference | `36.2692,-115.5935` | 8 km | Mount Charleston lodge area is a counterpart, not a literal building match. |
| Black Mountain | Regional inference | `35.9308,-115.0428` | 8 km | The real summit constrains the area without proving a tower point. |

## Result and next gate

All eleven New Vegas migration rows now have stable world records, completing the 23-marker record-coverage
milestone. The Strip was also reconciled, so all twelve New Vegas records use explicit basis, status,
uncertainty, and linked evidence.

None is yet marked `reviewed`. Before renderer migration, direct identities need final claim-level checks
against game or official-guide material, and the user interface must show uncertainty without implying that
a radius is an exact boundary. Novac, the Fort, Jacobstown, and Black Mountain should remain visibly
inferential even if the direct identities are promoted first.
