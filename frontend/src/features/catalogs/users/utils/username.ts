import { normalizeText } from '@/shared/lib/normalizeText'
import { USERNAME_MAX_LENGTH } from '../schemas/user.schema'

/** Sólo letras y números: saca espacios, apóstrofos y guiones del apellido. */
function slug(value: string): string {
  return normalizeText(value).replace(/[^a-z0-9]/g, '')
}

/**
 * La base del nombre de usuario propuesto: inicial del nombre + apellido, sin
 * acentos ni espacios ("Matías Castro" → "mcastro"). Lo arma el cliente
 * (D-23); la unicidad la garantiza la API igual.
 */
export function usernameBase(firstName: string, lastName: string): string {
  return (slug(firstName).charAt(0) + slug(lastName)).slice(0, USERNAME_MAX_LENGTH)
}

/**
 * El primer nombre libre a partir de la base: "mcastro", y si ya existe
 * "mcastro2", "mcastro3"… La comparación no distingue mayúsculas, como la API
 * (D-22). `taken` son los nombres que ya existen, incluidos los dados de baja.
 */
export function proposeUsername(base: string, taken: readonly string[]): string {
  const used = new Set(taken.map((name) => name.toLowerCase()))
  if (!used.has(base)) return base
  for (let n = 2; ; n++) {
    const suffix = String(n)
    const candidate = base.slice(0, USERNAME_MAX_LENGTH - suffix.length) + suffix
    if (!used.has(candidate)) return candidate
  }
}
