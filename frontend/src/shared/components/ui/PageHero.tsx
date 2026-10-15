import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/shared/lib/cn'

interface PageHeroProps {
  /** Rótulo chico arriba del título, p. ej. "Catálogo de". */
  eyebrow: string
  /** Última palabra del rótulo, resaltada en azul claro: "proveedores". */
  accent?: string
  title: string
  /** Foto del taller que va a la derecha (un import de imagen). */
  photo: string
  /**
   * Encuadre de la foto (background-position). Cada foto tiene el suyo;
   * sin esto va a 65% del ancho, centrada en el alto.
   */
  photoPosition?: string
  /**
   * Enlace de vuelta al panel del que cuelga el listado ("← Clientes").
   * Va arriba del rótulo.
   */
  back?: { to: string; label: string }
  /**
   * `panel`: la cabecera de un panel de tarjetas. No lleva la barra de
   * herramientas montada abajo, así que no le deja ese lugar.
   */
  variant?: 'list' | 'panel'
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
export function PageHero({
  eyebrow,
  accent,
  title,
  photo,
  photoPosition,
  back,
  variant = 'list',
  children,
}: PageHeroProps) {
  const style = {
    '--hero-foto': `url(${photo})`,
    ...(photoPosition && { '--hero-pos': photoPosition }),
  } as CSSProperties

  return (
    <div className={cn('page-header page-header--hero', variant === 'panel' && 'page-header--panel')} style={style}>
      {back && (
        <Link to={back.to} className="back-link">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {back.label}
        </Link>
      )}
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
