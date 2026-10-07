import { Link, useRouteError } from 'react-router'
import { Button } from '@/shared/components/ui'

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

  const content = (
    <div className="empty-state error-page">
      <p className="empty-state__text">
        Algo salió mal al mostrar esta pantalla. Probá de nuevo; si sigue
        pasando, avisale al equipo.
      </p>
      {detail && <p className="error-page__detail">{detail}</p>}
      <div className="error-page__actions">
        {/* Recarga completa: es la forma segura de salir de un estado roto. */}
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
        <Link className="table__action" to="/">
          Volver al inicio
        </Link>
      </div>
    </div>
  )

  return standalone ? <div className="content">{content}</div> : content
}
