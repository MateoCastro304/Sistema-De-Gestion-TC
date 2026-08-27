import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input, Modal } from '@/shared/components/ui'
import { useToast } from '@/app/providers/ToastContext'
import { isApiError } from '@/shared/api/ApiError'
import type { Industry } from '../types/industry'
import {
  emptyIndustryForm,
  industryFormSchema,
  toIndustryInput,
} from '../schemas/industry.schema'
import type { IndustryFormValues } from '../schemas/industry.schema'
import { useCreateIndustry } from '../api/customers.queries'

interface IndustryFormModalProps {
  open: boolean
  onClose: () => void
  /** Called with the freshly created rubro, so the caller can pre-select it. */
  onCreated: (industry: Industry) => void
}

const FORM_ID = 'industry-form'

/** Inline "nuevo rubro" (CU-41), opened from the factory form. */
export function IndustryFormModal({
  open,
  onClose,
  onCreated,
}: IndustryFormModalProps) {
  const showToast = useToast()
  const create = useCreateIndustry()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IndustryFormValues>({
    resolver: zodResolver(industryFormSchema),
    defaultValues: emptyIndustryForm,
  })

  // Clear the field every time the modal opens.
  useEffect(() => {
    if (open) reset(emptyIndustryForm)
  }, [open, reset])

  const submit = handleSubmit((values) => {
    create.mutate(toIndustryInput(values), {
      onSuccess: (industry) => {
        showToast('success', `Rubro "${industry.name}" creado.`)
        onCreated(industry)
        onClose()
      },
      onError: (error) => {
        showToast(
          'error',
          isApiError(error) ? error.message : 'No se pudo crear el rubro.',
        )
      },
    })
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo rubro"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} disabled={create.isPending}>
            {create.isPending ? 'Creando…' : 'Crear rubro'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={submit} noValidate>
        <Input
          label="Nombre del rubro"
          placeholder="Ej: Metalúrgica"
          error={errors.name?.message}
          {...register('name')}
        />
      </form>
    </Modal>
  )
}
