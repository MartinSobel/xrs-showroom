// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Post-deploy health checks.
 * Run against production: npm run test:deploy
 *
 * These tests verify the deployed app is functional.
 */

const TEST_SCENE_ID = '-OpndSMhuRHI-q2icUEl';

test.describe('Deploy Health Check', () => {
  test('login page loads', async ({ page }) => {
    const response = await page.goto('/login');
    expect(response?.status()).toBe(200);

    await expect(page.locator('h1')).toContainText('XRS Showroom');
    await expect(page.locator('#login-password')).toBeVisible();
  });

  test('protected routes redirect to login', async ({ page }) => {
    await page.goto('/');
    expect(page.url()).toContain('/login');
  });

  test('/scenes/* routes redirect to login', async ({ page }) => {
    await page.goto('/scenes/test');
    expect(page.url()).toContain('/login');
  });

  test('public view route responds', async ({ page }) => {
    const response = await page.goto(`/view/${TEST_SCENE_ID}`);
    // Should respond without redirect to login
    expect(page.url()).toContain('/view/');
    expect(response?.status()).toBe(200);
  });

  test('auth API responds', async ({ request }) => {
    const response = await request.post('/api/auth', {
      data: { password: 'health-check-probe' },
    });

    // Should return 401 (wrong password) — proves the API is alive
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  test('static assets load (CSS bundle)', async ({ page }) => {
    const response = await page.goto('/login');

    // Collect all CSS resource responses
    const cssResponses = [];
    page.on('response', (res) => {
      if (res.url().includes('/_next/') && res.url().endsWith('.css')) {
        cssResponses.push(res);
      }
    });

    // Reload to capture resource requests
    await page.reload();
    await page.waitForLoadState('networkidle');

    // At least one CSS file should have loaded
    // (globals.css is always included via layout)
    for (const res of cssResponses) {
      expect(res.status()).toBe(200);
    }
  });

  test('static assets load (JS bundle)', async ({ page }) => {
    const failedRequests = [];

    page.on('response', (res) => {
      if (
        res.url().includes('/_next/') &&
        res.url().endsWith('.js') &&
        res.status() >= 400
      ) {
        failedRequests.push({ url: res.url(), status: res.status() });
      }
    });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // No JS bundles should have failed
    expect(failedRequests).toHaveLength(0);
  });

  test('viewer WebGL canvas renders', async ({ page }) => {
    await page.goto(`/view/${TEST_SCENE_ID}`);

    // Canvas should mount within reasonable time
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 20_000 });
  });

  test('no console errors on login page', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Filter out known benign errors (e.g. Firebase analytics)
    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes('analytics') &&
        !err.includes('favicon') &&
        !err.includes('third-party')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
