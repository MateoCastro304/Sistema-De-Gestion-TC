/**
 * Sin los caracteres que se confunden al dictarla o copiarla a mano
 * (0/O, 1/l/I).
 */
const LOWER = 'abcdefghijkmnpqrstuvwxyz'
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const DIGITS = '23456789'
const ALL = LOWER + UPPER + DIGITS

export const GENERATED_PASSWORD_LENGTH = 10

function pick(chars: string): string {
  const [n] = crypto.getRandomValues(new Uint32Array(1))
  return chars[n % chars.length]
}

/**
 * Botón "Generar" del alta (D-24): una contraseña al azar armada en el
 * navegador, con al menos una minúscula, una mayúscula y un número. Usa
 * `crypto`, no `Math.random`, porque es una contraseña de verdad.
 */
export function generatePassword(length = GENERATED_PASSWORD_LENGTH): string {
  const chars = [pick(LOWER), pick(UPPER), pick(DIGITS)]
  while (chars.length < length) chars.push(pick(ALL))
  // Mezcla (Fisher-Yates) para que los tres obligatorios no queden al principio.
  for (let i = chars.length - 1; i > 0; i--) {
    const [n] = crypto.getRandomValues(new Uint32Array(1))
    const j = n % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}
