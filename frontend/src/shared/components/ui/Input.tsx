import { forwardRef } from 'react'
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
}

/**
 * Text field for forms. Uses `forwardRef` so form libraries such as
 * react-hook-form can register the underlying `<input>`.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, id, full = false, ...rest },
  ref,
) {
  return (
    <div className={cn('form-field', full && 'form-field--full')}>
      {label && (
        <label className="form-field__label" htmlFor={id}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn('form-field__input', className)}
        aria-invalid={error ? true : undefined}
        {...rest}
      />
      {error ? (
        <span className="form-field__hint form-field__hint--error">{error}</span>
      ) : hint ? (
        <span className="form-field__hint">{hint}</span>
      ) : null}
    </div>
  )
})
