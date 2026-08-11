import { test, expect } from "@playwright/test";

const base = process.env.PLAYWRIGHT_ADMIN_URL;

test.describe("admin smoke", () => {
  test.skip(!base, "Set PLAYWRIGHT_ADMIN_URL to run admin smoke");

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /THARAGAI Admin/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });
});
