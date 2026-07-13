# UI/UX audit and continuous quality plan

This is the canonical plan for evaluating the whole application as a product: correctness, usability,
accessibility, visual coherence, performance, resilience, and maintainability. Keep active findings here;
resolved detail belongs in the implementing commit and Git history rather than an ever-growing archive.

This plan coordinates existing specialist work instead of replacing it:

- `ACCESSIBILITY-PLAN.md` records the completed substantive accessibility pass and its remaining external checks.
- `AUDIT-2026-07-02.md` records the security and correctness audit.
- `T6-REGRESSION-SWEEP.md` records the earlier feature regression sweep.
- `STYLE-GUIDE.md`, `MAINTENANCE.md`, and `CONTRIBUTING.md` define design and engineering invariants.

## Outcomes

The audit must produce more than a list of cosmetic opinions. It should:

1. find reproducible bugs and broken states;
2. identify friction in real user journeys;
3. expose visual, interaction, content, and terminology drift;
4. find unnecessary duplication, coupling, global state, and stale documentation;
5. establish measurable baselines before major map-interface changes;
6. convert accepted findings into small tasks with explicit acceptance criteria.

It is not a mandate for wholesale redesign. Preserve distinctive, working behaviour unless evidence shows
that a change improves comprehension, reliability, accessibility, or maintenance cost.

## Surfaces and journeys

Audit every surface at least once, then concentrate deeper testing on shared mechanisms and high-use paths:

| Surface | Essential journeys |
|---|---|
| Home and masthead | first-load orientation, faction selection, primary navigation, settings |
| Roster and dossier | loading, search, keyboard selection, direct character link, empty/error states |
| Relations | selection, graph/list comprehension, missing relationship data |
| Docs and wiki | load, switch rapidly, every scroll entry point, find, deep link, image/table handling |
| Map: US / Region / Local | scope changes, marker details, direct routes, narrow layout, reduced motion |
| Command palette | discovery, fuzzy results, keyboard-only operation, route coverage |
| Settings and modals | persistence, reset, focus management, close/restore behaviour |
| Fullscreen and boot states | enter/exit, refresh, reduced motion, interrupted transitions |
| Paperwork | parked; include only in regression coverage until its source application is available |

Cross-cutting states include first visit, warm cache, slow response, offline/failure, empty data, malformed
hash, browser back/forward, refresh on a deep link, and rapid navigation while work is still loading.

## Audit dimensions

### 1. Correctness and state

- route, breadcrumb, heading, selected tab, and visible content always agree;
- async work has clear ownership and cannot overwrite a newer view;
- refresh, back/forward, and direct hashes restore the same state;
- failures retain useful cached content and give truthful feedback;
- persistence, reset, and import/export paths do not silently lose data.

### 2. Information architecture and usability

- a first-time visitor can tell what the product contains and where they are;
- labels and navigation groupings match user intent rather than implementation details;
- primary actions are prominent and secondary controls do not compete with them;
- search, command navigation, and cross-links cover the same important destinations;
- empty, unavailable, and not-yet-linked content is distinguishable.

### 3. Accessibility and input

- keyboard order, focus visibility, semantics, announcements, and focus restoration;
- touch target size, gesture alternatives, and avoidance of hover-only information;
- text size, contrast, reflow, zoom, reduced motion, and high-contrast modes;
- VoiceOver spot-check and axe/Lighthouse checks remaining from `ACCESSIBILITY-PLAN.md`.

### 4. Visual system and content presentation

- hierarchy, spacing, alignment, density, typography, and component state consistency;
- screen-versus-metal material rules from `STYLE-GUIDE.md`;
- theme tokens rather than one-off values; all important meaning survives every colour preset;
- tables, long prose, images, maps, and dense records remain legible at their intended sizes;
- decorative effects support rather than obscure the current task.

### 5. Responsive behaviour

- representative widths: 1440, 1024, 760, 390, and 320 CSS pixels;
- no document-level horizontal overflow, clipped controls, overlapping layers, or unreachable content;
- layout changes preserve reading order and do not hide essential actions;
- pointer, touch, and keyboard paths reach equivalent outcomes.

### 6. Scrolling quality

Treat scrolling as an interaction system, not a collection of local calls. Audit the sidebar TOC,
in-document TOC, direct section links, find next/previous, back-to-top, active-section tracking, focus-mode
changes, roster/relations selection, and any nested table or rail scrolling.

- every action scrolls the intended container and never moves an ancestor accidentally;
- the heading or result lands at a consistent readable offset after fonts and lazy images settle;
- motion starts promptly, uses a graceful distance-appropriate path, and does not finish with a visible jerk;
- wheel, touch, or navigation input cancels programmatic motion immediately without pulling the user back;
- rapid successive requests replace the older target rather than racing it;
- active-section tracking follows the reader without oscillation, route churn, or main-content movement;
- the contents rail may reveal its active entry, but must scroll only itself;
- reduced-motion mode uses an immediate, correct jump while preserving all other behaviour;
- keyboard activation leaves focus and reading context understandable;
- behaviour remains correct when `scrollend` is unavailable and when layout changes mid-scroll.

Prefer one documented coordinator for content-target scrolling if Phase 0 confirms that separate handlers are
causing drift. Do not refactor merely for symmetry; preserve distinct selection-list behaviour where it has
different requirements.

### 7. Performance and resilience

- establish baseline load weight, request count, render responsiveness, and cache behaviour before budgets;
- avoid eager work for unopened sections and duplicated fetches for the same resource;
- test slow/offline data sources and unavailable browser capabilities;
- pin and self-host runtime dependencies where practical; load large map code only when the Map opens;
- keep third-party failure from blanking unrelated local content.

### 8. Entropy and maintainability

- identify duplicated constants, navigation registries, templates, styles, and documentation claims;
- find unreachable code, broad exception suppression, stale comments, and misleading completion labels;
- make state ownership and data boundaries explicit before splitting files or introducing abstractions;
- prefer one registry or adapter that drives repeated behaviour over several synchronized lists;
- add mechanical checks for recurring failures; do not rely on prose for enforceable invariants;
- remove obsolete rules when their replacement ships.

## Representative test matrix

Do not test the full Cartesian product of every theme, frame, width, input, and data state. Use this baseline
matrix, then expand only where a finding or changed component creates risk:

| Pass | Configuration | Purpose |
|---|---|---|
| A | 1440px, screen frame, default theme, pointer | primary visual, long-doc TOC, and journey baseline |
| B | 390px, screen frame, touch-sized viewport | mobile navigation, inline TOC, reflow, targets |
| C | 320px, large text, high contrast | worst-case reflow and legibility |
| D | 1024px, chassis frame, keyboard only | alternate material, focus, intermediate layout |
| E | reduced motion, direct deep links, back/forward | routing and transition correctness |
| F | slow/offline responses and warm cache | resilience, truthful status, stale-work ownership |

Spot-check all colour presets through shared token/component examples instead of replaying every journey.

## Findings and severity

Each active finding needs this minimum record:

```text
ID · severity · category · surface
Observation:
Reproduction or evidence:
User/maintenance impact:
Recommended direction:
Acceptance check:
Status:
```

Severity is based on impact, not implementation difficulty:

- **P0:** security, data loss, deploy blocker, or application-wide failure;
- **P1:** a core journey is broken, inaccessible, or materially misleading;
- **P2:** significant friction, inconsistency, performance cost, or recurring maintenance risk;
- **P3:** useful polish or an opportunity whose value should be weighed against churn.

Record observations before prescribing large solutions. Several symptoms may share one cause and should
become one task. Conversely, unrelated fixes must not be bundled merely because one audit discovered them.

## Delivery sequence and gates

### Phase 0 — baseline and inventory

Run the surface/journey matrix without changing behaviour. Record console/network failures, route/state
disagreements, responsive breakage, task friction, and obvious entropy. Establish performance measurements.

**Gate:** every surface has a recorded pass; every finding has evidence, severity, and an acceptance check.

### Phase 1 — correctness and access

Fix P0/P1 issues in dependency order. Complete the outstanding live axe/Lighthouse and VoiceOver checks.

**Gate:** no accepted P0/P1 findings remain; selfcheck and targeted manual regressions pass.

### Phase 2 — journeys and visual coherence

Address accepted P2 usability, information-architecture, responsive, and design-system findings. Group work
by shared cause, not by screen, so global fixes replace repeated local patches.

**Gate:** primary journeys work without undocumented exceptions across passes A–F.

### Phase 3 — entropy and performance

Remove verified duplication and dead paths, clarify state/data ownership, convert recurring checks into
automation, and establish budgets from the Phase 0 measurements. Refactor only behind characterised behaviour.

**Gate:** documentation has one current source for each contract; new safeguards cover the failure classes
found during the audit.

### Phase 4 — map integration review

Run the geographic renderer proof against the baseline. Compare interaction quality, load cost, visual fit,
reduced-motion behaviour, failure handling, attribution, and the handoff into Local game-space coordinates.

**Gate:** the renderer earns its permanent dependency; otherwise retain the original SVG architecture.

### Phase 5 — continuous regression

After each substantial feature, rerun only the affected journeys plus one cross-cutting pass. Rerun the full
matrix before a public milestone. Keep this document's active findings current and delete resolved entries.

## Active findings

### UX-001 · P1 · scrolling · Docs and wiki

**Observation:** TOC navigation can still feel stuck or land incorrectly despite the earlier targeted fix.
The reader currently has separate paths for sidebar TOC clicks, inline TOC links, deep-linked headings, find
results, back-to-top, and active-entry reveal; they do not all share cancellation or layout-settling behaviour.

**Reproduction or evidence:** user report. Reproduce across cold/warm documents and wiki pages, wide sidebar
and narrow inline TOCs, long and image-heavy content, immediate clicks after switching, rapid successive
clicks, focus-mode entry/exit, reduced motion, mouse wheel, touch, and keyboard activation. Instrument the
intended container, target geometry, `scrollTop`, layout shifts, cancellation, and active-section changes.

**User/maintenance impact:** a core reading/navigation action feels unreliable, and several independent
handlers can regress differently.

**Recommended direction:** first identify which failures remain. If duplication is causal, route content
targets through one cancellation-aware coordinator and keep active-rail reveal explicitly scoped to its own
scroll container.

**Acceptance check:** sidebar and inline TOCs, direct links, find stepping, and back-to-top always reach the
correct target; motion is smooth and prompt; layout settling causes no visible final jump; user input cancels
without snap-back; active tracking never moves the main reader; reduced motion is immediate; no stuck state
occurs in the tested matrix.

**Status:** open — first reproduction target in Phase 0.

## Audit runs

Add one row per representative pass. Link finding IDs in Notes rather than duplicating their contents.

| Run | Date | Configuration | Surfaces covered | Result | Notes |
|---|---|---|---|---|---|
| — | — | — | — | Not started | Phase 0 baseline pending |
