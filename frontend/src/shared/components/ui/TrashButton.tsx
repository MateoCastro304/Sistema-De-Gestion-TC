import { cn } from '@/shared/lib/cn'
import { IconTrash } from './IconTrash'

interface TrashButtonProps {
  onClick?: () => void
  /**
   * Texto del tooltip y del lector de pantalla. Siempre decir QUÉ se
   * borra: "Eliminar proveedor", no "Eliminar".
   */
  label: string
  /** Con texto al lado, para barras de acciones. Sin él, botón redondo. */
  children?: string
  disabled?: boolean
}

/**
 * Botón de eliminar. Gris en reposo, rojo al pasar el mouse: no grita
 * hasta que lo vas a usar, que es lo que corresponde para una acción
 * destructiva. La tapa del tacho se abre en el hover y con el foco de
 * teclado.
 *
 *   // sólo ícono (filas de tabla)
 *   <TrashButton label="Eliminar a Laura Gómez" onClick={() => borrar(c)} />
 *
 *   // pastilla con texto (paneles, barras de acciones)
 *   <TrashButton label="Eliminar proveedores" onClick={abrirModo}>
 *     Eliminar proveedores
 *   </TrashButton>
 */
export function TrashButton({ onClick, label, children, disabled }: TrashButtonProps) {
  return (
    <button
      type="button"
      className={cn('btn-trash', children && 'btn-trash--text')}
      onClick={onClick}
      disabled={disabled}
      title={label}
      // Con texto visible, el texto ya nombra al botón; sin él, el label.
      aria-label={children ? undefined : label}
    >
      <IconTrash size={children ? 18 : 19} />
      {children}
    </button>
  )
}
