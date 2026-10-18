/**
 * Montos de los tipos de proceso. En pantalla van con formato argentino
 * ("1.385,50"); la API recibe números con hasta dos decimales (D-35).
 * Las reglas para leer lo que escribe el usuario son las del prototipo.
 */
/** Dos decimales siempre, con punto de miles y coma decimal: 1385.5 → "1.385,50". */
const moneyFormatter = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Para los campos del formulario: "1.385,50". */
export function formatMoney(value: number): string {
  return moneyFormatter.format(value)
}

/** "$ 1.557,00" */
export function formatArs(value: number): string {
  return `$ ${formatMoney(value)}`
}

/** "US$ 1,13" */
export function formatUsd(value: number): string {
  return `US$ ${formatMoney(value)}`
}

/** Redondea a dos decimales, como todos los cálculos de precios (contrato §3.4). */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/** Qué tiene de malo un monto: vacío, no es un número mayor a 0, o más de dos decimales. */
export type MoneyProblem = 'missing' | 'invalid' | 'decimals'

export type ParsedMoney = { ok: true; value: number } | { ok: false; problem: MoneyProblem }

/**
 * Lee un monto escrito por el usuario. Acepta "1.385,50", "1385,5",
 * "1385.5", "1.385" (miles) y el prefijo "$" o "US$".
 */
export function parseMoney(text: string): ParsedMoney {
  let raw = text.replace(/\s/g, '').replace(/^(US)?\$/i, '')
  if (raw === '') return { ok: false, problem: 'missing' }

  if (raw.includes(',')) {
    // La coma es el decimal: los puntos son de miles.
    raw = raw.replace(/\./g, '').replace(',', '.')
  } else if (/^\d{1,3}(\.\d{3})+$/.test(raw)) {
    // Sin coma, "1.385" o "1.385.000" son miles, no decimales.
    raw = raw.replace(/\./g, '')
  }

  if (!/^\d+(\.\d+)?$/.test(raw)) return { ok: false, problem: 'invalid' }
  if ((raw.split('.')[1] ?? '').length > 2) return { ok: false, problem: 'decimals' }

  const value = Number(raw)
  return value > 0 ? { ok: true, value } : { ok: false, problem: 'invalid' }
}