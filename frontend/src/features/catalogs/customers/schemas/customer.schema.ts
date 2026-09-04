/** ESTE ARCHIVO DEFINE QUE DATOS SON VALIDOS ANTES DE MANDARLOS AL SERVIDOR Y TRADUCTOR ENTRE LO QUE VE EL USUARIO Y LO QUE ENTIENDE LA API */
import { z } from 'zod' /** zod permite describir reglas */
import type { Customer, CustomerInput } from '../types/customer'

/**
 * Validation for the customer (EncargadoCliente) form. Fields match CU-01:
 * nombre, apellido, teléfono, mail y observaciones, plus the factory the
 * contact belongs to.
 *
 * Regla de negocio: mail y teléfono son condicionales. Debe cargarse al menos
 * uno de los dos, porque el informe de cotización (CU-21) se envía por mail o
 * WhatsApp. El mail, si se carga, debe tener formato válido.
 */
export const customerFormSchema = z
  .object({
    firstName: z.string().trim().min(1, 'El nombre es obligatorio'),
    lastName: z.string().trim().min(1, 'El apellido es obligatorio'),
    phone: z.string().trim(),
    hasWhatsapp: z.boolean(),
    // Vacío es válido acá; la obligatoriedad "al menos uno" la cubre el refine.
    mail: z.union([z.literal(''), z.email('Ingresá un email válido')]),
    observation: z.string().trim(),
    factoryId: z.string().min(1, 'Elegí una fábrica'),
  })
  .refine((values) => values.mail !== '' || values.phone !== '', {
    message: 'Registrá al menos un medio de contacto (mail o WhatsApp)',
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
  hasWhatsapp: false,
  mail: '',
  observation: '',
  factoryId: '',
}

/** Maps validated form values to the payload the API expects. */
export function toCustomerInput(values: CustomerFormValues): CustomerInput {
  const phone = values.phone.trim()
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    phone,
    // Sin teléfono no hay número que admita WhatsApp.
    hasWhatsapp: phone !== '' && values.hasWhatsapp,
    mail: values.mail.trim(),
    observation: values.observation.trim(),
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
    hasWhatsapp: customer.hasWhatsapp,
    mail: customer.mail,
    observation: customer.observation,
    factoryId: customer.factoryId,
  }
}
/** convierte un cliente que ya existe (viene del servidor) en valores para llenar el formulario. Es para la pantalla de edición.

Recibe un Customer completo (con id e isActive).
Devuelve solo los campos que el formulario maneja (CustomerFormValues). */
