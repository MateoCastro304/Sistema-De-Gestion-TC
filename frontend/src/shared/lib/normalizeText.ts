/**
 * Deja un texto listo para comparar en una búsqueda: sin mayúsculas y sin
 * acentos. Así "gomez" encuentra a "Gómez" y "metalurgica" a "Metalúrgica".
 *
 * `normalize('NFD')` separa cada letra acentuada en la letra y su tilde, y
 * el replace saca las tildes sueltas.
 */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}
