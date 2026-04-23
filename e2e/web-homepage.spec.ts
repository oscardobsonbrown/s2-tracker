import { expect, test } from "@playwright/test";

const nonEmptyTextPattern = /.+/;
const interactiveGlobePattern = /interactive rotating globe/i;

test.describe("Web Homepage", () => {
  test("homepage loads successfully", async ({ page }) => {
    const response = await page.goto("/");

    // Wait for the document to be ready; client analytics can keep networkidle open.
    await page.waitForLoadState("domcontentloaded");

    // Check HTTP status
    expect(response?.status()).toBe(200);

    // Basic smoke test - page should load without errors
    await expect(page).toHaveTitle(nonEmptyTextPattern);

    // Check that the page has content
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();

    await expect(
      page.getByRole("heading", {
        name: "Find the best snow in the world, every time.",
      })
    ).toBeVisible();
    await expect(
      page.getByRole("img", {
        name: interactiveGlobePattern,
      })
    ).toBeVisible();

    // Check there's no 404 page
    await expect(page.locator("text=404")).not.toBeVisible();
  });

  test("page has basic structure", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Check for basic HTML structure
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", nonEmptyTextPattern);

    // Body should be visible
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("globe supports drag controls", async ({ page }) => {
    const pageErrors: string[] = [];

    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const globe = page.getByRole("img", {
      name: interactiveGlobePattern,
    });
    const cobeCanvas = page.locator("canvas").first();

    await expect(globe).toBeVisible();
    await expect(cobeCanvas).toBeVisible();

    const bounds = await globe.boundingBox();

    expect(bounds?.width).toBeGreaterThan(0);
    expect(bounds?.height).toBeGreaterThan(0);

    if (!bounds) {
      throw new Error("Globe canvas should have visible bounds.");
    }

    const beforeDragScreenshot = await globe.screenshot();

    expect(beforeDragScreenshot.length).toBeGreaterThan(1000);

    await page.waitForTimeout(700);

    const afterAutoRotateScreenshot = await globe.screenshot();

    expect(afterAutoRotateScreenshot.equals(beforeDragScreenshot)).toBe(false);

    await page.mouse.move(
      bounds.x + bounds.width / 2,
      bounds.y + bounds.height / 2
    );
    await page.mouse.down();
    await page.mouse.move(
      bounds.x + bounds.width / 2 + 90,
      bounds.y + bounds.height / 2 + 50,
      { steps: 8 }
    );
    await page.mouse.up();

    await expect(globe).toBeVisible();

    const afterDragScreenshot = await globe.screenshot();

    expect(afterDragScreenshot.length).toBeGreaterThan(1000);
    expect(afterDragScreenshot.equals(afterAutoRotateScreenshot)).toBe(false);
    expect(pageErrors).toEqual([]);
  });

  test("globe keeps moving briefly after drag release", async ({ page }) => {
    const pageErrors: string[] = [];

    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const globe = page.getByRole("img", {
      name: interactiveGlobePattern,
    });

    await expect(globe).toBeVisible();

    const bounds = await globe.boundingBox();

    expect(bounds?.width).toBeGreaterThan(0);
    expect(bounds?.height).toBeGreaterThan(0);

    if (!bounds) {
      throw new Error("Globe canvas should have visible bounds.");
    }

    await page.mouse.move(
      bounds.x + bounds.width / 2,
      bounds.y + bounds.height / 2
    );
    await page.mouse.down();
    await page.mouse.move(
      bounds.x + bounds.width / 2 + 140,
      bounds.y + bounds.height / 2 + 70,
      { steps: 10 }
    );
    await page.mouse.up();

    await expect(globe).toHaveAttribute("data-motion-mode", "inertia");
    await page.waitForTimeout(1400);
    await expect(globe).toHaveAttribute("data-motion-mode", "autoplay");
    expect(pageErrors).toEqual([]);
  });

  test("globe tags open and pause rotation", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const globe = page.getByRole("img", {
      name: interactiveGlobePattern,
    });
    const nisekoTag = page.locator('[data-globe-tag="niseko"]');

    await expect(globe).toBeVisible();
    await expect(nisekoTag).toBeAttached();
    await page.waitForFunction(() => {
      const tag = document.querySelector('[data-globe-tag="niseko"]');

      return tag && getComputedStyle(tag).opacity === "1";
    });

    const bounds = await globe.boundingBox();

    expect(bounds?.width).toBeGreaterThan(0);
    expect(bounds?.height).toBeGreaterThan(0);

    if (!bounds) {
      throw new Error("Globe canvas should have visible bounds.");
    }

    await page.mouse.move(
      bounds.x + bounds.width / 2,
      bounds.y + bounds.height / 2
    );
    await page.mouse.down();
    await page.mouse.move(
      bounds.x + bounds.width / 2 + 100,
      bounds.y + bounds.height / 2 + 40,
      { steps: 8 }
    );
    await page.mouse.up();

    await nisekoTag.click({ force: true });
    await expect(nisekoTag).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText("Hokkaido powder")).toBeVisible();
    await expect(globe).toHaveAttribute("data-motion-mode", "paused");
  });
});
