import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input, Select } from '@/shared/components/ui'
import type { FactoryInput } from '../types/factory'
import {
  emptyFactoryForm,
  factoryFormSchema,
  toFactoryInput,
} from '../schemas/factory.schema'
import type { FactoryFormValues } from '../schemas/factory.schema'
import { useCategories } from '../api/customers.queries'

interface FactoryFormProps {
  /** Pre-filled values when editing; omit to create a new factory. */
  defaultValues?: FactoryFormValues
  onSubmit: (input: FactoryInput) => void
  onCancel?: () => void
  submitting?: boolean
  submitLabel?: string
  /**
   * id del <form>. Sirve para que un botón de afuera lo envíe con
   * `<Button type="submit" form={formId}>` (el detalle pone Guardar en el
   * panel de arriba, donde estaba Editar, igual que Proveedores).
   */
  formId?: string
  /** Esconde Cancelar/Guardar del pie: el que llama los pone en otro lado. */
  hideActions?: boolean
  /** El CUIT no se puede modificar: al editar se muestra de solo lectura. */
  lockCuit?: boolean
  /** Título de la tarjeta (en el detalle: "Datos de la fábrica"). */
  title?: string
}

/**
 * Form for creating and editing a factory (FabricaCliente, CU-58/59). The rubro
 * selector solo consume el catálogo de rubros (ABMC de otra persona): lista los
 * existentes; el alta/edición de rubros no vive acá.
 */
export function FactoryForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = 'Guardar',
  formId,
  hideActions = false,
  lockCuit = false,
  title,
}: FactoryFormProps) {
  const { data: categories = [], isLoading: loadingCategories } = useCategories()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FactoryFormValues>({
    resolver: zodResolver(factoryFormSchema),
    defaultValues: defaultValues ?? emptyFactoryForm,
  })

  const submit = handleSubmit((values) => onSubmit(toFactoryInput(values)))

  return (
    <>
      <form id={formId} className="card" onSubmit={submit} noValidate>
        {title && <h2 className="card__title">{title}</h2>}
        <div className="card__grid card__grid--3">
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
              label="CUIT"
              // El ejemplo tiene que ser un CUIT válido: el anterior
              // (30-71234567-8) tenía mal el dígito verificador y, copiado
              // tal cual, el formulario lo rechazaba.
              placeholder="30-71234567-1"
              hint={lockCuit ? 'El CUIT no se puede modificar' : '11 dígitos, con o sin guiones'}
              error={errors.cuit?.message}
              // readOnly y no disabled: un campo deshabilitado puede salir
              // como undefined del formulario.
              readOnly={lockCuit}
              {...register('cuit')}
            />
          </div>

          <div className="form-field">
            <label className="form-field__label" htmlFor="factory-category">
              Rubro
            </label>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                // Select propio: onChange recibe el valor, y Controller lo
                // acepta así. field.ref deja que react-hook-form enfoque el
                // campo cuando la validación falla.
                <Select
                  id="factory-category"
                  name={field.name}
                  ref={field.ref}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={!!errors.categoryId}
                  disabled={loadingCategories}
                  placeholder={loadingCategories ? 'Cargando rubros…' : 'Seleccioná un rubro'}
                  options={categories.map((category) => ({ value: category.id, label: category.name }))}
                />
              )}
            />
            {errors.categoryId && (
              <span className="form-field__error">
                {errors.categoryId.message}
              </span>
            )}
            {!loadingCategories && categories.length === 0 && (
              <span className="form-field__hint">
                No hay rubros disponibles. Se cargan desde la sección Rubros.
              </span>
            )}
          </div>

          <div className="form-field--full">
            <Input
              label="Dirección (opcional)"
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
              Formas de pago (opcional)
            </label>
            <textarea
              id="factory-payment"
              className="form-field__textarea"
              rows={3}
              aria-labelledby="factory-payment-label"
              aria-invalid={errors.payMethod ? true : undefined}
              placeholder="Formas de pago habituales, plazos, señas, etc."
              {...register('payMethod')}
            />
            {errors.payMethod && (
              <span className="form-field__error">
                {errors.payMethod.message}
              </span>
            )}
          </div>
        </div>

        {!hideActions && (
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
        )}
      </form>
    </>
  )
}
