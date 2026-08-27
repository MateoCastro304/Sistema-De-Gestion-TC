/** ESTE ARCHIVO DEFINE QUE DATOS SON VALIDOS ANTES DE MANDARLOS AL SERVIDOR Y TRADUCTOR ENTRE LO QUE VE EL USUARIO Y LO QUE ENTIENDE LA API */
import { z } from 'zod' /** zod permite describir reglas */
import type { Customer, CustomerInput } from '../types/customer'

/**
 * Validation for the customer (EncargadoCliente) form. Fields match CU-01:
 * nombre, apellido, teléfono y mail, plus the factory the contact belongs to.
 */
export const customerFormSchema = z.object({
  firstName: z.string().trim().min(1, 'El nombre es obligatorio'),
  lastName: z.string().trim().min(1, 'El apellido es obligatorio'),
  phone: z.string().trim().min(1, 'El teléfono es obligatorio'),
  email: z.email('Ingresá un email válido'),
  factoryId: z.string().min(1, 'Elegí una fábrica'),
})
/** .trim() recorta los espacios de los extremos antes de validar */

export type CustomerFormValues = z.infer<typeof customerFormSchema>
/** z.infer<...> deduce automáticamente el tipo TypeScript a partir del esquema. No tenés que escribir el tipo a mano; Zod lo genera solo. El resultado es equivalente a: */
// type CustomerFormValues = {
//   firstName: string
//   lastName: string
//   phone: string
//   email: string
//   factoryId: string
// }

/** Empty form, used when creating a new customer. */
export const emptyCustomerForm: CustomerFormValues = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  factoryId: '',
}

/** Maps validated form values to the payload the API expects. */
export function toCustomerInput(values: CustomerFormValues): CustomerInput {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    phone: values.phone.trim(),
    email: values.email.trim(),
    factoryId: values.factoryId,
  }
}
/** Recibe values: CustomerFormValues (lo que llenó el usuario).
Devuelve un CustomerInput (lo que se manda al servidor). */
/** CustomerFormValues y CustomerInput tienen los mismos campos, pero conceptualmente son cosas distintas: uno es "el estado del formulario" y el otro es "el contrato de la API". Separarlos te da libertad: si mañana el form tuviera un campo extra (ej. "confirmar email") que no va al servidor, esta función sería el lugar donde se descarta. */


/** Maps an existing customer to form values, for the edit screen. */
export function toCustomerFormValues(customer: Customer): CustomerFormValues {
  return {
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
    email: customer.email,
    factoryId: customer.factoryId,
  }
}
/** convierte un cliente que ya existe (viene del servidor) en valores para llenar el formulario. Es para la pantalla de edición.

Recibe un Customer completo (con id e isActive).
Devuelve solo los campos que el formulario maneja (CustomerFormValues). */
