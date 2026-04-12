import { expect, test } from "@playwright/test";

test.describe("Web Homepage", () => {
  test("homepage loads successfully", async ({ page }) => {
    const response = await page.goto("http://localhost:3001");

    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Check HTTP status
    expect(response?.status()).toBe(200);

    // Basic smoke test - page should load without errors
    await expect(page).toHaveTitle(/.+/);

    // Check that the page has content
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();

    // Check there's no 404 page
    await expect(page.locator("text=404")).not.toBeVisible();
  });

  test("page has basic structure", async ({ page }) => {
    await page.goto("http://localhost:3001");
    await page.waitForLoadState("networkidle");

    // Check for basic HTML structure
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", /.+/);

    // Body should be visible
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});
