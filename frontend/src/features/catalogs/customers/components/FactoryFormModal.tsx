import { Modal } from '@/shared/components/ui'
import { useToast } from '@/app/providers/ToastContext'
import type { Factory, FactoryInput } from '../types/factory'
import { useCreateFactory } from '../api/customers.queries'
import { FactoryForm } from './FactoryForm'
import { factoryErrorMessage } from '../utils/errorMessages'

interface FactoryFormModalProps {
  open: boolean
  onClose: () => void
  /** Called with the freshly created factory, so the caller can pre-select it. */
  onCreated: (factory: Factory) => void
}

/**
 * Inline "nueva fábrica" (CU-58), opened from the customer form when the
 * factory the user is looking for is not in the selector yet.
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
          factoryErrorMessage(error, 'No se pudo registrar la fábrica.'),
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
