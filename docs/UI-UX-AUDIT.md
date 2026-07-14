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

**Observation:** confirmed. A sidebar TOC click moved both the reader and the document page. The requested
heading could finish above the visible reader while active-entry reveal independently moved another ancestor.
Separate deep-link, inline-TOC, and find paths used the same unsafe browser primitive.

**Reproduction or evidence:** in the 1280px Tribe Lore reader, clicking `The Tree of Life` changed the outer
page from `scrollY=0` to `202`; the reader's top moved from about `201px` to `0`, and the heading finished
about `84px` above it. After routing all content targets through the reader, physical TOC clicks kept the page
at `0`, the reader at about `202px`, and headings at their `14px` margin. A live wheel takeover stopped an
in-flight jump and applied exactly the wheel delta with no later snap-back. Reduced motion landed within the
first 30ms sample. At 390px, physical document-find input centered the result without moving the page. The
wiki reader, focus-mode entry/exit, and a genuinely cold Roleplay Guide load with nine deferred figures all
preserved the same target and page containment. The image-heavy deep link remained aligned after hydration.

**User/maintenance impact:** a core reading/navigation action feels unreliable, and several independent
handlers can regress differently.

**Recommended direction:** implemented for sidebar TOC, inline TOC, deep links, and document find: explicit
reader coordinates, a bounded owned animation, one late-layout correction, input cancellation, and an
independent contents-rail reveal. Back-to-top now uses the same coordinator rather than slow native smooth
scrolling. Active-route writes occur only when the section changes.

**Acceptance check:** sidebar and inline TOCs, direct links, find stepping, and back-to-top always reach the
correct target; motion is smooth and prompt; layout settling causes no visible final jump; user input cancels
without snap-back; active tracking never moves the main reader; reduced motion is immediate; no stuck state
occurs in the tested matrix.

**Status:** implemented; local regression pass complete. Neither available Google document exports inline
TOC anchors, so that path needs a suitable source document. Retain independent keyboard activation and a
real touch-device pass as external checks; the browser driver could focus the native links but did not
reliably dispatch its synthetic Enter action, so no application conclusion was drawn from it.

### UX-002 · P2 · correctness and entropy · Home, masthead, routing, command palette

**Observation:** section availability is independently encoded in faction switching, two route guards, home
cards, faction tabs, primary navigation, page headings, and command-palette items. Those copies have drifted.
`applyFaction()` preserves only Home, Roster, or a current faction document, so switching faction from
Relations or the faction-agnostic Map/Wiki/Paperwork surfaces unexpectedly opens Roster. The global Wiki uses
a faction-branded application heading. The command palette promises global navigation but omits Paperwork
and hard-codes only Tribe relations and documents.

**Reproduction or evidence:** static ownership trace in `app.js`: the Roster/Relations/document list is built
separately by `renderHome()` and `renderNav()`; umbrella ids are repeated by `applyRoute()`, `setSection()`,
`renderPrimaryNav()`, and `writeRoute()`; `applyFaction()` uses a narrower validity rule; `cmdk.items()` has
another hand-built destination list. The canonical handoff currently instructs contributors to update five
locations for one new umbrella section, confirming that synchronization is manual.

**User/maintenance impact:** faction selection can discard the user's current task, global surfaces present
contradictory identity, and new or faction-specific destinations can silently disappear from discovery tools.
Every added section increases the number of synchronized edits and the chance of another partial feature.

**Recommended direction:** define one small registry for umbrella sections and one function for a faction's
Roster/Relations/document sections. Use them for availability, labels, home/tabs, and palette discovery while
keeping `setSection()`'s rendering branches explicit. Do not turn the registry into a generic rendering
framework; its purpose is shared metadata and validation.

**Acceptance check:** switching faction preserves Home, Map, Wiki, Paperwork, Roster, and Relations; a faction
document survives only where the destination exists and otherwise falls back truthfully to Roster; global
headings use the Misfits Database identity; direct malformed routes remain safe; home, tabs, primary nav, and
command palette expose the destinations dictated by the shared registries with no hard-coded Tribe exception.

**Status:** implemented 2026-07-13. Live reproduction confirmed the trace: Map/Region switched to the new
faction's Roster, Relations switched to Roster, Wiki inherited the NCR heading, and the palette omitted
Paperwork and all non-Tribe Relations destinations. One umbrella registry and one faction-section builder now
own shared identity, availability, labels, and discovery while rendering remains explicit. All global/base
continuity cases pass; unavailable documents fall back to Roster; malformed section, map-scope, and character
routes canonicalise safely; same-id document loads are tied to their faction and exact source. The palette has
44 registry-derived destinations. Verification also exposed an independent 1280px hit-area collision: the
centred faction control covered Map/Paperwork. Intermediate desktop widths now use four 46px icon controls
with accessible names/titles; full labels return where measured room exists.

### UX-003 · P1 · correctness and accessibility · Roster List, Cards, dossier

**Observation:** query, section filter, and sort state do not produce one shared visible roster. The List
applies the section filter only while constructing rows, after the dossier and listbox selection have already
been derived from the broader search result. Cards uses only the search result and ignores both section and
sort controls. Filter/sort handlers call `renderRoster()` even when Cards is the active view.

**Reproduction or evidence:** with 55 Tribe characters, select Stacey Webb and change the section filter to
The Tribe. The List displays 48 in-section rows, but the dossier and URL remain Stacey Webb and
`aria-activedescendant="row-53"` names an option absent from the DOM. Switching to Cards shows all 55 cards,
including Stacey. Selecting Name A–Z sorts the List from Andrew Stone onward, while Cards still starts with
Big Brom Matlok in sheet order. A no-match query leaves zero options but retains the missing `row-53` active
descendant.

**User/maintenance impact:** a visible filter gives contradictory results across two layouts, the detail pane
can describe a character the List claims is excluded, and assistive technology receives an invalid selection.
Future controls would add another place for the representations to drift.

**Recommended direction:** derive one query+section visible-character set, then let List and Cards present it.
Normalize a displaced selection to the first visible character, clear active-descendant when there are no
options, render whichever layout is active after control changes, and apply the selected sort to Cards when
search relevance is not the ordering source.

**Acceptance check:** rows, cards, dossier, route, and active-descendant agree through query/filter changes;
Cards respects section and sort controls; empty results reference no absent option; pointer and keyboard paths
pass at representative wide and narrow widths.

**Status:** implemented 2026-07-14. `visibleRosterCharacters()` now supplies List, Cards, dossier selection,
and keyboard movement. Filter/sort handlers render the active layout; Cards honors section and non-search
sort order; excluded selections move to the first displayed character; empty results clear active-descendant
and the character route; explicit character jumps clear constraints that would hide them. List/Cards now
expose their selected tab state. The original 55/48-character, Name A–Z, no-match, and keyboard display-order
reproductions pass at 1440px and 390px with no document overflow.

### UX-004 · P2 · correctness · Relations routing

**Observation:** an invalid Relations character deep link falls back safely in the UI but retains the invalid
hash. For example, `#tribe/relations/not-a-character` shows Big Brom Matlok while the URL still names the
missing target. Valid direct targets and keyboard selection otherwise keep panel, rail, ARIA, and route aligned.

**User/maintenance impact:** copying or refreshing the URL does not describe the visible state and malformed
Roster and Relations links repair differently.

**Recommended direction:** when a pending Relations slug is absent, clear it and repair to the base Relations
route after the current route application completes. Do not invent or silently select a different slug in the
URL.

**Acceptance check:** malformed targets canonicalise to `#<faction>/relations`; valid targets and pointer/
keyboard selection retain their character slug; selected rail option, panel, and active-descendant agree.

**Status:** implemented 2026-07-14. An absent pending slug schedules a guarded repair that runs only if the
URL still contains that exact stale target. The invalid route canonicalises to base Relations without
changing the current panel; a valid Stacey Webb deep link and keyboard Home selection retain their character
routes and keep rail, panel, and active-descendant aligned.

### UX-005 · P1 · boot and correctness · fresh direct Roster route

**Observation:** a fresh load on `#<faction>/roster[/<character>]` can remain indefinitely on “ACCESSING
PIP-LINK” when that linked faction is already the remembered faction. `currentSection` is initialised to
`roster`; `applyRoute()` sees no faction or section change and therefore never enters `setSection()` or starts
the sheet request. Loading the same link while another faction is remembered works because `applyFaction()`
starts the roster lifecycle, which makes the defect preference-dependent.

**User/maintenance impact:** a valid shared Roster or character URL can fail on first load based only on the
visitor's previous faction, with no error or recovery instruction. Clicking the visible Roster tab starts the
load, but a direct link must not require that undocumented action.

**Recommended direction:** make first route application enter the Roster lifecycle when no model/load owns
the view, even if the section id already equals the internal default. Keep subsequent same-section routing
idempotent and retain a valid pending character until data arrives.

**Acceptance check:** with the route faction already remembered, fresh Roster and character URLs start one
load, leave the loader, render the correct faction, and restore the character target; ordinary hash changes
do not duplicate requests; unlinked faction routes still show their truthful unavailable state.

**Status:** implemented 2026-07-14. `applyRoute()` now distinguishes faction changes, whose existing lifecycle
already owns loading, from a same-faction fresh Roster route with no model or in-flight request. Only the
latter re-enters `setSection()`. Fresh remembered-Tribe base and Stacey Webb character routes leave the
loader and restore selection/ARIA/URL correctly; a fresh remembered-NCR route retains the unavailable state.

## Audit runs

Add one row per representative pass. Link finding IDs in Notes rather than duplicating their contents.

| Run | Date | Configuration | Surfaces covered | Result | Notes |
|---|---|---|---|---|---|
| A/E | 2026-07-13 | 1280px, pointer, default + reduced motion | Tribe Lore sidebar, deep link, rapid replacement, wheel takeover | Core pass | UX-001 structural failure fixed; headings land at 14px without outer-page movement |
| B | 2026-07-13 | 390px, physical input, default + reduced motion | Tribe Lore document find | Core pass | Result centered inside reader; outer page remained at 0; residual narrow paths remain under UX-001 |
| A/E | 2026-07-13 | 1280px, pointer, default + reduced motion | Wiki TOC, focus mode, back-to-top | Pass | Back-to-top joined the bounded coordinator; normal mode reached 0 by 620ms and reduced motion by the 30ms sample |
| A/F | 2026-07-13 | 1280px, cold load, nine deferred figures | Roleplay Guide TOC and deep link | Pass | Far appendix held its 14px offset before and after hydration; page remained at 0 |
| Static | 2026-07-13 | section-ownership trace | Home, masthead, router, headings, command palette | Finding | UX-002: duplicated section registries have already drifted in continuity and destination coverage |
| A | 2026-07-13 | 1760px + compact 1280/1024px, pointer | Home, masthead, routes, faction tabs, Docs, Map, Wiki, Paperwork | Pass | UX-002 fixed; global/base continuity, unavailable-doc fallback, malformed-route repair, headings, selected state, and nav hit areas agree |
| B | 2026-07-13 | 390px, pointer + keyboard | Primary navigation, Map, Paperwork, command palette | Pass | No horizontal overflow; every nav centre resolves to its control; Map/Paperwork pointer path and Paperwork palette selection pass |
| A/E | 2026-07-14 | 1440px, pointer + keyboard, direct routes | Roster List/Cards/dossier, Relations, unavailable faction | Finding | UX-003: List/Cards/filter/sort/selection drift; UX-004: invalid Relations target is not canonicalised. Valid in-session selection, keyboard stepping, and UI faction-switch unavailable states pass |
| A/B | 2026-07-14 | 1440px + 390px, pointer + keyboard | Roster List/Cards/dossier, filters, sorting, empty search | Pass | UX-003 fixed: shared 48-character filter, A–Z Cards, route/selection/ARIA sync, no-match state, and display-order `j` navigation pass with 0px overflow |
| E | 2026-07-14 | fresh direct route, remembered Tribe faction | Roster boot and character link | Finding | UX-005: route equals the internal default, so no section lifecycle or sheet load starts; Roster tab activation recovers |
| E | 2026-07-14 | fresh direct routes, remembered matching faction | Tribe Roster/base + Stacey Webb; NCR unavailable Roster | Pass | UX-005 fixed: linked routes enter one lifecycle and restore the target; unlinked route remains truthful |
| A/E | 2026-07-14 | 1440px, direct route + keyboard | Relations valid/invalid target and Home selection | Pass | UX-004 fixed: invalid slug repairs to base route; valid Stacey Webb and keyboard Big Brom routes retain full selection agreement |
