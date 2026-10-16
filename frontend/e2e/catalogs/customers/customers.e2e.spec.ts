import { chooseOption, expect, row, rows, test, toast } from '../../support/fixtures'
import { ROUTES, detail } from '../../support/routes'

/**
 * Encargados (Sprint 1). Datos de la semilla de `customers.db.ts`: Laura
 * Gómez (EDASA) y Martín Pérez (OxyCAM).
 */
test.describe('[CU-01][CU-02][CU-03][CU-04] Encargados', { tag: '@sprint1' }, () => {
  test.use({ sessionUser: 'mrios' })

  test('lista los encargados activos con su fábrica y busca por apellido', async ({ page }) => {
    await page.goto(ROUTES.customers)
    await expect(page.getByText('2 encargados activos')).toBeVisible()
    await expect(row(page, 'Laura Gómez')).toContainText('EDASA')
    await expect(row(page, 'Martín Pérez')).toContainText('OxyCAM')

    await page.getByRole('searchbox', { name: 'Buscar por nombre o apellido' }).fill('gomez')
    await expect(rows(page)).toHaveCount(1)
    await expect(row(page, 'Laura Gómez')).toBeVisible()
  })

  test('registra un encargado en una fábrica', async ({ page }) => {
    await page.goto(ROUTES.newCustomer)
    await page.getByLabel('Nombre', { exact: true }).fill('Ana')
    await page.getByLabel('Apellido (opcional)').fill('Ruiz')
    await page.getByLabel('Email').fill('ana.ruiz@edasa.com')
    await chooseOption(page.getByRole('combobox', { name: 'Fábrica' }), 'EDASA')
    await page.getByRole('button', { name: 'Crear encargado' }).click()

    await expect(toast(page, 'Encargado "Ana Ruiz" registrado.')).toBeVisible()
    await expect(page).toHaveURL(ROUTES.customers)
    await expect(row(page, 'Ana Ruiz')).toContainText('EDASA')
  })

  test('pide al menos un medio de contacto y no repite el mail en la fábrica', async ({ page }) => {
    await page.goto(ROUTES.newCustomer)
    await page.getByLabel('Nombre', { exact: true }).fill('Ana')
    await chooseOption(page.getByRole('combobox', { name: 'Fábrica' }), 'EDASA')
    await page.getByRole('button', { name: 'Crear encargado' }).click()
    await expect(page.getByText('Registrá al menos un medio de contacto (mail o teléfono)')).toBeVisible()

    // El mail de Laura Gómez, en mayúsculas: el backend compara sin distinguirlas.
    await page.getByLabel('Email').fill('COMPRAS@edasa.com')
    await page.getByRole('button', { name: 'Crear encargado' }).click()
    await expect(toast(page, 'Ya existe un encargado con ese email en esta fábrica.')).toBeVisible()
    await expect(page).toHaveURL(ROUTES.newCustomer)
  })

  test('modifica los datos de contacto desde el detalle', async ({ page }) => {
    await page.goto(detail.customer(1, 1))
    await expect(page.getByRole('heading', { name: 'Laura Gómez' })).toBeVisible()

    await page.getByRole('button', { name: 'Editar', exact: true }).click()
    await page.getByLabel('Teléfono').fill('+54 9 351 555-9999')
    await page.getByRole('button', { name: 'Guardar cambios' }).first().click()
    await expect(toast(page, 'Encargado actualizado.')).toBeVisible()
    await expect(page.getByText('+54 9 351 555-9999')).toBeVisible()
  })

  test('da de baja un encargado y deja de listarse', async ({ page }) => {
    await page.goto(ROUTES.customers)
    await page.getByRole('button', { name: 'Eliminar a Laura Gómez' }).click()
    await page.getByRole('dialog', { name: 'Eliminar encargado' }).getByRole('button', { name: 'Eliminar' }).click()

    await expect(toast(page, 'Encargado "Laura Gómez" eliminado.')).toBeVisible()
    await expect(row(page, 'Laura Gómez')).toHaveCount(0)
    await expect(page.getByText('1 encargado activo')).toBeVisible()
  })
})
