import { Navigate } from 'react-router'
import { useSession } from '@/app/providers/SessionContext'
import { homePathFor } from '@/features/catalogs/panels'
import { heroPhoto } from '@/shared/lib/heroPhoto'
import fotoHero from '@/assets/hero-castro.webp'

/**
 * El inicio ("/"). Lleva a la primera pantalla que permiten los roles; si no
 * tienen ningún módulo (Jefe de Taller, Encargado de Reportes), muestra el
 * saludo del prototipo (CU-53, escenario 1).
 */
export function HomePage() {
  const { user } = useSession()
  const home = homePathFor(user?.roles ?? [])

  if (home) return <Navigate to={home} replace />

  return (
    <div className="system-page">
      <div className="system-page__body">
        <span className="system-page__icon system-page__icon--suave" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5 10 3.5l7 6V17H3zM8 17v-4.5h4V17" />
          </svg>
        </span>
        <span className="system-page__line" aria-hidden="true" />
        <h1 className="system-page__title">Hola, {user?.employee.firstName}</h1>
        <p className="system-page__text">Todavía no hay módulos disponibles para tu rol.</p>
      </div>
      <div className="system-page__photo" style={heroPhoto(fotoHero)} aria-hidden="true" />
    </div>
  )
}
