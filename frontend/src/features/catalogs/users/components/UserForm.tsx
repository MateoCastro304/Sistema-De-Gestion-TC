import { useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input } from '@/shared/components/ui'
import { findSimilarUsernames } from '../api/users.api'
import { emptyUserForm, userFormSchema, type UserFormValues } from '../schemas/user.schema'
import type { EmployeeOption } from '../types/employee-option'
import { generatePassword } from '../utils/password'
import { proposeUsername, usernameBase } from '../utils/username'
import { EmployeePicker } from './EmployeePicker'
import { PasswordField } from './PasswordField'
import { RolesSelect } from './RolesSelect'

/** Los campos en el orden de la pantalla: al enviar con errores se enfoca el primero. */
const FIELD_ORDER: (keyof UserFormValues)[] = ['employeeId', 'username', 'password', 'passwordConfirmation', 'roles']

/** Para que la página marque en un campo lo que respondió la API (400 / 409 / 422). */
export type SetFieldError = (field: keyof UserFormValues, message: string) => void

interface UserFormProps {
  onSubmit: (values: UserFormValues, setFieldError: SetFieldError) => void
  onCancel: () => void
  submitting?: boolean
}

/** Formulario de alta de usuario (CU-05), con las secciones del prototipo. */
export function UserForm({ onSubmit, onCancel, submitting = false }: UserFormProps) {
  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    setError,
    setFocus,
    formState: { errors, isSubmitted },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: emptyUserForm(),
    // react-hook-form enfoca en el orden en que se registraron los campos, y
    // los de <Controller> (Empleado, Permisos) se registran después que los
    // demás. Se enfoca a mano el primero de la pantalla (ver `submit`).
    shouldFocusError: false,
  })

  /** El empleado elegido entero: el formulario sólo guarda su id. */
  const [employee, setEmployee] = useState<EmployeeOption | null>(null)
  /** Las dos contraseñas en claro (ojo o "Generar"), como en el prototipo. */
  const [passwordVisible, setPasswordVisible] = useState(false)
  /** El último nombre propuesto: si el usuario no lo cambió, se puede reemplazar. */
  const lastProposal = useRef('')
  /** Si se eligen dos empleados seguidos, sólo vale la propuesta del último. */
  const proposalRequest = useRef(0)

  /**
   * Propone el nombre de usuario del empleado elegido (D-23): inicial +
   * apellido, con un número si ya existe. No pisa lo que el usuario escribió
   * a mano, igual que el prototipo.
   */
  async function proposeFor(chosen: EmployeeOption) {
    const request = ++proposalRequest.current
    const base = usernameBase(chosen.firstName, chosen.lastName)
    // Si no se pueden consultar los existentes se propone la base igual: si
    // choca, la API responde 409 USERNAME_TAKEN en el campo.
    const taken = await findSimilarUsernames(base).catch(() => [])
    if (request !== proposalRequest.current) return

    const current = getValues('username').trim()
    if (current !== '' && current !== lastProposal.current) return
    const proposal = proposeUsername(base, taken)
    lastProposal.current = proposal
    setValue('username', proposal, { shouldDirty: true, shouldValidate: isSubmitted })
  }

  function generate() {
    const password = generatePassword()
    setValue('password', password, { shouldDirty: true, shouldValidate: isSubmitted })
    setValue('passwordConfirmation', password, { shouldDirty: true, shouldValidate: isSubmitted })
    setPasswordVisible(true)
  }

  const setFieldError: SetFieldError = (field, message) => setError(field, { type: 'server', message }, { shouldFocus: true })
  const submit = handleSubmit(
    (values) => onSubmit(values, setFieldError),
    (invalid) => {
      const first = FIELD_ORDER.find((field) => invalid[field])
      if (first) setFocus(first)
    },
  )

  return (
    <form className="card card--form" onSubmit={submit} noValidate>
      <section className="form-section">
        <h2 className="card__title">Empleado y acceso</h2>
        <div className="card__grid card__grid--2">
          <Controller
            control={control}
            name="employeeId"
            render={({ field }) => (
              <EmployeePicker
                id="user-employee"
                ref={field.ref}
                selected={employee}
                onSelect={(chosen) => {
                  setEmployee(chosen)
                  field.onChange(chosen?.id ?? null)
                  if (chosen) void proposeFor(chosen)
                }}
                onBlur={field.onBlur}
                error={errors.employeeId?.message}
              />
            )}
          />

          <Input
            full
            id="user-username"
            label="Nombre de usuario"
            placeholder="Ej: mcastro"
            autoComplete="off"
            hint="Se propone a partir del empleado. Lo podés cambiar."
            error={errors.username?.message}
            {...register('username')}
          />

          <PasswordField
            id="user-password"
            label="Contraseña"
            placeholder="Mínimo 8 caracteres"
            visible={passwordVisible}
            onToggleVisible={() => setPasswordVisible((visible) => !visible)}
            onGenerate={generate}
            error={errors.password?.message}
            {...register('password')}
          />

          <PasswordField
            id="user-password-confirmation"
            label="Repetir contraseña"
            placeholder="Escribila de nuevo"
            visible={passwordVisible}
            onToggleVisible={() => setPasswordVisible((visible) => !visible)}
            error={errors.passwordConfirmation?.message}
            {...register('passwordConfirmation')}
          />
        </div>
      </section>

      <section className="form-section">
        <h2 className="card__title">Permisos</h2>
        <div className="form-field form-field--full">
          <label className="form-field__label" htmlFor="user-roles">
            Permisos
          </label>
          <Controller
            control={control}
            name="roles"
            render={({ field }) => (
              <RolesSelect
                id="user-roles"
                ref={field.ref}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                invalid={Boolean(errors.roles)}
              />
            )}
          />
          {errors.roles ? (
            <span className="form-field__error">{errors.roles.message}</span>
          ) : (
            <span className="form-field__hint">Podés asignar más de un rol.</span>
          )}
        </div>
      </section>

      <div className="form-actions">
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Guardando…' : 'Registrar usuario'}
        </Button>
      </div>
    </form>
  )
}
