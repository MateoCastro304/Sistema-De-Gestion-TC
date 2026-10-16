import { defineConfig, devices } from '@playwright/test'

/**
 * Tests E2E del frontend (ver TESTING.md).
 *
 * Corren contra el dev server de Vite con los mocks de MSW prendidos
 * (VITE_USE_MOCKS=true): no hace falta backend ni base de datos. Cada
 * `page.goto` recarga la página y los mocks vuelven a su semilla, así que
 * cada test arranca con los mismos datos.
 *
 * Los tests se separan por sprint con etiquetas en el `describe`
 * (`@sprint1`, `@sprint2`) y cada sprint es un proyecto: se puede correr
 * uno solo con `--project=sprint-1`.
 */

/** Puerto propio para no chocar con el `npm run dev` de todos los días. */
const PORT = 5180
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.spec.ts',
  outputDir: './e2e/.results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['list'], ['html', { outputFolder: './e2e/.report', open: 'never' }]]
    : [['list'], ['html', { outputFolder: './e2e/.report', open: 'on-failure' }]],

  use: {
    baseURL: BASE_URL,
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Cordoba',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Los mocks responden desde el Service Worker de MSW: tiene que poder
    // registrarse (Playwright los bloquea si se lo pide `serviceWorkers`).
    serviceWorkers: 'allow',
  },

  projects: [
    {
      name: 'sprint-1',
      grep: /@sprint1/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'sprint-2',
      grep: /@sprint2/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Las variables que ya están en el entorno le ganan a .env.local, así
    // que los mocks se prenden aunque el .env.local diga lo contrario.
    env: { VITE_USE_MOCKS: 'true' },
  },
})
