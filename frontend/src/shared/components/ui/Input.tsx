import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  /** Validation error message. Takes priority over `hint`. */
  error?: string
  /** Helper text shown below the field when there is no error. */
  hint?: string
  /** Makes the field span every column of its `.form-grid`. */
  full?: boolean
  /**
   * Texto fijo adentro del campo, a la izquierda ("$", "US$"). Es sólo
   * visual: no forma parte del valor ni del nombre accesible.
   */
  prefix?: string
}

/**
 * Text field for forms. Uses `forwardRef` so form libraries such as
 * react-hook-form can register the underlying `<input>`.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, id: idProp, full = false, prefix, ...rest },
  ref,
) {
  // Sin id el <label htmlFor> no apunta a nada: tocar el rótulo no enfoca
  // el campo y el lector de pantalla lo anuncia sin nombre. Si quien lo usa
  // no pasa uno, se genera.
  const generatedId = useId()
  const id = idProp ?? generatedId

  return (
    // form-field--error pinta el borde en rojo (regla del rediseño); sin
    // error la clase no se agrega y el campo se ve igual que siempre.
    <div className={cn('form-field', full && 'form-field--full', error && 'form-field--error')}>
      {label && (
        <label className="form-field__label" htmlFor={id}>
          {label}
        </label>
      )}
      {prefix ? (
        <span className="form-field__affix">
          <span className="form-field__prefix" aria-hidden="true">
            {prefix}
          </span>
          <input ref={ref} id={id} className={className} aria-invalid={error ? true : undefined} {...rest} />
        </span>
      ) : (
        <input
          ref={ref}
          id={id}
          className={cn('form-field__input', className)}
          aria-invalid={error ? true : undefined}
          {...rest}
        />
      )}
      {/* __error en vez de __hint--error: el rediseño lo muestra con su
          ícono de advertencia. Es el mismo texto y la misma condición. */}
      {error ? (
        <span className="form-field__error">{error}</span>
      ) : hint ? (
        <span className="form-field__hint">{hint}</span>
      ) : null}
    </div>
  )
})
