import { useId, useState } from 'react'
import type { KeyboardEvent, Ref } from 'react'
import { Link } from 'react-router'
import { Button } from '@/shared/components/ui'
import { cn } from '@/shared/lib/cn'
import { useEmployeeOptions } from '../api/users.queries'
import type { EmployeeOption } from '../types/employee-option'
import { userDetailPath } from '../utils/paths'

interface EmployeePickerProps {
  id: string
  selected: EmployeeOption | null
  onSelect: (employee: EmployeeOption | null) => void
  onBlur?: () => void
  /** "+ Registrar empleado": abre el alta de empleado en una ventana (CU-05, escenario 6). */
  onRegisterNew: () => void
  /** Error del formulario ("Elegí el empleado") o de la API (409 / 422). */
  error?: string
  /** react-hook-form lo usa para enfocar el buscador cuando hay error. */
  ref?: Ref<HTMLInputElement>
}

function fullName(employee: EmployeeOption): string {
  return `${employee.firstName} ${employee.lastName}`
}

/**
 * Buscador "Empleado" del alta de usuario (CU-05), como el del prototipo:
 * al hacer clic muestra los primeros 8 empleados activos, y al tipear, los
 * que coinciden. Los que ya tienen usuario llevan la etiqueta "Ya tiene
 * usuario". Al elegir uno se ve su tarjeta, con el aviso y el enlace a su
 * usuario si ya tiene. Si la persona no está, "+ Registrar empleado".
 *
 * Los resultados van debajo del campo (no flotando), así que no hace falta
 * un portal como en `Select`.
 *
 * Accesibilidad: patrón combobox con lista. El foco se queda en el input y
 * la opción resaltada se anuncia con aria-activedescendant.
 */
export function EmployeePicker({ id, selected, onSelect, onBlur, onRegisterNew, error, ref }: EmployeePickerProps) {
  const listId = useId()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  // Se pide sólo con la lista abierta: sin texto, los primeros 8.
  const { data: options = [], isFetching, isError } = useEmployeeOptions(search, open)
  const showList = open

  function choose(employee: EmployeeOption) {
    onSelect(employee)
    setSearch('')
    setOpen(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!showList) return
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActiveIndex((index) => Math.min(index + 1, options.length - 1))
        return
      case 'ArrowUp':
        event.preventDefault()
        setActiveIndex((index) => Math.max(index - 1, 0))
        return
      case 'Enter':
        // Sin esto Enter mandaría el formulario con el buscador a medias.
        event.preventDefault()
        if (options[activeIndex]) choose(options[activeIndex])
        return
      case 'Escape':
        event.preventDefault()
        setOpen(false)
        return
    }
  }

  if (selected) {
    return (
      <div className={cn('form-field form-field--full', error && 'form-field--error')}>
        <span className="form-field__label" id={`${id}-label`}>
          Empleado
        </span>
        <div className="picked-card" aria-labelledby={`${id}-label`} role="group">
          <div className="picked-card__text">
            <strong>{fullName(selected)}</strong>
            <span>{selected.user ? 'Empleado activo · con usuario' : 'Empleado activo · sin usuario'}</span>
          </div>
          <Button variant="outline" onClick={() => onSelect(null)}>
            Cambiar
          </Button>
        </div>
        {selected.user ? (
          <p className="field-alert" role="alert">
            Este empleado ya tiene el usuario «{selected.user.username}».{' '}
            <Link to={userDetailPath(selected.user.id)}>Ver usuario</Link>
          </p>
        ) : (
          error && <span className="form-field__error">{error}</span>
        )}
      </div>
    )
  }

  return (
    <div className={cn('form-field form-field--full', error && 'form-field--error')}>
      <label className="form-field__label" htmlFor={id}>
        Empleado
      </label>
      <input
        ref={ref}
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && options[activeIndex] ? `${listId}-${activeIndex}` : undefined}
        aria-invalid={error ? true : undefined}
        className="form-field__input"
        placeholder="Buscar empleado por nombre o apellido"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value)
          setActiveIndex(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        // Si se cerró con Escape, un clic la vuelve a abrir sin salir del campo.
        onClick={() => setOpen(true)}
        onBlur={() => {
          setOpen(false)
          onBlur?.()
        }}
        onKeyDown={handleKeyDown}
      />

      {showList && (
        <ul
          id={listId}
          role="listbox"
          // No "Empleados": buscar el campo por el rótulo "Empleado" también
          // encontraría la lista.
          aria-label="Resultados de la búsqueda"
          className="inline-list"
          // El foco se queda en el input: sin esto, el click en una opción
          // lo sacaba, el onBlur cerraba la lista y el click no llegaba.
          onMouseDown={(event) => event.preventDefault()}
        >
          {options.map((employee, index) => (
            <li
              key={employee.id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={cn('select__option', index === activeIndex && 'select__option--active')}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(employee)}
            >
              <span className="option-text">
                <span>{fullName(employee)}</span>
                <span className="option-text__sub">
                  {employee.user ? `Usuario ${employee.user.username}` : 'Sin usuario'}
                </span>
              </span>
              {employee.user && <span className="badge badge--neutral">Ya tiene usuario</span>}
            </li>
          ))}
          {options.length === 0 && (
            <li className="inline-list__empty" role="presentation">
              {isError
                ? 'No se pudieron buscar los empleados. Intentá de nuevo.'
                : isFetching
                  ? 'Buscando…'
                  : 'No hay empleados activos con ese nombre.'}
            </li>
          )}
        </ul>
      )}

      {error && <span className="form-field__error">{error}</span>}
      <span className="form-field__hint">
        ¿No aparece?{' '}
        <button type="button" className="link-inline" onClick={onRegisterNew}>
          + Registrar empleado
        </button>
      </span>
    </div>
  )
}