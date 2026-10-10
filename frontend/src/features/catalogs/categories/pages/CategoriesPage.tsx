import { useState } from 'react'
import { Button, IconTrash, Modal, PageHero, Pagination, SearchField } from '@/shared/components/ui'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { usePagedList } from '@/shared/hooks/usePagedList'
import fotoTaller from '@/assets/foto-disco.webp'
import { normalizeText } from '@/shared/lib/normalizeText'
import { useToast } from '@/app/providers/ToastContext'
import { isApiError } from '@/shared/api/ApiError'
import type { Category } from '../types/category'
import { useCategories, useDeleteCategory } from '../api/categories.queries'
import { CategoriesTable } from '../components/CategoriesTable'
import { CategoryFormModal } from '../components/CategoryFormModal'
import { categoryErrorMessage } from '../utils/errorMessages'

/**
 * Rubros catalog: CU-43 Consultar Rubro, plus CU-41 Registrar and CU-42
 * Modificar through a modal, and CU-44 Baja de Rubro with confirmation.
 *
 * La baja es lógica y definitiva para el usuario: el rubro queda en la base
 * sólo como registro, pero no se vuelve a listar, editar ni reactivar.
 */
export function CategoriesPage() {
  const showToast = useToast()
  const categoriesQuery = useCategories()
  const remove = useDeleteCategory()

  const [search, setSearch] = useState('')
  // Form modal state: closed, create (`null` rubro) or edit (the rubro).
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  // Rubro pending delete confirmation; null when the modal is closed.
  const [toDelete, setToDelete] = useState<Category | null>(null)

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (category: Category) => {
    setEditing(category)
    setFormOpen(true)
  }

  const confirmDelete = () => {
    if (!toDelete) return
    remove.mutate(toDelete.id, {
      onSuccess: () => {
        // 'info' y no 'success', igual que en los otros catálogos.
        showToast('info', `Rubro "${toDelete.name}" dado de baja.`)
        setToDelete(null)
      },
      onError: (error) => {
        showToast(
          'error',
          categoryErrorMessage(error, 'No se pudo dar de baja el rubro.'),
        )
        setToDelete(null)
      },
    })
  }

  // Sin acentos ni mayúsculas: "metalurgica" encuentra "Metalúrgica".
  const term = normalizeText(search.trim())
  const visible = (categoriesQuery.data ?? [])
    .filter((c) => normalizeText(c.name).includes(term))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))

  // La lista llega entera y se filtra acá, así que también se pagina acá.
  const { pageItems, page, setPage, pageSize, total } = usePagedList(visible)

  // Buscar vuelve a la primera página.
  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  return (
    <>
      <PageHero eyebrow="Catálogo de" accent="rubros" title="Rubros" photo={fotoTaller} />

      <div className="toolbar">
        <SearchField value={search} onChange={handleSearchChange} placeholder="Buscar rubro" />
        <button type="button" className="btn btn--primary" onClick={openCreate}>
          + Nuevo rubro
        </button>
      </div>

      {categoriesQuery.isLoading && (
        <div className="empty-state">
          <p className="empty-state__text">Cargando rubros…</p>
        </div>
      )}

      {/* El error va dentro de la tarjeta del listado, con el encabezado
          de columnas a la vista. */}
      {categoriesQuery.isError && (
        <CategoriesTable
          categories={[]}
          onEdit={openEdit}
          onDelete={setToDelete}
          emptyState={
            <EmptyState
              kind="error"
              title="No se pudieron cargar los rubros."
              action={<Button onClick={() => categoriesQuery.refetch()}>Reintentar</Button>}
            >
              {isApiError(categoriesQuery.error)
                ? categoriesQuery.error.message
                : 'Revisá la conexión e intentá de nuevo.'}
            </EmptyState>
          }
        />
      )}

      {categoriesQuery.isSuccess && (
        <CategoriesTable
          categories={pageItems}
          onEdit={openEdit}
          onDelete={setToDelete}
          emptyState={
            term ? (
              <EmptyState
                kind="no-results"
                title="No hay rubros que coincidan con la búsqueda."
                action={
                  <Button variant="secondary" onClick={() => handleSearchChange('')}>
                    Limpiar búsqueda
                  </Button>
                }
              >
                Revisá cómo está escrito.
              </EmptyState>
            ) : (
              <EmptyState
                title="Todavía no hay rubros registrados."
                action={<Button onClick={openCreate}>+ Nuevo rubro</Button>}
              >
                Cuando cargues el primero va a aparecer acá.
              </EmptyState>
            )
          }
          footer={
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
          }
        />
      )}

      <CategoryFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        category={editing}
      />

      <Modal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title="Dar de baja rubro"
        tone="danger"
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setToDelete(null)}
              disabled={remove.isPending}
            >
              Cancelar
            </Button>
            {/* danger: confirmar una baja va en rojo, como en el resto. */}
            <Button variant="danger" onClick={confirmDelete} disabled={remove.isPending}>
              <IconTrash />
              {remove.isPending ? 'Dando de baja…' : 'Dar de baja'}
            </Button>
          </>
        }
      >
        <p>
          ¿Dar de baja el rubro <strong>{toDelete?.name}</strong>? Deja de
          aparecer en el sistema y no se puede modificar ni reactivar. No se
          puede dar de baja si alguna fábrica activa lo tiene asignado.
        </p>
      </Modal>
    </>
  )
}
