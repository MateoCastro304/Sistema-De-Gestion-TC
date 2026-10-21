import { expect, rows, test } from '../support/fixtures'
import { ROUTES } from '../support/routes'
import { changeSession, DEMO_PASSWORD, seedSession } from '../support/session'
import type { Page } from '@playwright/test'

/**
 * Sesión (Sprint 2): iniciar sesión (CU-53), cerrar sesión (CU-52) y el
 * acceso según el rol. Usuarios de `users.db.ts`, todos con la contraseña
 * Castro1977: wcastro (AS), mrios (ERP), rsanchez (JT), hfunes (bloqueado)
 * y ogimenez (dado de baja).
 *
 * Pantalla de ingreso esperada (la del prototipo): título "Ingresar",
 * campos "Nombre de usuario" y "Contraseña" y el botón "Ingresar".
 */

async function login(page: Page, username: string, password: string) {
  await page.getByLabel('Nombre de usuario').fill(username)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
}

const loginHeading = (page: Page) => page.getByRole('heading', { name: 'Ingresar' })

test.describe('[CU-53] Iniciar sesión', { tag: '@sprint2' }, () => {
  test('sin sesión, cualquier pantalla lleva al ingreso', async ({ page }) => {
    await page.goto(ROUTES.suppliers)
    await expect(loginHeading(page)).toBeVisible()
  })

  test('marca los campos vacíos sin contarlos como intento', async ({ page }) => {
    await page.goto(ROUTES.login)
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
    await expect(page.getByText('Ingresá tu nombre de usuario')).toBeVisible()
    await expect(page.getByText('Ingresá tu contraseña')).toBeVisible()
  })

  test('con datos incorrectos conserva el usuario y limpia la contraseña', async ({ page }) => {
    await page.goto(ROUTES.login)
    await login(page, 'mrios', 'otra-clave')
    await expect(page.getByRole('alert').filter({ hasText: 'Usuario o contraseña incorrectos' })).toBeVisible()
    await expect(page.getByLabel('Nombre de usuario')).toHaveValue('mrios')
    await expect(page.getByLabel('Contraseña', { exact: true })).toHaveValue('')
  })

  test('un usuario dado de baja recibe el mismo mensaje que una contraseña mala', async ({ page }) => {
    await page.goto(ROUTES.login)
    await login(page, 'ogimenez', DEMO_PASSWORD)
    await expect(page.getByRole('alert').filter({ hasText: 'Usuario o contraseña incorrectos' })).toBeVisible()
  })

  test('bloquea al usuario al quinto intento fallido', async ({ page }) => {
    await page.goto(ROUTES.login)
    for (let attempt = 1; attempt <= 4; attempt++) {
      await login(page, 'mrios', `mala-${attempt}`)
      await expect(page.getByRole('alert').filter({ hasText: 'Usuario o contraseña incorrectos' })).toBeVisible()
    }
    await login(page, 'mrios', 'mala-5')
    await expect(page.getByRole('alert').filter({ hasText: 'Tu usuario fue bloqueado por intentos fallidos' })).toBeVisible()

    // Bloqueado, ni con la contraseña correcta.
    await login(page, 'mrios', DEMO_PASSWORD)
    await expect(page.getByRole('alert').filter({ hasText: 'Tu usuario fue bloqueado por intentos fallidos' })).toBeVisible()
  })

  test('un usuario bloqueado no ingresa', async ({ page }) => {
    await page.goto(ROUTES.login)
    await login(page, 'hfunes', DEMO_PASSWORD)
    await expect(page.getByRole('alert').filter({ hasText: 'Contactá al Administrador del Sistema' })).toBeVisible()
  })

  test('ingresa a la primera pantalla que permite el rol y la sesión sobrevive a una recarga', async ({ page }) => {
    await page.goto(ROUTES.login)
    // Sin distinguir mayúsculas en el nombre de usuario.
    await login(page, 'MRIOS', DEMO_PASSWORD)
    // ERP: el primer módulo que puede ver es el panel de Clientes.
    await expect(page).toHaveURL(ROUTES.customersPanel)
    await expect(page.getByRole('link', { name: 'Clientes' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Administración' })).toHaveCount(0)

    await page.reload()
    await expect(page).toHaveURL(ROUTES.customersPanel)
    await expect(loginHeading(page)).toHaveCount(0)
  })

  test('un rol sin módulos ve el inicio vacío', async ({ page }) => {
    await page.goto(ROUTES.login)
    await login(page, 'rsanchez', DEMO_PASSWORD)
    await expect(page.getByRole('heading', { name: 'Hola, Raúl' })).toBeVisible()
    await expect(page.getByText('Todavía no hay módulos disponibles para tu rol.')).toBeVisible()
  })

  test('avisa cuando la sesión expiró por inactividad', async ({ page }) => {
    await seedSession(page, 'mrios', { expiredByInactivity: true })
    await page.goto(ROUTES.customers)
    await expect(loginHeading(page)).toBeVisible()
    await expect(page.getByText('Tu sesión expiró por inactividad')).toBeVisible()
  })
})

/**
 * Lo que pasa con la sesión mientras se usa (escenarios 5, 11 y 12). Los
 * tiempos (15 minutos, 7 días) no se esperan: `changeSession` deja la sesión
 * simulada en ese estado después de que la app arrancó, y la acción es abrir
 * Encargados, que pide tres listados a la vez (encargados, fábricas y rubros).
 */
test.describe('[DTC-33][CU-53] Sesión abierta', { tag: '@sprint2' }, () => {
  test.use({ sessionUser: 'mrios' })

  const encargados = (page: Page) => page.getByRole('link', { name: /^Encargados/ })

  test('renueva el token vencido sin que se note, con un solo refresh', async ({ page }) => {
    await page.goto(ROUTES.customersPanel)
    await expect(encargados(page)).toBeVisible()

    const refreshes: string[] = []
    page.on('request', (request) => {
      if (request.url().endsWith('/api/auth/refresh')) refreshes.push(request.url())
    })
    await changeSession(page, { accessTokenExpired: true })

    await encargados(page).click()
    await expect(rows(page).first()).toBeVisible()
    await expect(loginHeading(page)).toHaveCount(0)
    // Las tres peticiones vencieron juntas y compartieron un solo refresh.
    expect(refreshes).toHaveLength(1)
  })

  test('a los 7 días del ingreso la sesión vence aunque se use el sistema', async ({ page }) => {
    await page.goto(ROUTES.customersPanel)
    await expect(encargados(page)).toBeVisible()
    await changeSession(page, { maxDurationReached: true })

    await encargados(page).click()
    await expect(loginHeading(page)).toBeVisible()
    await expect(page.getByText('Tu sesión expiró. Volvé a ingresar.')).toBeVisible()
  })

  test('si el refresh token ya fue reemplazado, cierra la sesión sin mensaje', async ({ page }) => {
    await page.goto(ROUTES.customersPanel)
    await expect(encargados(page)).toBeVisible()
    await changeSession(page, { accessTokenExpired: true, refreshRevoked: true })

    await encargados(page).click()
    await expect(loginHeading(page)).toBeVisible()
    await expect(page.getByRole('alert')).toHaveCount(0)

    // La sesión quedó cerrada en el servidor: recargar no la recupera.
    await page.reload()
    await expect(loginHeading(page)).toBeVisible()
  })
})

test.describe('[CU-53][RNF09] Acceso por rol', { tag: '@sprint2' }, () => {
  test.use({ sessionUser: 'mrios' })

  test('una pantalla de otro rol muestra acceso denegado', async ({ page }) => {
    await page.goto(ROUTES.employees)
    await expect(page.getByRole('heading', { name: 'Acceso denegado' })).toBeVisible()
    await expect(page.getByText('No tenés permisos para realizar esta operación.')).toBeVisible()
  })
})

test.describe('[CU-52] Cerrar sesión', { tag: '@sprint2' }, () => {
  test.use({ sessionUser: 'wcastro' })

  test('cierra la sesión y no vuelve al recargar', async ({ page }) => {
    await page.goto(ROUTES.administrationPanel)
    await expect(page.getByRole('heading', { name: 'Administración' })).toBeVisible()

    await page.getByRole('button', { name: 'Cerrar sesión' }).click()
    await expect(loginHeading(page)).toBeVisible()
    await expect(page.getByText('Cerraste sesión correctamente')).toBeVisible()

    await page.goto(ROUTES.employees)
    await expect(loginHeading(page)).toBeVisible()
  })

  test('pide confirmación si hay datos sin guardar', async ({ page }) => {
    await page.goto(ROUTES.newEmployee)
    await page.getByLabel('Nombre').fill('Julián')

    await page.getByRole('button', { name: 'Cerrar sesión' }).click()
    const dialog = page.getByRole('dialog', { name: 'Cerrar sesión' })
    await expect(dialog.getByText('Se van a perder los datos que no guardaste.')).toBeVisible()
    await dialog.getByRole('button', { name: 'Cerrar sesión' }).click()
    await expect(loginHeading(page)).toBeVisible()
  })
})
