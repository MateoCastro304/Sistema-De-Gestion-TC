import { z } from 'zod'
import type { LoginRequest } from '../types/session'

/**
 * Validación del ingreso (CU-53, escenario 9). Un campo vacío se marca acá y
 * no llega a la API: no cuenta como intento fallido. Los textos son los del
 * contrato (§3.1, `400 VALIDATION_ERROR`).
 */
export const loginFormSchema = z.object({
  username: z.string().trim().min(1, 'Ingresá tu nombre de usuario'),
  // La contraseña se compara tal cual: no se recorta.
  password: z.string().min(1, 'Ingresá tu contraseña'),
})

export type LoginFormValues = z.infer<typeof loginFormSchema>

export const emptyLoginForm: LoginFormValues = { username: '', password: '' }

/** Del formulario validado al cuerpo de `POST /auth/login`. */
export function toLoginRequest(values: LoginFormValues): LoginRequest {
  return { username: values.username.trim(), password: values.password }
}
