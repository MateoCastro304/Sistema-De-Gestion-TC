import { createContext, useContext, useEffect } from 'react'

/**
 * El último tramo de la miga de pan de la topbar cuando es un dato y no
 * una sección: el nombre del encargado, de la fábrica o del proveedor que
 * se está viendo ("CLIENTES / ENCARGADOS / Laura Gómez").
 *
 * El layout no sabe ese nombre (lo trae la pantalla de detalle), así que
 * la pantalla se lo pasa por acá. El resto de la miga sale de la URL.
 */
export type SetCrumbTitle = (title: string | null) => void

export const BreadcrumbContext = createContext<SetCrumbTitle | null>(null)

/**
 * Publica el título del registro mientras la pantalla está montada y lo
 * borra al salir. Pasar `undefined` mientras el dato carga.
 */
export function useCrumbTitle(title: string | undefined): void {
  const setTitle = useContext(BreadcrumbContext)
  if (setTitle === null) throw new Error('useCrumbTitle() must be used inside <AppLayout>')

  useEffect(() => {
    setTitle(title ?? null)
    return () => setTitle(null)
  }, [title, setTitle])
}
