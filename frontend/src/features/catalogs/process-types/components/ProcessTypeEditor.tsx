import { useState } from 'react'
import { useToast } from '@/app/providers/ToastContext'
import { isApiError } from '@/shared/api/ApiError'
import { Button, Modal } from '@/shared/components/ui'
import type { ProcessType, ProcessTypeUpdate } from '../types/process-type'
import { useExchangeRate, useUpdateProcessType } from '../api/process-types.queries'
import {
  buildProcessTypePatch,
  toProcessTypeFormValues,
  type ProcessTypeFormValues,
} from '../schemas/process-type.schema'
import { formatArs, formatUsd } from '../utils/money'
import { ProcessTypeForm, type SetFieldError } from './ProcessTypeForm'

/** Los campos que se muestran en "Confirmar cambios" (el tipo de cambio no). */
type ChangedField = 'name' | 'description' | 'hourlyRateArs' | 'hourlyRateUsd'

const CHANGED_FIELDS: ChangedField[] = ['name', 'description', 'hourlyRateArs', 'hourlyRateUsd']

const LABELS: Record<ChangedField, string> = {
  name: 'Nombre',
  description: 'Descripción',
  hourlyRateArs: 'Precio hora en pesos',
  hourlyRateUsd: 'Precio hora en dólares',
}

/** Un valor para el modal: los precios con su moneda; un texto vacío, "(vacío)". */
function formatValue(field: ChangedField, value: string | number | null): string {
  if (typeof value === 'number') return field === 'hourlyRateArs' ? formatArs(value) : formatUsd(value)
  return value || '(vacío)'
}

/** Lo que se va a guardar, mientras el modal espera la confirmación. */
interface PendingChanges {
  patch: ProcessTypeUpdate
  setFieldError: SetFieldError
}

interface ProcessTypeEditorProps {
  processType: ProcessType
  /** Vuelve al detalle: al cancelar o después de guardar. */
  onDone: () => void
}

/**
 * Modificar tipo de proceso (CU-10): el formulario con los valores actuales y
 * la cotización de hoy, y el modal "Confirmar cambios" con "anterior → nuevo".
 * Vive aparte del detalle para que la cotización se pida sólo al editar.
 */
export function ProcessTypeEditor({ processType, onDone }: ProcessTypeEditorProps) {
  const showToast = useToast()
  const exchangeRate = useExchangeRate()
  const update = useUpdateProcessType(processType.id)
  const [pending, setPending] = useState<PendingChanges | null>(null)

  const handleSubmit = (values: ProcessTypeFormValues, setFieldError: SetFieldError) => {
    const patch = buildProcessTypePatch(processType, values)
    // Sin cambios: se avisa sin llamar a la API (esc. 6).
    if (Object.keys(patch).length === 0) {
      showToast('info', 'No hay cambios para guardar')
      return
    }
    setPending({ patch, setFieldError })
  }

  const confirm = () => {
    if (!pending) return
    update.mutate(pending.patch, {
      onSuccess: () => {
        showToast('success', 'Tipo de proceso modificado correctamente')
        onDone()
      },
      onError: (error) => {
        setPending(null)
        // El nombre ya es de otro tipo de proceso (esc. 5): va en el campo.
        if (isApiError(error) && error.isConflict) {
          pending.setFieldError('name', error.message)
          return
        }
        showToast('error', isApiError(error) ? error.message : 'No se pudo modificar el tipo de proceso.')
      },
    })
  }

  if (exchangeRate.isPending) {
    return <p className="card">Cargando la cotización del dólar…</p>
  }

  const changes = pending ? CHANGED_FIELDS.filter((field) => pending.patch[field] !== undefined) : []

  return (
    <>
      <ProcessTypeForm
        editing
        defaultValues={toProcessTypeFormValues(processType, exchangeRate.data?.rate)}
        currentRate={exchangeRate.data}
        onSubmit={handleSubmit}
        onCancel={onDone}
        submitting={update.isPending}
        submitLabel="Guardar cambios"
      />

      <Modal
        open={pending !== null}
        onClose={() => {
          if (!update.isPending) setPending(null)
        }}
        title="Confirmar cambios"
        footer={
          <>
            <Button variant="outline" onClick={() => setPending(null)} disabled={update.isPending}>
              Cancelar
            </Button>
            <Button onClick={confirm} disabled={update.isPending}>
              {update.isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </>
        }
      >
        <p>
          Revisá los cambios de <strong>{processType.name}</strong> antes de guardarlos.
        </p>
        {changes.map((field) => (
          <p key={field}>
            <strong>{LABELS[field]}:</strong> {formatValue(field, processType[field])} →{' '}
            {formatValue(field, pending?.patch[field] ?? null)}
          </p>
        ))}
      </Modal>
    </>
  )
}