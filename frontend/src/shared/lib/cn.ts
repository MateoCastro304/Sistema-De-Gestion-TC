/**
 * Joins class names into a single string, dropping any falsy values.
 * Lets components build conditional class lists without an extra dependency.
 *
 * @example
 * cn('btn', isPrimary && 'btn--primary', block && 'btn--block')
 * // -> "btn btn--primary btn--block"
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
