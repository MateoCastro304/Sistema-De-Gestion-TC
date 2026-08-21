import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/shared/lib/cn'

type ModalSize = 'sm' | 'md' | 'lg'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  size?: ModalSize
  children: ReactNode
  /** Optional footer, typically the action buttons. */
  footer?: ReactNode
}

/**
 * Floating dialog rendered through a portal on `document.body`.
 * Closes on Escape and on scrim click, and locks body scroll while open.
 */
export function Modal({
  open,
  onClose,
  title,
  size = 'md',
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="modal-scrim" onClick={onClose}>
      <div
        className={cn(
          'modal',
          size === 'sm' && 'modal--sm',
          size === 'lg' && 'modal--lg',
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </header>

        <div className="modal__body">{children}</div>

        {footer && (
          <footer className="modal__footer modal__footer--end">{footer}</footer>
        )}
      </div>
    </div>,
    document.body,
  )
}
