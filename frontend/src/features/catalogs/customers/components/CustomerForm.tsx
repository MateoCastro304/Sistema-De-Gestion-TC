import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input } from '@/shared/components/ui'
import { cn } from '@/shared/lib/cn'
import type { CustomerInput } from '../types/customer'
import {
  customerFormSchema,
  emptyCustomerForm,
  toCustomerInput,
} from '../schemas/customer.schema'
import type { CustomerFormValues } from '../schemas/customer.schema'
import { useFactories } from '../api/customers.queries'

interface CustomerFormProps {
  /** Pre-filled values when editing; omit to create a new customer. */
  defaultValues?: CustomerFormValues
  onSubmit: (input: CustomerInput) => void
  onCancel?: () => void
  submitting?: boolean
  submitLabel?: string
  /**
   * When set, the contact belongs to this factory and the factory selector is
   * hidden. Used when adding an encargado from inside a factory
   * ("desde la fábrica se agregan los encargados").
   */
  lockedFactoryId?: string
}

/**
 * Form for creating and editing a customer (EncargadoCliente). The factory is
 * chosen from a selector (read-only catalog here); creating/editing factories
 * happens in the Factories catalog, not from this form.
 */
export function CustomerForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = 'Guardar',
  lockedFactoryId,
}: CustomerFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: defaultValues ??
      (lockedFactoryId
        ? { ...emptyCustomerForm, factoryId: lockedFactoryId }
        : emptyCustomerForm),
  })

  const { data: factories = [], isLoading: loadingFactories } = useFactories()

  const submit = handleSubmit((values) => onSubmit(toCustomerInput(values)))

  return (
    <form className="form-card" onSubmit={submit} noValidate>
      <div className="form-grid">
        <div className="form-field">
          <Input
            label="Nombre"
            placeholder="Ej: Laura"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
        </div>

        <div className="form-field">
          <Input
            label="Apellido"
            placeholder="Ej: Gómez"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        <div className="form-field">
          <Input
            label="Teléfono"
            placeholder="+54 351 555-0000"
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>

        <div className="form-field">
          <Input
            label="Email"
            placeholder="contacto@empresa.com"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        {/* Factory selector, unless the factory is fixed by the context. */}
        {!lockedFactoryId && (
          <div className="form-field--full">
            <label className="form-field__label" htmlFor="factoryId">
              Fábrica
            </label>
            <Controller
              control={control}
              name="factoryId"
              render={({ field }) => (
                <select
                  id="factoryId"
                  className={cn(
                    'form-field__select',
                    errors.factoryId && 'form-field__select--error',
                  )}
                  disabled={loadingFactories}
                  {...field}
                >
                  <option value="">
                    {loadingFactories
                      ? 'Cargando fábricas…'
                      : 'Seleccioná una fábrica'}
                  </option>
                  {factories.map((factory) => (
                    <option key={factory.id} value={factory.id}>
                      {factory.name}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.factoryId && (
              <span className="form-field__hint form-field__hint--error">
                {errors.factoryId.message}
              </span>
            )}
          </div>
        )}
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
  )
}
