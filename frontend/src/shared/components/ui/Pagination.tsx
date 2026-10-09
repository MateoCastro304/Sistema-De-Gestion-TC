interface PaginationProps {
  /** Página actual, empezando en 1. */
  page: number
  pageSize: number
  /** Total de registros que cumplen el filtro, sumando todas las páginas. */
  total: number
  onPageChange: (page: number) => void
  /** Mientras llega la página pedida: bloquea los botones. */
  disabled?: boolean
}

/**
 * Qué números mostrar: siempre la primera, la última y la actual con sus
 * vecinas; lo que queda en el medio se resume con "…". Con 7 páginas o
 * menos entran todas y no hace falta resumir nada.
 */
function pageList(page: number, totalPages: number): (number | 'gap')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

  const wanted = [1, page - 1, page, page + 1, totalPages]
  // En las puntas se completa hasta tres seguidos (1 2 3 … 9), para que
  // la barra no cambie de largo al pasar de la página 1 a la 2.
  if (page <= 2) wanted.push(2, 3)
  if (page >= totalPages - 1) wanted.push(totalPages - 1, totalPages - 2)

  const pages = [...new Set(wanted)]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b)

  const list: (number | 'gap')[] = []
  pages.forEach((p, i) => {
    const previous = pages[i - 1]
    if (previous !== undefined) {
      // Un hueco de una sola página no se resume: "…" ocuparía lo mismo.
      if (p - previous === 2) list.push(previous + 1)
      else if (p - previous > 2) list.push('gap')
    }
    list.push(p)
  })
  return list
}

/**
 * Pie de un listado: "Mostrando 1–20 de 87" y los controles para cambiar
 * de página. Se le pasa a `<Table footer={…} />`.
 *
 * No sabe de dónde salen los datos: sirve igual si pagina el backend
 * (Encargados) o si la lista entera está en memoria (ver `usePagedList`).
 *
 * En celular el CSS esconde los números y muestra "2 de 5" entre dos
 * botones con texto; por eso los dos juegos de controles están siempre
 * en el HTML.
 */
export function Pagination({ page, pageSize, total, onPageChange, disabled = false }: PaginationProps) {
  if (total === 0) return null

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="pagination">
      <span className="pagination__summary">
        Mostrando{' '}
        <strong>
          {from}–{to}
        </strong>{' '}
        de <strong>{total}</strong>
      </span>

      {/* Con una sola página queda el resumen y nada que apretar. */}
      {totalPages > 1 && (
        <nav className="pagination__nav" aria-label="Paginación">
          <button
            type="button"
            className="pagination__arrow"
            onClick={() => onPageChange(page - 1)}
            disabled={disabled || page <= 1}
            aria-label="Página anterior"
            title="Página anterior"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 4 6 10l6 6" />
            </svg>
            <span className="pagination__arrow-text">Anterior</span>
          </button>

          <div className="pagination__pages">
            {pageList(page, totalPages).map((item, i) =>
              item === 'gap' ? (
                <span key={`gap-${i}`} className="pagination__gap" aria-hidden="true">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  className={
                    item === page ? 'pagination__page pagination__page--current' : 'pagination__page'
                  }
                  onClick={() => onPageChange(item)}
                  disabled={disabled && item !== page}
                  aria-label={`Página ${item}`}
                  aria-current={item === page ? 'page' : undefined}
                >
                  {item}
                </button>
              ),
            )}
          </div>

          <span className="pagination__status">
            {page} de {totalPages}
          </span>

          <button
            type="button"
            className="pagination__arrow pagination__arrow--next"
            onClick={() => onPageChange(page + 1)}
            disabled={disabled || page >= totalPages}
            aria-label="Página siguiente"
            title="Página siguiente"
          >
            <span className="pagination__arrow-text">Siguiente</span>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8 4l6 6-6 6" />
            </svg>
          </button>
        </nav>
      )}
    </div>
  )
}
