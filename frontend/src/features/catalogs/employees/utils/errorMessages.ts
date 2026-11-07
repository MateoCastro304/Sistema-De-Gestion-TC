import { isApiError, type FieldError } from '@/shared/api/ApiError'
import type { EmployeeFormValues } from '../schemas/employee.schema'

const FORM_FIELDS: readonly string[] = ['firstName', 'lastName', 'dni', 'position', 'address', 'email', 'phone']

/**
 * Errores de campo que informa la API (`details` del 400 y del 409
 * `EMPLOYEE_DNI_TAKEN`), para marcarlos en el formulario.
 */
export function employeeFieldErrors(error: unknown): (FieldError & { field: keyof EmployeeFormValues })[] {
  if (!isApiError(error)) return []
  return error.details.filter(
    (detail): detail is FieldError & { field: keyof EmployeeFormValues } => FORM_FIELDS.includes(detail.field),
  )
}

/**
 * Mensaje de aviso (toast) cuando el error no es de un campo. Red, servidor
 * y permisos ya traen su texto en español; el resto cae en `fallback`.
 */
export function employeeErrorMessage(error: unknown, fallback: string): string {
  if (isApiError(error) && (error.isNetworkError || error.isServer || error.isAuth)) return error.message
  return fallback
}
