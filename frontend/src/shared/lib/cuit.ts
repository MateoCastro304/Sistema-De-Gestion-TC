/**
 * CUIT argentino: las mismas reglas que valida el backend, para avisar en
 * el formulario en vez de recibir un 400. Lo usan Proveedores y Fábricas.
 */

/** Largo del CUIT en dígitos: 2 de prefijo + 8 + 1 verificador. */
const CUIT_DIGITS = 11

/** Pesos que se aplican a los primeros 10 dígitos para el verificador. */
const CUIT_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2] as const

/** Prefijos que el backend acepta (persona física / jurídica). */
const CUIT_PREFIXES = ['20', '23', '24', '27', '30', '33', '34']

/** Saca todo lo que no sea dígito: "30-71234567-1" -> "30712345671". */
export function cuitDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/** true si tiene los 11 dígitos, con o sin guiones. */
export function hasCuitLength(value: string): boolean {
  return cuitDigits(value).length === CUIT_DIGITS
}

/**
 * Valida prefijo y dígito verificador (módulo 11) sobre los 11 dígitos.
 * Si el verificador calculado da 10, el CUIT no es asignable y se rechaza.
 */
export function isValidCuit(digits: string): boolean {
  if (digits.length !== CUIT_DIGITS) return false
  if (!CUIT_PREFIXES.includes(digits.slice(0, 2))) return false
  const nums = digits.split('').map(Number)
  const sum = CUIT_WEIGHTS.reduce((acc, weight, i) => acc + weight * nums[i], 0)
  let check = 11 - (sum % 11)
  if (check === 11) check = 0
  if (check === 10) return false
  return check === nums[CUIT_DIGITS - 1]
}

/** Muestra un CUIT de 11 dígitos como "XX-XXXXXXXX-X". */
export function formatCuit(cuit: string): string {
  const digits = cuitDigits(cuit)
  if (digits.length !== CUIT_DIGITS) return cuit
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`
}
