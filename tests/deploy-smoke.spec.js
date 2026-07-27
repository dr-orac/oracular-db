const { test, expect } = require("@playwright/test");

/*
  DEPLOYMENT SMOKE. This repository is a one-way deploy mirror, not a development
  trunk, and that decides what its CI may check.

  It used to carry forks of the trunk's tooling: tools/selfcheck.py, a copy of
  tests/browser/app-shell.spec.js, and this config. The publisher never updates any of
  them, because it deliberately owns only the served payload. So all three froze while
  the app kept moving, and by 2026-07-27 every one of them was lying:

    * selfcheck.py failed with 139 errors, demanding a legacy_id on all 137 atlas
      markers, against a trunk that had deliberately made it optional (a new pin gets
      no legacy id rather than a fabricated one);
    * app-shell.spec.js asserted #map-panel-local, an element of the hand-rolled map
      that Phase 5 deleted when the atlas replaced it;
    * playwright.config.js was reported as stale served payload and removed, which is
      what finally took the whole workflow down.

  The trunk already gates the app, including a production suite run against this exact
  artifact, so re-running a copy of that here buys nothing and costs a fork. What is
  genuinely unproven here is the DEPLOYMENT: that the bytes in this repository, served
  as a static site, still boot.

  So this file asserts only what is true of any working deployment and stays true
  however the app is built inside: every entry point loads, renders something, and
  raises nothing. It names no internal id, class or component, which is precisely why
  it cannot rot the way its predecessors did.
*/

const SECTIONS = [
  "#home",
  "#wiki",
  "#map",
  "#paperwork",
  "#events",
  "#stories",
  "#proposals",
  "#tribe/roster",
];

test("every entry point boots, renders and raises nothing", async ({ page, baseURL }) => {
  const origin = new URL(baseURL).origin;
  const problems = [];

  page.on("pageerror", e => problems.push(`${page.url()} threw: ${e.message}`));
  page.on("console", m => {
    if (m.type() === "error") problems.push(`${page.url()} logged: ${m.text().slice(0, 200)}`);
  });
  // Only our OWN files. The roster reads a Google Sheet and the wiki reads a live
  // server; a third party being slow or down is not this deployment being broken.
  page.on("response", r => {
    if (r.url().startsWith(origin) && r.status() >= 400) {
      problems.push(`${r.status()} ${r.url().replace(origin, "")}`);
    }
  });

  // skip the boot animation: it is a deliberate delay, not a thing under test
  await page.addInitScript(() => sessionStorage.setItem("mdb-booted", "1"));

  const empty = [];
  for (const hash of SECTIONS) {
    await page.goto(`/${hash}`, { waitUntil: "networkidle" });
    // POLLED, not measured once. The map and the roster both mount asynchronously and
    // are still near-empty when networkidle fires: measuring immediately reported 33
    // and 82 characters for two sections that render fine a second later. Polling also
    // makes the assertion the honest one, which is that a section renders WITHIN a
    // deadline rather than that it happens to be ready at an arbitrary moment.
    const size = () => page.evaluate(() =>
      (document.querySelector("main")?.innerText || "").trim().length);
    let rendered = 0;
    // 120 characters is well under every real section (the smallest, Proposals, runs
    // about 200) and well over an empty shell, so it catches "loaded but rendered
    // nothing" without pinning any section's word count.
    for (let waited = 0; waited < 12_000 && (rendered = await size()) < 120; waited += 400) {
      await page.waitForTimeout(400);
    }
    if (rendered < 120) empty.push(`${hash} rendered ${rendered} characters`);
  }

  expect(empty, "sections that loaded but rendered nothing").toEqual([]);
  expect([...new Set(problems)], "errors raised by the deployment's own files").toEqual([]);
});

test("the served tree has the files the page asks for", async ({ page, baseURL }) => {
  // A missing data file does not throw: the app degrades. So request order is checked
  // directly. This is the failure the stale-file cleanup can cause, and the one that
  // deleting playwright.config.js proved nobody would notice until CI was already red.
  const origin = new URL(baseURL).origin;
  const missing = [];
  page.on("response", r => {
    if (r.url().startsWith(origin) && r.status() === 404) missing.push(r.url().replace(origin, ""));
  });
  await page.addInitScript(() => sessionStorage.setItem("mdb-booted", "1"));
  await page.goto("/#map", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  expect(missing).toEqual([]);
});
