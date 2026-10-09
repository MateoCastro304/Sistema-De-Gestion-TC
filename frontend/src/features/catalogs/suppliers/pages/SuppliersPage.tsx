import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  Avatar,
  Badge,
  Button,
  CheckBox,
  IconTrash,
  Modal,
  PageHero,
  Pagination,
  SearchField,
  Table,
  TrashButton,
  ValueOrDash,
} from '@/shared/components/ui'
import type { Column } from '@/shared/components/ui'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { DEFAULT_PAGE_SIZE } from '@/shared/api/pagination'
import { cn } from '@/shared/lib/cn'
import fotoTaller from '@/assets/hero-castro.webp'
import { isApiError } from '@/shared/api/ApiError'
import { useToast } from '@/app/providers/ToastContext'
import { useSuppliers } from '../api/useSuppliers'
import { useDeleteSuppliers } from '../api/useDeleteSuppliers'
import { SUPPLIER_TYPE_LABELS } from '../types/supplier'
import type { Supplier } from '../types/supplier'
import { TYPE_ICONS, TYPE_TONES, supplierIcon, supplierTone } from '../utils/supplierTone'

export function SuppliersPage() {
  // El backend busca y pagina. La búsqueda se debouncea para no pegarle en
  // cada tecla; `search` es lo que se ve en el cuadro y `debouncedSearch`
  // lo que viaja.
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isPending, isPlaceholderData, error, refetch } = useSuppliers({
    search: debouncedSearch || undefined,
    page,
    limit: DEFAULT_PAGE_SIZE,
  })

  // `rows` es la página que mandó el backend; `total`, todos los que
  // coinciden con la búsqueda sumando las demás páginas.
  const rows = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE))

  // null = mirando la lista. Un Map, aunque este vacio = modo eliminacion.
  // En un solo estado para que no exista "modo activo sin seleccion".
  // Guarda el proveedor entero y no sólo el id: la selección sobrevive al
  // cambio de página y a la búsqueda, y los que quedan fuera de la página
  // actual ya no están en `rows` para listarlos en la confirmación.
  const [selected, setSelected] = useState<Map<number, Supplier> | null>(null)
  const isSelecting = selected !== null
  const selectedCount = selected?.size ?? 0

  const [confirmOpen, setConfirmOpen] = useState(false)
  const { mutate: deleteSuppliers, isPending: isDeleting } = useDeleteSuppliers()
  const showToast = useToast()

  // Buscar vuelve a la primera página: los resultados nuevos no tienen
  // por qué empezar donde había quedado la lista anterior.
  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  // "Limpiar búsqueda" no espera al debounce: el botón ya dijo qué quiere.
  function clearSearch() {
    handleSearchChange('')
    setDebouncedSearch('')
  }

  function toggleOne(supplier: Supplier) {
    setSelected((current) => {
      if (!current) return current
      // Copia obligatoria: mutar el Map del estado no dispara re-render,
      // porque React compara por referencia y seria el mismo objeto.
      const next = new Map(current)
      if (next.has(supplier.id)) next.delete(supplier.id)
      else next.set(supplier.id, supplier)
      return next
    })
  }

  // Opera sobre la pagina que se ve: "todos" son los que el usuario tiene
  // delante, no los de las paginas que no abrio.
  // El length > 0 evita que una lista vacia cuente como toda seleccionada.
  const allVisibleSelected =
    selected !== null && rows.length > 0 && rows.every((s) => selected.has(s.id))

  // Sale de `selected` y no de `rows`: la seleccion sobrevive a la busqueda
  // y al cambio de pagina, asi que puede incluir proveedores que no se ven.
  const selectedSuppliers = [...(selected?.values() ?? [])]

  // Tildados que no estan a la vista: en otra pagina o fuera de la busqueda.
  // Si hay, se avisa en la barra: sin eso el usuario borraria cosas que no
  // tiene delante.
  const hiddenSelectedCount = selectedSuppliers.filter(
    (s) => !rows.some((r) => r.id === s.id),
  ).length

  function toggleAllVisible() {
    setSelected((current) => {
      if (!current) return current
      const next = new Map(current)
      if (allVisibleSelected) rows.forEach((s) => next.delete(s.id))
      else rows.forEach((s) => next.set(s.id, s))
      return next
    })
  }

  function handleDelete() {
    // El spread convierte las claves del Map en el number[] que espera la mutacion.
    const ids = [...(selected?.keys() ?? [])]

    deleteSuppliers(ids, {
      onSuccess: ({ deleted, failed }) => {
        setConfirmOpen(false)

        // Si se borró todo lo que había en esta página, el backend la
        // devolvería vacía: se retrocede una para no quedar mirando nada.
        const pageEmptied = rows.length > 0 && rows.every((s) => deleted.includes(s.id))
        if (pageEmptied && page > 1) setPage(page - 1)

        if (failed.length === 0) {
          // Salio todo: cerramos el modo eliminacion.
          setSelected(null)
          // 'info' y no 'success': salió bien, pero el verde de éxito
          // para un borrado se lee como si hubiéramos ganado algo.
          showToast(
            'info',
            deleted.length === 1
              ? 'Proveedor eliminado.'
              : `${deleted.length} proveedores eliminados.`,
          )
          return
        }

        // Seguimos en modo eliminacion con los fallidos tildados: se ve
        // cuales quedaron y se reintenta sin volver a buscarlos.
        setSelected(new Map(selectedSuppliers.filter((s) => failed.includes(s.id)).map((s) => [s.id, s])))

        if (deleted.length === 0) {
          showToast(
            'error',
            'No se pudo eliminar el proveedor.',
          )
        } else {
          showToast(
            'error',
            `${deleted.length} eliminados. ${failed.length} no se pudieron eliminar.`,
          )
        }
      },
      onError: (mutationError) => {
        setConfirmOpen(false)
        showToast(
          'error',
          isApiError(mutationError)
            ? mutationError.message
            : 'Ocurrió un error inesperado.',
        )
      },
    })
  }

  // Las columnas se arman adentro del componente porque la de seleccion
  // depende del estado; antes eran una constante de modulo.
  const selectionColumn: Column<Supplier> = {
    // Sin titulo: el "seleccionar todos" vive en la barra, donde el texto
    // no obliga a ensanchar esta columna en todas las filas.
    header: '',
    align: 'center',
    // En ficha (ventana angosta) el CSS lo manda a la esquina de la tarjeta.
    cellClassName: 'table__cell--check',
    // Mismo estado y mismo onChange de antes: CheckBox sólo cambia el
    // aspecto, el <input> nativo sigue adentro.
    render: (s) => (
      <CheckBox
        checked={selected?.has(s.id) ?? false}
        onChange={() => toggleOne(s)}
        label={`Seleccionar ${s.legalName}`}
      />
    ),
  }

  const columns: Column<Supplier>[] = [
    // El spread de un array vacio no agrega nada: asi se mete una columna
    // condicionalmente sin romper el array literal.
    ...(isSelecting ? [selectionColumn] : []),
    {
      header: 'Razón social',
      render: (s) => (
        <span className="table__cell--nombre">
          <Avatar
            name={s.legalName}
            icon={supplierIcon(s.supplierType)}
            tone={supplierTone(s.supplierType)}
          />
          <b>{s.legalName}</b>
        </span>
      ),
    },
    // El CUIT en monoespaciada: son columnas de dígitos, y así los
    // guiones quedan alineados de una fila a la otra.
    { header: 'CUIT', render: (s) => <ValueOrDash value={s.cuit} className="table__cell--mono" /> },
    {
      header: 'Tipo',
      // La etiqueta del tipo, con su color.
      render: (s) => (
        <span className="table__cell--tipos">
          <Badge variant={TYPE_TONES[s.supplierType]} icon={TYPE_ICONS[s.supplierType]}>
            {SUPPLIER_TYPE_LABELS[s.supplierType]}
          </Badge>
        </span>
      ),
    },
    {
      header: 'Contacto',
      render: (s) => <ValueOrDash value={s.contactName} className="table__cell--contacto" />,
    },
    // El teléfono va en texto común: la monoespaciada es sólo para el
    // CUIT, que es un identificador y se lee en columna.
    {
      header: 'Teléfono',
      render: (s) => <ValueOrDash value={s.contactPhone} className="table__cell--tel" />,
    },
    // En modo eliminación no hay "Ver": navegar desmonta la pantalla y la
    // selección se perdería sin ningún aviso.
    ...(isSelecting
      ? []
      : [
          {
            header: '',
            align: 'center' as const,
            // --fin lo pega contra el borde derecho de la fila. Va como
            // cellClassName y no adentro del render porque justify-self
            // sólo lo obedece el hijo directo del grid.
            cellClassName: 'table__cell--fin',
            render: (s: Supplier) => (
              <Link className="link-btn" to={`/catalogos/proveedores/${s.id}`}>
                Ver
              </Link>
            ),
          },
        ]),
  ]

  /*
    Anchos de las columnas de la fila-tarjeta. Cambia según el modo
    porque las columnas no son las mismas: en selección entra el
    casillero adelante y sale el botón "Ver" del final.

    Las columnas de dato fijo van en px (el CUIT y el teléfono tienen
    largo conocido y no se parten, la etiqueta de rubro tampoco y el
    botón "Ver" es del ancho de su texto) y las dos de texto libre en
    fr, con minmax(0,…) para que cedan en vez de desbordar. Los px son
    algo más anchos que los del prototipo: con aquellos el teléfono
    quedaba justo y el contacto se partía en dos líneas.

    Abajo de 1080px de ventana esto deja de usarse: el CSS pasa la fila a ficha
    apilada de una sola columna, que es donde seis columnas ya no
    entran de ninguna forma.
  */
  const gridTemplate = isSelecting
    ? '44px minmax(0,2fr) 124px 120px minmax(0,1.3fr) 150px'
    : 'minmax(0,2fr) 124px 120px minmax(0,1.3fr) 150px 72px'

  // Qué va en el cuerpo de la tabla cuando no hay filas, según por qué
  // no las hay. Mientras carga queda `undefined` y la tabla muestra el
  // texto de `emptyMessage`.
  let emptyState
  if (error) {
    emptyState = (
      <EmptyState
        kind="error"
        title="No se pudieron cargar los proveedores."
        action={<Button onClick={() => refetch()}>Reintentar</Button>}
      >
        {isApiError(error) ? error.message : 'Revisá la conexión e intentá de nuevo.'}
      </EmptyState>
    )
  } else if (!isPending && debouncedSearch) {
    emptyState = (
      <EmptyState
        kind="no-results"
        title="No hay proveedores que coincidan con la búsqueda."
        action={
          <Button variant="secondary" onClick={clearSearch}>
            Limpiar búsqueda
          </Button>
        }
      >
        Revisá cómo está escrito o buscá por CUIT.
      </EmptyState>
    )
  } else if (!isPending) {
    emptyState = (
      <EmptyState
        title="Todavía no hay proveedores registrados."
        action={
          <Link to="/catalogos/proveedores/nuevo" className="btn btn--primary">
            + Nuevo proveedor
          </Link>
        }
      >
        Cuando cargues el primero va a aparecer acá.
      </EmptyState>
    )
  }

  return (
    <>
      <PageHero eyebrow="Catálogo de" accent="proveedores" title="Proveedores" photo={fotoTaller}>
        {isPending ? (
          'Cargando…'
        ) : (
          <>
            {/* Con una búsqueda activa el total es el de los que coinciden,
                no el del catálogo entero: el texto lo dice. */}
            <strong>{total}</strong>{' '}
            {debouncedSearch
              ? total === 1
                ? 'proveedor coincide con la búsqueda'
                : 'proveedores coinciden con la búsqueda'
              : total === 1
                ? 'proveedor registrado'
                : 'proveedores registrados'}
          </>
        )}
      </PageHero>

      {/* Barra de herramientas: tarjeta blanca montada sobre la cabecera,
          con el buscador y las acciones del listado. */}
      <div className="toolbar">
        <SearchField
          value={search}
          onChange={handleSearchChange}
          placeholder="Buscar por razón social, CUIT o contacto"
          label="Buscar proveedores"
        />

        {/* En modo eliminación las acciones las toma la barra de abajo:
            acá sólo queda un cartel del modo y el alta deshabilitada. */}
        {isSelecting ? (
          <>
            <span className="toolbar__status">Eliminando proveedores</span>
            <button type="button" className="btn btn--primary" disabled>
              + Nuevo proveedor
            </button>
          </>
        ) : (
          <>
            <TrashButton
              label="Eliminar proveedores"
              onClick={() => setSelected(new Map())}
              disabled={total === 0}
            >
              Eliminar proveedores
            </TrashButton>
            <Link to="/catalogos/proveedores/nuevo" className="btn btn--primary">
              + Nuevo proveedor
            </Link>
          </>
        )}
      </div>

      {isSelecting && (
        <div className="bulk-bar" role="region" aria-live="polite">
          <div className="bulk-bar__left">
            {/* <label> envolviendo el input: el texto tambien alterna la casilla. */}
            <label className="bulk-bar__select-all">
              <CheckBox
                checked={allVisibleSelected}
                onChange={toggleAllVisible}
                disabled={rows.length === 0}
              />
              <span className="bulk-bar__select-all-text">
                Seleccionar todos
                {/* Sólo si hay más de una página: con una sola, "todos"
                    ya es todos y la aclaración confunde. */}
                {totalPages > 1 && <span className="bulk-bar__hint">sólo esta página</span>}
              </span>
            </label>

            <span className="bulk-bar__count">
              {selectedCount === 1
                ? '1 proveedor seleccionado'
                : `${selectedCount} proveedores seleccionados`}
            </span>

            {/* Avisa que hay tildados que no están a la vista (otra página
                o fuera de la búsqueda). Va con --warn en vez de --hint: es
                una advertencia, y el rediseño la muestra como pastilla roja. */}
            {hiddenSelectedCount > 0 && (
              <span className="bulk-bar__warn">
                {hiddenSelectedCount === 1
                  ? '1 no está a la vista'
                  : `${hiddenSelectedCount} no están a la vista`}
              </span>
            )}
          </div>
          <div className="bulk-bar__actions">
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancelar
            </Button>
            {/* Deshabilitado sin selección: el contador de al lado explica por qué. */}
            <Button
              variant="danger"
              onClick={() => setConfirmOpen(true)}
              disabled={selectedCount === 0}
            >
              <IconTrash />
              Confirmar
            </Button>
          </div>
        </div>
      )}

      <Table
        /* Rediseño: filas-tarjeta en vez de <table>. Los datos, el
           filtro y el rowKey son los mismos; lo único nuevo son las
           props de presentación. */
        variant="cards"
        gridTemplate={gridTemplate}
        /* Tocar cualquier parte de la fila tilda, no sólo el casillero
           (era el pedido del diseño: en celular es la diferencia entre
           acertarle y no). Sólo en modo eliminación: fuera de él la
           fila no tiene por qué reaccionar al click.
           Es el mismo toggleOne de siempre, así que la lógica de
           selección no cambia. */
        onRowClick={isSelecting ? (s) => toggleOne(s) : undefined}
        rowClassName={(s) =>
          cn(
            `table__row--${supplierTone(s.supplierType)}`,
            // Resalta la fila tildada. Es el mismo `selected` que ya
            // usaba el casillero: no hay estado nuevo.
            selected?.has(s.id) && 'table__row--selected',
          )
        }
        columns={columns}
        data={rows}
        rowKey={(s) => s.id}
        emptyMessage="Cargando proveedores…"
        emptyState={emptyState}
        footer={
          <Pagination
            page={page}
            pageSize={DEFAULT_PAGE_SIZE}
            total={total}
            onPageChange={setPage}
            // Mientras llega la página pedida se sigue viendo la anterior.
            disabled={isPlaceholderData}
          />
        }
      />

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Eliminar proveedores"
        tone="danger"
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
              <IconTrash />
              {isDeleting ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </>
        }
      >
        <p>
          {selectedCount === 1
            ? 'Vas a eliminar este proveedor:'
            : `Vas a eliminar estos ${selectedCount} proveedores:`}
        </p>

        {/* Listados y no contados: la seleccion puede incluir proveedores
            fuera de la busqueda, y un "vas a eliminar 2" dejaba borrar a ciegas. */}
        <ul className="confirm-list">
          {selectedSuppliers.map((s) => (
            <li key={s.id} className="confirm-list__item">
              <Avatar name={s.legalName} icon={supplierIcon(s.supplierType)} />
              <span className="confirm-list__text">
                <b>{s.legalName}</b>
                <span>{s.cuit ?? 'Sin CUIT'}</span>
              </span>
            </li>
          ))}
        </ul>

        <p className="confirm-warning">Esta acción no se puede deshacer.</p>
      </Modal>
    </>
  )
}
