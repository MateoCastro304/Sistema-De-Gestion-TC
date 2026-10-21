import type { Page } from '@playwright/test'
import { expect, row, rows, test, toast } from '../../support/fixtures'
import { ROUTES, detail } from '../../support/routes'

/**
 * Tipos de proceso (Sprint 2), para el Administrativo Técnico y el Encargado
 * de Cotización. Datos de `process-types.db.ts`: siete tipos; Mecanizado Torno
 * Manual (id 1) tiene dos cambios en el historial, Fresado (id 3) uno y
 * Soldadura / Herrería (id 4) ninguno. La cotización del dólar del mock es
 * $ 1.385,50 al 15/10/2026 09:30.
 *
 * Pantallas esperadas (las del prototipo): listado con "Buscar por nombre";
 * formulario con "Nombre", "Descripción", "Precio hora en pesos", "Precio
 * hora en dólares" y "Tipo de cambio (USD → ARS)", con los montos en formato
 * argentino (1.385,50); detalle con "Datos del tipo de proceso", "Registro" e
 * "Historial de precios".
 *
 * Escenarios que no se prueban acá:
 *   - CU-11 esc. 1, paginar de a 20: la semilla tiene 7 tipos.
 *   - CU-11 esc. 8 (parámetros de consulta inválidos) y el 400 por un precio
 *     sin tipo de cambio (CU-10 esc. 5): son de la API, la pantalla nunca
 *     manda esas peticiones.
 *   - CU-09 esc. 4, nombre de más de 100 caracteres: es una regla del schema.
 *   - CU-10 esc. 3, las cotizaciones conservan su costo hora: las cotizaciones
 *     llegan en otro sprint.
 */

/** Simula el `502 EXCHANGE_RATE_UNAVAILABLE` (ver `process-types.mocks.ts`). */
async function exchangeRateDown(page: Page) {
  await page.addInitScript(() => localStorage.setItem('castro-mock-exchange-rate-down', '1'))
}

function openEdit(page: Page) {
  return page.getByRole('button', { name: 'Modificar' }).or(page.getByRole('link', { name: 'Modificar' })).click()
}

test.describe('[DTC-205][CU-11] Consultar tipos de proceso', { tag: '@sprint2' }, () => {
  test.use({ sessionUser: 'fpaz' })

  test('lista los tipos ordenados por nombre y busca por nombre (esc. 1, 2 y 4)', async ({ page }) => {
    await page.goto(ROUTES.processTypes)
    await expect(page.getByText('7 tipos de proceso registrados')).toBeVisible()
    await expect(rows(page)).toHaveCount(7)
    await expect(rows(page).first()).toContainText('Armado / Desarmado')
    await expect(row(page, 'Mecanizado Torno Manual')).toContainText('$ 1.557,00')
    await expect(row(page, 'Mecanizado Torno Manual')).toContainText('US$ 1,13')

    // Sin distinguir mayúsculas ni acentos.
    const search = page.getByRole('searchbox', { name: 'Buscar por nombre' })
    await search.fill('TÓRNO')
    await expect(rows(page)).toHaveCount(2)
    await expect(row(page, 'Mecanizado Torno Manual')).toBeVisible()
    await expect(row(page, 'Mecanizado Torno CNC')).toBeVisible()

    await search.fill('pintura')
    await expect(page.getByText('No se encontraron tipos de proceso con ese criterio')).toBeVisible()
    await expect(page.getByRole('button', { name: '+ Nuevo tipo de proceso' }).or(page.getByRole('link', { name: '+ Nuevo tipo de proceso' })).first()).toBeVisible()
  })

  test('muestra el detalle con el historial del más reciente al más antiguo (esc. 3)', async ({ page }) => {
    await page.goto(ROUTES.processTypes)
    await row(page, 'Mecanizado Torno Manual').click()

    await expect(page.getByRole('heading', { name: 'Mecanizado Torno Manual' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Datos del tipo de proceso' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Registro', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Historial de precios' })).toBeVisible()

    // Sin paginar y sin opciones para editar ni borrar (CU-10 esc. 4).
    await expect(rows(page)).toHaveCount(2)
    await expect(rows(page).nth(0)).toContainText('lbenitez')
    await expect(rows(page).nth(0)).toContainText('US$ 1,21')
    await expect(rows(page).nth(0)).toContainText('US$ 1,13')
    await expect(rows(page).nth(1)).toContainText('fpaz')
    await expect(page.getByText('Este historial no se puede modificar.')).toBeVisible()
  })

  test('un tipo sin cambios de precio muestra el historial vacío (esc. 3)', async ({ page }) => {
    await page.goto(detail.processType(4))
    await expect(page.getByRole('heading', { name: 'Soldadura / Herrería' })).toBeVisible()
    await expect(page.getByText('Todavía no hubo cambios en este tipo de proceso.')).toBeVisible()
  })

  // Texto acordado con el equipo: ni el prototipo ni el contrato lo definen
  // (se tomó el del detalle de proveedores). También cubre CU-10 esc. 9.
  test('avisa si el tipo de proceso no existe (esc. 7)', async ({ page }) => {
    for (const url of [detail.processType(99), `${ROUTES.processTypes}/abc`]) {
      await page.goto(url)
      await expect(page.getByText('No encontramos el tipo de proceso que buscabas.')).toBeVisible()
    }
    await page.getByRole('link', { name: 'Volver al listado' }).click()
    await expect(page).toHaveURL(ROUTES.processTypes)
  })
})

test.describe('[DTC-203][CU-09] Registrar tipo de proceso', { tag: '@sprint2' }, () => {
  test.use({ sessionUser: 'lbenitez' })

  test('registra un tipo con los precios vinculados por el tipo de cambio (esc. 1)', async ({ page }) => {
    await page.goto(ROUTES.processTypes)
    await page.getByRole('button', { name: '+ Nuevo tipo de proceso' }).or(page.getByRole('link', { name: '+ Nuevo tipo de proceso' })).first().click()
    await expect(page).toHaveURL(ROUTES.newProcessType)

    await page.getByLabel('Nombre').fill('Mecanizado Torno CNC 5 ejes')
    await page.getByLabel('Precio hora en pesos').fill('3100')
    // 3100 / 1385,50 = 2,24
    await expect(page.getByLabel('Precio hora en dólares')).toHaveValue('2,24')
    await page.getByRole('button', { name: 'Registrar tipo de proceso' }).click()

    await expect(toast(page, 'Tipo de proceso registrado correctamente')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Mecanizado Torno CNC 5 ejes' })).toBeVisible()
    await expect(page.getByText('$ 3.100,00').first()).toBeVisible()
    await expect(page.getByText('US$ 2,24').first()).toBeVisible()
    await expect(page.getByText('Todavía no hubo cambios en este tipo de proceso.')).toBeVisible()
  })

  test('precarga la cotización del dólar y la deja restablecer (esc. 6)', async ({ page }) => {
    await page.goto(ROUTES.newProcessType)
    const rate = page.getByLabel('Tipo de cambio (USD → ARS)')
    await expect(rate).toHaveValue('1.385,50')
    await expect(page.getByText('Cotización actualizada al 15/10/2026 09:30.')).toBeVisible()

    await rate.fill('1400')
    await expect(page.getByText(/Valor modificado/)).toBeVisible()
    await page.getByRole('button', { name: /Restablecer cotización actual/ }).or(page.getByRole('link', { name: /Restablecer cotización actual/ })).click()
    await expect(rate).toHaveValue('1.385,50')
    await expect(page.getByText(/Valor modificado/)).toBeHidden()
  })

  test('recalcula el otro precio al cambiar pesos, dólares o el tipo de cambio (esc. 8)', async ({ page }) => {
    await page.goto(ROUTES.newProcessType)
    const ars = page.getByLabel('Precio hora en pesos')
    const usd = page.getByLabel('Precio hora en dólares')

    // Dólares → pesos = dólares × tipo de cambio.
    await usd.fill('3')
    await expect(ars).toHaveValue('4.156,50')

    // Tipo de cambio → los pesos se mantienen y se recalculan los dólares (RN18).
    await page.getByLabel('Tipo de cambio (USD → ARS)').fill('1400')
    await expect(ars).toHaveValue('4.156,50')
    await expect(usd).toHaveValue('2,97')
  })

  test('sin cotización del dólar, deja cargar el tipo de cambio a mano (esc. 7)', async ({ page }) => {
    await exchangeRateDown(page)
    await page.goto(ROUTES.newProcessType)
    const rate = page.getByLabel('Tipo de cambio (USD → ARS)')
    await expect(page.getByText('No se pudo obtener la cotización del dólar. Ingresá el tipo de cambio a mano.')).toBeVisible()
    await expect(rate).toHaveValue('')

    await page.getByLabel('Nombre').fill('Granallado')
    await rate.fill('1400')
    await page.getByLabel('Precio hora en pesos').fill('2800')
    await expect(page.getByLabel('Precio hora en dólares')).toHaveValue('2,00')
    await page.getByRole('button', { name: 'Registrar tipo de proceso' }).click()
    await expect(toast(page, 'Tipo de proceso registrado correctamente')).toBeVisible()
  })

  test('valida los obligatorios y los precios (esc. 3 y 4)', async ({ page }) => {
    await page.goto(ROUTES.newProcessType)
    await page.getByRole('button', { name: 'Registrar tipo de proceso' }).click()
    await expect(page.getByText('Ingresá el nombre del tipo de proceso')).toBeVisible()
    await expect(page.getByText('Ingresá el precio hora en pesos')).toBeVisible()

    await page.getByLabel('Precio hora en pesos').fill('0')
    await page.getByLabel('Precio hora en dólares').fill('1,234')
    await page.getByRole('button', { name: 'Registrar tipo de proceso' }).click()
    await expect(page.getByText('El precio hora en pesos tiene que ser un número mayor a 0')).toBeVisible()
    await expect(page.getByText('El precio hora en dólares admite como máximo dos decimales')).toBeVisible()
  })

  test('no repite el nombre, sin distinguir mayúsculas, acentos ni espacios (esc. 2)', async ({ page }) => {
    await page.goto(ROUTES.newProcessType)
    await page.getByLabel('Nombre').fill('mecanizado  Tórno manual')
    await page.getByLabel('Precio hora en pesos').fill('1000')
    await page.getByRole('button', { name: 'Registrar tipo de proceso' }).click()
    await expect(page.getByText('Ya existe un tipo de proceso con ese nombre').first()).toBeVisible()
  })
})

test.describe('[DTC-204][CU-10] Modificar tipo de proceso', { tag: '@sprint2' }, () => {
  test.use({ sessionUser: 'lbenitez' })

  test('actualiza por variación del dólar y suma una línea al historial (esc. 1 y 4)', async ({ page }) => {
    await page.goto(detail.processType(1))
    await openEdit(page)

    // Los valores actuales y la cotización de hoy, sin recalcular al abrir.
    await expect(page.getByLabel('Precio hora en pesos')).toHaveValue('1.557,00')
    await expect(page.getByLabel('Precio hora en dólares')).toHaveValue('1,13')
    await expect(page.getByLabel('Tipo de cambio (USD → ARS)')).toHaveValue('1.385,50')

    // 1557 / 1390 = 1,12; los pesos se mantienen (RN18).
    await page.getByLabel('Tipo de cambio (USD → ARS)').fill('1390')
    await expect(page.getByLabel('Precio hora en dólares')).toHaveValue('1,12')
    await expect(page.getByLabel('Precio hora en pesos')).toHaveValue('1.557,00')
    await page.getByRole('button', { name: 'Guardar cambios' }).click()

    const dialog = page.getByRole('dialog', { name: 'Confirmar cambios' })
    await expect(dialog).toContainText('Precio hora en dólares')
    await expect(dialog).toContainText(/US\$ 1,13\s*→\s*US\$ 1,12/)
    await dialog.getByRole('button', { name: 'Guardar cambios' }).click()

    await expect(toast(page, 'Tipo de proceso modificado correctamente')).toBeVisible()
    await expect(rows(page)).toHaveCount(3)
    await expect(rows(page).first()).toContainText('lbenitez')
    await expect(rows(page).first()).toContainText('US$ 1,13')
    await expect(rows(page).first()).toContainText('US$ 1,12')
    await expect(rows(page).first()).toContainText('$ 1.390,00')
  })

  test('modifica el precio en pesos y recalcula los dólares (esc. 2)', async ({ page }) => {
    await page.goto(detail.processType(3))
    await expect(page.getByRole('heading', { name: 'Fresado' })).toBeVisible()
    await openEdit(page)

    // 2078 / 1385,50 = 1,50
    await page.getByLabel('Precio hora en pesos').fill('2078')
    await expect(page.getByLabel('Precio hora en dólares')).toHaveValue('1,50')
    await page.getByRole('button', { name: 'Guardar cambios' }).click()

    const dialog = page.getByRole('dialog', { name: 'Confirmar cambios' })
    await expect(dialog).toContainText(/\$ 1\.890,00\s*→\s*\$ 2\.078,00/)
    await expect(dialog).toContainText(/US\$ 1,37\s*→\s*US\$ 1,50/)
    await dialog.getByRole('button', { name: 'Guardar cambios' }).click()

    await expect(toast(page, 'Tipo de proceso modificado correctamente')).toBeVisible()
    // Un solo registro aunque cambiaron los dos precios.
    await expect(rows(page)).toHaveCount(2)
    await expect(rows(page).first()).toContainText('US$ 1,50')
  })

  test('cambiar sólo la descripción no suma al historial (esc. 8)', async ({ page }) => {
    await page.goto(detail.processType(4))
    await openEdit(page)
    await page.getByLabel('Descripción').fill('Soldadura eléctrica, MIG y TIG.')
    await page.getByRole('button', { name: 'Guardar cambios' }).click()
    await page.getByRole('dialog', { name: 'Confirmar cambios' }).getByRole('button', { name: 'Guardar cambios' }).click()

    await expect(toast(page, 'Tipo de proceso modificado correctamente')).toBeVisible()
    await expect(page.getByText('Soldadura eléctrica, MIG y TIG.')).toBeVisible()
    await expect(page.getByText('Todavía no hubo cambios en este tipo de proceso.')).toBeVisible()
  })

  test('no deja usar el nombre de otro tipo de proceso (esc. 5)', async ({ page }) => {
    await page.goto(detail.processType(4))
    await openEdit(page)
    await page.getByLabel('Nombre').fill('fresado')
    await page.getByRole('button', { name: 'Guardar cambios' }).click()
    // La unicidad la decide la API (409) al confirmar; el error va en el campo.
    await page.getByRole('dialog', { name: 'Confirmar cambios' }).getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(page.getByText('Ya existe un tipo de proceso con ese nombre').first()).toBeVisible()
    await expect(page.getByLabel('Nombre')).toHaveValue('fresado')
  })

  test('no guarda si no hubo cambios (esc. 6)', async ({ page }) => {
    await page.goto(detail.processType(4))
    await openEdit(page)
    await page.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(toast(page, 'No hay cambios para guardar')).toBeVisible()
    await expect(page.getByRole('dialog', { name: 'Confirmar cambios' })).toBeHidden()
  })
})

// CU-09 esc. 5, CU-10 esc. 7 y CU-11 esc. 5 y 6: sin AT ni EC no se entra ni
// por el menú ni por la URL (D-13).
for (const user of ['gtorres', 'rsanchez', 'mrios', 'wcastro'] as const) {
  test.describe(`[DTC-203][DTC-204][DTC-205] Tipos de proceso: acceso de ${user}`, { tag: '@sprint2' }, () => {
    test.use({ sessionUser: user })

    test('no entra al listado, al alta ni al detalle', async ({ page }) => {
      for (const url of [ROUTES.processTypes, ROUTES.newProcessType, detail.processType(1)]) {
        await page.goto(url)
        await expect(page.getByRole('heading', { name: 'Acceso denegado' })).toBeVisible()
      }
    })
  })
}
