import { useMutation } from '@tanstack/react-query'
import { login } from './auth.api'

/**
 * Iniciar sesión (CU-53). Es una mutación: no se cachea ni se reintenta
 * (un reintento sumaría otro intento fallido). Por eso no hay `auth.keys.ts`.
 */
export function useLogin() {
  return useMutation({ mutationFn: login })
}
