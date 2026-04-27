// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Public viewer tests.
 * Verifies the /view/[id] route works without authentication.
 */

const TEST_SCENE_ID = '-OpndSMhuRHI-q2icUEl';

test.describe('Public Viewer (/view)', () => {
  test('non-existent scene shows "not found" message', async ({ page }) => {
    await page.goto('/view/nonexistent-id-12345');

    // Wait for Firebase to respond
    await page.waitForTimeout(3000);

    // Should show the error state
    const heading = page.locator('h1');
    await expect(heading).toContainText('Escena no encontrada', { timeout: 10_000 });
  });

  test('does not redirect to login (public route)', async ({ page }) => {
    await page.goto(`/view/${TEST_SCENE_ID}`);

    // URL should stay on /view, not redirect to /login
    expect(page.url()).toContain('/view/');
    expect(page.url()).not.toContain('/login');
  });

  test('valid scene shows loading screen', async ({ page }) => {
    await page.goto(`/view/${TEST_SCENE_ID}`);

    // Loading screen should appear
    const loader = page.locator('.loading-split');
    await expect(loader).toBeVisible({ timeout: 10_000 });

    // Should show the spinner and scene name
    await expect(page.locator('.loader-spinner')).toBeVisible();
    await expect(page.locator('.loader-title')).toBeVisible();
  });

  test('WebGL canvas mounts', async ({ page }) => {
    await page.goto(`/view/${TEST_SCENE_ID}`);

    // Wait for the viewer to render
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 15_000 });
  });

  test('loading screen dismisses after assets load', async ({ page }) => {
    await page.goto(`/view/${TEST_SCENE_ID}`);

    // Wait for the loading screen to appear first
    const loader = page.locator('.loading-split');
    await expect(loader).toBeVisible({ timeout: 10_000 });

    // Then wait for it to dismiss (has a CSS transition)
    await expect(loader).toBeHidden({ timeout: 60_000 });
  });

  test('progress bar advances during load', async ({ page }) => {
    await page.goto(`/view/${TEST_SCENE_ID}`);

    const progressFill = page.locator('.loader-progress-fill');
    await expect(progressFill).toBeVisible({ timeout: 10_000 });

    // Progress should advance from 0
    // Wait a moment for some progress
    await page.waitForTimeout(2000);

    const width = await progressFill.evaluate(
      (el) => parseFloat(getComputedStyle(el).width)
    );
    expect(width).toBeGreaterThan(0);
  });
});
