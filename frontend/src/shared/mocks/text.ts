import { normalizeText } from '@/shared/lib/normalizeText'

/**
 * Comparación de textos del contrato del Sprint 2 (§4, "Comparación de
 * textos"): sin mayúsculas, sin acentos, sin espacios en los extremos y con
 * cada grupo de espacios reducido a uno. "Teflón", "teflon" y " TEFLON "
 * son el mismo texto.
 */
export function comparable(value: string): string {
  return normalizeText(value).trim().replace(/\s+/g, ' ')
}

export function sameText(a: string, b: string): boolean {
  return comparable(a) === comparable(b)
}

/** `haystack` contiene a `needle` con el mismo criterio. Un `needle` vacío coincide siempre. */
export function containsText(haystack: string, needle: string): boolean {
  return comparable(haystack).includes(comparable(needle))
}
