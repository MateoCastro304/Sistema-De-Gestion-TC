import { chooseOption, expect, row, rows, test, toast } from '../../support/fixtures'
import { ROUTES } from '../../support/routes'

/**
 * Materiales (Sprint 2), para el Administrativo Técnico y el Encargado de
 * Cotización. Datos de `materials.mocks.ts`: 13 materiales, la semilla del
 * prototipo. El listado no tiene detalle ni acciones por fila.
 *
 * Pantallas esperadas (las del prototipo): listado con el filtro "Todos los
 * materiales" y "Buscar por calidad"; la ventana "Nuevo material" con
 * "Material" (elegir de la lista o escribir uno nuevo) y "Calidad".
 */
test.describe('[CU-37][CU-39] Materiales', { tag: '@sprint2' }, () => {
  test.use({ sessionUser: 'fpaz' })

  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.materials)
    await expect(page.getByRole('heading', { name: 'Materiales' })).toBeVisible()
  })

  test('lista los materiales, filtra por material y busca por calidad', async ({ page }) => {
    await expect(page.getByText('13 materiales registrados')).toBeVisible()

    await chooseOption(page.getByRole('combobox', { name: 'Filtrar por material' }), 'Bronce')
    await expect(rows(page)).toHaveCount(2)
    // Orden natural de la calidad: SAE 62 antes que SAE 65.
    await expect(rows(page).first()).toContainText('SAE 62')

    await chooseOption(page.getByRole('combobox', { name: 'Filtrar por material' }), 'Todos los materiales')
    await page.getByRole('searchbox', { name: 'Buscar por calidad' }).fill('aisi')
    await expect(rows(page)).toHaveCount(2)
    await expect(row(page, 'AISI 304')).toBeVisible()
  })

  test('registra un material con un nombre existente', async ({ page }) => {
    await page.getByRole('button', { name: '+ Nuevo material' }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Nuevo material' })
    // Escrito en minúsculas: se guarda con la grafía del existente ("Acero").
    await dialog.getByLabel('Material').fill('acero')
    await dialog.getByLabel('Calidad').fill('4140')
    await dialog.getByRole('button', { name: 'Registrar material' }).click()

    await expect(toast(page, 'Material registrado correctamente')).toBeVisible()
    await expect(row(page, '4140')).toContainText('Acero')
    await expect(page.getByText('14 materiales registrados')).toBeVisible()
  })

  test('valida los campos y no repite nombre y calidad', async ({ page }) => {
    await page.getByRole('button', { name: '+ Nuevo material' }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Nuevo material' })
    await dialog.getByRole('button', { name: 'Registrar material' }).click()
    await expect(dialog.getByText('Ingresá el material')).toBeVisible()
    await expect(dialog.getByText('Ingresá la calidad')).toBeVisible()

    await dialog.getByLabel('Material').fill('Acero')
    await dialog.getByLabel('Calidad').fill('1045')
    await dialog.getByRole('button', { name: 'Registrar material' }).click()
    await expect(dialog.getByText('Ya existe un material registrado con ese nombre y calidad')).toBeVisible()
  })
})
