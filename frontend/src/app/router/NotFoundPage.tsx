import { Link, useNavigate } from 'react-router'
import { Button } from '@/shared/components/ui'
import { heroPhoto } from '@/shared/lib/heroPhoto'
import fotoTaller from '@/assets/foto-cono.webp'

/**
 * Lo que se ve cuando la URL no coincide con ninguna ruta. Sin esto React
 * Router muestra su pantalla de error por defecto, en inglés y pensada para
 * el desarrollador.
 */
export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="system-page">
      <div className="system-page__body">
        <span className="system-page__code">404</span>
        <span className="system-page__line" aria-hidden="true" />
        <h1 className="system-page__title">Página no encontrada</h1>
        <p className="system-page__text">
          La página que buscás no existe o se movió. Volvé al inicio y seguí
          desde ahí.
        </p>
        <div className="system-page__actions">
          <Link className="btn btn--primary" to="/">
            Ir al inicio
          </Link>
          {/* Atrás en el historial: si llegó por un enlace roto de adentro
              de la app, vuelve a donde estaba. */}
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Volver
          </Button>
        </div>
      </div>
      <div className="system-page__photo" style={heroPhoto(fotoTaller)} aria-hidden="true" />
    </div>
  )
}
