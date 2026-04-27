// @ts-check
import { test, expect } from '@playwright/test';

/**
 * API route tests.
 * Verifies auth and proxy endpoints respond correctly.
 */

test.describe('API Routes', () => {
  test.describe('POST /api/auth', () => {
    test('returns 401 for wrong password', async ({ request }) => {
      const response = await request.post('/api/auth', {
        data: { password: 'wrong-password' },
      });

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBeTruthy();
    });

    test('returns 200 and sets __session cookie for correct password', async ({ request }) => {
      const response = await request.post('/api/auth', {
        data: { password: process.env.ADMIN_PASSWORD || 'novaworks2026' },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.ok).toBe(true);

      // Verify __session cookie was set
      const cookies = response.headers()['set-cookie'] || '';
      expect(cookies).toContain('__session');
    });

    test('returns 400 for malformed request', async ({ request }) => {
      const response = await request.post('/api/auth', {
        data: 'not-json',
        headers: { 'Content-Type': 'text/plain' },
      });

      // Should be 400 (bad request)
      expect(response.status()).toBe(400);
    });
  });

  test.describe('DELETE /api/auth', () => {
    test('clears session cookie', async ({ request }) => {
      const response = await request.delete('/api/auth');

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.ok).toBe(true);

      // Cookie should be cleared (maxAge=0)
      const cookies = response.headers()['set-cookie'] || '';
      expect(cookies).toContain('__session');
    });
  });

  test.describe('POST /api/proxy', () => {
    test('returns 400 when url is missing', async ({ request }) => {
      const response = await request.post('/api/proxy', {
        data: {},
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('url');
    });

    test('proxies request to valid URL', async ({ request }) => {
      const response = await request.post('/api/proxy', {
        data: { url: 'https://httpbin.org/post' },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.status).toBe(200);
      expect(body.data).toBeTruthy();
    });
  });
});
