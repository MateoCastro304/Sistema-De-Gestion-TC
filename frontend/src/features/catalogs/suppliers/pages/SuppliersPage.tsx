import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  Avatar,
  Badge,
  Button,
  CheckBox,
  IconTrash,
  Modal,
  Table,
  TrashButton,
} from '@/shared/components/ui'
import type { Column } from '@/shared/components/ui'
import { cn } from '@/shared/lib/cn'
import { normalizeText } from '@/shared/lib/normalizeText'
import { isApiError } from '@/shared/api/ApiError'
import { useToast } from '@/app/providers/ToastContext'
import { useSuppliers } from '../api/useSuppliers'
import { useDeleteSuppliers } from '../api/useDeleteSuppliers'
import { SUPPLIER_TYPE_LABELS } from '../types/supplier'
import type { Supplier } from '../types/supplier'
import { TYPE_TONES, supplierTone } from '../utils/supplierTone'

// Chequea trim() y no solo `??`: un campo que el usuario vacio llega como ''
// (no undefined), y con `??` la celda quedaba en blanco en vez del guion.
function orDash(value?: string) {
  return value?.trim() ? value : <span className="table__cell--vacio">—</span>
}


export function SuppliersPage() {
  const { data, isPending, error } = useSuppliers()
  const [search, setSearch] = useState('')

  // null = mirando la lista. Un Set, aunque este vacio = modo eliminacion.
  // En un solo estado para que no exista "modo activo sin seleccion".
  const [selected, setSelected] = useState<Set<number> | null>(null)
  const isSelecting = selected !== null
  const selectedCount = selected?.size ?? 0

  const [confirmOpen, setConfirmOpen] = useState(false)
  const { mutate: deleteSuppliers, isPending: isDeleting } = useDeleteSuppliers()
  const showToast = useToast()

  const filtered = useMemo(() => {
    const list = data ?? []
    const term = normalizeText(search.trim())
    if (!term) return list
    return list.filter((s) =>
      [
        s.legalName,
        s.cuit ?? '',
        s.cuit?.replace(/-/g, '') ?? '', // Para buscar sin los guiones
        // Se busca por el texto que se ve ("Pintura"), no por el valor
        // del contrato ("PAINT").
        ...s.supplierTypes.map((type) => SUPPLIER_TYPE_LABELS[type]),
        s.contactName ?? '',
      ].some((field) => normalizeText(field).includes(term)),
    )
  }, [data, search])

  function toggleOne(id: number) {
    setSelected((current) => {
      if (!current) return current
      // Copia obligatoria: mutar el Set del estado no dispara re-render,
      // porque React compara por referencia y seria el mismo objeto.
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Opera sobre lo filtrado: con una busqueda activa, "todos" son esos.
  // El length > 0 evita que una lista vacia cuente como toda seleccionada.
  const allVisibleSelected =
    selected !== null && filtered.length > 0 && filtered.every((s) => selected.has(s.id))

  // Sale de `data` y no de `filtered`: la seleccion sobrevive a la busqueda,
  // asi que puede incluir proveedores que el filtro actual no muestra.
  const selectedSuppliers = (data ?? []).filter((s) => selected?.has(s.id))

  // Tildados que quedaron fuera de la busqueda. Si hay, se avisa en la barra:
  // sin eso el usuario borraria cosas que no tiene delante.
  const hiddenSelectedCount = selectedSuppliers.filter(
    (s) => !filtered.some((f) => f.id === s.id),
  ).length

  function toggleAllVisible() {
    setSelected((current) => {
      if (!current) return current
      const next = new Set(current)
      if (allVisibleSelected) filtered.forEach((s) => next.delete(s.id))
      else filtered.forEach((s) => next.add(s.id))
      return next
    })
  }

  function handleDelete() {
    // El spread convierte el Set en el number[] que espera la mutacion.
    const ids = [...(selected ?? [])]

    deleteSuppliers(ids, {
      onSuccess: ({ deleted, failed }) => {
        setConfirmOpen(false)

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
        // cuales estan en uso y se reintenta sin volver a buscarlos.
        setSelected(new Set(failed))

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
        onChange={() => toggleOne(s.id)}
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
          <Avatar name={s.legalName} tone={supplierTone(s.supplierTypes)} />
          <b>{s.legalName}</b>
        </span>
      ),
    },
    // El CUIT en monoespaciada: son columnas de dígitos, y así los
    // guiones quedan alineados de una fila a la otra.
    { header: 'CUIT', render: (s) => <span className="table__cell--mono">{orDash(s.cuit)}</span> },
    {
      header: 'Tipo',
      // Una etiqueta por rubro, cada una con su color. Si no entran en
      // una línea bajan enteras (flex-wrap en --tipos).
      render: (s) => (
        <span className="table__cell--tipos">
          {s.supplierTypes.map((type) => (
            <Badge key={type} variant={TYPE_TONES[type]}>
              {SUPPLIER_TYPE_LABELS[type]}
            </Badge>
          ))}
        </span>
      ),
    },
    {
      header: 'Contacto',
      render: (s) => <span className="table__cell--contacto">{orDash(s.contactName)}</span>,
    },
    // El teléfono va en texto común: la monoespaciada es sólo para el
    // CUIT, que es un identificador y se lee en columna.
    {
      header: 'Teléfono',
      render: (s) => <span className="table__cell--tel">{orDash(s.contactPhone)}</span>,
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

    Abajo de 1200px esto deja de usarse: el CSS pasa la fila a ficha
    apilada de una sola columna, que es donde seis columnas ya no
    entran de ninguna forma.
  */
  const gridTemplate = isSelecting
    ? '44px minmax(0,2fr) 124px 120px minmax(0,1.3fr) 150px'
    : 'minmax(0,2fr) 124px 120px minmax(0,1.3fr) 150px 72px'

  // El mensaje del cuerpo vacío cambia según por qué está vacío.
  let emptyMessage = 'Todavía no hay proveedores registrados.'
  if (isPending) emptyMessage = 'Cargando proveedores…'
  else if (search.trim()) emptyMessage = `No encontramos proveedores para "${search.trim()}".`

  return (
    <>
      {/*
        Rediseño: el título, las acciones y el buscador pasan a vivir
        adentro del mismo panel azul (.page-header) en vez de estar en
        tres bloques sueltos. Es sólo envoltura: los mismos textos, los
        mismos botones y el mismo input controlado de antes.
      */}
      <div className="page-header">
        <div className="page-header__row">
          <div className="page-header__heading">
            {/* Chip de sección. El puntito que late lo pone el CSS. */}
            <span className="page-header__eyebrow">Catálogo</span>
            <h1 className="page-header__title">Proveedores</h1>
            <p className="page-header__subtitle">
              {isPending
                ? 'Cargando…'
                : data?.length === 1
                  ? '1 proveedor registrado'
                  : `${data?.length ?? 0} proveedores registrados`}
            </p>
          </div>

          {/* En modo eliminación las acciones las toma la barra de abajo. */}
          {!isSelecting && (
            <div className="content__actions">
              {/* El botón de eliminar con el tacho animado. Adentro del
                  panel oscuro va en vidrio, igual que el secondary de antes. */}
              <TrashButton
                label="Eliminar proveedores"
                onClick={() => setSelected(new Set())}
                disabled={(data?.length ?? 0) === 0}
              >
                Eliminar proveedores
              </TrashButton>
              <Link to="/catalogos/proveedores/nuevo" className="btn btn--primary content__cta">
                <span>+</span> Nuevo proveedor
              </Link>
            </div>
          )}
        </div>

        {/* Adentro del panel el buscador va en vidrio. La pastilla es el
            <label>, no el input: así la lupa queda adentro y el anillo de
            foco rodea a los dos (`:focus-within`). El <label> además hace
            que tocar la lupa enfoque el campo. */}
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
            className="search-input"
            type="search"
            placeholder="Buscar por razón social, CUIT, contacto o tipo"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar proveedores"
          />
        </label>
      </div>

      {isSelecting && (
        <div className="bulk-bar" role="region" aria-live="polite">
          <div className="bulk-bar__left">
            {/* <label> envolviendo el input: el texto tambien alterna la casilla. */}
            <label className="bulk-bar__select-all">
              <CheckBox
                checked={allVisibleSelected}
                onChange={toggleAllVisible}
                disabled={filtered.length === 0}
              />
              Seleccionar todos
            </label>

            {/* El listado no da ninguna pista de que la fila entera es
                tocable, así que se dice. */}
            <span className="bulk-bar__hint">Tocá la fila para seleccionar</span>

            <span className="bulk-bar__count">
              {selectedCount === 1
                ? '1 proveedor seleccionado'
                : `${selectedCount} proveedores seleccionados`}
            </span>

            {/* Avisa que hay tildados que el filtro actual no muestra.
                Va con --warn en vez de --hint: es una advertencia, y el
                rediseño la muestra como pastilla roja. */}
            {hiddenSelectedCount > 0 && (
              <span className="bulk-bar__warn">
                ({hiddenSelectedCount} fuera de la búsqueda)
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

      {error ? (
        <div className="callout callout--warning">
          <span>{isApiError(error) ? error.message : 'Ocurrió un error inesperado.'}</span>
        </div>
      ) : (
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
          onRowClick={isSelecting ? (s) => toggleOne(s.id) : undefined}
          rowClassName={(s) =>
            cn(
              `table__row--${supplierTone(s.supplierTypes)}`,
              // Resalta la fila tildada. Es el mismo `selected` que ya
              // usaba el casillero: no hay estado nuevo.
              selected?.has(s.id) && 'table__row--selected',
            )
          }
          columns={columns}
          data={filtered}
          rowKey={(s) => s.id}
          emptyMessage={emptyMessage}
        />
      )}

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Eliminar proveedores"
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
            <li key={s.id}>{s.legalName}</li>
          ))}
        </ul>

        <p className="confirm-warning">Esta acción no se puede deshacer.</p>
      </Modal>
    </>
  )
}
