import { Modal } from '@/shared/components/ui'
import { useToast } from '@/app/providers/ToastContext'
import { isApiError } from '@/shared/api/ApiError'
import type { Factory, FactoryInput } from '../types/factory'
import { useCreateFactory } from '../api/customers.queries'
import { FactoryForm } from './FactoryForm'

interface FactoryFormModalProps {
  open: boolean
  onClose: () => void
  /** Called with the freshly created factory, so the caller can pre-select it. */
  onCreated: (factory: Factory) => void
}

/**
 * Inline "nueva fábrica" (CU-58), opened from the customer form when the
 * factory the user is looking for is not in the selector yet. Mirrors the
 * "nuevo rubro" flow of {@link ./IndustryFormModal.tsx}.
 */
export function FactoryFormModal({
  open,
  onClose,
  onCreated,
}: FactoryFormModalProps) {
  const showToast = useToast()
  const create = useCreateFactory()

  const handleSubmit = (input: FactoryInput) => {
    create.mutate(input, {
      onSuccess: (factory) => {
        showToast('success', `Fábrica "${factory.name}" registrada.`)
        onCreated(factory)
        onClose()
      },
      onError: (error) => {
        showToast(
          'error',
          isApiError(error) ? error.message : 'No se pudo registrar la fábrica.',
        )
      },
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva fábrica">
      {open && (
        <FactoryForm
          // Remount per open so the fields reset between visits.
          key={open ? 'open' : 'closed'}
          onSubmit={handleSubmit}
          onCancel={onClose}
          submitting={create.isPending}
          submitLabel="Registrar fábrica"
        />
      )}
    </Modal>
  )
}
