# Documentation index

This index separates current project contracts from active plans and historical records. If two documents
disagree, use the higher item in the order below and reconcile the lower document in the same change.

## Start here

1. [`HANDOFF-NEXT.md`](HANDOFF-NEXT.md) — current state, open decisions, next work, and shipping protocol.
2. [`../MAINTENANCE.md`](../MAINTENANCE.md) — implemented architecture, invariants, and operational details.
3. [`../TASKS.md`](../TASKS.md) — task specifications and completion record; the current queue is at the top.
4. [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — change discipline and recipes for extending the application.
5. [`../STYLE-GUIDE.md`](../STYLE-GUIDE.md) — visual-system rules.

`HANDOFF-NEXT.md` owns priority and current status. `MAINTENANCE.md` describes what is implemented. A roadmap
or task describes intended work until its heading explicitly says it is implemented. Git and the code remain
the final evidence of whether a change shipped.

## Active plans and evidence

- [`APP-FOUNDATION-GUIDE.md`](APP-FOUNDATION-GUIDE.md) — plain-language guide to the reusable app
  architecture, tools, quality gates, and staged learning programme introduced by T126.
- [`UI-UX-AUDIT.md`](UI-UX-AUDIT.md) — continuous product audit, findings, test matrix, and evidence log.
- [`ACCESSIBILITY-PLAN.md`](ACCESSIBILITY-PLAN.md) — completed accessibility baseline and retained checks.
- [`MAP-ARCHITECTURE.md`](MAP-ARCHITECTURE.md) — map data, renderer, territory, terrain, and Local-map contracts.
- [`MAP-DATA-INVENTORY.md`](MAP-DATA-INVENTORY.md) — migration boundary for the legacy US markers.
- [`MAP-FALLOUT-1-REVIEW.md`](MAP-FALLOUT-1-REVIEW.md),
  [`MAP-FALLOUT-2-REVIEW.md`](MAP-FALLOUT-2-REVIEW.md), and
  [`MAP-NEW-VEGAS-REVIEW.md`](MAP-NEW-VEGAS-REVIEW.md) — evidence and placement reviews.
- [`WIKI-INTEGRATION.md`](WIKI-INTEGRATION.md), [`WIKI-CATEGORISATION.md`](WIKI-CATEGORISATION.md), and
  [`WIKI-EDITS-TODO.md`](WIKI-EDITS-TODO.md) — wiki migration and content work.
- [`LEGAL-SWEEP.md`](LEGAL-SWEEP.md) — asset, font, and content licensing risks.
- [`DOC-AUTHORING.md`](DOC-AUTHORING.md) — source-document formatting guidance.
- [`MASTER-SHEET-PLAN.md`](MASTER-SHEET-PLAN.md) — parked data-model proposal, not the current sheet design.

## Reference material

- [`DESIGN-RELATIONSHIPS.md`](DESIGN-RELATIONSHIPS.md) — shipped Relations design rationale.
- [`CRT-COMPARISON.md`](CRT-COMPARISON.md) and [`CRT-Terminal-Theme-Guide.md`](CRT-Terminal-Theme-Guide.md) —
  earlier visual research; [`crt-theme.css`](crt-theme.css) is the guide's reusable companion stylesheet.
  Current application UI rules live in `STYLE-GUIDE.md`.
- [`../lib/prefs/README.md`](../lib/prefs/README.md) — parked reusable preferences prototype. It is not loaded
  by the application; T19 in `TASKS.md` records the possible future migration.
- [`AUDIT-2026-07-02.md`](AUDIT-2026-07-02.md) — security snapshot. Re-audit affected boundaries when code changes.
- [`T6-REGRESSION-SWEEP.md`](T6-REGRESSION-SWEEP.md) — historical regression evidence.

## Historical handoffs

The dated `HANDOFF-2026-07-*.md` files are immutable context snapshots, not instructions. They intentionally
retain obsolete names and decisions so the project history remains understandable. Do not update them to
describe current behavior; add current facts to `HANDOFF-NEXT.md` and the appropriate canonical document.

## Maintenance rule

Every behavior change must update the narrowest owning document in the same commit. Avoid repeating full
specifications across files: link to the owner and record only the local consequence. Run
`python3 tools/selfcheck.py` before committing; it validates local documentation links as well as application
and map-data integrity.
