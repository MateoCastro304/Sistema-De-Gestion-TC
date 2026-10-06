import { useState } from 'react'
import { Button, Modal } from '@/shared/components/ui'
import { useToast } from '@/app/providers/ToastContext'
import { isApiError } from '@/shared/api/ApiError'
import type { Category } from '../types/category'
import { useCategories, useDeleteCategory } from '../api/categories.queries'
import { CategoriesTable } from '../components/CategoriesTable'
import { CategoryFormModal } from '../components/CategoryFormModal'

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
        showToast('success', `Rubro "${toDelete.name}" eliminado.`)
        setToDelete(null)
      },
      onError: (error) => {
        showToast(
          'error',
          isApiError(error) ? error.message : 'No se pudo eliminar el rubro.',
        )
        setToDelete(null)
      },
    })
  }

  const term = search.trim().toLocaleLowerCase()
  const visible = (categoriesQuery.data ?? [])
    .filter((c) => c.name.toLocaleLowerCase().includes(term))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))

  return (
    <>
      <div className="content__heading">
        <div>
          <h1 className="content__title">Rubros</h1>
          <p className="content__subtitle">
            Alta, baja, modificación y consulta de los rubros de las fábricas.
          </p>
        </div>
        <Button onClick={openCreate}>+ Nuevo rubro</Button>
      </div>

      <div className="filters">
        <label className="filters__search">
          <svg
            className="filters__search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            className="filters__search-input"
            type="search"
            placeholder="Buscar rubro…"
            aria-label="Buscar rubro"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>

      {categoriesQuery.isLoading && <p>Cargando rubros…</p>}

      {categoriesQuery.isError && (
        <p className="form-field__hint--error">
          {isApiError(categoriesQuery.error)
            ? categoriesQuery.error.message
            : 'No se pudieron cargar los rubros.'}
        </p>
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
            <Button onClick={confirmDelete} disabled={remove.isPending}>
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
