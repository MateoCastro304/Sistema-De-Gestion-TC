/**
 * Formatea para mostrar un teléfono que el backend guarda normalizado
 * (sin separadores). Solo toca celulares argentinos `+549` + 10 dígitos;
 * cualquier otro formato se muestra tal cual, para no inventar un formato.
 *
 * El largo del código de área varía (11 → 2 dígitos, 351 → 3, 2966 → 4) y
 * no hay forma de saberlo sin una tabla: se asume 2 para el 11 y 3 para el
 * resto, que cubre Buenos Aires y las ciudades grandes.
 */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return ''
  const match = /^\+549(\d{10})$/.exec(value.trim())
  if (!match) return value

  const national = match[1]
  const areaLength = national.startsWith('11') ? 2 : 3
  const area = national.slice(0, areaLength)
  const rest = national.slice(areaLength)
  const split = rest.length - 4
  return `+54 9 ${area} ${rest.slice(0, split)}-${rest.slice(split)}`
}
