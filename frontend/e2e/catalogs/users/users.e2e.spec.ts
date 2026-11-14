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

  test('[DTC-131] el listado está ordenado por nombre de usuario y muestra empleado y roles', async ({ page }) => {
    await page.goto(ROUTES.users)
    await expect(rows(page)).toHaveCount(8)
    // dcastro abre la lista y wcastro la cierra: orden alfabético del usuario.
    await expect(rows(page).first()).toContainText('dcastro')
    await expect(rows(page).last()).toContainText('wcastro')
    await expect(row(page, 'dcastro')).toContainText('Castro')
    await expect(row(page, 'dcastro')).toContainText('Encargado de Cotización')
  })

  test('[DTC-131] busca por usuario o empleado sin distinguir mayúsculas ni acentos', async ({ page }) => {
    await page.goto(ROUTES.users)
    const search = page.getByRole('searchbox', { name: 'Buscar por usuario o empleado' })

    // Por el nombre del empleado, sin el acento de "Mónica".
    await search.fill('MONICA')
    await expect(rows(page)).toHaveCount(1)
    await expect(row(page, 'mrios')).toBeVisible()

    // Por el nombre de usuario.
    await search.fill('FPAZ')
    await expect(rows(page)).toHaveCount(1)
    await expect(row(page, 'fpaz')).toBeVisible()
  })

  test('[DTC-131] avisa si no hay resultados y ofrece crear un usuario', async ({ page }) => {
    await page.goto(ROUTES.users)
    await page.getByRole('searchbox', { name: 'Buscar por usuario o empleado' }).fill('zzzz')

    await expect(page.getByText('No se encontraron usuarios con ese criterio')).toBeVisible()
    await expect(page.getByRole('link', { name: '+ Nuevo usuario' }).last()).toBeVisible()
  })

  test('[DTC-131] abre el detalle desde el listado', async ({ page }) => {
    await page.goto(ROUTES.users)
    await row(page, 'wcastro').getByRole('link', { name: 'Ver' }).click()
    await expect(page).toHaveURL(detail.user(1))
    await expect(page.getByRole('heading', { name: /wcastro/ })).toBeVisible()
  })

  test('[DTC-131] el detalle de un usuario dado de baja lo avisa', async ({ page }) => {
    await page.goto(detail.user(9))
    await expect(page.getByRole('heading', { name: /ogimenez/ })).toBeVisible()
    await expect(page.getByText('Este usuario está inactivo: no puede ingresar al sistema.')).toBeVisible()
  })

  test('[DTC-131] avisa si el usuario no existe', async ({ page }) => {
    await page.goto(detail.user(999))
    await expect(page.getByText('No encontramos el usuario que buscabas.')).toBeVisible()
  })
})

test.describe('[DTC-131][CU-07] Usuarios: acceso por rol', { tag: '@sprint2' }, () => {
  // mrios es Encargado de Presupuesto: no administra usuarios.
  test.use({ sessionUser: 'mrios' })

  test('otro rol ve acceso denegado en el listado de usuarios', async ({ page }) => {
    await page.goto(ROUTES.users)
    await expect(page.getByRole('heading', { name: 'Acceso denegado' })).toBeVisible()
    await expect(page.getByText('No tenés permisos para realizar esta operación.')).toBeVisible()
  })
})
