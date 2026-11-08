import { z } from 'zod'
import { EMPLOYEE_POSITIONS, type EmployeeCreate, type EmployeePosition } from '../types/employee'

/**
 * Validación del formulario de empleado (CU-45). Repite las reglas del
 * contrato (§3.2) para avisar antes de llamar a la API, con sus mismos
 * mensajes. El DNI repetido sólo lo sabe el backend (409).
 */
export const employeeFormSchema = z.object({
  firstName: z.string().trim().min(1, 'Ingresá el nombre').max(100, 'El nombre admite hasta 100 caracteres'),
  lastName: z.string().trim().min(1, 'Ingresá el apellido').max(100, 'El apellido admite hasta 100 caracteres'),
  dni: z
    .string()
    .trim()
    .min(1, 'Ingresá el DNI')
    .regex(/^\d{7,8}$/, 'El DNI tiene que tener 7 u 8 números'),
  // '' es "todavía no elegí": el desplegable arranca vacío.
  position: z
    .string()
    .refine((value) => EMPLOYEE_POSITIONS.includes(value as EmployeePosition), 'Elegí el puesto'),
  address: z.string().trim().max(200, 'La dirección admite hasta 200 caracteres'),
  email: z
    .string()
    .trim()
    .max(120, 'El email admite hasta 120 caracteres')
    .refine((value) => value === '' || z.email().safeParse(value).success, 'Revisá el formato del email'),
  phone: z.string().trim().max(50, 'El teléfono admite hasta 50 caracteres'),
})

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>

export const emptyEmployeeForm: EmployeeFormValues = {
  firstName: '',
  lastName: '',
  dni: '',
  position: '',
  address: '',
  email: '',
  phone: '',
}

/** Valores validados → cuerpo de `POST /employees`. Un opcional vacío viaja como `null`. */
export function toEmployeeCreate(values: EmployeeFormValues): EmployeeCreate {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    dni: values.dni.trim(),
    position: values.position as EmployeePosition,
    address: values.address.trim() || null,
    email: values.email.trim() || null,
    phone: values.phone.trim() || null,
  }
}
