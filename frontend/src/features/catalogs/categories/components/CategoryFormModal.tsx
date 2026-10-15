import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input, Modal } from '@/shared/components/ui'
import { useToast } from '@/app/providers/ToastContext'
import { categoryErrorMessage } from '../utils/errorMessages'
import type { Category } from '../types/category'
import {
  categoryFormSchema,
  emptyCategoryForm,
  toCategoryFormValues,
  toCategoryInput,
} from '../schemas/category.schema'
import type { CategoryFormValues } from '../schemas/category.schema'
import {
  useCreateCategory,
  useUpdateCategory,
} from '../api/categories.queries'

interface CategoryFormModalProps {
  open: boolean
  onClose: () => void
  /** Rubro being edited (CU-42); `null` opens the modal in create mode (CU-41). */
  category: Category | null
  /** Called with the saved rubro, so the caller can react (e.g. pre-select it). */
  onSaved?: (category: Category) => void
}

const FORM_ID = 'category-form'

/**
 * Create / edit modal for a rubro (CU-41 Registrar, CU-42 Modificar). Crear
 * un nombre que pertenece a un rubro dado de baja lo reactiva.
 */
export function CategoryFormModal({
  open,
  onClose,
  category,
  onSaved,
}: CategoryFormModalProps) {
  const showToast = useToast()
  const create = useCreateCategory()
  const update = useUpdateCategory()
  const isEdit = category !== null
  const isPending = create.isPending || update.isPending

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: emptyCategoryForm,
  })

  // Load the rubro (or clear the field) every time the modal opens.
  useEffect(() => {
    if (open) {
      reset(category ? toCategoryFormValues(category) : emptyCategoryForm)
    }
  }, [open, category, reset])

  const done = (saved: Category, message: string) => {
    showToast('success', message)
    onSaved?.(saved)
    onClose()
  }

  const onError = (error: unknown) => {
    showToast(
      'error',
      categoryErrorMessage(
        error,
        isEdit ? 'No se pudo actualizar el rubro.' : 'No se pudo crear el rubro.',
      ),
    )
  }

  const submit = handleSubmit((values) => {
    const input = toCategoryInput(values)
    if (category) {
      update.mutate(
        { id: category.id, input },
        { onSuccess: (saved) => done(saved, `Rubro "${saved.name}" actualizado.`), onError },
      )
    } else {
      create.mutate(input, {
        onSuccess: ({ category: saved, reactivated }) =>
          done(
            saved,
            reactivated
              ? `El rubro "${saved.name}" estaba dado de baja y se reactivó.`
              : `Rubro "${saved.name}" creado.`,
          ),
        onError,
      })
    }
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar rubro' : 'Nuevo rubro'}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} disabled={isPending}>
            {isPending
              ? 'Guardando…'
              : isEdit
                ? 'Guardar cambios'
                : 'Crear rubro'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={submit} noValidate>
        <Input
          id="category-name"
          label="Nombre del rubro"
          placeholder="Ej: Metalúrgica"
          autoFocus
          error={errors.name?.message}
          {...register('name')}
        />
      </form>
    </Modal>
  )
}
