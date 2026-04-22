import { test, expect } from '@playwright/test';

/**
 * Smoke tests públicos (sin autenticación).
 * Validan que las rutas principales responden sin errores del servidor.
 */

test.describe('BC Compliance — smoke público', () => {
  test('home redirects to /dashboard (or /login if not authed)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    // Sin auth, el middleware redirige a /login
    await expect(page).toHaveURL(/login|dashboard/);
  });

  test('login page renders with email/password inputs', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /iniciar sesi[oó]n|entrar/i })).toBeVisible();
  });

  test('forgot-password page renders', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page).toHaveURL(/forgot-password/);
  });
});
