import { useState } from 'react'
import { Button, IconTrash, Modal, PageHero, SearchField } from '@/shared/components/ui'
import fotoTaller from '@/assets/foto-disco.png'
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
        showToast('info', `Rubro "${toDelete.name}" eliminado.`)
        setToDelete(null)
      },
      onError: (error) => {
        showToast(
          'error',
          categoryErrorMessage(error, 'No se pudo eliminar el rubro.'),
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

  return (
    <>
      <PageHero eyebrow="Catálogo de" accent="rubros" title="Rubros" photo={fotoTaller} />

      <div className="toolbar">
        <SearchField value={search} onChange={setSearch} placeholder="Buscar rubro" />
        <button type="button" className="btn btn--primary" onClick={openCreate}>
          + Nuevo rubro
        </button>
      </div>

      {categoriesQuery.isLoading && (
        <div className="empty-state">
          <p className="empty-state__text">Cargando rubros…</p>
        </div>
      )}

      {categoriesQuery.isError && (
        <div className="callout callout--warning">
          <span>
            {isApiError(categoriesQuery.error)
              ? categoriesQuery.error.message
              : 'No se pudieron cargar los rubros.'}
          </span>
        </div>
      )}

      {categoriesQuery.isSuccess && (
        <CategoriesTable
          categories={visible}
          onEdit={openEdit}
          onDelete={setToDelete}
          emptyMessage={
            term
              ? `No hay rubros que coincidan con "${search.trim()}".`
              : 'No hay rubros registrados.'
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
        title="Eliminar rubro"
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
            {/* danger: confirmar un borrado va en rojo, como en el resto. */}
            <Button variant="danger" onClick={confirmDelete} disabled={remove.isPending}>
              <IconTrash />
              {remove.isPending ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </>
        }
      >
        <p>
          ¿Seguro que querés eliminar el rubro{' '}
          <strong>{toDelete?.name}</strong>? No se puede eliminar si alguna
          fábrica lo tiene asignado.
        </p>
      </Modal>
    </>
  )
}
