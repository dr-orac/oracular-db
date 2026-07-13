# Handoff — next steps (for whoever picks this up next)

State: `main` is clean, selfcheck passes, everything below is pushed + live on GitHub Pages.

## Just shipped this pass
- **`data/world.json`** — canonical world dataset (13 locations w/ real lat/long, 7 regions, routes, faction
  zones, event hooks, terrain, lore). Cleaned from the research JSON — its AI-facing instruction blocks
  (`guidance_for_chatgpt`, `agent_brief_for_any_model`, `prompt_templates`, `*_for_models`) were STRIPPED.
  **The map does not read from it yet** — wiring it up is the main open task.
- **Paperwork tab** — new row-1 `#paperwork` umbrella tab (wired like Map): copy-to-clipboard fillable SS14
  form templates. Starter set only, in `PAPERWORK_TEMPLATES` (app.js).

## Open tasks (priority order)
1. **Import the full paperwork library.** Source: `…/SS14 Macros/App/Hammerspoon/_archive/paperwork_palette.js`
   (2654 lines; templates are Lua-injected via `__…_JSON__` placeholders — check `paperwork_palette.lua` /
   `paperwork_palette_engine.lua` for the actual template data + letterheads/stamps/tags). Add them to
   `PAPERWORK_TEMPLATES`; the tab/route/renderer/CSS are already in place. Add a search box + category filter.
2. **Wire the map to `data/world.json`.** Replace the hardcoded `MAP_LOCATIONS` pixel pins: (a) US atlas —
   project each location's lat/long into the 650×500 viewBox (needs a small 2-anchor calibration) and show
   `terminal_entry` lore in the detail panel; (b) Wendover Region/Local — render the 4 `misfits_*` locations
   + `connections` (routes) + `faction_zones` (control) + lore. Do it in bounded increments.
3. **Decide `EXTRA_CHARACTERS` (app.js).** Hardcoded bios (incl. Wendover NCR/merc chars) currently live in
   code — decide whether they stay in code or move to the Sheet/wiki like the rest of the roster.

## Hard rules (unchanged — enforce)
- **No AI-signals anywhere** — no `Co-Authored-By`, no AI/model/agent language in tracked files OR commit
  messages (this is why the research JSON had to be cleaned before committing). NB: the 3 old pre-existing
  offending commit bodies are LEFT as-is by user decision — do not rewrite history.
- Never write to `CONFIG.sheetId` (tribe source sheet). One task = one commit. `python3 tools/selfcheck.py`
  clean before committing (pre-commit hook + CI enforce it). GitHub Pages auto-deploys on push to `main`.
- Wiki-migration guidance for the Tribe Lore/Roleplay docs is in `docs/WIKI-INTEGRATION.md`.
