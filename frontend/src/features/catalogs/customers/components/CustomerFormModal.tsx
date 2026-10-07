import { Modal } from '@/shared/components/ui'
import { useToast } from '@/app/providers/ToastContext'
import type { Customer, CustomerInput } from '../types/customer'
import { toCustomerFormValues } from '../schemas/customer.schema'
import { useCreateCustomer, useUpdateCustomer } from '../api/customers.queries'
import { CustomerForm } from './CustomerForm'
import { customerErrorMessage, customerFullName } from '../utils/errorMessages'

interface CustomerFormModalProps {
  open: boolean
  onClose: () => void
  /** Factory the encargado belongs to; fixes the customer's `factoryId`. */
  factoryId: string
  /** Contact to edit; omit to create a new one (CU-01 vs CU-02). */
  customer?: Customer
}

/**
 * Create/edit an encargado (EncargadoCliente) from inside a factory
 * ("desde la fábrica se agregan los encargados"). The factory is fixed by the
 * caller, so the form hides its factory selector.
 */
export function CustomerFormModal({
  open,
  onClose,
  factoryId,
  customer,
}: CustomerFormModalProps) {
  const showToast = useToast()
  const isEdit = Boolean(customer)

  const create = useCreateCustomer()
  const update = useUpdateCustomer(factoryId, customer?.id ?? '')
  const saving = create.isPending || update.isPending

  const handleSubmit = (input: CustomerInput) => {
    const onSuccess = (saved: Customer) => {
      showToast(
        'success',
        `Encargado "${customerFullName(saved)}" ${
          isEdit ? 'actualizado' : 'agregado'
        }.`,
      )
      onClose()
    }
    const onError = (error: unknown) => {
      showToast(
        'error',
        customerErrorMessage(error, 'No se pudo guardar el encargado.'),
      )
    }

    if (isEdit) update.mutate(input, { onSuccess, onError })
    else create.mutate(input, { onSuccess, onError })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar encargado' : 'Agregar encargado'}
    >
      {open && (
        <CustomerForm
          // Remount per target so defaults reset between add/edit.
          key={customer?.id ?? 'new'}
          lockedFactoryId={factoryId}
          defaultValues={customer ? toCustomerFormValues(customer) : undefined}
          onSubmit={handleSubmit}
          onCancel={onClose}
          submitting={saving}
          submitLabel={isEdit ? 'Guardar cambios' : 'Agregar encargado'}
        />
      )}
    </Modal>
  )
}
