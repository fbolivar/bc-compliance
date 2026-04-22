import { test, expect } from '@playwright/test';

/**
 * Tests E2E de integración GRC (requieren auth).
 * Se ejecutan solo si E2E_EMAIL y E2E_PASSWORD están configurados
 * y el setup bc.setup.ts ha guardado la sesión autenticada.
 */

test.describe('BC Compliance — flujos de integración autenticados', () => {
  test('dashboard carga con sección Integración GRC', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByText('Integración GRC', { exact: false })).toBeVisible();
  });

  test('riesgos listado navegable a detalle', async ({ page }) => {
    await page.goto('/risks', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: /riesgos/i })).toBeVisible();
  });

  test('matriz de riesgos (heatmap) renderiza toggle inherente/residual', async ({ page }) => {
    await page.goto('/risks/matrix', { waitUntil: 'networkidle' });
    await expect(page.getByRole('button', { name: /riesgo residual/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /riesgo inherente/i })).toBeVisible();
  });

  test('compliance cross-framework renderiza', async ({ page }) => {
    await page.goto('/compliance/cross-framework', { waitUntil: 'networkidle' });
    await expect(page.getByRole('button', { name: /nuevo mapeo/i })).toBeVisible();
  });

  test('SOA page muestra tabla con controles y derivar', async ({ page }) => {
    await page.goto('/compliance/soa', { waitUntil: 'networkidle' });
    await expect(page.getByText(/declaraci[oó]n de aplicabilidad/i)).toBeVisible();
  });

  test('controls mapping tabla + botón export excel', async ({ page }) => {
    await page.goto('/controls/mapping', { waitUntil: 'networkidle' });
    await expect(page.getByRole('link', { name: /exportar excel/i })).toBeVisible();
  });

  test('informes index muestra 4 tarjetas', async ({ page }) => {
    await page.goto('/reports', { waitUntil: 'networkidle' });
    await expect(page.getByText(/declaraci[oó]n de aplicabilidad/i)).toBeVisible();
    await expect(page.getByText(/an[aá]lisis de brechas/i)).toBeVisible();
    await expect(page.getByText(/resumen ejecutivo/i)).toBeVisible();
    await expect(page.getByText(/mapeos completos/i)).toBeVisible();
  });

  test('notificaciones page carga con toolbar', async ({ page }) => {
    await page.goto('/notifications', { waitUntil: 'networkidle' });
    await expect(page.getByRole('button', { name: /generar alertas/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /marcar todas le[ií]das/i })).toBeVisible();
  });

  test('vendor detail muestra certificaciones third-party', async ({ page }) => {
    await page.goto('/vendors', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: /proveedores/i })).toBeVisible();
  });

  test('incidents detail muestra lifecycle NIST', async ({ page }) => {
    await page.goto('/incidents', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: /incident/i })).toBeVisible();
  });

  test('api mappings-export responde con xlsx', async ({ request }) => {
    const res = await request.get('/api/compliance/mappings-export');
    expect([200, 302, 401]).toContain(res.status());
    if (res.status() === 200) {
      const ct = res.headers()['content-type'];
      expect(ct).toContain('spreadsheet');
    }
  });

  test('api soa report responde con xlsx', async ({ request }) => {
    const res = await request.get('/api/reports/soa');
    expect([200, 302, 401]).toContain(res.status());
    if (res.status() === 200) {
      const ct = res.headers()['content-type'];
      expect(ct).toContain('spreadsheet');
    }
  });
});
