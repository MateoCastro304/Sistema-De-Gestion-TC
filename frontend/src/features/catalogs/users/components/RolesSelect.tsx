import { useId, useState } from 'react'
import type { KeyboardEvent, Ref } from 'react'
import { ROLE_ORDER, ROL_DESCRIPTION, ROL_LABEL, type Rol } from '@/domain/roles'
import { cn } from '@/shared/lib/cn'

interface RolesSelectProps {
  id: string
  value: Rol[]
  onChange: (roles: Rol[]) => void
  onBlur?: () => void
  invalid?: boolean
  /** react-hook-form lo usa para enfocar el campo cuando hay error. */
  ref?: Ref<HTMLButtonElement>
}

/**
 * Desplegable "Permisos" del alta de usuario (CU-05): se pueden marcar
 * varios roles, y cada opción muestra su descripción (contrato §2). Los
 * elegidos se ven como etiquetas en el campo, en el orden del contrato.
 *
 * Es el `Select` compartido pero con selección múltiple: elegir una opción
 * no cierra la lista. Se cierra con Escape, Tab o al salir del campo. Como
 * hoy sólo lo usa esta pantalla, vive en la feature.
 *
 * Accesibilidad: el botón es el combobox y el foco nunca se va de él; la
 * lista es `aria-multiselectable` y cada opción informa si está marcada.
 */
export function RolesSelect({ id, value, onChange, onBlur, invalid = false, ref }: RolesSelectProps) {
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const lastIndex = ROLE_ORDER.length - 1

  function toggle(role: Rol) {
    const next = value.includes(role) ? value.filter((r) => r !== role) : [...value, role]
    onChange(ROLE_ORDER.filter((r) => next.includes(r)))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault()
        setOpen(true)
      }
      return
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActiveIndex((index) => Math.min(index + 1, lastIndex))
        return
      case 'ArrowUp':
        event.preventDefault()
        setActiveIndex((index) => Math.max(index - 1, 0))
        return
      case 'Enter':
      case ' ':
        event.preventDefault()
        toggle(ROLE_ORDER[activeIndex])
        return
      case 'Escape':
        event.preventDefault()
        event.stopPropagation()
        setOpen(false)
        return
      case 'Tab':
        setOpen(false)
        return
    }
  }

  return (
    <>
      <button
        ref={ref}
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${activeIndex}` : undefined}
        aria-invalid={invalid || undefined}
        className={cn(
          'select__trigger form-field__select roles-select__trigger',
          invalid && 'form-field__select--error',
          open && 'select__trigger--open',
        )}
        onClick={(event) => {
          event.currentTarget.focus()
          setOpen((current) => !current)
        }}
        onKeyDown={handleKeyDown}
        // Espacio "clickea" el botón al soltarse: ya se manejó en el keydown.
        onKeyUp={(event) => {
          if (event.key === ' ') event.preventDefault()
        }}
        onBlur={() => {
          setOpen(false)
          onBlur?.()
        }}
      >
        {value.length === 0 ? (
          <span className="select__value select__value--placeholder">Elegí uno o más roles</span>
        ) : (
          <span className="roles-select__chips">
            {value.map((role) => (
              <span key={role} className="badge badge--suave">
                {ROL_LABEL[role]}
              </span>
            ))}
          </span>
        )}
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          aria-label="Roles"
          className="inline-list"
          // El foco se queda en el botón: si no, el click lo sacaba y el
          // onBlur cerraba la lista antes de marcar la opción.
          onMouseDown={(event) => event.preventDefault()}
        >
          {ROLE_ORDER.map((role, index) => {
            const checked = value.includes(role)
            return (
              <li
                key={role}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={checked}
                className={cn(
                  'select__option role-option',
                  index === activeIndex && 'select__option--active',
                  checked && 'role-option--checked',
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => toggle(role)}
              >
                <span className="role-option__box" aria-hidden="true">
                  {checked && (
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="m3.5 8.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="option-text">
                  <span>{ROL_LABEL[role]}</span>
                  <span className="option-text__sub">{ROL_DESCRIPTION[role]}</span>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
