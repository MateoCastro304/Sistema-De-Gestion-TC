import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

/** Button styles available in the stylesheet (`.btn--*`). */
export type ButtonVariant = 'primary' | 'outline' | 'success' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  /** Makes the button span the full width of its container. */
  block?: boolean
}

/**
 * App-wide button. Inherits every native `<button>` prop (onClick, disabled,
 * type, children, ...) on top of `variant` and `block`.
 */
export function Button({
  variant = 'primary',
  block = false,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn('btn', `btn--${variant}`, block && 'btn--block', className)}
      {...rest}
    />
  )
}

/** Remember that the idea of cn is to avoid rewriting the same structure many times. With <Button variant="success" block> it would look like → "btn btn--success btn--block". */
