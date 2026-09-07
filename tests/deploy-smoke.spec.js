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

/* WHAT THE DEPLOYMENT SAYS IT HAS, read off the deployment. This was a frozen list, and it rotted
   the way its own header warns about — just not in the place the header was watching. It named
   `#home`, deleted in August; `#paperwork` and `#stories`, which the Pack no longer draws; and
   `#events` and `#proposals`, which it draws nowhere and reaches only by address. An address for a
   section this Pack does not show LANDS ON THE LANDING, renders a full wiki page, and sails past a
   "did it render" check. Three of the eight rows asserted nothing about the section they named,
   and the file could not tell: it froze a section list while congratulating itself on naming no
   ids.

   So the drawn destinations are discovered from the served page's own navigation, which cannot go
   stale because it IS the deployment. */
async function drawnSections(page) {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForSelector(".nav-grid .navbox", { timeout: 20_000 });
  return page.evaluate(() =>
    [...document.querySelectorAll(".nav-grid .navbox")]
      .map(b => b.getAttribute("aria-label"))
      .filter(name => name && name !== "Settings")
      .map(name => "#" + name.toLowerCase().replace(/\s+/g, "-")));
}

/* AND THE ADDRESSES WE HAND OUT, which have no navigation entry by design and are therefore the
   ones that can die without anybody noticing. An unlisted section is reached only by a link
   somebody was given; a `c/` page is a link somebody was given years ago. Explicit because the
   fact being asserted is "we shared this", and that is not derivable from the app.

   `#roster` is here rather than discovered because the nav's label for it may differ from its
   address; discovering it as well is harmless and this keeps one row honest either way. */
const SHARED = ["#proposals", "#events", "#roster"];

/* One legacy share page, checked as a REDIRECT rather than as a section: 43 of them sit in this
   repository from the retired app and every one is a link somebody may still hold. They forward
   to `index.html#tribe/roster/<id>`, which the current app's route-compat ratchet covers. */
const LEGACY_SHARE_PAGE = "c/andrew-stone.html";

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
  const sections = [...new Set([...(await drawnSections(page)), ...SHARED])];
  expect(sections.length, "the deployment drew no navigation at all").toBeGreaterThan(2);
  for (const hash of sections) {
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

test("the published preview mounts the complete atlas without errors", async ({ page, baseURL }) => {
  const problems = [];
  const previewRoot = new URL("/preview/", baseURL);
  page.on("pageerror", error => problems.push(`threw: ${error.message}`));
  page.on("console", message => {
    if (message.type() === "error") problems.push(`logged: ${message.text().slice(0, 200)}`);
  });
  page.on("request", request => {
    const url = new URL(request.url());
    if (url.origin === previewRoot.origin && !url.pathname.startsWith(previewRoot.pathname)) {
      problems.push(`escaped preview root: ${url.pathname}`);
    }
  });

  await page.addInitScript(() => sessionStorage.setItem("mdb-booted", "1"));
  await page.goto("/preview/#map", { waitUntil: "networkidle" });

  await expect(page.locator('#atlas-map .terr[d]:not([d=""])')).toHaveCount(188, { timeout: 15_000 });
  await expect(page.locator(".pin")).toHaveCount(137, { timeout: 15_000 });
  expect([...new Set(problems)], "errors or misplaced requests while mounting the preview atlas").toEqual([]);
});

/* A LINK SOMEBODY WAS GIVEN YEARS AGO STILL OPENS THE PERSON IT NAMES. The retired app left 43
   `c/*.html` pages in this repository, each a meta-refresh into the app's own hash. The publisher
   is overlay-only and does not delete them, so they stay live — which is right, and only worth
   anything if they still arrive somewhere. Asserted on the ADDRESS reached, not on what renders
   there: a character can leave the roster without the redirect being broken. */
test("a legacy character share page still redirects into the app", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("mdb-booted", "1"));
  await page.goto(`/${LEGACY_SHARE_PAGE}`, { waitUntil: "networkidle" });
  await expect
    .poll(() => new URL(page.url()).hash, { timeout: 15_000 })
    .toMatch(/^#(tribe\/roster\/|roster\/)[a-z0-9-]+/);
});
