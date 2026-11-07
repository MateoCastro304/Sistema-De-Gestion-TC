import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input, Select, type SelectOption } from '@/shared/components/ui'
import { cn } from '@/shared/lib/cn'
import { useToast } from '@/app/providers/ToastContext'
import { useUnsavedChanges } from '@/app/providers/UnsavedChangesContext'
import { EMPLOYEE_POSITIONS, EMPLOYEE_POSITION_LABELS, type Employee } from '../types/employee'
import { emptyEmployeeForm, employeeFormSchema, toEmployeeCreate } from '../schemas/employee.schema'
import type { EmployeeFormValues } from '../schemas/employee.schema'
import { useCreateEmployee } from '../api/employees.queries'
import { employeeErrorMessage, employeeFieldErrors } from '../utils/errorMessages'

const POSITION_OPTIONS: SelectOption[] = EMPLOYEE_POSITIONS.map((position) => ({
  value: position,
  label: EMPLOYEE_POSITION_LABELS[position],
}))

interface EmployeeFormProps {
  /** Se llama con el empleado ya registrado, después del aviso. */
  onCreated: (employee: Employee) => void
  onCancel: () => void
  /** Texto del aviso de éxito. */
  successMessage?: string
  /** Sin tarjeta propia: para el formulario dentro de una ventana. */
  bare?: boolean
}

/**
 * Formulario de alta de empleado (CU-45). Lo usan la pantalla de alta y la
 * ventana "+ Registrar empleado" del formulario de usuario. Valida antes de
 * llamar a la API y marca en su campo lo que la API rechaza (400 y 409).
 */
export function EmployeeForm({
  onCreated,
  onCancel,
  successMessage = 'Empleado registrado correctamente',
  bare = false,
}: EmployeeFormProps) {
  const showToast = useToast()
  const create = useCreateEmployee()

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: emptyEmployeeForm,
  })

  // Con datos sin guardar, cerrar sesión pide confirmar (CU-52).
  useUnsavedChanges(isDirty)

  const submit = handleSubmit((values) => {
    create.mutate(toEmployeeCreate(values), {
      onSuccess: (employee) => {
        showToast('success', successMessage)
        onCreated(employee)
      },
      onError: (error) => {
        const fieldErrors = employeeFieldErrors(error)
        if (fieldErrors.length > 0) {
          fieldErrors.forEach(({ field, message }) => setError(field, { message }))
          return
        }
        showToast('error', employeeErrorMessage(error, 'No se pudo registrar el empleado.'))
      },
    })
  })

  return (
    <form className={cn(!bare && 'card')} onSubmit={submit} noValidate>
      <h2 className="card__title">Datos personales</h2>
      <div className="card__grid card__grid--2">
        <Input label="Nombre *" placeholder="Ej: Matías" error={errors.firstName?.message} {...register('firstName')} />
        <Input label="Apellido *" placeholder="Ej: Castro" error={errors.lastName?.message} {...register('lastName')} />
        <Input
          label="DNI *"
          placeholder="Ej: 38012345"
          inputMode="numeric"
          maxLength={8}
          hint="Solo números, sin puntos."
          error={errors.dni?.message}
          {...register('dni')}
        />
        <div className="form-field">
          <label className="form-field__label" htmlFor="employee-position">
            Puesto *
          </label>
          <Controller
            control={control}
            name="position"
            render={({ field }) => (
              <Select
                id="employee-position"
                name={field.name}
                ref={field.ref}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                invalid={!!errors.position}
                placeholder="Seleccioná un puesto"
                options={POSITION_OPTIONS}
              />
            )}
          />
          {errors.position && <span className="form-field__error">{errors.position.message}</span>}
        </div>
      </div>

      <h2 className="card__title">Contacto</h2>
      <div className="card__grid card__grid--2">
        <Input
          label="Dirección (opcional)"
          placeholder="Calle, número y ciudad"
          full
          error={errors.address?.message}
          {...register('address')}
        />
        <Input
          label="Email (opcional)"
          placeholder="nombre@castrotorneria.com.ar"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Teléfono (opcional)"
          placeholder="+54 351 000-0000"
          error={errors.phone?.message}
          {...register('phone')}
        />
      </div>

      <div className="form-actions">
        <Button variant="outline" onClick={onCancel} disabled={create.isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? 'Registrando…' : 'Registrar empleado'}
        </Button>
      </div>
    </form>
  )
}
