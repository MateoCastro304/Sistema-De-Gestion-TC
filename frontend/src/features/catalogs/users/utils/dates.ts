/**
 * Fechas de usuarios. La API las manda en UTC; en pantalla van en la hora de
 * Córdoba, el taller. Mismo formato que el detalle de tipos de proceso.
 */

const dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'America/Argentina/Cordoba',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** "2026-10-14T11:02:00.000Z" → "14 oct 2026 · 08:02", el formato largo del detalle. */
export function formatLongDateTime(iso: string): string {
  const parts = Object.fromEntries(
    dateTimeFormatter.formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  )
  return `${Number(parts.day)} ${MONTHS[Number(parts.month) - 1]} ${parts.year} · ${parts.hour}:${parts.minute}`
}
