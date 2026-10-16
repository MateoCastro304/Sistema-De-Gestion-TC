import { chooseOption, expect, row, rows, test, toast } from '../../support/fixtures'
import { ROUTES, detail } from '../../support/routes'

/**
 * Empleados (Sprint 2), sólo para el Administrador del Sistema. Datos de
 * `employees.db.ts`: 11 activos (tres sin usuario: Matías Castro, Ezequiel
 * Moreno y Carla Videla) y Omar Giménez dado de baja.
 *
 * Pantallas esperadas (las del prototipo): listado con "Buscar por nombre,
 * apellido, DNI o puesto" e "Incluir dados de baja"; alta con "Nombre",
 * "Apellido", "DNI", "Puesto", "Dirección", "Email" y "Teléfono".
 */
test.describe('[CU-45][CU-47] Empleados', { tag: '@sprint2' }, () => {
  test.use({ sessionUser: 'wcastro' })

  test('lista los empleados activos, busca por puesto e incluye los dados de baja', async ({ page }) => {
    await page.goto(ROUTES.employees)
    await expect(page.getByText('11 empleados activos')).toBeVisible()
    await expect(row(page, 'Omar')).toHaveCount(0)

    const search = page.getByRole('searchbox', { name: 'Buscar por nombre, apellido, DNI o puesto' })
    await search.fill('jefe de taller')
    await expect(rows(page)).toHaveCount(1)
    await expect(row(page, 'Sánchez')).toBeVisible()

    await search.fill('')
    await page.getByLabel('Incluir dados de baja').check()
    await expect(row(page, 'Giménez')).toContainText('Inactivo')
  })

  test('registra un empleado', async ({ page }) => {
    await page.goto(ROUTES.employees)
    await page.getByRole('link', { name: '+ Nuevo empleado' }).click()
    await expect(page).toHaveURL(ROUTES.newEmployee)

    await page.getByLabel('Nombre').fill('Julián')
    await page.getByLabel('Apellido').fill('Ferreyra')
    await page.getByLabel('DNI').fill('42345678')
    await chooseOption(page.getByRole('combobox', { name: 'Puesto' }), 'Empleado')
    await page.getByLabel('Teléfono').fill('+54 351 555-1013')
    await page.getByRole('button', { name: 'Registrar empleado' }).click()

    await expect(toast(page, 'Empleado registrado correctamente')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Julián Ferreyra/ })).toBeVisible()
    await expect(page.getByText('Este empleado todavía no tiene usuario.')).toBeVisible()
  })

  test('valida los obligatorios y no repite el DNI', async ({ page }) => {
    await page.goto(ROUTES.newEmployee)
    await page.getByRole('button', { name: 'Registrar empleado' }).click()
    await expect(page.getByText('Ingresá el nombre')).toBeVisible()
    await expect(page.getByText('Ingresá el apellido')).toBeVisible()
    await expect(page.getByText('Ingresá el DNI')).toBeVisible()
    await expect(page.getByText('Elegí el puesto')).toBeVisible()

    await page.getByLabel('Nombre').fill('Otro')
    await page.getByLabel('Apellido').fill('Castro')
    await chooseOption(page.getByRole('combobox', { name: 'Puesto' }), 'Jefe')
    // El DNI de Walter Castro.
    await page.getByLabel('DNI').fill('20112233')
    await page.getByRole('button', { name: 'Registrar empleado' }).click()
    await expect(page.getByText('Ya existe un empleado con ese DNI')).toBeVisible()
  })

  test('el detalle muestra su usuario o el acceso para crearlo', async ({ page }) => {
    await page.goto(detail.employee(1))
    await expect(page.getByRole('heading', { name: /Walter Castro/ })).toBeVisible()
    await expect(page.getByText('wcastro')).toBeVisible()

    await page.goto(detail.employee(9))
    await expect(page.getByRole('heading', { name: /Matías Castro/ })).toBeVisible()
    await expect(page.getByText('Este empleado todavía no tiene usuario.')).toBeVisible()
    await page.getByRole('link', { name: 'Crear usuario' }).click()
    await expect(page).toHaveURL(new RegExp(`${ROUTES.newUser}`))
    await expect(page.getByText('Matías Castro')).toBeVisible()
  })
})
