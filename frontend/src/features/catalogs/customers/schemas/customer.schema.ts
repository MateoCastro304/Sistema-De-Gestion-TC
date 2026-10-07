/** ESTE ARCHIVO DEFINE QUE DATOS SON VALIDOS ANTES DE MANDARLOS AL SERVIDOR Y TRADUCTOR ENTRE LO QUE VE EL USUARIO Y LO QUE ENTIENDE LA API */
import { z } from 'zod' /** zod permite describir reglas */
import type { Customer, CustomerInput } from '../types/customer'

/**
 * Validation for the customer (EncargadoCliente) form. Fields match CU-01:
 * nombre, apellido, teléfono y mail, plus the factory the contact belongs to.
 *
 * Regla de negocio: mail y teléfono son condicionales. Debe cargarse al menos
 * uno de los dos, porque el informe de cotización (CU-21) se envía por mail o
 * teléfono. El mail, si se carga, debe tener formato válido. El apellido es
 * opcional (la columna `last_name` admite null).
 */
export const customerFormSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, 'El nombre es obligatorio')
      .max(50, 'El nombre admite hasta 50 caracteres'),
    lastName: z.string().trim().max(50, 'El apellido admite hasta 50 caracteres'),
    // Mismas reglas que el backend (shared/domain/phone.ts): dígitos con los
    // separadores habituales, entre 8 y 15 dígitos. Vacío pasa: el teléfono
    // es opcional si hay mail (ver el refine de abajo).
    phone: z
      .string()
      .trim()
      .max(50, 'El teléfono admite hasta 50 caracteres')
      .refine(
        (value) => value === '' || /^\+?[\d\s().-]+$/.test(value),
        'El teléfono solo admite números, espacios y los signos + ( ) - .',
      )
      .refine((value) => {
        const digits = value.replace(/\D/g, '').length
        return value === '' || (digits >= 8 && digits <= 15)
      }, 'El teléfono debe tener entre 8 y 15 dígitos'),
    // Vacío es válido acá; la obligatoriedad "al menos uno" la cubre el refine.
    mail: z
      .string()
      .trim()
      .max(120, 'El email admite hasta 120 caracteres')
      .refine(
        (value) => value === '' || z.email().safeParse(value).success,
        'Ingresá un email válido',
      ),
    factoryId: z.string().min(1, 'Elegí una fábrica'),
  })
  .refine((values) => values.mail !== '' || values.phone !== '', {
    message: 'Registrá al menos un medio de contacto (mail o teléfono)',
    path: ['phone'],
  })
/** .trim() recorta los espacios de los extremos antes de validar */

export type CustomerFormValues = z.infer<typeof customerFormSchema>
/** z.infer<...> deduce automáticamente el tipo TypeScript a partir del esquema. No tenés que escribir el tipo a mano; Zod lo genera solo. El resultado es equivalente a: */
// type CustomerFormValues = {
//   firstName: string
//   lastName: string
//   phone: string
//   mail: string
//   factoryId: string
// }

/** Empty form, used when creating a new customer. */
export const emptyCustomerForm: CustomerFormValues = {
  firstName: '',
  lastName: '',
  phone: '',
  mail: '',
  factoryId: '',
}

/** Maps validated form values to the payload the API expects. */
export function toCustomerInput(values: CustomerFormValues): CustomerInput {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    phone: values.phone.trim(),
    mail: values.mail.trim(),
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
    mail: customer.mail,
    factoryId: customer.factoryId,
  }
}
/** convierte un cliente que ya existe (viene del servidor) en valores para llenar el formulario. Es para la pantalla de edición.

Recibe un Customer completo (con id e isActive).
Devuelve solo los campos que el formulario maneja (CustomerFormValues). */
