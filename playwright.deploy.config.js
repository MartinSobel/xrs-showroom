// @ts-check
import { defineConfig } from '@playwright/test';

/**
 * Playwright config — post-deploy health checks against production.
 * Usage: npm run test:deploy
 */
const PROD_URL = process.env.DEPLOY_URL || 'https://xrs-showroom.web.app';

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/deploy-health.spec.js'],

  retries: 1,
  reporter: 'list',

  use: {
    baseURL: PROD_URL,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'deploy-check',
      use: { browserName: 'chromium' },
    },
  ],

  /* No webServer — tests run against the live production URL */

  timeout: 30_000,
});
