import { expect, row, rows, test, toast } from '../../support/fixtures'
import { ROUTES } from '../../support/routes'

/**
 * Rubros (Sprint 1). Datos de la semilla de `categories.db.ts`: cinco rubros
 * activos y "Fundición" dado de baja. "Autopartes" lo usa la fábrica EDASA,
 * así que no se puede dar de baja.
 */
test.describe('[CU-41][CU-42][CU-43][CU-44] Rubros', { tag: '@sprint1' }, () => {
  test.use({ sessionUser: 'mrios' })

  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.categories)
    await expect(page.getByRole('heading', { name: 'Rubros' })).toBeVisible()
  })

  test('lista los rubros activos y busca sin importar acentos', async ({ page }) => {
    await expect(page.getByText('5 rubros registrados')).toBeVisible()
    await expect(row(page, 'Metalúrgica')).toBeVisible()
    await expect(row(page, 'Fundición')).toHaveCount(0)

    await page.getByRole('searchbox', { name: 'Buscar rubro' }).fill('metalurgica')
    await expect(rows(page)).toHaveCount(1)
    await expect(row(page, 'Metalúrgica')).toBeVisible()

    await page.getByRole('searchbox', { name: 'Buscar rubro' }).fill('zzz')
    await expect(page.getByText('No hay rubros que coincidan con la búsqueda.')).toBeVisible()
  })

  test('registra un rubro nuevo y valida el largo mínimo', async ({ page }) => {
    await page.getByRole('button', { name: '+ Nuevo rubro' }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Nuevo rubro' })
    const name = dialog.getByLabel('Nombre del rubro')

    await name.fill('ab')
    await dialog.getByRole('button', { name: 'Crear rubro' }).click()
    await expect(dialog.getByText('El nombre debe tener al menos 3 caracteres')).toBeVisible()

    await name.fill('Siderurgia')
    await dialog.getByRole('button', { name: 'Crear rubro' }).click()
    await expect(toast(page, 'Rubro "Siderurgia" creado.')).toBeVisible()
    await expect(dialog).toBeHidden()
    await expect(row(page, 'Siderurgia')).toBeVisible()
  })

  test('no repite nombres y reactiva un rubro dado de baja', async ({ page }) => {
    await page.getByRole('button', { name: '+ Nuevo rubro' }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Nuevo rubro' })

    await dialog.getByLabel('Nombre del rubro').fill('metalúrgica')
    await dialog.getByRole('button', { name: 'Crear rubro' }).click()
    await expect(toast(page, 'Ya existe un rubro con ese nombre')).toBeVisible()

    await dialog.getByLabel('Nombre del rubro').fill('Fundición')
    await dialog.getByRole('button', { name: 'Crear rubro' }).click()
    await expect(toast(page, 'El rubro "Fundición" estaba dado de baja y se reactivó.')).toBeVisible()
    await expect(row(page, 'Fundición')).toBeVisible()
  })

  test('modifica el nombre de un rubro', async ({ page }) => {
    await page.getByRole('button', { name: 'Editar Agroindustria' }).click()
    const dialog = page.getByRole('dialog', { name: 'Editar rubro' })
    await expect(dialog.getByLabel('Nombre del rubro')).toHaveValue('Agroindustria')

    await dialog.getByLabel('Nombre del rubro').fill('Agroindustria y alimentos')
    await dialog.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(toast(page, 'Rubro "Agroindustria y alimentos" actualizado.')).toBeVisible()
    await expect(row(page, 'Agroindustria y alimentos')).toBeVisible()
  })

  test('da de baja un rubro libre y no deja dar de baja uno en uso', async ({ page }) => {
    await page.getByRole('button', { name: 'Dar de baja Autopartes' }).click()
    await page.getByRole('dialog', { name: 'Dar de baja rubro' }).getByRole('button', { name: 'Dar de baja' }).click()
    await expect(toast(page, /existen 1 fábricas activas asociadas/)).toBeVisible()
    await expect(row(page, 'Autopartes')).toBeVisible()

    await page.getByRole('button', { name: 'Dar de baja Particular' }).click()
    await page.getByRole('dialog', { name: 'Dar de baja rubro' }).getByRole('button', { name: 'Dar de baja' }).click()
    await expect(toast(page, 'Rubro "Particular" dado de baja.')).toBeVisible()
    await expect(row(page, 'Particular')).toHaveCount(0)
  })
})
