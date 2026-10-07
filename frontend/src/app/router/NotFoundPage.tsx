import { Link } from 'react-router'

/**
 * Lo que se ve cuando la URL no coincide con ninguna ruta. Sin esto React
 * Router muestra su pantalla de error por defecto, en inglés y pensada para
 * el desarrollador.
 */
export function NotFoundPage() {
  return (
    <div className="empty-state">
      <p className="empty-state__text">
        No encontramos la página que buscabas.{' '}
        <Link className="table__action" to="/">
          Volver al inicio
        </Link>
      </p>
    </div>
  )
}
