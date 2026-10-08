import type { CSSProperties } from 'react'

/**
 * Pasa la foto de una cabecera al CSS como la custom property
 * `--hero-foto`. El recorte, el degradado y la versión de celular viven
 * en styles.css (.page-header--hero y .page-header--foto).
 */
export function heroPhoto(url: string): CSSProperties {
  return { '--hero-foto': `url(${url})` } as CSSProperties
}
