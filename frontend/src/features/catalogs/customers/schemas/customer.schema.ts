import { z } from 'zod'
import type { Customer, CustomerInput } from '../types/customer'

/**
 * Validation for the customer form.
 *
 * `emails` is an array of objects (not plain strings) so react-hook-form's
 * `useFieldArray` can give each row a stable key; it is flattened back to the
 * API shape by `toCustomerInput`. `paymentDescription` is a single free-text
 * field, not a list.
 */
export const customerFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  personType: z.enum(['individual', 'business']),
  address: z.string().trim().min(1, 'La dirección es obligatoria'),
  phone: z.string().trim().optional(),
  industryId: z.string().min(1, 'Elegí un rubro'),
  emails: z
    .array(z.object({ value: z.email('Ingresá un email válido') }))
    .min(1, 'Agregá al menos un email'),
  paymentDescription: z
    .string()
    .trim()
    .min(1, 'Ingresá la descripción de pago'),
})

export type CustomerFormValues = z.infer<typeof customerFormSchema>

/** Empty form, used when creating a new customer. */
export const emptyCustomerForm: CustomerFormValues = {
  name: '',
  personType: 'individual',
  address: '',
  phone: '',
  industryId: '',
  emails: [{ value: '' }],
  paymentDescription: '',
}

/** Maps validated form values to the payload the API expects. */
export function toCustomerInput(values: CustomerFormValues): CustomerInput {
  return {
    name: values.name.trim(),
    personType: values.personType,
    address: values.address.trim(),
    phone: values.phone?.trim() ? values.phone.trim() : undefined,
    industryId: values.industryId,
    emails: values.emails.map((e) => e.value.trim()),
    paymentDescription: values.paymentDescription.trim(),
  }
}

/** Maps an existing customer to form values, for the edit screen. */
export function toCustomerFormValues(customer: Customer): CustomerFormValues {
  return {
    name: customer.name,
    personType: customer.personType,
    address: customer.address,
    phone: customer.phone ?? '',
    industryId: customer.industryId,
    emails: customer.emails.length
      ? customer.emails.map((value) => ({ value }))
      : [{ value: '' }],
    paymentDescription: customer.paymentDescription,
  }
}
