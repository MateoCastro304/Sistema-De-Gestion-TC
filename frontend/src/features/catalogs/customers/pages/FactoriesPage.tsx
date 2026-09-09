import { useMemo, useState } from 'react'
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

  // Filters: free-text search (razón social / CUIT, case-insensitive) + rubro.
  const [search, setSearch] = useState('')
  const [industryId, setIndustryId] = useState('')

  // Count encargados per factory, to show in the table.
  const contactsByFactory = customers.reduce<Record<string, number>>(
    (acc, customer) => {
      acc[customer.factoryId] = (acc[customer.factoryId] ?? 0) + 1
      return acc
    },
    {},
  )

  const factories = useMemo(() => factoriesQuery.data ?? [], [factoriesQuery.data])

  const filteredFactories = useMemo(() => {
    const query = search.trim().toLowerCase()
    // Compare CUIT by digits so "30-71" matches a stored "30712345671".
    const queryDigits = query.replace(/\D/g, '')
    return factories.filter((factory) => {
      if (industryId && factory.industryId !== industryId) return false
      if (!query) return true
      const matchesName = factory.name.toLowerCase().includes(query)
      const matchesCuit =
        queryDigits.length > 0 && factory.cuit.includes(queryDigits)
      return matchesName || matchesCuit
    })
  }, [factories, search, industryId])

  const isFiltering = search.trim() !== '' || industryId !== ''

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
        <>
          <div className="filters">
            <div className="filters__search">
              <svg
                className="filters__search-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                className="filters__search-input"
                placeholder="Buscar por razón social o CUIT"
                aria-label="Buscar por razón social o CUIT"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              className="form-field__select"
              style={{ width: 'auto', minWidth: '180px' }}
              aria-label="Filtrar por rubro"
              value={industryId}
              onChange={(event) => setIndustryId(event.target.value)}
            >
              <option value="">Todos los rubros</option>
              {industries.map((industry) => (
                <option key={industry.id} value={industry.id}>
                  {industry.name}
                </option>
              ))}
            </select>
          </div>

          <FactoriesTable
            factories={filteredFactories}
            industries={industries}
            contactsByFactory={contactsByFactory}
            emptyMessage={
              isFiltering
                ? 'No hay fábricas que coincidan con la búsqueda.'
                : 'No hay fábricas registradas.'
            }
          />
        </>
      )}
    </>
  )
}
