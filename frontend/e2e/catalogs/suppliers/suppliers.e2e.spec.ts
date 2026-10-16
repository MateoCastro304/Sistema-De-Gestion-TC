import { chooseOption, expect, row, rows, test, toast } from '../../support/fixtures'
import { ROUTES, detail } from '../../support/routes'

/**
 * Proveedores (Sprint 1). Datos de la semilla de `suppliers.db.ts`: cinco
 * proveedores activos y uno dado de baja (Aluminios Pampa), que no se lista.
 */
test.describe('[CU-33][CU-34][CU-35][CU-36] Proveedores', { tag: '@sprint1' }, () => {
  test.use({ sessionUser: 'lbenitez' })

  test('lista los proveedores vigentes, busca por CUIT y filtra por tipo', async ({ page }) => {
    await page.goto(ROUTES.suppliers)
    await expect(row(page, 'Aceros del Sur S.A.')).toBeVisible()
    await expect(rows(page)).toHaveCount(5)
    await expect(row(page, 'Aluminios Pampa')).toHaveCount(0)

    const search = page.getByRole('searchbox', { name: 'Buscar proveedores' })
    await search.fill('33698745210')
    await expect(rows(page)).toHaveCount(1)
    await expect(row(page, 'Bronces Industriales Castro')).toBeVisible()

    await search.fill('')
    await chooseOption(page.getByRole('combobox', { name: 'Filtrar por tipo' }), 'Pintura')
    await expect(rows(page)).toHaveCount(2)
    await expect(row(page, 'Metalúrgica Rivadavia S.R.L.')).toBeVisible()
    await expect(row(page, 'Insumos Técnicos del Litoral S.A.')).toBeVisible()
  })

  test('registra un proveedor y abre su detalle', async ({ page }) => {
    await page.goto(ROUTES.newSupplier)
    await page.getByLabel('Razón social').fill('Pinturas Córdoba S.A.')
    await page.getByLabel('CUIT').fill('30-71555444-1')
    await page.getByRole('group', { name: 'Tipo' }).getByText('Pintura').click()
    await page.getByLabel('Persona de contacto').fill('Sofía Medina')
    await page.getByRole('button', { name: 'Crear proveedor' }).click()

    await expect(toast(page, 'Proveedor creado exitosamente.')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Pinturas Córdoba S.A.' })).toBeVisible()
  })

  test('no repite la razón social de otro proveedor', async ({ page }) => {
    await page.goto(ROUTES.newSupplier)
    await page.getByLabel('Razón social').fill('aceros del sur s.a.')
    await page.getByRole('group', { name: 'Tipo' }).getByText('Material').click()
    await page.getByRole('button', { name: 'Crear proveedor' }).click()

    await expect(page.getByText('Ya existe un proveedor con esa razón social.')).toBeVisible()
    await expect(page).toHaveURL(ROUTES.newSupplier)
  })

  test('modifica el contacto de un proveedor', async ({ page }) => {
    await page.goto(detail.supplier(1))
    await expect(page.getByRole('heading', { name: 'Aceros del Sur S.A.' })).toBeVisible()

    await page.getByRole('button', { name: 'Editar', exact: true }).click()
    await page.getByLabel('Persona de contacto').fill('Diego Fernández (ventas)')
    await page.getByRole('button', { name: 'Guardar cambios' }).first().click()

    await expect(toast(page, 'Proveedor actualizado.')).toBeVisible()
    await expect(page.getByText('Diego Fernández (ventas)')).toBeVisible()
  })

  test('elimina varios proveedores a la vez', async ({ page }) => {
    await page.goto(ROUTES.suppliers)
    await page.getByRole('button', { name: 'Eliminar proveedores' }).click()
    await page.getByRole('checkbox', { name: 'Seleccionar Aceros del Sur S.A.' }).check()
    await page.getByRole('checkbox', { name: 'Seleccionar Bronces Industriales Castro' }).check()
    await expect(page.getByText('2 proveedores seleccionados')).toBeVisible()

    await page.getByRole('button', { name: 'Confirmar' }).click()
    const dialog = page.getByRole('dialog', { name: 'Eliminar proveedores' })
    await expect(dialog.getByText('Vas a eliminar estos 2 proveedores:')).toBeVisible()
    await dialog.getByRole('button', { name: 'Eliminar' }).click()

    await expect(toast(page, '2 proveedores eliminados.')).toBeVisible()
    await expect(rows(page)).toHaveCount(3)
    await expect(row(page, 'Aceros del Sur S.A.')).toHaveCount(0)
  })
})
