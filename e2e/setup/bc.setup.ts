import { test as setup, expect } from '@playwright/test';

/**
 * Setup E2E para BC Compliance.
 * Requiere env vars:
 *   E2E_EMAIL (ej. fbolivarb@gmail.com)
 *   E2E_PASSWORD
 * Guarda el state en ./e2e/.auth/bc-user.json para reusar en specs autenticados.
 */
const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;

setup.setTimeout(60000);

setup('authenticate as BC Compliance user', async ({ page }) => {
  if (!EMAIL || !PASSWORD) {
    setup.skip(true, 'E2E_EMAIL y E2E_PASSWORD no configurados — skipping auth setup');
    return;
  }

  await page.goto('/login', { timeout: 45000 });

  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);

  await page.getByRole('button', { name: /iniciar sesi[oó]n|login|entrar/i }).click();

  await page.waitForURL('**/dashboard', { timeout: 30000 });
  await expect(page).toHaveURL(/dashboard/);

  await page.context().storageState({ path: './e2e/.auth/bc-user.json' });
});
