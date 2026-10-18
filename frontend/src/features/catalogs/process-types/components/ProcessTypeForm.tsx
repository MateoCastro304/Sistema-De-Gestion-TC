import { useForm, useWatch,  type UseFormGetValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input } from '@/shared/components/ui'
import type { ExchangeRate } from '../types/process-type'
import { processTypeFormSchema, type ProcessTypeFormValues } from '../schemas/process-type.schema'
import { formatArs, formatMoney, parseMoney, roundMoney } from '../utils/money'
import { formatDateTime } from '../utils/dates'

type PriceField = 'hourlyRateArs' | 'hourlyRateUsd' | 'exchangeRate'

/** Para que la página marque en un campo un error que vino de la API (el 409 del nombre). */
export type SetFieldError = (field: keyof ProcessTypeFormValues, message: string) => void

const RATE_UNAVAILABLE = 'No se pudo obtener la cotización del dólar. Ingresá el tipo de cambio a mano.'

const EDIT_NOTICE = 'Si cambió el dólar, actualizá el tipo de cambio: el precio en pesos se mantiene y se recalcula el valor en dólares. Las cotizaciones ya cargadas conservan el precio hora con el que se cotizaron.'

function linkedPrice(
  changed: PriceField,
  getValues: UseFormGetValues<ProcessTypeFormValues>,
): { field: PriceField; value: string } | null {
  const rate = parseMoney(getValues('exchangeRate'))
  if (!rate.ok) return null

  if (changed === 'hourlyRateUsd') {
    const usd = parseMoney(getValues('hourlyRateUsd'))
    return usd.ok ? { field: 'hourlyRateArs', value: formatMoney(roundMoney(usd.value * rate.value)) } : null
  }
  const ars = parseMoney(getValues('hourlyRateArs'))
  return ars.ok ? { field: 'hourlyRateUsd', value: formatMoney(roundMoney(ars.value / rate.value)) } : null
}


interface ProcessTypeFormProps {
  defaultValues: ProcessTypeFormValues
  /** La cotización del backend; `undefined` si no se pudo obtener (502). */
  currentRate?: ExchangeRate
  /** Modificar muestra el aviso sobre el dólar y las cotizaciones ya cargadas. */
  editing?: boolean
  onSubmit: (values: ProcessTypeFormValues, setFieldError: SetFieldError) => void
  onCancel: () => void
  submitting?: boolean
  submitLabel: string
}

export function ProcessTypeForm({
  defaultValues,
  currentRate,
  editing = false,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel,
}: ProcessTypeFormProps) {
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    setError,
    control,
    formState: { errors, isSubmitted },
  } = useForm<ProcessTypeFormValues>({
    resolver: zodResolver(processTypeFormSchema),
    defaultValues,
  })

  /** Al tocar un precio o el tipo de cambio, recalcula el otro precio. */
  const recalculate = (changed: PriceField) => {
    const linked = linkedPrice(changed, getValues)
    // Revalida sólo si el usuario ya intentó enviar: antes no hay errores que limpiar.
    if (linked) setValue(linked.field, linked.value, { shouldDirty: true, shouldValidate: isSubmitted })
  }

  const restoreRate = () => {
    if (!currentRate) return
    setValue('exchangeRate', formatMoney(currentRate.rate), { shouldDirty: true, shouldValidate: isSubmitted })
    recalculate('exchangeRate')
  }

  const typedRate = parseMoney(useWatch({ control, name: 'exchangeRate' }))  
  const rateModified = currentRate !== undefined && typedRate.ok && typedRate.value !== currentRate.rate
  const rateHint = !currentRate
    ? RATE_UNAVAILABLE
    : rateModified
      ? `Valor modificado. Cotización actual: ${formatArs(currentRate.rate)} (actualizada al ${formatDateTime(currentRate.updatedAt)}).`
      : `Cotización actualizada al ${formatDateTime(currentRate.updatedAt)}.`

  const setFieldError: SetFieldError = (field, message) => setError(field, { type: 'server', message }, { shouldFocus: true })
  const submit = handleSubmit((values) => onSubmit(values, setFieldError))

  return (
    <form className="card" onSubmit={submit} noValidate>
      {editing && <p className="card__subtitle">{EDIT_NOTICE}</p>}

      <div className="card__grid card__grid--2">
        <Input
          full
          label="Nombre"
          placeholder="Ej: Mecanizado Torno CNC"
          autoComplete="off"
          error={errors.name?.message}
          {...register('name')}
        />

        <div className="form-field form-field--full">
          <label className="form-field__label" htmlFor="process-type-description">
            Descripción (opcional)
          </label>
          <textarea
            id="process-type-description"
            className="form-field__textarea"
            rows={3}
            placeholder="Qué incluye este proceso."
            aria-invalid={errors.description ? true : undefined}
            {...register('description')}
          />
          {errors.description && <span className="form-field__error">{errors.description.message}</span>}
        </div>

        <Input
          label="Precio hora en pesos"
          placeholder="0,00"
          inputMode="decimal"
          autoComplete="off"
          error={errors.hourlyRateArs?.message}
          {...register('hourlyRateArs', { onChange: () => recalculate('hourlyRateArs') })}
        />

        <Input
          label="Precio hora en dólares"
          placeholder="0,00"
          inputMode="decimal"
          autoComplete="off"
          hint="Se calcula con el tipo de cambio. Si lo editás, se recalcula el precio en pesos."
          error={errors.hourlyRateUsd?.message}
          {...register('hourlyRateUsd', { onChange: () => recalculate('hourlyRateUsd') })}
        />

        <div className="form-field--full">
          <Input
            label="Tipo de cambio (USD → ARS)"
            placeholder="0,00"
            inputMode="decimal"
            autoComplete="off"
            hint={rateHint}
            error={errors.exchangeRate?.message}
            {...register('exchangeRate', { onChange: () => recalculate('exchangeRate') })}
          />
          {currentRate && (
            <button type="button" className="table__add-link" onClick={restoreRate}>
              ↺ Restablecer cotización actual
            </button>
          )}
        </div>
      </div>

      <div className="form-actions">
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Guardando…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}