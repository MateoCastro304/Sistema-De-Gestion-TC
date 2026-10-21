import { Link } from 'react-router'
import { heroPhoto } from '@/shared/lib/heroPhoto'
import fotoPrensa from '@/assets/foto-prensa.webp'

/**
 * Lo que se ve al abrir una pantalla que no permiten los roles del usuario
 * (CU-53, escenario 8). Textos del prototipo.
 */
export function AccessDeniedPage() {
  return (
    <div className="system-page system-page--error">
      <div className="system-page__body">
        <span className="system-page__icon" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 2.5 16.5 5v5c0 3.8-2.8 6.5-6.5 7.5-3.7-1-6.5-3.7-6.5-7.5V5zM7.5 10h5" />
          </svg>
        </span>
        <span className="system-page__line" aria-hidden="true" />
        <h1 className="system-page__title">Acceso denegado</h1>
        <p className="system-page__text">No tenés permisos para realizar esta operación.</p>
        <div className="system-page__actions">
          <Link className="btn btn--primary" to="/">
            Ir al inicio
          </Link>
        </div>
      </div>
      <div className="system-page__photo" style={heroPhoto(fotoPrensa)} aria-hidden="true" />
    </div>
  )
}
