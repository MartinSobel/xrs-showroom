// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Home page tests.
 * Verifies the scene list page renders correctly after authentication.
 */

// Helper: login before each test
async function login(page) {
  await page.goto('/login');
  await page.locator('#login-password').fill(process.env.ADMIN_PASSWORD || 'novaworks2026');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('/', { timeout: 15_000 });
}

test.describe('Home Page (Scene List)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('displays the app title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('XRS Showroom');
  });

  test('shows subtitle', async ({ page }) => {
    await expect(page.locator('.home-header p')).toContainText('Gestión de escenas 3D');
  });

  test('has the create scene input', async ({ page }) => {
    const input = page.locator('.create-scene-row input');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('placeholder', 'Nombre de escena…');
  });

  test('has the create scene button (disabled when empty)', async ({ page }) => {
    const btn = page.locator('.create-scene-row button');
    await expect(btn).toBeVisible();
    await expect(btn).toBeDisabled();
  });

  test('create button enables when name is typed', async ({ page }) => {
    const input = page.locator('.create-scene-row input');
    const btn = page.locator('.create-scene-row button');

    await input.fill('Test Scene');
    await expect(btn).toBeEnabled();
  });

  test('renders scene list or empty state', async ({ page }) => {
    // Wait for loading to finish
    await page.waitForTimeout(2000);

    const sceneItems = page.locator('.scene-item');
    const emptyState = page.locator('.empty-state');

    // Either scenes are shown or the empty state is displayed
    const hasScenes = await sceneItems.count() > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(hasScenes || hasEmptyState).toBe(true);
  });

  test('scene items are clickable', async ({ page }) => {
    // Wait for scenes to load
    await page.waitForTimeout(2000);

    const sceneItems = page.locator('.scene-item');
    const count = await sceneItems.count();

    if (count > 0) {
      // First scene item should have a name and delete button
      const firstItem = sceneItems.first();
      await expect(firstItem.locator('.scene-name')).toBeVisible();
      await expect(firstItem.locator('.scene-delete')).toBeVisible();
    }
  });
});
