import { Link } from 'react-router'
import { Button } from '@/shared/components/ui'
import { isApiError } from '@/shared/api/ApiError'
import {
  useCustomers,
  useFactories,
  useIndustries,
} from '../api/customers.queries'
import { FactoriesTable } from '../components/FactoriesTable'

/** CU-60 Consultar Fábrica: listing of the FabricaCliente catalog. */
export function FactoriesPage() {
  const factoriesQuery = useFactories()
  const { data: industries = [] } = useIndustries()
  const { data: customers = [] } = useCustomers()

  // Count encargados per factory, to show in the table.
  const contactsByFactory = customers.reduce<Record<string, number>>(
    (acc, customer) => {
      acc[customer.factoryId] = (acc[customer.factoryId] ?? 0) + 1
      return acc
    },
    {},
  )

  return (
    <>
      <div className="content__heading">
        <div>
          <h1 className="content__title">Fábricas</h1>
          <p className="content__subtitle">
            Alta, modificación y consulta de fábricas. Desde cada fábrica se
            gestionan sus encargados.
          </p>
        </div>
        <Link to="/catalogs/factories/new">
          <Button>+ Nueva fábrica</Button>
        </Link>
      </div>

      {factoriesQuery.isLoading && <p>Cargando fábricas…</p>}

      {factoriesQuery.isError && (
        <p className="form-field__hint--error">
          {isApiError(factoriesQuery.error)
            ? factoriesQuery.error.message
            : 'No se pudieron cargar las fábricas.'}
        </p>
      )}

      {factoriesQuery.isSuccess && (
        <FactoriesTable
          factories={factoriesQuery.data}
          industries={industries}
          contactsByFactory={contactsByFactory}
        />
      )}
    </>
  )
}
