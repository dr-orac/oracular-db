# Building dependable interface apps — a plain-language guide

This is the reusable learning guide behind the Misfits Database. It explains what the major pieces of a
modern interface application do, why they exist, and when they are worth adding. It is intentionally written
for a product owner or developing builder rather than assuming professional frontend vocabulary.

The project-specific visual rules remain in [`../STYLE-GUIDE.md`](../STYLE-GUIDE.md). The staged migration
of this repository is T126 in [`../TASKS.md`](../TASKS.md). This guide describes the intended foundation; it
does not claim that every tool below is already installed.

---

## The central idea

A dependable app is not one enormous clever system. It is a small number of layers with clear jobs:

```text
What the user sees          screens and features
Reusable interface parts   buttons, tabs, dialogs, cards, loading states
Shared behaviour           routing, state, keyboard and focus rules
Data boundary              validation and translation of outside data
Outside services           Sheets, Docs, wiki, maps, storage
Safety net                 types, tests, accessibility checks and builds
```

Information should move upward through these layers. A map control may use a shared button; the shared
button must not know anything about Fallout maps. That one rule prevents much of the duplication and drift
that accumulates in growing projects.

### What “reducing parallelism” means here

Parallelism is when two parts of an app solve the same problem independently. Examples include two route
lists, three different modal-closing systems, or separate mobile and desktop navigation data.

The preferred pattern is:

- one source of truth for identity and data;
- one shared primitive for repeated behaviour;
- different presentations only where the user genuinely needs them;
- an explicit adapter where two external systems cannot share a format.

US and Region maps can share a geographic renderer. Local uses game-grid coordinates, so a deliberate
adapter or separate renderer is correct—not harmful duplication. “One system” must never mean forcing unlike
things through a misleading abstraction.

---

## The proposed toolkit, in ordinary language

### Vite — the workshop

Vite is the workshop in which the app is assembled. During development it serves files quickly and reports
problems; for release it packs the source into efficient static files. It does not dictate the appearance or
require a particular component framework.

Why it earns a place:

- JavaScript and CSS can be split into understandable files without slowing the live site.
- Installed libraries and their exact versions are recorded in one lockfile.
- Development, tests, and release builds use the same module rules.
- The result can remain a static GitHub Pages site.

What it does **not** do: design screens, manage application state, or make code correct by itself.

### TypeScript — the labelled wiring diagram

JavaScript lets almost any value travel anywhere. TypeScript adds descriptions such as “this is a faction
id”, “this record must have coordinates”, or “this function returns a route”. It can then flag mismatches
before a person encounters them in the browser.

Use it most strongly at boundaries:

- route inputs and outputs;
- faction, character, document, story, and map records;
- saved settings and migrations;
- responses from Sheets, Docs, MediaWiki, and local storage;
- public inputs and events for reusable components.

It should be introduced gradually. Existing JavaScript can first receive checked JSDoc descriptions; a file
can become TypeScript when it is extracted for a real reason. A giant syntax-only conversion creates risk
without teaching the architecture anything.

### Lit and Web Components — reusable appliances

A Web Component is a named interface element the browser understands, such as a project-specific tab rail or
dialog shell. Lit is a small library that makes these elements easier to build and update.

Good reusable components have:

- one clear purpose;
- a small, documented set of inputs;
- explicit empty, loading, error, disabled, hover, focus, and selected states;
- keyboard and screen-reader behaviour built in;
- styling controlled through shared tokens rather than copied colours and measurements;
- no knowledge of the feature that happens to use them first.

Do not turn every paragraph or wrapper into a component. Extract something after a stable boundary or a
second genuine use appears. Feature pages may remain ordinary modules composed from these parts.

### Design tokens — the app’s measuring system

Tokens are named values such as `--space-3`, `--control-min`, `--fg-dim`, or `--reading-width`. They let a
decision change everywhere without hunting for dozens of near-matching numbers.

Useful token families are:

- colour and contrast roles;
- type sizes and line heights;
- spacing steps;
- control and touch sizes;
- reading widths and layout bounds;
- borders, shadows, motion, and layer order;
- safe-area and viewport measurements.

A token should represent a repeated decision, not merely give a name to every number. Product themes may
change token values; components should normally consume roles rather than faction-specific colours.

### Storybook — the component showroom

Storybook displays interface components outside the full application. It lets us inspect a tab rail at
320px, a dialog with a long error, or a card in every colour theme without navigating the real app into each
state.

It becomes worthwhile after several real components exist. Adding it before there is anything stable to
display would be ceremony rather than protection.

### Vitest — the workbench tester

Vitest checks small pieces of logic quickly. It is suitable for questions such as:

- Does this URL become the correct route object?
- Does this CSV header map to the expected field?
- Does a provisional map record fail the display-ready rule?
- Does resetting preferences preserve authored story data?
- Does the document cleaner reject an unsafe element?

These tests should mostly avoid a full browser. They are cheap enough to run after every change.

### Playwright — the test pilot

Playwright operates the complete application in real browser engines. It checks journeys rather than just
individual functions: open Settings, change a value, close it with Escape, reload, and confirm the right
control receives focus.

High-value browser journeys include:

- navigation, browser history, and direct links;
- phone and desktop layout;
- keyboard, touch-sized controls, focus, and overlays;
- roster filtering and dossier selection;
- document contents, scrolling, find, and focus mode;
- map scale switching and fallback behaviour;
- loading, empty, error, slow, and offline states;
- high contrast, reduced motion, and large text.

Tests should assert user-visible outcomes, not fragile details such as the exact number of wrapper elements.
Playwright can emulate mobile conditions, but final releases still need physical iOS and Android checks.

### Automated accessibility checks — the spellchecker, not the editor

An axe scan can find missing labels, invalid roles, duplicate ids, and some contrast failures. It cannot tell
whether a reading flow makes sense, whether focus movement feels natural, or whether a visual relationship is
understandable. Automated and manual accessibility checks complement one another.

### GitHub Actions — the gate at the door

Continuous integration runs the same checks on every proposed or pushed change. A mature gate should
eventually perform, in this order:

1. repository self-check;
2. formatting/lint checks;
3. type checking;
4. fast logic tests;
5. production build;
6. a bounded set of critical browser journeys;
7. accessibility scans on representative pages.

The fast checks go first so a simple mistake does not consume time running browsers.

---

## What a framework does—and does not do

Bootstrap is primarily a visual toolkit: responsive grids, utilities, and familiar components. React,
Svelte, Vue, and Lit primarily organise changing interface state and reusable components. Vite organises the
development/build process. These tools overlap at the edges, but they are not substitutes for one another.

For a conventional internal dashboard, Bootstrap may be an efficient visual choice. For a strongly art-
directed application such as this one, its defaults would create considerable override work. The portable
foundation should therefore standardise behaviour, quality, and component contracts while allowing each
project to own its visual language.

No framework supplies good information architecture, truthful data, sensible product decisions, or useful
tests automatically. Those remain design work.

---

## The intended project shape

```text
src/
  app/                 startup, route coordination, shared state
  features/            home, roster, relations, documents, wiki, maps, community
  integrations/        Google Sheets, Google Docs, MediaWiki, MapLibre, storage
  data/                record shapes, validation, migrations, repositories
  ui/                  reusable components, layouts, behaviours, icons
  styles/              tokens, reset, base type, utilities, themes, surfaces

tests/
  fixtures/            small, stable examples of external data and failure states
  unit/                fast logic tests
  browser/             critical user journeys
  accessibility/       automated representative checks
```

### Responsibility rules

- A **feature** may use shared UI and integrations.
- A **shared UI component** may use tokens and generic behaviours, but not feature data.
- An **integration** translates one outside service into an internal record shape.
- A screen never treats an unvalidated outside response as trustworthy application data.
- Routes describe destinations; they do not contain rendering logic.
- Mobile and desktop consume the same records, route, and selection state.
- Loading, empty, error, unavailable, and stale are designed states, not afterthoughts.

---

## How to begin a new project

### 1. Write the product contract before choosing a framework

In one page, record:

- who uses it and what they are trying to accomplish;
- its important objects and sources of truth;
- the five most important user journeys;
- expected devices and accessibility needs;
- offline, privacy, authentication, and publishing requirements;
- what must remain easy to change.

This prevents a fashionable tool from deciding the product shape accidentally.

### 2. Draw boundaries before drawing screens

List the features, integrations, shared behaviours, and shared visual parts. Mark which external systems are
read-only and who owns every writable record. A useful first architecture fits on one page.

### 3. Establish tokens and primitives

Choose type, spacing, control sizes, contrast roles, reading widths, and motion rules. Build only the basic
controls needed by the first real journey. Do not create an imaginary library of unused components.

### 4. Build one vertical slice

A vertical slice is one small journey that travels through every necessary layer—for example: load a roster,
show a list, select a character, and open its dossier. It proves the data boundary, state, component, layout,
and test approach together.

### 5. Add states before adding breadth

Make that slice work when data is loading, empty, malformed, slow, or unavailable; then verify phone,
keyboard, and assistive behaviour. Only then copy the established pattern into the next feature.

### 6. Extract after evidence

When the second feature needs the same behaviour, extract the shared primitive. If the two uses differ in
meaning, retain two small implementations rather than creating a complicated “universal” component.

### 7. Ship through quality gates

Every change should answer:

- What single outcome changed?
- Which source of truth owns it?
- Which automated check protects it?
- Which manual journey was verified?
- Which document now describes the durable rule?

---

## How to judge something found on GitHub

Do not judge a repository mainly by stars or screenshots. Check:

- Is it still maintained and releasing?
- Does its licence permit the intended use and redistribution?
- Are dependencies pinned and security updates visible?
- Does it test keyboard, screen-reader, mobile, and failure behaviour?
- Is its public API documented?
- Can one component be adopted without inheriting the entire application?
- Does it replace an existing responsibility, or create a second way to do it?
- What is the exit cost if maintenance stops?

Prefer official generators and small maintained dependencies over copying an entire application. Record the
version, licence, source, purpose, and local modifications for anything vendored into the repository.

---

## The staged learning programme for this repository

Each stage must leave the live application working and produce something reusable for the next project.

### Stage 0 — describe and protect the current behaviour — implemented 2026-07-16

- Keep the existing self-check.
- Add a dependency manifest and reproducible lockfile.
- Add a small Playwright suite for critical routes and shell behaviour.
- Use local fixtures so core tests do not rely on Google or wiki availability.
- Record current behaviours before reorganising their code.

**Learning outcome:** understand the difference between a behaviour contract and an implementation detail.

The first harness now runs six sequential, fixture-backed browser journeys in about three seconds. It protects
routes/history, Settings focus restoration, command navigation, roster selection, document contents/focus mode,
and compact Home/Local-map containment without changing any deployed runtime code.

### Stage 1 — introduce the workshop without redesigning the product

- Add Vite and preserve GitHub Pages output and URLs.
- Keep runtime assets self-hosted.
- Ensure the production build can be previewed locally.
- Run the existing self-check plus build and smoke tests in CI.

**Learning outcome:** understand source files, generated release files, dependencies, and reproducible builds.

### Stage 2 — create real module boundaries

- Extract pure routing and section-registry logic first.
- Extract preferences, data parsing, and validation next.
- Move integrations behind small adapters.
- Move one feature at a time; do not perform a file-shuffling rewrite.

**Learning outcome:** understand responsibilities, imports, public APIs, and dependency direction.

### Stage 3 — add types at important boundaries

- Enable checked JavaScript first.
- Define internal records for routes, factions, characters, documents, stories, locations, and claims.
- Validate untrusted runtime data separately; TypeScript alone does not validate network responses.
- Convert stable extracted modules to TypeScript gradually.

**Learning outcome:** understand compile-time guarantees versus runtime validation.

### Stage 4 — extract the reusable interface foundation

- Inventory repeated controls and behaviours.
- Build the first Lit components only where boundaries are proven.
- Add Storybook with normal, compact, large-text, high-contrast, reduced-motion, and failure examples.
- Retain the Misfits CRT theme as one consumer of generic component contracts.

**Learning outcome:** understand components, composition, inputs, events, state, and design tokens.

### Stage 5 — make quality automatic

- Expand Vitest coverage for pure logic and migrations.
- Expand Playwright across representative surfaces and browsers.
- Add axe scans and retain manual accessibility/device checks.
- Add controlled visual regression only for components whose appearance is stable enough to justify it.

**Learning outcome:** understand the testing pyramid and why different failures need different tests.

### Stage 6 — create the reusable starter

- Extract only the proven generic foundation into a separate template repository.
- Include the directory structure, tokens, components, tests, CI, documentation ownership, and decision log.
- Provide a small example app and a checklist for replacing its identity and integrations.
- Keep product-specific Fallout content and Misfits data out of the generic template.

**Learning outcome:** understand the difference between a reusable platform and copied project history.

---

## Definition of a dependable interface foundation

The foundation is ready for another project when a new builder can:

- create and run an app from one documented command;
- find each responsibility without searching a giant file;
- change the theme through tokens without rewriting components;
- add a route, feature, and external integration without duplicating registries;
- inspect every reusable component and important state in isolation;
- run type, unit, browser, accessibility, and production-build checks locally and in CI;
- deploy a static app without hand-editing generated output;
- understand the licence and provenance of every shipped dependency;
- remove an optional component or integration without rewriting unrelated features;
- hand the repository to another contributor through current, non-contradictory documentation.

That—not the presence of a particular fashionable framework—is the reliable structure future projects
should inherit.
