import { useState } from 'react'
import { Link } from 'react-router'
import { Button, Modal } from '@/shared/components/ui'
import { useToast } from '@/app/providers/ToastContext'
import { isApiError } from '@/shared/api/ApiError'
import type { Customer } from '../types/customer'
import {
  useCustomers,
  useDeactivateCustomer,
  useFactories,
  useIndustries,
} from '../api/customers.queries'
import { CustomersTable } from '../components/CustomersTable'

/** CU-03 Consultar Cliente + CU-04 Registrar Baja de Cliente. */
export function CustomersPage() {
  const showToast = useToast()
  const customersQuery = useCustomers()
  const { data: factories = [] } = useFactories()
  const { data: industries = [] } = useIndustries()
  const deactivate = useDeactivateCustomer()

  // Customer pending confirmation for baja lógica; null when the modal is closed.
  const [toDeactivate, setToDeactivate] = useState<Customer | null>(null)

  const fullName = (c: Customer) => `${c.firstName} ${c.lastName}`

  const confirmDeactivate = () => {
    if (!toDeactivate) return
    deactivate.mutate(toDeactivate.id, {
      onSuccess: () => {
        showToast('success', `Encargado "${fullName(toDeactivate)}" desactivado.`)
        setToDeactivate(null)
      },
      onError: (error) => {
        showToast(
          'error',
          isApiError(error) ? error.message : 'No se pudo desactivar el encargado.',
        )
      },
    })
  }

  return (
    <>
      <div className="content__heading">
        <div>
          <h1 className="content__title">Encargados</h1>
          <p className="content__subtitle">
            Alta, baja, modificación y consulta de encargados de fábricas.
          </p>
        </div>
        <Link to="/catalogs/customers/new">
          <Button>+ Nuevo encargado</Button>
        </Link>
      </div>

      {customersQuery.isLoading && <p>Cargando encargados…</p>}

      {customersQuery.isError && (
        <p className="form-field__hint--error">
          {isApiError(customersQuery.error)
            ? customersQuery.error.message
            : 'No se pudieron cargar los encargados.'}
        </p>
      )}

      {customersQuery.isSuccess && (
        <CustomersTable
          customers={customersQuery.data}
          factories={factories}
          industries={industries}
          onDeactivate={setToDeactivate}
        />
      )}

      <Modal
        open={toDeactivate !== null}
        onClose={() => setToDeactivate(null)}
        title="Desactivar encargado"
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setToDeactivate(null)}
              disabled={deactivate.isPending}
            >
              Cancelar
            </Button>
            <Button onClick={confirmDeactivate} disabled={deactivate.isPending}>
              {deactivate.isPending ? 'Desactivando…' : 'Desactivar'}
            </Button>
          </>
        }
      >
        <p>
          ¿Seguro que querés desactivar a{' '}
          <strong>{toDeactivate ? fullName(toDeactivate) : ''}</strong>? El
          encargado se desactivará, pero se conserva su historial.
        </p>
      </Modal>
    </>
  )
}
