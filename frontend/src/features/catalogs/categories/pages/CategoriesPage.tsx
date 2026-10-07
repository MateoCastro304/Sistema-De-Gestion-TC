import { useState } from 'react'
import { Button, IconTrash, Modal } from '@/shared/components/ui'
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
      {/* El mismo panel azul de Encargados, Fábricas y Proveedores, con el
          buscador adentro. */}
      <div className="page-header">
        <div className="page-header__row">
          <div className="page-header__heading">
            <span className="page-header__eyebrow">Catálogo</span>
            <h1 className="page-header__title">Rubros</h1>
            <p className="page-header__subtitle">
              Alta, baja, modificación y consulta de los rubros de las fábricas.
            </p>
          </div>
          <div className="content__actions">
            <button type="button" className="btn btn--primary content__cta" onClick={openCreate}>
              <span>+</span> Nuevo rubro
            </button>
          </div>
        </div>

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
            placeholder="Buscar rubro"
            aria-label="Buscar rubro"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
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
