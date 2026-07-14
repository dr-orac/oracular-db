# Fallout 2 atlas evidence review

This review reconciles the three rendered Fallout 2 markers while using additional locations from the same
shipped world map as geometric checks. It creates broad research placements without changing the public map.
“Matched” continues to mean that a stable world record exists, not that its coordinate is display-approved.

## Evidence method

The shipped `CITY.TXT` data provides exact world-map pixel positions. The useful same-map loci are:

| Location | World-map position | Real-world role |
|---|---:|---|
| Arroyo | 184,133 | Fictional site; the developer reference says the founders headed north and later groups it with Northern California. |
| Klamath | 373,122 | Klamath Falls identity anchor in the developer reference. |
| Vault City | 1223,322 | Unknown site; the target of the inference. |
| Redding | 673,522 | Strong named-city anchor. |
| New Reno | 923,922 | Strong Reno identity anchor, visibly displaced on the game map. |
| San Francisco | 472,1322 | Strong named-city anchor. |

The Arroyo block contains an earlier `173,122` value followed by `184,133`; the latter is used because it is
the final value in the shipped-data transcript. That ambiguity is retained here instead of being silently
discarded.

The developer reference does not say that Arroyo is in southwest Oregon: it records a northward founding
journey, later describes a Northern California drought affecting Arroyo and Modoc, and says Tim Cain regarded
Arroyo as fictional. This mixed evidence is why the candidate straddles the state frontier.

An exploratory affine fit using Klamath Falls, Redding, New Reno, and San Francisco estimated Arroyo near
`42.0,-123.1` and Vault City near `41.7,-119.0`. The fit missed anchor longitude by as much as 1.12 degrees,
while New Reno itself is visibly shifted west on the game map. Those residuals rule out exact coordinates
derived from one global transform. The fit is therefore used only to choose a broad region and uncertainty,
not as a geographic conversion formula.

## Reconciliation decisions

| Location | Record decision | Placement decision | Reason |
|---|---|---|---|
| Arroyo | Added | Provisional, 130 km | The fictional site is west of Klamath Falls on the game map; developer material alternately points northward and groups it with Northern California. |
| New Reno | Updated | Provisional, 15 km | Reno identity is explicit; the real metropolitan centre is more defensible than the displaced game-map point. |
| Vault City | Added | Provisional, 130 km | The map puts it north-east of Reno in northwest Nevada, while its own travel log calls the setting Northern California. A border-centred point preserves both. |

## Result and next gate

Fallout 2 now has three of three migration records. Each has a coordinate, but none is promoted to `reviewed`:
New Reno still needs a direct game or guide citation for final approval, while Arroyo and Vault City are
regional hypotheses that must retain visible uncertainty in any future renderer.

The next record-coverage batch is Fallout: New Vegas. Its many explicit real-world identities should be
handled directly before inference is used for fictional sites such as the Fort or Jacobstown.
