import { useState } from 'react'
import { DEFAULT_PAGE_SIZE } from '@/shared/api/pagination'

/**
 * Pagina en memoria una lista que ya está entera en el cliente
 * (Proveedores, Fábricas, Rubros: el backend las devuelve completas y
 * el filtro corre en el navegador).
 *
 * Se le pasa la lista YA filtrada y devuelve el tramo de la página
 * actual más lo que necesita `<Pagination />`.
 *
 * Si la lista se achica y la página guardada queda fuera de rango (se
 * borró el último registro de la última página, o cambió el filtro), se
 * usa la última que exista: nunca devuelve una página vacía habiendo
 * datos. Al cambiar la búsqueda conviene igual llamar `setPage(1)` desde
 * el handler, para volver al principio y no a "la última que haya".
 */
export function usePagedList<T>(items: T[], pageSize = DEFAULT_PAGE_SIZE) {
  const [requestedPage, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const page = Math.min(requestedPage, totalPages)
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize)

  return { page, setPage, pageItems, pageSize, total: items.length, totalPages }
}
