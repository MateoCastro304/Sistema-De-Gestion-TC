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

/**
 * Dígito verificador que corresponde a los primeros 10 dígitos (módulo 11),
 * o null si el cálculo da 10: ese CUIT no es asignable.
 */
function expectedCheckDigit(digits: string): number | null {
  const nums = digits.split('').map(Number)
  const sum = CUIT_WEIGHTS.reduce((acc, weight, i) => acc + weight * nums[i], 0)
  const check = 11 - (sum % 11)
  if (check === 11) return 0
  if (check === 10) return null
  return check
}

/**
 * Qué tiene de malo un CUIT, dicho para quien lo está escribiendo, o null si
 * es válido. Acepta el número con o sin guiones. Son las mismas reglas que
 * aplica el backend; un CUIT que pasa acá no vuelve rechazado.
 *
 * No decide si el CUIT es obligatorio: un texto vacío lo resuelve cada
 * formulario antes de llamar a esto.
 */
export function cuitError(value: string): string | null {
  const digits = cuitDigits(value)
  if (digits.length !== CUIT_DIGITS) {
    return `El CUIT tiene que tener 11 dígitos; escribiste ${digits.length}.`
  }
  if (!CUIT_PREFIXES.includes(digits.slice(0, 2))) {
    return `Un CUIT empieza con ${CUIT_PREFIXES.slice(0, -1).join(', ')} o ${CUIT_PREFIXES.at(-1)}.`
  }
  if (expectedCheckDigit(digits) !== Number(digits[CUIT_DIGITS - 1])) {
    // No se dice cuál sería el dígito correcto: con ese dato cualquier
    // número mal tipeado "se arregla" solo y deja de servir como control.
    return 'El último dígito no coincide con el resto del CUIT. Revisá que esté bien escrito.'
  }
  return null
}

/** true si el CUIT (sus 11 dígitos, sin guiones) pasa prefijo y dígito verificador. */
export function isValidCuit(digits: string): boolean {
  return cuitError(digits) === null
}

/** Muestra un CUIT de 11 dígitos como "XX-XXXXXXXX-X". */
export function formatCuit(cuit: string): string {
  const digits = cuitDigits(cuit)
  if (digits.length !== CUIT_DIGITS) return cuit
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`
}
