import { expect, test } from '../support/fixtures'
import { ROUTES } from '../support/routes'
import { DEMO_PASSWORD, seedSession } from '../support/session'
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
