import { useEffect, useState } from 'react'
import { Avatar, Button, PageHero, Pagination, SearchField, Select, Table, type Column } from '@/shared/components/ui'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { DEFAULT_PAGE_SIZE } from '@/shared/api/pagination'
import { isApiError } from '@/shared/api/ApiError'
import fotoEjes from '@/assets/foto-ejes.webp'
import { PANELS } from '@/features/catalogs/panels'
import { useMaterialNames, useMaterials, useMaterialsCount } from '../api/materials.queries'
import { MaterialFormModal } from '../components/MaterialFormModal'
import type { Material } from '../types/material'

/** Columnas del prototipo: material y calidad. El listado no tiene detalle ni acciones por fila. */
const COLUMNS: Column<Material>[] = [
  {
    header: 'Material',
    render: (material) => (
      <span className="table__cell--nombre">
        <Avatar name={material.name} icon="material" />
        <b>{material.name}</b>
      </span>
    ),
  },
  { header: 'Calidad', render: (material) => material.quality },
]

/**
 * CU-39 Consultar materiales: filtro por material, búsqueda por calidad y
 * paginación. "+ Nuevo material" abre la ventana de alta (CU-37).
 */
export function MaterialsPage() {
  // `search` es lo que se ve en el buscador; `debouncedSearch`, lo que viaja a la API.
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  // '' es "Todos los materiales".
  const [name, setName] = useState('')
  const [page, setPage] = useState(1)
  /** La ventana "Nuevo material", abierta o cerrada. */
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isPending, isPlaceholderData, error, refetch } = useMaterials({
    name: name || undefined,
    quality: debouncedSearch || undefined,
    page,
    limit: DEFAULT_PAGE_SIZE,
  })
  // El encabezado cuenta el catálogo entero, sin filtros (contrato §3.6).
  const count = useMaterialsCount()
  const names = useMaterialNames()

  const rows = data?.items ?? []
  const total = data?.total ?? 0
  const filtering = name !== '' || debouncedSearch !== ''

  // "Todos los materiales" es una opción más (valor ''), no un placeholder:
  // volver a elegirla limpia el filtro.
  const nameOptions = [
    { value: '', label: 'Todos los materiales' },
    ...(names.data ?? []).map((materialName) => ({ value: materialName, label: materialName })),
  ]

  // Buscar o filtrar vuelve a la primera página.
  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleNameChange(value: string) {
    setName(value)
    setPage(1)
  }

  // Va en la barra y en "sin resultados" (escenario 3 de CU-39).
  const newMaterialButton = <Button onClick={() => setCreating(true)}>+ Nuevo material</Button>

  let emptyState
  if (error) {
    emptyState = (
      <EmptyState
        kind="error"
        title="No se pudieron cargar los materiales."
        action={<Button onClick={() => refetch()}>Reintentar</Button>}
      >
        {isApiError(error) ? error.message : 'Revisá la conexión e intentá de nuevo.'}
      </EmptyState>
    )
  } else if (!isPending && filtering) {
    emptyState = (
      <EmptyState kind="no-results" title="No se encontraron materiales con ese criterio" action={newMaterialButton}>
        Revisá la calidad o cambiá el material elegido.
      </EmptyState>
    )
  } else if (!isPending) {
    emptyState = (
      <EmptyState title="Todavía no hay materiales registrados.">Cuando cargues el primero va a aparecer acá.</EmptyState>
    )
  }

  return (
    <>
      <PageHero
        eyebrow="Catálogo de"
        accent="materiales"
        title="Materiales"
        photo={fotoEjes}
        photoPosition="center 45%"
        back={{ to: PANELS.gestion.to, label: PANELS.gestion.label }}
      >
        {count.isPending ? (
          'Cargando…'
        ) : (
          <>
            <strong>{count.data ?? 0}</strong> {count.data === 1 ? 'material registrado' : 'materiales registrados'}
          </>
        )}
      </PageHero>

      <div className="toolbar">
        <Select aria-label="Filtrar por material" value={name} onChange={handleNameChange} options={nameOptions} />
        <SearchField value={search} onChange={handleSearchChange} placeholder="Buscar por calidad" />
        <div className="toolbar__cta">{newMaterialButton}</div>
      </div>

      <Table
        variant="cards"
        gridTemplate="minmax(0,1.2fr) minmax(0,1fr)"
        columns={COLUMNS}
        data={rows}
        rowKey={(material) => material.id}
        emptyMessage="Cargando materiales…"
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

      <MaterialFormModal open={creating} onClose={() => setCreating(false)} />
    </>
  )
}