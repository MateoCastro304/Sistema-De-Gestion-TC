import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Badge, Button, CheckBox, PageHero, Pagination, SearchField, Table, type Column } from '@/shared/components/ui'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { DEFAULT_PAGE_SIZE } from '@/shared/api/pagination'
import { isApiError } from '@/shared/api/ApiError'
import { toneByStatus } from '@/shared/lib/rowTone'
import { ROL_LABEL } from '@/domain/roles'
import { PANELS } from '@/features/catalogs/panels'
import { EMPLOYEE_POSITION_LABELS, type Employee } from '../types/employee'
import { useEmployees, useEmployeesCount } from '../api/employees.queries'

const LIST_PATH = '/administracion/empleados'
const NEW_PATH = `${LIST_PATH}/nuevo`

/** Columnas del prototipo: persona con su DNI, puesto, usuario y roles. */
const COLUMNS: Column<Employee>[] = [
  {
    header: 'Empleado',
    render: (employee) => {
      const fullName = `${employee.lastName}, ${employee.firstName}`
      return (
        <span className="table__cell--stack">
          <b>{fullName}</b>
          <span className="table__cell--tel-sub">DNI {employee.dni}</span>
        </span>
      )
    },
  },
  { header: 'Puesto', render: (employee) => EMPLOYEE_POSITION_LABELS[employee.position] },
  {
    header: 'Usuario',
    render: (employee) => (employee.user ? <b>{employee.user.username}</b> : null),
  },
  {
    header: 'Roles',
    render: (employee) => employee.user?.roles.map((role) => ROL_LABEL[role]).join(', ') ?? null,
  },
  {
    header: '',
    align: 'center',
    cellClassName: 'table__cell--acciones',
    render: (employee) => (
      <>
        {!employee.active && <Badge variant="neutral">Inactivo</Badge>}
        <Link className="link-btn" to={`${LIST_PATH}/${employee.id}`}>
          Ver
        </Link>
      </>
    ),
  },
]

/** CU-47 Consultar empleados: listado con búsqueda, dados de baja y paginación. */
export function EmployeesPage() {
  const { photo, photoPosition } = PANELS.administracion.items[0]

  // `search` es lo que se ve en el buscador; `debouncedSearch`, lo que viaja a la API.
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [includeInactive, setIncludeInactive] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isPending, isPlaceholderData, error, refetch } = useEmployees({
    search: debouncedSearch || undefined,
    includeInactive: includeInactive || undefined,
    page,
    limit: DEFAULT_PAGE_SIZE,
  })
  // El encabezado cuenta los empleados activos, sin búsqueda ni filtros (contrato §3.2).
  const count = useEmployeesCount()

  const rows = data?.items ?? []
  const total = data?.total ?? 0

  // Buscar o filtrar vuelve a la primera página.
  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleIncludeInactiveChange(checked: boolean) {
    setIncludeInactive(checked)
    setPage(1)
  }

  let emptyState
  if (error) {
    emptyState = (
      <EmptyState
        kind="error"
        title="No se pudieron cargar los empleados."
        action={<Button onClick={() => refetch()}>Reintentar</Button>}
      >
        {isApiError(error) ? error.message : 'Revisá la conexión e intentá de nuevo.'}
      </EmptyState>
    )
  } else if (!isPending && debouncedSearch !== '') {
    emptyState = <EmptyState kind="no-results" title="No hay empleados que coincidan con la búsqueda." />
  } else if (!isPending) {
    emptyState = (
      <EmptyState title="Todavía no hay empleados registrados.">Cuando cargues el primero va a aparecer acá.</EmptyState>
    )
  }

  return (
    <>
      <PageHero
        eyebrow="Personal de"
        accent="la empresa"
        title="Empleados"
        photo={photo}
        photoPosition={photoPosition}
        back={{ to: PANELS.administracion.to, label: PANELS.administracion.label }}
      >
        {count.isPending ? (
          'Cargando…'
        ) : (
          <>
            <strong>{count.data ?? 0}</strong> {count.data === 1 ? 'empleado activo' : 'empleados activos'}
          </>
        )}
      </PageHero>

      <div className="toolbar">
        <SearchField
          value={search}
          onChange={handleSearchChange}
          placeholder="Buscar por nombre, apellido, DNI o puesto"
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckBox checked={includeInactive} onChange={() => handleIncludeInactiveChange(!includeInactive)} />
          Incluir dados de baja
        </label>
        <Link to={NEW_PATH} className="btn btn--primary toolbar__cta">
          + Nuevo empleado
        </Link>
      </div>

      <Table
        variant="cards"
        gridTemplate="minmax(0,2fr) minmax(0,1.2fr) minmax(0,1fr) minmax(0,1.4fr) 140px"
        rowHref={(employee) => `${LIST_PATH}/${employee.id}`}
        rowClassName={(employee) => `table__row--${toneByStatus(employee.active)}`}
        columns={COLUMNS}
        data={rows}
        rowKey={(employee) => employee.id}
        emptyMessage="Cargando empleados…"
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
