/* dump-roster.js — regenerate tools/roster-dump.json from the LIVE app.
   The app's own parser is the source of truth for slugs/names, so we read from it
   rather than re-parsing the sheet (which would miss the code-defined EXTRA_CHARACTERS
   and could drift on slug dedupe).

   HOW TO USE
   1. Open the deployed/preview roster in a browser and let it finish loading.
   2. Open DevTools → Console.
   3. Paste the whole snippet below and press Enter.
   4. It copies the active faction's JSON to your clipboard (and logs it). Save it as
      tools/roster-dump.json, then run: python3 tools/make-og-stubs.py --base-url "<your url>"
   5. Repeat for each linked faction. The generator updates matching files without deleting
      other factions' stubs; flat stub filenames require character slugs to be unique across factions.
*/
(() => {
  const clip = (s, n) => {
    s = (s || "").replace(/\s+/g, " ").trim();
    return s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…";
  };
  const faction = currentFaction;
  const factionName = activeFaction().name;
  const brand = activeFaction().brand;
  const data = state.model.characters.map(c => {
    const f = c.fields, b = [];
    if ((f.honorific || "").trim()) b.push("“" + f.honorific.trim() + "”");
    if ((f.role || "").trim()) b.push(f.role.trim());
    let line = b.join(" · ");
    const app = (f.appearance || "").trim();
    if (app) line = line ? line + " — " + app : app;
    return {
      slug: c.slug,
      name: c.name,
      faction,
      factionName,
      brand,
      desc: clip(line, 190) || "A member of " + factionName + ".",
      img: /^https?:/.test((f.image || "").trim()) ? f.image.trim() : ""
    };
  });
  const json = JSON.stringify(data);
  (navigator.clipboard?.writeText(json) || Promise.reject())
    .then(() => console.log(faction + " roster copied to clipboard (" + data.length + " characters)."))
    .catch(() => console.log(json));
  return json;
})();
