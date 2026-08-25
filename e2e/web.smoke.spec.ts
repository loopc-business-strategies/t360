import { test, expect } from "@playwright/test";

const base = process.env.PLAYWRIGHT_BASE_URL;

test.describe("web smoke", () => {
  test.skip(!base, "Set PLAYWRIGHT_BASE_URL to run web smoke");

  test("home loads brand", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/THARAGAI|தாரகை/i).first()).toBeVisible();
  });

  test("products page loads", async ({ page }) => {
    await page.goto("/products");
    await expect(page.locator("main, body").first()).toBeVisible();
  });

  test("privacy policy loads", async ({ page }) => {
    await page.goto("/policies/privacy");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
