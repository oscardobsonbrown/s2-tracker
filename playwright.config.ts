import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for basic E2E smoke tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Run web dev server before running tests
  webServer: {
    command: "pnpm --filter web dev",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      // Pass through all required environment variables to the web server
      BASEHUB_TOKEN: process.env.BASEHUB_TOKEN,
      DATABASE_URL: process.env.DATABASE_URL,
      POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN,
      RESEND_FROM: process.env.RESEND_FROM,
      RESEND_TOKEN: process.env.RESEND_TOKEN,
      NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_DOCS_URL: process.env.NEXT_PUBLIC_DOCS_URL,
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
      CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
      FLAGS_SECRET: process.env.FLAGS_SECRET,
      SVIX_TOKEN: process.env.SVIX_TOKEN,
      VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
      NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
      NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL:
        process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
      NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL:
        process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
    },
  },
});
