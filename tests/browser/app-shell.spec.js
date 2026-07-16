const fs = require("node:fs");
const path = require("node:path");
const { test, expect } = require("@playwright/test");

const rosterFixture = fs.readFileSync(path.join(__dirname, "../fixtures/roster.csv"), "utf8");
const documentFixture = fs.readFileSync(path.join(__dirname, "../fixtures/document.html"), "utf8");

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("mdb-booted", "1");
    localStorage.setItem("mdb-reducemotion", "on");
  });
  await page.route("https://docs.google.com/spreadsheets/**/gviz/tq?**", route =>
    route.fulfill({ status: 200, contentType: "text/csv", body: rosterFixture })
  );
  await page.route("https://docs.google.com/document/d/**/export?format=html", route =>
    route.fulfill({ status: 200, contentType: "text/html", body: documentFixture })
  );
});

test("global destinations use one route and selected-state contract", async ({ page }) => {
  await page.goto("/#home");

  await expect(page.locator("body")).toHaveAttribute("data-section", "home");
  await expect(page.locator("#app-h1")).toHaveText("Misfits Database — Home");

  await page.getByRole("button", { name: "Open Map" }).click();
  await expect(page).toHaveURL(/#map$/);
  await expect(page.locator("body")).toHaveAttribute("data-section", "map");
  await expect(page.locator("#nav-map")).toHaveAttribute("aria-current", "page");

  await page.getByRole("tab", { name: "Local" }).click();
  await expect(page).toHaveURL(/#map\/local$/);
  await expect(page.locator("#map-panel-local")).toBeVisible();

  await page.evaluate(() => { location.hash = "#home"; });
  await expect(page).toHaveURL(/#home$/);
  await expect(page.locator("body")).toHaveAttribute("data-section", "home");
  await page.goBack();
  await expect(page).toHaveURL(/#map\/local$/);
  await expect(page.locator("#map-panel-local")).toBeVisible();
});

test("settings closes with Escape and restores the invoking control", async ({ page }) => {
  await page.goto("/#home");

  const settings = page.getByRole("button", { name: "Settings" });
  const drawer = page.locator("#settings-pop");
  await settings.click();
  await expect(drawer).toHaveAttribute("aria-hidden", "false");
  await expect(page.locator("#settings-close")).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(drawer).toHaveAttribute("aria-hidden", "true");
  await expect(settings).toBeFocused();
});

test("command palette routes through the shared destination registry", async ({ page }) => {
  await page.goto("/#home");

  await page.keyboard.press("Control+k");
  const palette = page.locator("#cmdk");
  await expect(palette).toHaveAttribute("aria-hidden", "false");
  await page.getByRole("textbox", { name: "Search" }).fill("wasteland atlas");
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/#map$/);
  await expect(page.locator("body")).toHaveAttribute("data-section", "map");
  await expect(palette).toHaveAttribute("aria-hidden", "true");
});

test("a local roster fixture drives list, selection, and route behaviour", async ({ page }) => {
  await page.goto("/#tribe/roster");

  await expect(page.locator("body")).toHaveAttribute("data-section", "roster");
  await expect(page.locator("#list .row", { hasText: "Ada Vale" })).toBeVisible();
  await page.locator("#list .row", { hasText: "Bram Reed" }).click();
  await expect(page).toHaveURL(/#tribe\/roster\/bram-reed$/);
  await expect(page.locator("#list .row", { hasText: "Bram Reed" })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#dossier")).toContainText("Bram Reed");
});

test("document contents and focus mode keep one reader and one scroll owner", async ({ page }) => {
  await page.goto("/#tribe/lore");

  await expect(page.locator("#docreader h1")).toHaveText("Archive Overview");
  const readerScroll = page.locator("#docscroll");
  const pageBefore = await page.evaluate(() => window.scrollY);
  await page.locator("#doctoc").getByRole("link", { name: "Field Reports" }).click();
  await expect.poll(() => readerScroll.evaluate(el => el.scrollTop)).toBeGreaterThan(100);
  expect(await page.evaluate(() => window.scrollY)).toBe(pageBefore);

  await page.getByRole("button", { name: "Enter focus mode" }).click();
  await expect(page.locator("body")).toHaveAttribute("data-focus", "doc");
  await expect(page.locator("body")).toHaveAttribute("data-focus-toc", "open");
  await page.getByRole("button", { name: "Collapse contents" }).click();
  await expect(page.locator("body")).toHaveAttribute("data-focus-toc", "collapsed");
  await page.keyboard.press("Escape");
  await expect(page.locator("body")).toHaveAttribute("data-focus", "");
});

test("compact home and Local map do not create document-level horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#home");

  const overflow = () => page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
  }));
  await expect.poll(overflow).toEqual({ viewport: 390, document: 390 });

  await page.goto("/#map/local");
  await expect(page.locator("#map-panel-local")).toBeVisible();
  await expect.poll(overflow).toEqual({ viewport: 390, document: 390 });
});
