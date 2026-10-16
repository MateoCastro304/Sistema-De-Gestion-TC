import { expect, row, rows, test, toast } from '../../support/fixtures'
import { ROUTES, detail } from '../../support/routes'

/**
 * Tipos de proceso (Sprint 2), para el Administrativo Técnico y el Encargado
 * de Cotización. Datos de `process-types.db.ts`: siete tipos; Fresado (id 3)
 * tiene un cambio en el historial y Soldadura / Herrería (id 4) ninguno. La
 * cotización del dólar del mock es $ 1.385,50.
 *
 * Pantallas esperadas (las del prototipo): listado con "Buscar por nombre";
 * formulario con "Nombre", "Descripción", "Precio hora en pesos", "Precio
 * hora en dólares" y "Tipo de cambio (USD → ARS)", con los montos en formato
 * argentino (1.385,50).
 */
test.describe('[CU-09][CU-10][CU-11] Tipos de proceso', { tag: '@sprint2' }, () => {
  test.use({ sessionUser: 'lbenitez' })

  test('lista los tipos de proceso y busca por nombre', async ({ page }) => {
    await page.goto(ROUTES.processTypes)
    await expect(page.getByText('7 tipos de proceso registrados')).toBeVisible()

    await page.getByRole('searchbox', { name: 'Buscar por nombre' }).fill('torno')
    await expect(rows(page)).toHaveCount(2)
    await expect(row(page, 'Mecanizado Torno Manual')).toBeVisible()
    await expect(row(page, 'Mecanizado Torno CNC')).toBeVisible()
  })

  test('registra un tipo de proceso con los precios vinculados por el tipo de cambio', async ({ page }) => {
    await page.goto(ROUTES.newProcessType)
    await expect(page.getByLabel('Tipo de cambio (USD → ARS)')).toHaveValue('1.385,50')

    await page.getByLabel('Nombre').fill('Mecanizado Torno CNC 5 ejes')
    await page.getByLabel('Precio hora en pesos').fill('2771')
    // 2771 / 1385,50 = 2,00
    await expect(page.getByLabel('Precio hora en dólares')).toHaveValue('2,00')
    await page.getByRole('button', { name: 'Registrar tipo de proceso' }).click()

    await expect(toast(page, 'Tipo de proceso registrado correctamente')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Mecanizado Torno CNC 5 ejes' })).toBeVisible()
    await expect(page.getByText('Todavía no hubo cambios en este tipo de proceso.')).toBeVisible()
  })

  test('valida los obligatorios y no repite el nombre', async ({ page }) => {
    await page.goto(ROUTES.newProcessType)
    await page.getByRole('button', { name: 'Registrar tipo de proceso' }).click()
    await expect(page.getByText('Ingresá el nombre del tipo de proceso')).toBeVisible()
    await expect(page.getByText('Ingresá el precio hora en pesos')).toBeVisible()

    // Sin distinguir mayúsculas ni acentos.
    await page.getByLabel('Nombre').fill('FRESADO')
    await page.getByLabel('Precio hora en pesos').fill('1000')
    await page.getByRole('button', { name: 'Registrar tipo de proceso' }).click()
    await expect(page.getByText('Ya existe un tipo de proceso con ese nombre')).toBeVisible()
  })

  test('modifica el precio, confirma los cambios y suma una línea al historial', async ({ page }) => {
    await page.goto(detail.processType(3))
    await expect(page.getByRole('heading', { name: 'Fresado' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Historial de precios' })).toBeVisible()

    await page.getByRole('button', { name: 'Modificar' }).or(page.getByRole('link', { name: 'Modificar' })).click()
    await page.getByLabel('Precio hora en pesos').fill('2078')
    await page.getByRole('button', { name: 'Guardar cambios' }).click()

    const dialog = page.getByRole('dialog', { name: 'Confirmar cambios' })
    await expect(dialog).toContainText('→')
    await dialog.getByRole('button', { name: 'Guardar cambios' }).click()

    await expect(toast(page, 'Tipo de proceso modificado correctamente')).toBeVisible()
    await expect(page.getByText('lbenitez').first()).toBeVisible()
  })

  test('no guarda si no hubo cambios', async ({ page }) => {
    await page.goto(detail.processType(4))
    await expect(page.getByText('Todavía no hubo cambios en este tipo de proceso.')).toBeVisible()

    await page.getByRole('button', { name: 'Modificar' }).or(page.getByRole('link', { name: 'Modificar' })).click()
    await page.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(toast(page, 'No hay cambios para guardar')).toBeVisible()
  })
})

test.describe('[CU-11][D-13] Tipos de proceso: acceso', { tag: '@sprint2' }, () => {
  test.use({ sessionUser: 'gtorres' })

  test('el Encargado de Reportes no ve los tipos de proceso', async ({ page }) => {
    await page.goto(ROUTES.processTypes)
    await expect(page.getByRole('heading', { name: 'Acceso denegado' })).toBeVisible()
  })
})
