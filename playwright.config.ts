import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config — BC Compliance E2E
 *
 * Ejecuta con:
 *   npx playwright test                                   # todos
 *   npx playwright test bc-public                         # smoke sin auth
 *   npx playwright test bc-integration                    # flujos autenticados
 *   E2E_EMAIL=... E2E_PASSWORD=... npx playwright test    # con login real
 *
 * Base URL: detecta localhost:3000-3006 (ajusta BASE_URL env var si usas otro).
 * Si el dev server no está corriendo, Playwright lo inicia con `npm run dev`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  timeout: 60000,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Setup autenticado BC Compliance
    {
      name: 'bc-setup',
      testMatch: /bc\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Smoke público (no requiere login)
    {
      name: 'bc-public',
      testMatch: /bc-public\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Tests de integración autenticados
    {
      name: 'bc-integration',
      testMatch: /bc-integration\.spec\.ts/,
      dependencies: ['bc-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: './e2e/.auth/bc-user.json',
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: process.env.BASE_URL || 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
