import { Link, useRouteError } from 'react-router'
import { Button } from '@/shared/components/ui'
import { cn } from '@/shared/lib/cn'
import { heroPhoto } from '@/shared/lib/heroPhoto'
import fotoTaller from '@/assets/foto-fresado.webp'

interface ErrorPageProps {
  /**
   * true cuando lo que falló es el propio layout y no hay marco donde
   * mostrar el mensaje: la página se dibuja sola, con su propio margen.
   */
  standalone?: boolean
}

/**
 * Lo que se ve cuando una pantalla falla al dibujarse (un dato con una forma
 * inesperada, un bug). Sin esto React Router muestra su pantalla de error por
 * defecto, en inglés y pensada para el desarrollador.
 *
 * Los errores de red y de la API no pasan por acá: los maneja cada pantalla
 * con su propio aviso.
 */
export function ErrorPage({ standalone = false }: ErrorPageProps) {
  const error = useRouteError()

  // El detalle sólo en desarrollo: al usuario no le sirve, y al que está
  // programando le ahorra abrir la consola.
  const detail = import.meta.env.DEV && error instanceof Error ? error.message : null

  return (
    <div
      className={cn('system-page system-page--error', standalone && 'system-page--standalone')}
      role="alert"
    >
      <div className="system-page__body">
        <span className="system-page__icon" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3 18 17H2zM10 8.5v3.5M10 14.6v.01" />
          </svg>
        </span>
        <span className="system-page__line" aria-hidden="true" />
        <h1 className="system-page__title">Algo salió mal</h1>
        <p className="system-page__text">
          No pudimos mostrar esta pantalla. Probá de nuevo; si sigue pasando,
          avisale al equipo.
        </p>
        {detail && <p className="system-page__detail">{detail}</p>}
        <div className="system-page__actions">
          {/* Recarga completa: es la forma segura de salir de un estado roto. */}
          <Button onClick={() => window.location.reload()}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M16 10a6 6 0 1 1-1.8-4.3M16 3v3.2h-3.2" />
            </svg>
            Reintentar
          </Button>
          <Link className="btn btn--secondary" to="/">
            Ir al inicio
          </Link>
        </div>
      </div>
      <div className="system-page__photo" style={heroPhoto(fotoTaller)} aria-hidden="true" />
    </div>
  )
}
