// @ts-check
import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

/**
 * Build verification test.
 * Ensures `next build` completes without errors.
 */

const PROJECT_ROOT = process.cwd();

test.describe('Production Build', () => {
  test('next build completes without errors', async () => {
    // This test runs the actual build — may take 30-60s
    test.setTimeout(120_000);

    let buildOutput;
    try {
      buildOutput = execSync('npm run build', {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8',
        stdio: 'pipe',
        env: {
          ...process.env,
          // Ensure all required env vars are set
          ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'novaworks2026',
        },
      });
    } catch (err) {
      // Build failed — attach output for debugging
      const stderr = err.stderr || '';
      const stdout = err.stdout || '';
      console.error('Build STDERR:', stderr);
      console.error('Build STDOUT:', stdout);
      throw new Error(`next build failed:\n${stderr}\n${stdout}`);
    }

    // Build should mention the routes it compiled
    expect(buildOutput).toContain('/login');
    expect(buildOutput).toContain('/view/[id]');
    expect(buildOutput).toContain('/scenes/[id]');
  });
});
