import { z } from 'zod'
import { ROLE_ORDER, type Rol } from '@/domain/roles'
import type { UserCreate } from '../types/user'

/** Límites del contrato (§3.3, `POST /users`). */
export const USERNAME_MAX_LENGTH = 30
export const PASSWORD_MIN_LENGTH = 8
/** El tope de bcrypt (D-42). */
export const PASSWORD_MAX_LENGTH = 72

/**
 * Formulario de alta de usuario (CU-05). Los mensajes son los del contrato y
 * del prototipo.
 *
 * Lo que sólo la API sabe NO se valida acá: que el nombre de usuario esté
 * libre (409 USERNAME_TAKEN), que el empleado no tenga usuario (409
 * EMPLOYEE_ALREADY_HAS_USER) o esté dado de baja (422 EMPLOYEE_INACTIVE).
 */
export const userFormSchema = z
  .object({
    /** `null` mientras no se eligió nadie en el buscador. */
    employeeId: z.number().int().positive().nullable().refine((id) => id !== null, 'Elegí el empleado'),
    username: z
      .string()
      .trim()
      .min(1, 'Ingresá el nombre de usuario')
      .max(USERNAME_MAX_LENGTH, `El nombre de usuario admite hasta ${USERNAME_MAX_LENGTH} caracteres`),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`)
      .max(PASSWORD_MAX_LENGTH, `La contraseña admite hasta ${PASSWORD_MAX_LENGTH} caracteres`),
    /** "Repetir contraseña": sólo del formulario, no viaja a la API (D-24). */
    passwordConfirmation: z.string(),
    roles: z
      .array(z.custom<Rol>((value) => ROLE_ORDER.includes(value as Rol)))
      .min(1, 'Asigná al menos un rol'),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    message: 'Las contraseñas no coinciden',
    path: ['passwordConfirmation'],
    // Por defecto Zod no corre esta regla si otro campo ya falló. El
    // prototipo muestra todos los errores juntos (contraseña corta, que no
    // coinciden y sin roles), así que se corre siempre que haya los dos textos.
    when: ({ value }) => {
      const { password, passwordConfirmation } = value as Partial<Record<string, unknown>>
      return typeof password === 'string' && typeof passwordConfirmation === 'string'
    },
  })

export type UserFormValues = z.input<typeof userFormSchema>

/** Formulario vacío del alta. */
export function emptyUserForm(): UserFormValues {
  return { employeeId: null, username: '', password: '', passwordConfirmation: '', roles: [] }
}

/** Cuerpo del alta. Los roles viajan en el orden del contrato. */
export function toUserCreate(values: UserFormValues): UserCreate {
  // El schema ya lo validó: si llega null es un bug, se corta acá.
  if (values.employeeId === null) throw new Error('Empleado sin validar')
  return {
    employeeId: values.employeeId,
    username: values.username.trim(),
    password: values.password,
    roles: ROLE_ORDER.filter((role) => values.roles.includes(role)),
  }
}
