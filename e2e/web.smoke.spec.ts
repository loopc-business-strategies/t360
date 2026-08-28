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

  test("men t-shirts PLP shows product images", async ({ page }) => {
    await page.goto("/categories/men-t-shirts");
    await expect(page.locator("main, body").first()).toBeVisible();
    const images = page.locator("img, [srcset]");
    await expect(images.first()).toBeVisible({ timeout: 15000 });
  });

  test("PDP exposes try-me when try-on enabled", async ({ page }) => {
    await page.goto("/products?tryOnEnabled=true");
    const productLink = page.locator('a[href^="/products/"]').first();
    await expect(productLink).toBeVisible({ timeout: 15000 });
    const href = await productLink.getAttribute("href");
    test.skip(!href, "No product link found");
    await page.goto(href!);
    const tryMe = page.locator("#try-me");
    if ((await tryMe.count()) > 0) {
      await expect(tryMe).toBeVisible();
    } else {
      // Non-try-on PDP still must render a gallery/main image
      await expect(page.locator("img").first()).toBeVisible();
    }
  });

  test("shop by category tiles show images", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("section").filter({
      has: page.getByRole("heading", { name: /shop by category/i }),
    });
    await expect(section).toBeVisible({ timeout: 15000 });
    const images = section.locator("img");
    await expect(images).toHaveCount(8, { timeout: 15000 });
    await expect(images.first()).toBeVisible();
  });

  test("footer shop links present", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Women" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Sale" }).first()).toBeVisible();
  });

  test("newsletter section not disabled", async ({ page }) => {
    await page.goto("/");
    const emailInput = page.locator('input[type="email"]').first();
    if ((await emailInput.count()) > 0) {
      await expect(emailInput).not.toBeDisabled();
    }
  });

  test("header logo is static (no spin animation)", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header");
    await expect(header).toBeVisible();
    const logo = header.locator('img[src*="logo-mark"]');
    await expect(logo.first()).toBeVisible();
    const animation = await logo.first().evaluate((el) => {
      const coin = el.closest(".icon360-coin");
      if (!coin) return "none";
      return getComputedStyle(coin).animationName;
    });
    expect(animation === "none" || animation === "").toBeTruthy();
  });

  test("homepage includes recommendations section", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /you may also like/i }),
    ).toBeVisible({ timeout: 15000 });
  });
});
