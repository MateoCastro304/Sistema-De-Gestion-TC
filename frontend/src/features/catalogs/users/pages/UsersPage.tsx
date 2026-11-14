import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Badge, Button, CheckBox, PageHero, Pagination, SearchField, Select, Table, type BadgeVariant, type Column } from '@/shared/components/ui'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { DEFAULT_PAGE_SIZE } from '@/shared/api/pagination'
import { isApiError } from '@/shared/api/ApiError'
import { toneByStatus } from '@/shared/lib/rowTone'
import { ROL_LABEL, ROLE_ORDER, type Rol } from '@/domain/roles'
import { PANELS } from '@/features/catalogs/panels'
import fotoDispositivo from '@/assets/foto-dispositivo.webp'
import { USER_STATUS_LABELS, type User, type UserStatus } from '../types/user'
import { useUsers, useUsersCount } from '../api/users.queries'
import { formatLongDateTime } from '../utils/dates'
import { NEW_USER_PATH, userDetailPath } from '../utils/paths'

/**
 * Color de la etiqueta de estado. El prototipo pinta "Bloqueado" en rojo,
 * pero el sistema de diseño no tiene una etiqueta roja: va en ámbar, que es
 * la de "atención". "Inactivo" va en neutral, como los dados de baja de
 * Empleados.
 */
const STATUS_BADGE: Record<UserStatus, BadgeVariant> = {
  ACTIVE: 'verde',
  BLOCKED: 'ambar',
  INACTIVE: 'neutral',
}

/** Opciones del filtro: "Todos los roles" y los seis, en el orden del catálogo. */
const ROLE_OPTIONS = [
  { value: '' as const, label: 'Todos los roles' },
  ...ROLE_ORDER.map((role) => ({ value: role, label: ROL_LABEL[role] })),
]

/** Columnas del prototipo: usuario, empleado, roles, estado y último acceso. */
const COLUMNS: Column<User>[] = [
  { header: 'Nombre de usuario', render: (user) => <b>{user.username}</b> },
  { header: 'Empleado', render: (user) => `${user.employee.firstName} ${user.employee.lastName}` },
  { header: 'Roles', render: (user) => user.roles.map((role) => ROL_LABEL[role]).join(', ') },
  {
    header: 'Estado',
    render: (user) => <Badge variant={STATUS_BADGE[user.status]}>{USER_STATUS_LABELS[user.status]}</Badge>,
  },
  {
    header: 'Último acceso',
    render: (user) => (user.lastAccessAt ? formatLongDateTime(user.lastAccessAt) : 'Nunca ingresó'),
  },
  {
    header: '',
    align: 'center',
    cellClassName: 'table__cell--acciones',
    render: (user) => (
      <Link className="link-btn" to={userDetailPath(user.id)}>
        Ver
      </Link>
    ),
  },
]

/** CU-07 Consultar usuarios: listado con búsqueda, filtro por rol, dados de baja y paginación. */
export function UsersPage() {
  // `search` es lo que se ve en el buscador; `debouncedSearch`, lo que viaja a la API.
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [role, setRole] = useState<Rol | ''>('')
  const [includeInactive, setIncludeInactive] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isPending, isPlaceholderData, error, refetch } = useUsers({
    search: debouncedSearch || undefined,
    role: role || undefined,
    includeInactive: includeInactive || undefined,
    page,
    limit: DEFAULT_PAGE_SIZE,
  })
  // El encabezado cuenta activos y bloqueados, sin búsqueda ni filtros (contrato §3.3, D-28).
  const count = useUsersCount()

  const rows = data?.items ?? []
  const total = data?.total ?? 0
  const filtering = debouncedSearch !== '' || role !== '' || includeInactive

  // Buscar o filtrar vuelve a la primera página.
  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleRoleChange(value: Rol | '') {
    setRole(value)
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
        title="No se pudieron cargar los usuarios."
        action={<Button onClick={() => refetch()}>Reintentar</Button>}
      >
        {isApiError(error) ? error.message : 'Revisá la conexión e intentá de nuevo.'}
      </EmptyState>
    )
  } else if (!isPending && filtering) {
    emptyState = (
      <EmptyState
        kind="no-results"
        title="No se encontraron usuarios con ese criterio"
        action={
          <Link to={NEW_USER_PATH} className="btn btn--primary">
            + Nuevo usuario
          </Link>
        }
      >
        Probá con otro rol o incluí los dados de baja.
      </EmptyState>
    )
  } else if (!isPending) {
    emptyState = (
      <EmptyState title="Todavía no hay usuarios registrados.">Cuando crees el primero va a aparecer acá.</EmptyState>
    )
  }

  return (
    <>
      <PageHero
        eyebrow="Acceso al"
        accent="sistema"
        title="Usuarios"
        photo={fotoDispositivo}
        photoPosition="center 45%"
        back={{ to: PANELS.administracion.to, label: PANELS.administracion.label }}
      >
        {count.isPending ? (
          'Cargando…'
        ) : (
          <>
            <strong>{count.data ?? 0}</strong> {count.data === 1 ? 'usuario activo' : 'usuarios activos'}
          </>
        )}
      </PageHero>

      <div className="toolbar">
        <SearchField value={search} onChange={handleSearchChange} placeholder="Buscar por usuario o empleado" />
        {/* "Todos los roles" es una opción más (valor ''), no un placeholder:
            volver a elegirla limpia el filtro. */}
        <Select aria-label="Filtrar por rol" value={role} onChange={handleRoleChange} options={ROLE_OPTIONS} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckBox checked={includeInactive} onChange={() => handleIncludeInactiveChange(!includeInactive)} />
          Incluir dados de baja
        </label>
        <Link to={NEW_USER_PATH} className="btn btn--primary toolbar__cta">
          + Nuevo usuario
        </Link>
      </div>

      <Table
        variant="cards"
        gridTemplate="170px minmax(0,1.2fr) minmax(0,1.7fr) 130px 190px 100px"
        rowHref={(user) => userDetailPath(user.id)}
        rowClassName={(user) => `table__row--${toneByStatus(user.status !== 'INACTIVE')}`}
        columns={COLUMNS}
        data={rows}
        rowKey={(user) => user.id}
        emptyMessage="Cargando usuarios…"
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