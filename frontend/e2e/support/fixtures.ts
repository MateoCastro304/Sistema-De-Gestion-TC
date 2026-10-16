import { test as base, expect, type Locator, type Page } from '@playwright/test'
import { seedSession, type Username } from './session'

/**
 * `test` de la suite: el de Playwright más la opción `sessionUser`.
 *
 *   test.use({ sessionUser: 'mrios' })   // arranca logueado como mrios
 *
 * Sin `sessionUser` el test arranca sin sesión (pantalla de ingreso).
 */
export const test = base.extend<{ sessionUser: Username | null; seededSession: void }>({
  sessionUser: [null, { option: true }],
  seededSession: [
    async ({ page, sessionUser }, use) => {
      if (sessionUser) await seedSession(page, sessionUser)
      await use()
    },
    { auto: true },
  ],
})

export { expect }

/** El aviso flotante (toast) con ese texto. */
export function toast(page: Page, text: string | RegExp): Locator {
  return page.getByRole('region').getByRole('alert').filter({ hasText: text })
}

/**
 * Elige una opción de un desplegable. Sirve para el `Select` propio de la
 * app (un botón con role="combobox" y una lista con role="listbox") y
 * también para un `<select>` nativo, por si alguna pantalla lo usa.
 */
export async function chooseOption(combobox: Locator, option: string | RegExp) {
  const tag = await combobox.evaluate((element) => element.tagName)
  if (tag === 'SELECT') {
    await combobox.selectOption({ label: typeof option === 'string' ? option : undefined })
    return
  }
  await combobox.click()
  await combobox.page().getByRole('listbox').getByRole('option', { name: option }).click()
}

/**
 * Elige varias opciones de un desplegable de selección múltiple (los
 * "Permisos" del usuario): abre la lista, marca cada una y la cierra.
 */
export async function chooseOptions(combobox: Locator, options: (string | RegExp)[]) {
  const page = combobox.page()
  await combobox.click()
  for (const option of options) {
    await page.getByRole('listbox').getByRole('option', { name: option }).click()
  }
  await page.keyboard.press('Escape')
}

/**
 * Las filas de un listado. El `Table` de la app en modo tarjetas no usa
 * `<table>` (cada fila es un div `.table__row`); en modo tabla son `<tr>`.
 */
export function rows(page: Page): Locator {
  return page.locator('.table__row, [role="row"]:not(:has([role="columnheader"]))')
}

/** La fila de un listado que contiene ese texto. */
export function row(page: Page, text: string | RegExp): Locator {
  return rows(page).filter({ hasText: text })
}
