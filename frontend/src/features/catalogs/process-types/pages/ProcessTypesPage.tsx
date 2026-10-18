import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button, PageHero, Pagination, SearchField, Table, type Column } from '@/shared/components/ui'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { DEFAULT_PAGE_SIZE } from '@/shared/api/pagination'
import { isApiError } from '@/shared/api/ApiError'
import fotoCnc from '@/assets/foto-cnc.webp'
import { PANELS } from '@/features/catalogs/panels'
import { useProcessTypes, useProcessTypesCount } from '../api/process-types.queries'
import type { ProcessType } from '../types/process-type'
import { formatArs, formatUsd } from '../utils/money'
import { formatLongDateTime } from '../utils/dates'

const LIST_PATH = '/catalogos/tipos-de-proceso'
const NEW_PATH = `${LIST_PATH}/nuevo`

/** Columnas del prototipo: nombre con descripción, los dos precios y la última actualización. */
const COLUMNS: Column<ProcessType>[] = [
  {
    header: 'Nombre',
    render: (processType) => (
      <span className="table__cell--stack">
        <b>{processType.name}</b>
        <span className="table__cell--tel-sub">{processType.description || 'Sin descripción'}</span>
      </span>
    ),
  },
  { header: 'Precio hora en pesos', render: (processType) => <b>{formatArs(processType.hourlyRateArs)}</b> },
  { header: 'Precio hora en dólares', render: (processType) => <b>{formatUsd(processType.hourlyRateUsd)}</b> },
  { header: 'Última actualización', render: (processType) => formatLongDateTime(processType.updatedAt) },
  {
    header: '',
    align: 'center',
    cellClassName: 'table__cell--fin',
    render: (processType) => (
      <Link className="link-btn" to={`${LIST_PATH}/${processType.id}`}>
        Ver
      </Link>
    ),
  },
]

/** CU-11 Consultar tipos de proceso: listado con búsqueda por nombre. */
export function ProcessTypesPage() {
  const navigate = useNavigate()
  // `search` es lo que se ve en el buscador; `debouncedSearch`, lo que viaja a la API.
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isPending, isPlaceholderData, error, refetch } = useProcessTypes({
    search: debouncedSearch || undefined,
    page,
    limit: DEFAULT_PAGE_SIZE,
  })
  // El encabezado cuenta el catálogo entero, sin la búsqueda (contrato §3.4).
  const count = useProcessTypesCount()

  const rows = data?.items ?? []
  const total = data?.total ?? 0

  // Buscar vuelve a la primera página.
  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  const newButton = (
    <Link to={NEW_PATH} className="btn btn--primary">
      + Nuevo tipo de proceso
    </Link>
  )

  let emptyState
  if (error) {
    emptyState = (
      <EmptyState
        kind="error"
        title="No se pudieron cargar los tipos de proceso."
        action={<Button onClick={() => refetch()}>Reintentar</Button>}
      >
        {isApiError(error) ? error.message : 'Revisá la conexión e intentá de nuevo.'}
      </EmptyState>
    )
  } else if (!isPending && debouncedSearch !== '') {
    emptyState = (
      <EmptyState kind="no-results" title="No se encontraron tipos de proceso con ese criterio" action={newButton}>
        Revisá cómo está escrito.
      </EmptyState>
    )
  } else if (!isPending) {
    emptyState = (
      <EmptyState title="Todavía no hay tipos de proceso registrados." action={newButton}>
        Cuando cargues el primero va a aparecer acá.
      </EmptyState>
    )
  }

  return (
    <>
      <PageHero
        eyebrow="Procesos"
        accent="propios"
        title="Tipos de proceso"
        photo={fotoCnc}
        photoPosition="center 55%"
        back={{ to: PANELS.gestion.to, label: PANELS.gestion.label }}
      >
        {count.isPending ? (
          'Cargando…'
        ) : (
          <>
            <strong>{count.data ?? 0}</strong>{' '}
            {count.data === 1 ? 'tipo de proceso registrado' : 'tipos de proceso registrados'}
          </>
        )}
      </PageHero>

      <div className="toolbar">
        <SearchField value={search} onChange={handleSearchChange} placeholder="Buscar por nombre" />
        {newButton}
      </div>

      <Table
        variant="cards"
        gridTemplate="minmax(0,2fr) 170px 160px 200px 80px"
        onRowClick={(processType) => void navigate(`${LIST_PATH}/${processType.id}`)}
        columns={COLUMNS}
        data={rows}
        rowKey={(processType) => processType.id}
        emptyMessage="Cargando tipos de proceso…"
        emptyState={emptyState}
        footer={
          <Pagination
            page={page}
            pageSize={DEFAULT_PAGE_SIZE}
            total={total}
            onPageChange={setPage}
            disabled={isPlaceholderData}
          />
        }
      />
    </>
  )
}