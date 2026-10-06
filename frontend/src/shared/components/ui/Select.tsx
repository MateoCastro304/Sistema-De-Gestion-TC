import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent, Ref } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/shared/lib/cn'

/**
 * ============================================================
 * Select — desplegable propio con el estilo del rediseño
 * ============================================================
 *
 * POR QUÉ NO ES UN <select>
 * La lista de opciones de un <select> nativo la dibuja el sistema
 * operativo: con CSS se puede vestir el campo cerrado, pero la lista que
 * se despliega queda siempre gris, cuadrada y con la letra del sistema.
 * Acá el campo es un <button> y la lista un <ul>, así que se ven como el
 * resto de la app.
 *
 * ACCESIBILIDAD (lo que el nativo daba gratis y hay que reponer)
 * Sigue el patrón "select-only combobox" de las guías ARIA:
 *   - el botón tiene role="combobox" y el foco nunca se va de él; la
 *     opción marcada se anuncia con aria-activedescendant;
 *   - flechas, Inicio y Fin recorren; Enter o Espacio eligen; Escape
 *     cierra sin elegir; Tab cierra y sigue de largo;
 *   - tipear una letra salta a la próxima opción que empieza con ella
 *     (con la lista cerrada, la elige directamente, como el nativo);
 *   - un <label htmlFor> apuntando al `id` lo nombra igual que antes.
 *
 * POR QUÉ LA LISTA VA EN UN PORTAL
 * El panel oscuro (.page-header) tiene `overflow: hidden` y los modales
 * `overflow: auto`: una lista posicionada adentro quedaría recortada. Se
 * dibuja en <body> con position: fixed, calculada desde el botón, y se
 * recalcula al scrollear o cambiar el tamaño de la ventana. Si abajo no
 * entra, se abre hacia arriba.
 *
 * CÓMO SE USA
 *   <Select
 *     id="supplierType"
 *     value={form.supplierType}
 *     onChange={(type) => setForm((f) => ({ ...f, supplierType: type }))}
 *     options={SUPPLIER_TYPES.map((t) => ({ value: t, label: t }))}
 *   />
 * `onChange` recibe el VALOR, no un evento. Con react-hook-form va
 * adentro de un <Controller>, pasándole field.value / field.onChange /
 * field.onBlur / field.ref (Controller acepta el valor directo).
 *
 * El genérico `T` tipa el valor: con las opciones de SUPPLIER_TYPES,
 * onChange recibe un SupplierType y no hace falta castear.
 */

export interface SelectOption<T extends string = string> {
  value: T
  label: string
}

interface SelectProps<T extends string> {
  value: T | ''
  onChange: (value: T) => void
  options: SelectOption<T>[]
  onBlur?: () => void
  id?: string
  name?: string
  /** Texto cuando `value` no coincide con ninguna opción (por ej. ''). */
  placeholder?: string
  disabled?: boolean
  /** Pinta el borde de error. */
  invalid?: boolean
  /**
   * `field` (default) = campo de formulario, igual a los inputs.
   * `glass` = pastilla de vidrio para el panel oscuro (filtros).
   */
  variant?: 'field' | 'glass'
  className?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  /** React 19 acepta `ref` como prop: react-hook-form lo usa para enfocar el campo con error. */
  ref?: Ref<HTMLButtonElement>
}

interface ListPosition {
  left: number
  minWidth: number
  top?: number
  bottom?: number
}

const LIST_MAX_HEIGHT = 280 // igual al max-height de .select__list
const OPTION_HEIGHT = 44 // alto aproximado de una opción, para decidir si abre hacia arriba
const GAP = 6 // separación entre el botón y la lista

/** Dónde dibujar la lista: debajo del botón, o arriba si abajo no entra. */
function measureList(trigger: HTMLElement | null, optionCount: number): ListPosition | null {
  if (!trigger) return null
  const rect = trigger.getBoundingClientRect()
  const listHeight = Math.min(optionCount * OPTION_HEIGHT + 12, LIST_MAX_HEIGHT)
  const spaceBelow = window.innerHeight - rect.bottom
  const openUp = spaceBelow < listHeight + GAP * 2 && rect.top > spaceBelow
  return openUp
    ? { left: rect.left, minWidth: rect.width, bottom: window.innerHeight - rect.top + GAP }
    : { left: rect.left, minWidth: rect.width, top: rect.bottom + GAP }
}

/** Asigna el elemento a un ref que puede ser función u objeto. */
function assignRef<E>(ref: Ref<E> | undefined, element: E | null) {
  if (typeof ref === 'function') ref(element)
  else if (ref) (ref as { current: E | null }).current = element
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  onBlur,
  id,
  name,
  placeholder,
  disabled = false,
  invalid = false,
  variant = 'field',
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ref,
}: SelectProps<T>) {
  const listId = useId()
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)

  const [open, setOpen] = useState(false)
  /** La opción resaltada con teclado o mouse (todavía no elegida). */
  const [activeIndex, setActiveIndex] = useState(-1)
  const [position, setPosition] = useState<ListPosition | null>(null)

  const selectedIndex = options.findIndex((option) => option.value === value)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined
  const lastIndex = options.length - 1

  /* La posición se calcula en el evento que abre y no en un efecto:
     setState en el cuerpo de un efecto es un render en cascada y el lint
     del proyecto lo marca (react-hooks/set-state-in-effect). */
  function openList(startIndex = selectedIndex) {
    if (disabled || options.length === 0) return
    setPosition(measureList(triggerRef.current, options.length))
    setActiveIndex(startIndex >= 0 ? startIndex : 0)
    setOpen(true)
  }

  function choose(index: number) {
    const option = options[index]
    if (option && option.value !== value) onChange(option.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  /** Próxima opción (dando la vuelta) cuyo texto empieza con `letter`. */
  function findByLetter(letter: string, from: number) {
    const key = letter.toLowerCase()
    for (let step = 1; step <= options.length; step++) {
      const index = (from + step + options.length) % options.length
      if (options[index].label.toLowerCase().startsWith(key)) return index
    }
    return -1
  }

  /* Abierta: seguir al botón si la página scrollea o cambia de tamaño, y
     cerrar con un click afuera. El scroll se escucha en captura para
     enterarse también de los contenedores que scrollean por dentro. */
  useEffect(() => {
    if (!open) return
    const reposition = () => setPosition(measureList(triggerRef.current, options.length))
    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || listRef.current?.contains(target)) return
      setOpen(false)
    }
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    document.addEventListener('pointerdown', closeOnOutside)
    return () => {
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
      document.removeEventListener('pointerdown', closeOnOutside)
    }
  }, [open, options.length])

  /* La opción resaltada siempre a la vista, en listas largas. */
  useEffect(() => {
    if (!open || activeIndex < 0) return
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault()
        openList()
        return
      }
      if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault()
        openList(event.key === 'Home' ? 0 : lastIndex)
        return
      }
    } else {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setActiveIndex((index) => Math.min(index + 1, lastIndex))
          return
        case 'ArrowUp':
          event.preventDefault()
          setActiveIndex((index) => Math.max(index - 1, 0))
          return
        case 'Home':
          event.preventDefault()
          setActiveIndex(0)
          return
        case 'End':
          event.preventDefault()
          setActiveIndex(lastIndex)
          return
        case 'Enter':
        case ' ':
          event.preventDefault()
          choose(activeIndex)
          return
        case 'Escape':
          // stopPropagation: si el select está dentro de un modal, Escape
          // cierra la lista y no el modal entero.
          event.preventDefault()
          event.stopPropagation()
          setOpen(false)
          return
        case 'Tab':
          setOpen(false)
          return
      }
    }

    // Búsqueda por letra, como en el nativo.
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const match = findByLetter(event.key, open ? activeIndex : selectedIndex)
      if (match < 0) return
      event.preventDefault()
      if (open) setActiveIndex(match)
      else onChange(options[match].value)
    }
  }

  return (
    <>
      <button
        ref={(element) => {
          triggerRef.current = element
          assignRef(ref, element)
        }}
        type="button"
        id={id}
        name={name}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        aria-invalid={invalid || undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        disabled={disabled}
        className={cn(
          'select__trigger',
          // Reusa las pieles que ya existen: la del campo de formulario
          // (borde, foco, error) o la pastilla de vidrio del panel.
          variant === 'glass' ? 'filter-select' : 'form-field__select',
          variant === 'field' && invalid && 'form-field__select--error',
          open && 'select__trigger--open',
          className,
        )}
        // Safari no enfoca los botones al hacerles click: sin el focus()
        // las flechas no andarían después de abrir con el mouse.
        onClick={() => {
          triggerRef.current?.focus()
          if (open) setOpen(false)
          else openList()
        }}
        onKeyDown={handleKeyDown}
        // Espacio "clickea" el botón al soltarse. Como ya se manejó en el
        // keydown, sin esto la lista se abría y se volvía a cerrar.
        onKeyUp={(event) => {
          if (event.key === ' ') event.preventDefault()
        }}
        onBlur={() => {
          setOpen(false)
          onBlur?.()
        }}
      >
        <span className={cn('select__value', !selected && 'select__value--placeholder')}>
          {selected?.label ?? placeholder ?? ''}
        </span>
      </button>

      {open &&
        position &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            className="select__list"
            style={{
              left: position.left,
              minWidth: position.minWidth,
              top: position.top,
              bottom: position.bottom,
            }}
            // El foco se queda en el botón: sin esto, tocar la lista (o su
            // barra de scroll) le sacaba el foco y la cerraba por el onBlur.
            onMouseDown={(event) => event.preventDefault()}
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === selectedIndex}
                data-index={index}
                className={cn(
                  'select__option',
                  index === activeIndex && 'select__option--active',
                  index === selectedIndex && 'select__option--selected',
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(index)}
              >
                <span>{option.label}</span>
                {index === selectedIndex && (
                  <svg
                    className="select__check"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    aria-hidden="true"
                  >
                    <path d="m3.5 8.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </>
  )
}
