import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { isApiError } from '@/shared/api/ApiError'
import { PageHero, SearchField, Select } from '@/shared/components/ui'
import fotoTaller from '@/assets/foto-ejes.png'
import {
  useCustomers,
  useFactories,
  useCategories,
} from '../api/customers.queries'
import { FactoriesTable } from '../components/FactoriesTable'
import { normalizeText } from '@/shared/lib/normalizeText'

/** CU-60 Consultar Fábrica: listing of the FabricaCliente catalog. */
export function FactoriesPage() {
  const factoriesQuery = useFactories()
  const { data: categories = [] } = useCategories()
  // Para contar encargados activos por fábrica necesitamos todos: pedimos una
  // página grande hasta que el backend ofrezca un conteo dedicado (DTC-54).
  const { data: customersPage } = useCustomers({ active: true, limit: 1000 })
  const customers = customersPage?.items ?? []

  // Filters: free-text search (razón social / CUIT, case-insensitive) + rubro.
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')

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
      if (categoryId && factory.categoryId !== categoryId) return false
      if (!query) return true
      const matchesName = normalizeText(factory.name).includes(query)
      const matchesCuit =
        queryDigits.length > 0 && factory.cuit.includes(queryDigits)
      return matchesName || matchesCuit
    })
  }, [factories, search, categoryId])

  const isFiltering = search.trim() !== '' || categoryId !== ''

  return (
    <>
      <PageHero eyebrow="Empresas" accent="clientes" title="Fábricas" photo={fotoTaller} />

      {/* Barra de herramientas: buscador, filtro por rubro y alta. Los
          filtros aparecen recién cuando el listado cargó. */}
      <div className="toolbar">
        {factoriesQuery.isSuccess && (
          <>
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder="Buscar por razón social o CUIT"
            />

            {/* "Todos los rubros" es una opción más (valor ''), no un
                placeholder: volver a elegirla limpia el filtro. */}
            <Select
              aria-label="Filtrar por rubro"
              value={categoryId}
              onChange={setCategoryId}
              options={[
                { value: '', label: 'Todos los rubros' },
                ...categories.map((category) => ({ value: category.id, label: category.name })),
              ]}
            />
          </>
        )}
        <Link to="/catalogos/fabricas/nuevo" className="btn btn--primary toolbar__cta">
          + Nueva fábrica
        </Link>
      </div>

      {factoriesQuery.isLoading && (
        <div className="empty-state">
          <p className="empty-state__text">Cargando fábricas…</p>
        </div>
      )}

      {factoriesQuery.isError && (
        <div className="callout callout--warning">
          <span>
            {isApiError(factoriesQuery.error)
              ? factoriesQuery.error.message
              : 'No se pudieron cargar las fábricas.'}
          </span>
        </div>
      )}

      {factoriesQuery.isSuccess && (
        <>
          <FactoriesTable
            factories={filteredFactories}
            categories={categories}
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
