import { cn } from '@/shared/lib/cn'

/**
 * ============================================================
 * CheckBox — el casillero grande del rediseño
 * ============================================================
 *
 * QUÉ HACE
 * Reemplaza al `<input type="checkbox">` de 16px por el cuadro de
 * 34px del diseño. En una fila de tabla, y sobre todo en celular, es
 * la diferencia entre acertarle al tildar y no.
 *
 * CÓMO FUNCIONA (y por qué no cambia el comportamiento)
 * El input nativo NO desaparece: sigue adentro, ocupando todo el
 * cuadro, con `opacity: 0`. O sea que el click, el foco, la barra
 * espaciadora y el lector de pantalla los sigue manejando el input
 * de siempre, con el mismo `onChange` que ya tenía la página. Lo
 * único que cambia es lo que se ve.
 *
 * No se usa `display: none` ni `visibility: hidden` a propósito:
 * cualquiera de los dos lo sacaría del orden de tabulación y la
 * selección dejaría de funcionar con teclado.
 *
 * El tilde (✓) está siempre escrito; el CSS lo pinta transparente
 * mientras está apagado y blanco cuando se prende. Así no hay un
 * salto de tamaño al tildar.
 *
 * CÓMO SE USA
 *   <CheckBox
 *     checked={selected.has(s.id)}
 *     onChange={() => toggleOne(s.id)}
 *     label={`Seleccionar ${s.legalName}`}
 *   />
 */
interface CheckBoxProps {
  checked: boolean
  onChange: () => void
  disabled?: boolean
  /** Texto para el lector de pantalla. El cuadro no tiene texto visible. */
  label?: string
}

export function CheckBox({ checked, onChange, disabled = false, label }: CheckBoxProps) {
  return (
    <span className={cn('check-box', checked && 'check-box--on')}>
      <input
        type="checkbox"
        className="check-box__input"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-label={label}
        // Si el casillero vive dentro de una fila que también es
        // clickeable, el click se contaría dos veces (una por el input y
        // otra por la fila) y la selección quedaría igual que antes.
        onClick={(event) => event.stopPropagation()}
      />
      ✓
    </span>
  )
}
