import type { InputHTMLAttributes, Ref } from 'react'
import { Button } from '@/shared/components/ui'
import { cn } from '@/shared/lib/cn'

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  id: string
  label: string
  error?: string
  /** Se ve en claro. Lo comparten los dos campos, como en el prototipo. */
  visible: boolean
  onToggleVisible: () => void
  /** Si llega, muestra el botón "Generar" (sólo en "Contraseña"). */
  onGenerate?: () => void
  ref?: Ref<HTMLInputElement>
}

/**
 * Campo de contraseña del alta de usuario: el ojo para mostrarla u
 * ocultarla y, opcionalmente, "Generar". El rótulo del ojo es "Mostrar
 * contraseña", así que no choca con buscar el campo por "Contraseña".
 */
export function PasswordField({
  id,
  label,
  error,
  visible,
  onToggleVisible,
  onGenerate,
  className,
  ref,
  ...rest
}: PasswordFieldProps) {
  return (
    <div className={cn('form-field', error && 'form-field--error')}>
      <label className="form-field__label" htmlFor={id}>
        {label}
      </label>
      <div className="password-field">
        <span className="form-field__affix">
          <input
            ref={ref}
            id={id}
            type={visible ? 'text' : 'password'}
            autoComplete="new-password"
            aria-invalid={error ? true : undefined}
            className={className}
            {...rest}
          />
          <button
            type="button"
            className="password-field__toggle"
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
            onClick={onToggleVisible}
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <path
                d={
                  visible
                    ? 'M1.8 10S5 4.5 10 4.5 18.2 10 18.2 10 15 15.5 10 15.5 1.8 10 1.8 10zM12.5 10a2.5 2.5 0 1 1-5 0a2.5 2.5 0 1 1 5 0M3 3l14 14'
                    : 'M1.8 10S5 4.5 10 4.5 18.2 10 18.2 10 15 15.5 10 15.5 1.8 10 1.8 10zM12.5 10a2.5 2.5 0 1 1-5 0a2.5 2.5 0 1 1 5 0'
                }
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </span>
        {onGenerate && (
          <Button variant="outline" onClick={onGenerate}>
            Generar
          </Button>
        )}
      </div>
      {error && <span className="form-field__error">{error}</span>}
    </div>
  )
}
