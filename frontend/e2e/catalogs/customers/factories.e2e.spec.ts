import { chooseOption, expect, row, rows, test, toast } from '../../support/fixtures'
import { ROUTES, detail } from '../../support/routes'

/**
 * Fábricas (Sprint 1). Están en el feature `customers` porque es el mismo
 * módulo del frontend. Datos de la semilla de `customers.db.ts`: EDASA
 * (Autopartes, con encargado), OxyCAM (Petróleo y gas, con encargado) y
 * Agro Pampa (Agroindustria, sin encargados).
 */
test.describe('[CU-58][CU-59][CU-60][CU-61] Fábricas', { tag: '@sprint1' }, () => {
  test.use({ sessionUser: 'mrios' })

  test('lista las fábricas, busca por CUIT y filtra por rubro', async ({ page }) => {
    await page.goto(ROUTES.factories)
    await expect(page.getByText('3 fábricas registradas')).toBeVisible()

    const search = page.getByRole('searchbox', { name: 'Buscar por razón social o CUIT' })
    await search.fill('30-79876543-0')
    await expect(rows(page)).toHaveCount(1)
    await expect(row(page, 'OxyCAM')).toBeVisible()

    await search.fill('')
    await chooseOption(page.getByRole('combobox', { name: 'Filtrar por rubro' }), 'Autopartes')
    await expect(rows(page)).toHaveCount(1)
    await expect(row(page, 'EDASA')).toBeVisible()
  })

  test('registra una fábrica y ofrece cargar su encargado', async ({ page }) => {
    await page.goto(ROUTES.newFactory)
    await page.getByLabel('Nombre').fill('Metalúrgica Sur')
    await page.getByLabel('CUIT').fill('30-70987654-2')
    await chooseOption(page.getByRole('combobox', { name: 'Rubro' }), 'Metalúrgica')
    await page.getByRole('button', { name: 'Crear fábrica' }).click()

    await expect(toast(page, 'Fábrica registrada correctamente.')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Metalúrgica Sur' })).toBeVisible()
    await expect(page.getByRole('dialog', { name: 'Agregar encargado' })).toBeVisible()
  })

  test('valida el CUIT y no repite uno registrado', async ({ page }) => {
    await page.goto(ROUTES.newFactory)
    await page.getByLabel('Nombre').fill('Otra fábrica')
    await chooseOption(page.getByRole('combobox', { name: 'Rubro' }), 'Metalúrgica')

    await page.getByLabel('CUIT').fill('30-71234567-2')
    await page.getByRole('button', { name: 'Crear fábrica' }).click()
    await expect(page.getByText('El último dígito no coincide con el resto del CUIT.', { exact: false })).toBeVisible()

    // El CUIT de EDASA.
    await page.getByLabel('CUIT').fill('30-71234567-1')
    await page.getByRole('button', { name: 'Crear fábrica' }).click()
    await expect(toast(page, 'Ya existe una fábrica registrada con ese CUIT.')).toBeVisible()
  })

  test('modifica los datos de una fábrica sin tocar el CUIT', async ({ page }) => {
    await page.goto(detail.factory(2))
    await expect(page.getByRole('heading', { name: 'OxyCAM' })).toBeVisible()

    await page.getByRole('button', { name: 'Editar', exact: true }).click()
    await expect(page.getByLabel('CUIT')).not.toBeEditable()
    await page.getByLabel('Dirección (opcional)').fill('Parque Industrial Ferreyra, Córdoba')
    await page.getByRole('button', { name: 'Guardar cambios' }).first().click()

    await expect(toast(page, 'Fábrica actualizada.')).toBeVisible()
    await expect(page.getByText('Parque Industrial Ferreyra, Córdoba')).toBeVisible()
  })

  test('no deja dar de baja una fábrica con encargados activos', async ({ page }) => {
    await page.goto(detail.factory(1))
    await page.getByRole('button', { name: 'Eliminar', exact: true }).first().click()
    await page.getByRole('dialog', { name: 'Eliminar fábrica' }).getByRole('button', { name: 'Eliminar' }).click()

    await expect(toast(page, /la fábrica tiene encargados activos/)).toBeVisible()
    await expect(page).toHaveURL(detail.factory(1))
  })

  test('da de baja una fábrica sin encargados', async ({ page }) => {
    await page.goto(detail.factory(3))
    await expect(page.getByText(/no será posible\s+enviar informes de cotización/)).toBeVisible()

    await page.getByRole('button', { name: 'Eliminar', exact: true }).first().click()
    await page.getByRole('dialog', { name: 'Eliminar fábrica' }).getByRole('button', { name: 'Eliminar' }).click()

    await expect(toast(page, 'Fábrica "Agro Pampa" eliminada.')).toBeVisible()
    await expect(page).toHaveURL(ROUTES.factories)
    await expect(row(page, 'Agro Pampa')).toHaveCount(0)
  })
})
