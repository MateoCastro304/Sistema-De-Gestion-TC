/**
 * Fechas de tipos de proceso. La API las manda en UTC; en pantalla van en la
 * hora de Córdoba, el taller
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

/** "2026-10-15T12:30:00.000Z" → "15/10/2026 09:30". */
export function formatDateTime(iso: string): string {
  // Intl separa la fecha de la hora con ", "; el prototipo usa un espacio.
    return dateTimeFormatter.format(new Date(iso)).replace(', ', ' ')
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** "2026-10-01T13:22:00.000Z" → "1 oct 2026 · 10:22", el formato largo del detalle. */
export function formatLongDateTime(iso: string): string {
  const parts = Object.fromEntries(
    dateTimeFormatter.formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  )
  return `${Number(parts.day)} ${MONTHS[Number(parts.month) - 1]} ${parts.year} · ${parts.hour}:${parts.minute}`
}