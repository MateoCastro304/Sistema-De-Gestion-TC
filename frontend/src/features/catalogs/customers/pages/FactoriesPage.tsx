import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { isApiError } from '@/shared/api/ApiError'
import { Button, PageHero, Pagination, SearchField, Select } from '@/shared/components/ui'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { usePagedList } from '@/shared/hooks/usePagedList'
import fotoTaller from '@/assets/foto-ejes.webp'
import { PANELS } from '@/features/catalogs/panels'
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

  // La lista llega entera y se filtra acá, así que también se pagina acá.
  const { pageItems, page, setPage, pageSize, total } = usePagedList(filteredFactories)

  // Cambiar un filtro vuelve a la primera página.
  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleCategoryChange = (value: string) => {
    setCategoryId(value)
    setPage(1)
  }

  const clearFilters = () => {
    handleSearchChange('')
    setCategoryId('')
  }

  return (
    <>
      <PageHero
        eyebrow="Empresas"
        accent="clientes"
        title="Fábricas"
        photo={fotoTaller}
        photoPosition="center 45%"
        back={{ to: PANELS.clientes.to, label: PANELS.clientes.label }}
      >
        {factoriesQuery.isLoading ? (
          'Cargando…'
        ) : (
          <>
            {/* Con una búsqueda activa el total es el de los que coinciden,
                no el del catálogo entero: el texto lo dice. */}
            <strong>{total}</strong>{' '}
            {isFiltering
              ? total === 1
                ? 'fábrica coincide con la búsqueda'
                : 'fábricas coinciden con la búsqueda'
              : total === 1
                ? 'fábrica registrada'
                : 'fábricas registradas'}
          </>
        )}
      </PageHero>

      {/* Barra de herramientas: buscador, filtro por rubro y alta. Los
          filtros aparecen recién cuando el listado cargó. */}
      <div className="toolbar">
        {factoriesQuery.isSuccess && (
          <>
            <SearchField
              value={search}
              onChange={handleSearchChange}
              placeholder="Buscar por razón social o CUIT"
            />

            {/* "Todos los rubros" es una opción más (valor ''), no un
                placeholder: volver a elegirla limpia el filtro. */}
            <Select
              aria-label="Filtrar por rubro"
              value={categoryId}
              onChange={handleCategoryChange}
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

      {/* El error va dentro de la tarjeta del listado, con el encabezado
          de columnas a la vista. */}
      {factoriesQuery.isError && (
        <FactoriesTable
          factories={[]}
          categories={categories}
          contactsByFactory={contactsByFactory}
          emptyState={
            <EmptyState
              kind="error"
              title="No se pudieron cargar las fábricas."
              action={<Button onClick={() => factoriesQuery.refetch()}>Reintentar</Button>}
            >
              {isApiError(factoriesQuery.error)
                ? factoriesQuery.error.message
                : 'Revisá la conexión e intentá de nuevo.'}
            </EmptyState>
          }
        />
      )}

      {factoriesQuery.isSuccess && (
        <FactoriesTable
          factories={pageItems}
          categories={categories}
          contactsByFactory={contactsByFactory}
          emptyState={
            isFiltering ? (
              <EmptyState
                kind="no-results"
                title="No hay fábricas que coincidan con la búsqueda."
                action={
                  <Button variant="secondary" onClick={clearFilters}>
                    Limpiar búsqueda
                  </Button>
                }
              >
                Revisá cómo está escrito, buscá por CUIT o probá con otro rubro.
              </EmptyState>
            ) : (
              <EmptyState
                title="Todavía no hay fábricas registradas."
                action={
                  <Link to="/catalogos/fabricas/nuevo" className="btn btn--primary">
                    + Nueva fábrica
                  </Link>
                }
              >
                Cuando cargues la primera va a aparecer acá.
              </EmptyState>
            )
          }
          footer={
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
          }
        />
      )}
    </>
  )
}
