# T6 — recent-feature regression sweep (findings)

End-to-end walk of the features shipped in T1–T5 + the Chassis frame mode and doc reader.
Two real bugs were found and fixed; the rest passed. Recorded per T6's acceptance
("list everything else in the summary with repro steps").

## Bugs found + fixed

1. **Doc tab-switch stale-render race** — FIXED (commit "Fix doc tab-switch stale-render race").
   Repro: empty the doc cache, click one doc tab, then quickly click the other before the
   first finishes. The nav tab/title showed the second doc but the body rendered the first.
   Cause: two overlapping cold loads; the later-resolving `await` rendered last, clobbering
   the selected doc. Fix: `loadDoc()` bails after its fetch settles if `currentSection` has
   changed (guarded on both success and error), and the shared loader timer is only stopped
   when still current. Verified fixed on the exact repro.

2. **Chassis-mobile `// PIP-LINK` overflow at 375px** — already resolved.
   The label-tape strip is hidden on narrow screens in chassis mode
   (`body[data-frame="border"] .brand small{ display:none }` in the ≤760px media query).
   Verified: `display:none` and no horizontal overflow at 375px.

## Passed

- **Find-in-doc** — type / step (▲▼, Enter, Shift+Enter) / Esc-clear work across both docs;
  match count + no-match state correct; DOM restored cleanly on clear.
- **Chassis across all 8 colour presets + frame tint** — every preset applies a distinct
  accent; `frametint: theme` re-derives the metal `--panel-*` palette per preset
  (verified green/amber/blue). No overflow desktop or mobile.
- **Theme popover collapsed-group summaries** — populate correctly (type / screen / frame
  value lines) via `refreshCur()` on popover interaction and reset.
- **Keyboard nav** — `/` focuses search; `j`/`k` (and arrows) step the roster selection.
- **Default "Screen only" frame mode** — unchanged by all the Chassis/bezel/metal work
  (no border-image, no main padding).

## Caveat — preview-harness limitation (not a product finding)

- **Lazy doc-image hydration on scroll** could not be exercised live: the preview browser
  runs as a hidden/background tab, which suspends IntersectionObserver and throttles scroll/
  rAF (documented in MAINTENANCE "Doc reader"). The mechanism was verified structurally by
  direct invocation when built (placeholders → context populated → src assigned). Recommend
  a 10-second manual scroll-through on the live site to confirm the fade-in end-to-end.
- **Find-in-doc** showed one non-reproducing intermittent zero-result in the harness that
  did not recur on careful retry and worked via direct `runDocFind()` — attributed to
  harness timing under background-tab throttling, not a product defect. Worth a glance
  during the same live pass.
