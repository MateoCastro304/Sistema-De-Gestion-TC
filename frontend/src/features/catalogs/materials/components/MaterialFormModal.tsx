import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@/app/providers/ToastContext'
import { isApiError } from '@/shared/api/ApiError'
import { Button, Input, Modal } from '@/shared/components/ui'
import { useCreateMaterial, useMaterialNames } from '../api/materials.queries'
import {
  emptyMaterialForm,
  materialFormSchema,
  toMaterialCreate,
  type MaterialFormValues,
} from '../schemas/material.schema'

/** El botón del pie envía el formulario por su id: están en lugares distintos del Modal. */
const FORM_ID = 'material-form'
/** Las sugerencias del campo "Material". */
const NAMES_LIST_ID = 'material-names'
/** Los campos del formulario que la API puede nombrar en `details`. */
const FORM_FIELDS = new Set<string>(['name', 'quality'])

interface MaterialFormModalProps {
  open: boolean
  onClose: () => void
}

/**
 * Ventana "Nuevo material" del listado (CU-37). "Material" sugiere los
 * nombres que ya existen y deja escribir uno nuevo, como el prototipo.
 */
export function MaterialFormModal({ open, onClose }: MaterialFormModalProps) {
  const showToast = useToast()
  const create = useCreateMaterial()
  // La misma caché que el filtro del listado: las sugerencias ya están.
  const names = useMaterialNames()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: emptyMaterialForm(),
  })

  // Cada vez que se abre, arranca vacío (sin lo de la vez anterior ni sus errores).
  useEffect(() => {
    if (open) reset(emptyMaterialForm())
  }, [open, reset])

  const submit = handleSubmit((values) => {
    create.mutate(toMaterialCreate(values), {
      onSuccess: () => {
        showToast('success', 'Material registrado correctamente')
        onClose()
      },
      onError: (error) => {
        if (!isApiError(error)) {
          showToast('error', 'No se pudo registrar el material.')
          return
        }
        // 400 VALIDATION_ERROR y 409 MATERIAL_ALREADY_EXISTS dicen en `details`
        // qué campo marcar: el duplicado va sobre "Calidad".
        const fieldErrors = error.details.filter((detail) => FORM_FIELDS.has(detail.field))
        if (fieldErrors.length > 0) {
          fieldErrors.forEach((detail) =>
            setError(detail.field as keyof MaterialFormValues, { type: 'server', message: detail.message }, { shouldFocus: true }),
          )
          return
        }
        // Los mensajes del Sprint 2 ya vienen en castellano para el usuario.
        showToast('error', error.message)
      },
    })
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo material"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} disabled={create.isPending}>
            {create.isPending ? 'Guardando…' : 'Registrar material'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={submit} noValidate>
        <Input
          full
          id="material-name"
          label="Material"
          placeholder="Ej: Acero"
          autoComplete="off"
          autoFocus
          list={NAMES_LIST_ID}
          hint="Elegí uno de la lista o escribí uno nuevo."
          error={errors.name?.message}
          {...register('name')}
        />
        <datalist id={NAMES_LIST_ID}>
          {(names.data ?? []).map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>

        <Input
          full
          id="material-quality"
          label="Calidad"
          placeholder="Ej: 1045"
          autoComplete="off"
          error={errors.quality?.message}
          {...register('quality')}
        />
      </form>
    </Modal>
  )
}