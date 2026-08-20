import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the SnackRapido customer-app (apps/client).
 *
 * E2E specs live in apps/client/e2e. The `webServer` block boots the Next.js
 * dev server (port 3000) before the run and reuses an already-running one
 * locally. Run with:  npx playwright test -c apps/client/playwright.config.ts
 *
 * NOTE: the browsing flow (GET /restaurants) must exist for these to pass —
 * see the NEEDS_CHANGES handoff. Browsers install once via `npx playwright install`.
 */
const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Mobile viewport — the design system is mobile-first, so cover it in E2E.
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: 'npx nx serve client',
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
