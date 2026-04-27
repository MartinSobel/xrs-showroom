// @ts-check
import { defineConfig } from '@playwright/test';

/**
 * Playwright config — local tests against dev server.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/deploy-health.spec.js'],

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry once on CI to absorb flakiness */
  retries: process.env.CI ? 1 : 0,

  /* Reporter */
  reporter: process.env.CI ? 'github' : 'list',

  /* Shared settings for all projects */
  use: {
    baseURL: 'http://localhost:3000',

    /* Capture screenshot only on failure */
    screenshot: 'only-on-failure',

    /* Collect trace on first retry */
    trace: 'on-first-retry',
  },

  /* Chromium only — sufficient for smoke tests */
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],

  /* Start Next.js dev server before running tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },

  /* Global test timeout */
  timeout: 30_000,
});
