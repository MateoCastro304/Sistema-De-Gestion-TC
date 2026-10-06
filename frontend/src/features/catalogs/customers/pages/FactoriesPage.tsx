import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { isApiError } from '@/shared/api/ApiError'
import { Select } from '@/shared/components/ui'
import {
  useCustomers,
  useFactories,
  useIndustries,
} from '../api/customers.queries'
import { FactoriesTable } from '../components/FactoriesTable'
import { normalizeText } from '@/shared/lib/normalizeText'

/** CU-60 Consultar Fábrica: listing of the FabricaCliente catalog. */
export function FactoriesPage() {
  const factoriesQuery = useFactories()
  const { data: industries = [] } = useIndustries()
  // Para contar encargados activos por fábrica necesitamos todos: pedimos una
  // página grande hasta que el backend ofrezca un conteo dedicado (DTC-54).
  const { data: customersPage } = useCustomers({ active: true, limit: 1000 })
  const customers = customersPage?.items ?? []

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
    const query = normalizeText(search.trim())
    // Compare CUIT by digits so "30-71" matches a stored "30712345671".
    const queryDigits = query.replace(/\D/g, '')
    return factories.filter((factory) => {
      if (industryId && factory.industryId !== industryId) return false
      if (!query) return true
      const matchesName = normalizeText(factory.name).includes(query)
      const matchesCuit =
        queryDigits.length > 0 && factory.cuit.includes(queryDigits)
      return matchesName || matchesCuit
    })
  }, [factories, search, industryId])

  const isFiltering = search.trim() !== '' || industryId !== ''

  return (
    <>
      {/* Rediseño: el encabezado pasa a ser el panel azul, el mismo que
          usan Proveedores y el resto de los catálogos. Sólo cambia la
          envoltura y las clases; los textos, el botón y el link son los
          de antes. Los filtros se mudan acá adentro (ver más abajo). */}
      <div className="page-header">
        <div className="page-header__row">
          <div className="page-header__heading">
            <span className="page-header__eyebrow">Catálogo</span>
            <h1 className="page-header__title">Fábricas</h1>
            <p className="page-header__subtitle">
              Alta, modificación y consulta de fábricas. Desde cada fábrica se
              gestionan sus encargados.
            </p>
          </div>
          <div className="content__actions">
            <Link to="/catalogos/fabricas/nuevo" className="btn btn--primary content__cta">
              <span>+</span> Nueva fábrica
            </Link>
          </div>
        </div>

        {factoriesQuery.isSuccess && (
          <div className="page-header__filters">
            <label className="search-field">
              <svg
                className="search-field__icon"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="9" cy="9" r="6" />
                <path d="m14 14 4 4" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                className="search-input"
                placeholder="Buscar por razón social o CUIT"
                aria-label="Buscar por razón social o CUIT"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            {/* "Todos los rubros" es una opción más (valor ''), no un
                placeholder: volver a elegirla limpia el filtro. */}
            <Select
              variant="glass"
              aria-label="Filtrar por rubro"
              value={industryId}
              onChange={setIndustryId}
              options={[
                { value: '', label: 'Todos los rubros' },
                ...industries.map((industry) => ({ value: industry.id, label: industry.name })),
              ]}
            />
          </div>
        )}
      </div>

      {factoriesQuery.isLoading && <p>Cargando fábricas…</p>}

      {factoriesQuery.isError && (
        <p className="form-field__error">
          {isApiError(factoriesQuery.error)
            ? factoriesQuery.error.message
            : 'No se pudieron cargar las fábricas.'}
        </p>
      )}

      {factoriesQuery.isSuccess && (
        <>
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
