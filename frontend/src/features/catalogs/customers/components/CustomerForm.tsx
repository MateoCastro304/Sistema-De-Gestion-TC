import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input } from '@/shared/components/ui'
import { cn } from '@/shared/lib/cn'
import { PERSON_TYPE_OPTIONS } from '../types/customer'
import type { CustomerInput } from '../types/customer'
import {
  customerFormSchema,
  emptyCustomerForm,
  toCustomerInput,
} from '../schemas/customer.schema'
import type { CustomerFormValues } from '../schemas/customer.schema'
import { useIndustries } from '../api/customers.queries'

interface CustomerFormProps {
  /** Pre-filled values when editing; omit to create a new customer. */
  defaultValues?: CustomerFormValues
  onSubmit: (input: CustomerInput) => void
  onCancel?: () => void
  submitting?: boolean
  submitLabel?: string
}

/**
 * Form for creating and editing a customer. Emails and payment methods are
 * dynamic lists (useFieldArray), matching the ERS: a customer can have several
 * of each and they change over time.
 */
export function CustomerForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = 'Guardar',
}: CustomerFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: defaultValues ?? emptyCustomerForm,
  })

  const emails = useFieldArray({ control, name: 'emails' })

  const { data: industries = [], isLoading: loadingIndustries } = useIndustries()

  const submit = handleSubmit((values) => onSubmit(toCustomerInput(values)))

  const emailsError = errors.emails?.root?.message ?? errors.emails?.message

  return (
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
          <label className="form-field__label" htmlFor="personType">
            Tipo de persona
          </label>
          <select
            id="personType"
            className="form-field__select"
            {...register('personType')}
          >
            {PERSON_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label className="form-field__label" htmlFor="industryId">
            Rubro
          </label>
          <select
            id="industryId"
            className={cn(
              'form-field__select',
              errors.industryId && 'form-field__input--error',
            )}
            disabled={loadingIndustries}
            {...register('industryId')}
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
          {errors.industryId && (
            <span className="form-field__hint form-field__hint--error">
              {errors.industryId.message}
            </span>
          )}
        </div>

        <div className="form-field--full">
          <Input
            label="Dirección"
            placeholder="Calle, número, ciudad"
            error={errors.address?.message}
            {...register('address')}
          />
        </div>

        <div className="form-field">
          <Input
            label="Teléfono (opcional)"
            placeholder="+54 351 555-0000"
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>
      </div>

      {/* Emails ------------------------------------------------------------ */}
      <fieldset className="form-fieldset">
        <legend className="form-field__label">Emails</legend>
        {emails.fields.map((field, index) => (
          <div className="form-field__row" key={field.id}>
            <div className="form-field__row-grow">
              <Input
                placeholder="compras@empresa.com"
                error={errors.emails?.[index]?.value?.message}
                {...register(`emails.${index}.value`)}
              />
            </div>
            <button
              type="button"
              className="form-field__icon-btn"
              onClick={() => emails.remove(index)}
              disabled={emails.fields.length === 1}
              aria-label="Quitar email"
            >
              &times;
            </button>
          </div>
        ))}
        {emailsError && (
          <span className="form-field__hint form-field__hint--error">
            {emailsError}
          </span>
        )}
        <button
          type="button"
          className="table__add-link"
          onClick={() => emails.append({ value: '' })}
        >
          + Agregar email
        </button>
      </fieldset>

      {/* Payment description ---------------------------------------------- */}
      <fieldset className="form-fieldset">
        <legend className="form-field__label" id="paymentDescription-label">
          Descripción de pago
        </legend>
        <textarea
          className="form-field__textarea"
          rows={4}
          aria-labelledby="paymentDescription-label"
          aria-invalid={errors.paymentDescription ? true : undefined}
          placeholder="Cliente puntual con los pagos, suele pagar adelantado, casi siempre abona en transferencia, etc."
          {...register('paymentDescription')}
        />
        {errors.paymentDescription && (
          <span className="form-field__hint form-field__hint--error">
            {errors.paymentDescription.message}
          </span>
        )}
      </fieldset>

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
  )
}
