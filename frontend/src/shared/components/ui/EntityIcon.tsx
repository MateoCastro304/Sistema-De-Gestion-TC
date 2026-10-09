/**
 * Íconos fijos por tipo de registro. Reemplazan a las iniciales: cada
 * entidad se reconoce por su dibujo (el mismo del menú lateral) y cada
 * tipo de proveedor por el suyo.
 *
 * Todos comparten viewBox (0 0 20 20) y se dibujan con trazo, así que
 * alcanza con guardar el `d` de cada uno.
 */
const PATHS = {
  encargado: 'M13.2 7a3.2 3.2 0 1 1-6.4 0a3.2 3.2 0 1 1 6.4 0M4 16.5c.9-2.8 3.2-4.2 6-4.2s5.1 1.4 6 4.2',
  fabrica: 'M3 17V8.5l4.5 3V8.5l4.5 3V5h5v12z',
  rubro: 'M3 3.5h6.5l7.5 7.5-6 6-7.5-7.5zM6.8 7.2h.01',
  proveedor: 'M10 2.6 17 6v8l-7 3.4L3 14V6zM3 6l7 3.4L17 6M10 9.4v8',
  material:
    'M2.5 13.5h9l2-3h-9zM6.5 10.5h9l2-3h-9zM2.5 13.5v2.5h9v-2.5M11.5 16l2-3v-2.5M15.5 10.5v-3',
  repuesto:
    'M10 2.5l6.5 3.75v7.5L10 17.5l-6.5-3.75v-7.5zM12.6 10a2.6 2.6 0 1 1-5.2 0a2.6 2.6 0 1 1 5.2 0',
  pintura: 'M3 3.5h11v4H3zM14 5.5h2.5v4.5H9.5v2.5M8.5 12.5h2v5h-2z',
  tercerizado:
    'M1.5 5.5h10v7.5h-10zM11.5 8.5h3.5l3 3v1.5h-6.5M5 15.6a1.6 1.6 0 1 1 0-.01M14.5 15.6a1.6 1.6 0 1 1 0-.01',
} as const

export type EntityIconName = keyof typeof PATHS

interface EntityIconProps {
  name: EntityIconName
}

/** El tamaño y el color los pone el CSS de quien lo contiene. */
export function EntityIcon({ name }: EntityIconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
