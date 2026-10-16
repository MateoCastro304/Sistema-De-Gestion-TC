import { chooseOption, chooseOptions, expect, row, rows, test, toast } from '../../support/fixtures'
import { ROUTES, detail } from '../../support/routes'

/**
 * Usuarios (Sprint 2), sólo para el Administrador del Sistema. Datos de
 * `users.db.ts`: 7 activos, hfunes bloqueado (se lista siempre) y ogimenez
 * dado de baja (sólo con "Incluir dados de baja").
 *
 * Pantallas esperadas (las del prototipo): listado con "Buscar por usuario o
 * empleado", el filtro "Todos los roles" e "Incluir dados de baja"; alta con
 * el buscador "Empleado", "Nombre de usuario", "Contraseña", "Repetir
 * contraseña" y el desplegable "Permisos".
 */
test.describe('[CU-05][CU-07] Usuarios', { tag: '@sprint2' }, () => {
  test.use({ sessionUser: 'wcastro' })

  test('lista los usuarios, filtra por rol e incluye los dados de baja', async ({ page }) => {
    await page.goto(ROUTES.users)
    // Activos y bloqueados: el encabezado cuenta los 8.
    await expect(page.getByText('8 usuarios activos')).toBeVisible()
    await expect(row(page, 'hfunes')).toContainText('Bloqueado')
    await expect(row(page, 'ogimenez')).toHaveCount(0)

    await chooseOption(page.getByRole('combobox', { name: 'Filtrar por rol' }), 'Encargado de Cotización')
    await expect(rows(page)).toHaveCount(2)
    await expect(row(page, 'fpaz')).toBeVisible()
    await expect(row(page, 'dcastro')).toBeVisible()

    await chooseOption(page.getByRole('combobox', { name: 'Filtrar por rol' }), 'Todos los roles')
    await page.getByLabel('Incluir dados de baja').check()
    await expect(row(page, 'ogimenez')).toContainText('Inactivo')
  })

  test('registra un usuario para un empleado sin usuario', async ({ page }) => {
    await page.goto(ROUTES.newUser)
    await page.getByLabel('Empleado').fill('Matías')
    await page.getByRole('option', { name: /Matías Castro/ }).click()
    // El nombre de usuario se propone: inicial + apellido.
    await expect(page.getByLabel('Nombre de usuario')).toHaveValue('mcastro')

    await page.getByLabel('Contraseña', { exact: true }).fill('Tz8kq4Rmw2')
    await page.getByLabel('Repetir contraseña').fill('Tz8kq4Rmw2')
    await chooseOptions(page.getByRole('combobox', { name: 'Permisos' }), ['Encargado de Cotización', 'Encargado de Reportes'])
    await page.getByRole('button', { name: 'Registrar usuario' }).click()

    await expect(toast(page, 'Usuario registrado correctamente')).toBeVisible()
    await expect(page.getByRole('heading', { name: /mcastro/ })).toBeVisible()
    await expect(page.getByText('Nunca ingresó')).toBeVisible()
  })

  test('valida contraseñas, roles y el nombre de usuario repetido', async ({ page }) => {
    await page.goto(ROUTES.newUser)
    await page.getByLabel('Empleado').fill('Carla')
    await page.getByRole('option', { name: /Carla Videla/ }).click()
    await page.getByLabel('Nombre de usuario').fill('MRIOS')
    await page.getByLabel('Contraseña', { exact: true }).fill('corta')
    await page.getByLabel('Repetir contraseña').fill('distinta')
    await page.getByRole('button', { name: 'Registrar usuario' }).click()

    await expect(page.getByText('La contraseña debe tener al menos 8 caracteres')).toBeVisible()
    await expect(page.getByText('Las contraseñas no coinciden')).toBeVisible()
    await expect(page.getByText('Asigná al menos un rol')).toBeVisible()

    await page.getByLabel('Contraseña', { exact: true }).fill('Castro2026!')
    await page.getByLabel('Repetir contraseña').fill('Castro2026!')
    await chooseOptions(page.getByRole('combobox', { name: 'Permisos' }), ['Encargado de Recepción'])
    await page.getByRole('button', { name: 'Registrar usuario' }).click()
    await expect(page.getByText('El nombre de usuario ya está en uso')).toBeVisible()
  })

  test('avisa si el empleado ya tiene usuario', async ({ page }) => {
    await page.goto(ROUTES.newUser)
    await page.getByLabel('Empleado').fill('Gabriela')
    await expect(page.getByRole('option', { name: /Gabriela Torres/ })).toContainText('Ya tiene usuario')
  })

  test('el detalle avisa el estado de un usuario bloqueado', async ({ page }) => {
    await page.goto(detail.user(8))
    await expect(page.getByRole('heading', { name: /hfunes/ })).toBeVisible()
    await expect(
      page.getByText('Este usuario está bloqueado por 5 intentos fallidos de ingreso: no puede ingresar al sistema.'),
    ).toBeVisible()
  })
})
