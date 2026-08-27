import { defineConfig, devices } from "@playwright/test";

const webBase = process.env.PLAYWRIGHT_BASE_URL;
const adminBase = process.env.PLAYWRIGHT_ADMIN_URL;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "web-chromium",
      testMatch: /web\.smoke\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: webBase || "http://127.0.0.1:3999",
      },
    },
    {
      name: "web-mobile",
      testMatch: /web\.smoke\.spec\.ts/,
      use: {
        ...devices["Mobile Chrome"],
        baseURL: webBase || "http://127.0.0.1:3999",
      },
    },
    {
      name: "admin-chromium",
      testMatch: /admin\.smoke\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: adminBase || "http://127.0.0.1:3998",
      },
    },
  ],
});
