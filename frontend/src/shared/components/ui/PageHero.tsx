import type { CSSProperties, ReactNode } from 'react'

interface PageHeroProps {
  /** Rótulo chico arriba del título, p. ej. "Catálogo de". */
  eyebrow: string
  /** Última palabra del rótulo, resaltada en azul claro: "proveedores". */
  accent?: string
  title: string
  /** Foto del taller que va a la derecha (un import de imagen). */
  photo: string
  /** Bajada opcional debajo del título. */
  children?: ReactNode
}

/**
 * Cabecera de un catálogo: panel marino con trama de puntos y una foto
 * del taller a la derecha que se funde hacia el marino.
 *
 * La foto viaja al CSS como la custom property `--hero-foto`: así el
 * degradado, el recorte y la versión de celular viven en styles.css y
 * acá no hay estilos en línea más que ese dato.
 */
export function PageHero({ eyebrow, accent, title, photo, children }: PageHeroProps) {
  const style = { '--hero-foto': `url(${photo})` } as CSSProperties

  return (
    <div className="page-header page-header--hero" style={style}>
      <span className="page-header__eyebrow">
        {eyebrow}
        {accent && <span className="page-header__eyebrow-accent"> {accent}</span>}
      </span>
      <span className="page-header__line" aria-hidden="true" />
      <h1 className="page-header__title">{title}</h1>
      {children && <p className="page-header__subtitle">{children}</p>}
    </div>
  )
}
