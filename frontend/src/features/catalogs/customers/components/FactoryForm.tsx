import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input } from '@/shared/components/ui'
import { cn } from '@/shared/lib/cn'
import type { FactoryInput } from '../types/factory'
import {
  emptyFactoryForm,
  factoryFormSchema,
  toFactoryInput,
} from '../schemas/factory.schema'
import type { FactoryFormValues } from '../schemas/factory.schema'
import { useIndustries } from '../api/customers.queries'
import { IndustryFormModal } from './IndustryFormModal'

interface FactoryFormProps {
  /** Pre-filled values when editing; omit to create a new factory. */
  defaultValues?: FactoryFormValues
  onSubmit: (input: FactoryInput) => void
  onCancel?: () => void
  submitting?: boolean
  submitLabel?: string
}

/**
 * Form for creating and editing a factory (FabricaCliente, CU-58/59). The rubro
 * selector can spawn a "nuevo rubro" modal inline ("desde las fábricas los
 * rubros").
 */
export function FactoryForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = 'Guardar',
}: FactoryFormProps) {
  const { data: industries = [], isLoading: loadingIndustries } = useIndustries()
  const [industryModalOpen, setIndustryModalOpen] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FactoryFormValues>({
    resolver: zodResolver(factoryFormSchema),
    defaultValues: defaultValues ?? emptyFactoryForm,
  })

  const submit = handleSubmit((values) => onSubmit(toFactoryInput(values)))

  return (
    <>
      <form className="form-card" onSubmit={submit} noValidate>
        <div className="form-grid">
          <div className="form-field--full">
            <Input
              label="Nombre"
              placeholder="Ej: EDASA"
              error={errors.name?.message}
              {...register('name')}
            />
          </div>

          <div className="form-field">
            <Input
              label="Código de fábrica"
              placeholder="Ej: EDA"
              maxLength={4}
              style={{ textTransform: 'uppercase' }}
              error={errors.code?.message}
              {...register('code')}
            />
          </div>

          <div className="form-field">
            <Input
              label="CUIT (opcional)"
              placeholder="30-71234567-8"
              error={errors.cuit?.message}
              {...register('cuit')}
            />
          </div>

          <div className="form-field">
            <label className="form-field__label" htmlFor="factory-industry">
              Rubro
            </label>
            <Controller
              control={control}
              name="industryId"
              render={({ field }) => (
                <select
                  id="factory-industry"
                  className={cn(
                    'form-field__select',
                    errors.industryId && 'form-field__select--error',
                  )}
                  disabled={loadingIndustries}
                  {...field}
                >
                  <option value="">
                    {loadingIndustries ? 'Cargando rubros…' : 'Seleccioná un rubro'}
                  </option>
                  {industries.map((industry) => (
                    <option key={industry.id} value={industry.id}>
                      {industry.name}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.industryId && (
              <span className="form-field__hint form-field__hint--error">
                {errors.industryId.message}
              </span>
            )}
            <button
              type="button"
              className="table__add-link"
              onClick={() => setIndustryModalOpen(true)}
            >
              + Nuevo rubro
            </button>
          </div>

          <div className="form-field--full">
            <Input
              label="Dirección"
              placeholder="Calle, número, ciudad"
              error={errors.address?.message}
              {...register('address')}
            />
          </div>

          <div className="form-field--full">
            <label
              className="form-field__label"
              id="factory-payment-label"
              htmlFor="factory-payment"
            >
              Formas de pago
            </label>
            <textarea
              id="factory-payment"
              className="form-field__textarea"
              rows={3}
              aria-labelledby="factory-payment-label"
              aria-invalid={errors.paymentDescription ? true : undefined}
              placeholder="Formas de pago habituales, plazos, señas, etc."
              {...register('paymentDescription')}
            />
            {errors.paymentDescription && (
              <span className="form-field__hint form-field__hint--error">
                {errors.paymentDescription.message}
              </span>
            )}
          </div>
        </div>

        <div className="form-actions">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={submitting}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Guardando…' : submitLabel}
          </Button>
        </div>
      </form>

      <IndustryFormModal
        open={industryModalOpen}
        onClose={() => setIndustryModalOpen(false)}
        onCreated={(industry) =>
          setValue('industryId', industry.id, { shouldValidate: true })
        }
      />
    </>
  )
}
