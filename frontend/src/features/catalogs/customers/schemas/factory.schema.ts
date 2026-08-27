import { z } from 'zod'
import type { Factory, FactoryInput } from '../types/factory'

/** Digits-only CUIT length (Argentina: 2 + 8 + 1). */
const CUIT_DIGITS = 11

/** Strips everything but digits, so "30-71234567-8" -> "30712345678". */
function cuitDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Validation for the factory form (FabricaCliente, CU-58/59). CUIT is checked
 * for the expected 11-digit length; dashes/spaces are allowed and normalised
 * away by {@link toFactoryInput}.
 */
export const factoryFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre de la fábrica es obligatorio'),
  cuit: z
    .string()
    .trim()
    .min(1, 'El CUIT es obligatorio')
    .refine(
      (value) => cuitDigits(value).length === CUIT_DIGITS,
      'El CUIT debe tener 11 dígitos',
    ),
  address: z.string().trim().min(1, 'La dirección es obligatoria'),
  industryId: z.string().min(1, 'Elegí un rubro'),
  paymentDescription: z
    .string()
    .trim()
    .min(1, 'Ingresá las formas de pago'),
})

export type FactoryFormValues = z.infer<typeof factoryFormSchema>

export const emptyFactoryForm: FactoryFormValues = {
  name: '',
  cuit: '',
  address: '',
  industryId: '',
  paymentDescription: '',
}

/** Maps validated form values to the API payload (CUIT normalised to digits). */
export function toFactoryInput(values: FactoryFormValues): FactoryInput {
  return {
    name: values.name.trim(),
    cuit: cuitDigits(values.cuit),
    address: values.address.trim(),
    industryId: values.industryId,
    paymentDescription: values.paymentDescription.trim(),
  }
}

/** Maps an existing factory to form values, for the edit modal. */
export function toFactoryFormValues(factory: Factory): FactoryFormValues {
  return {
    name: factory.name,
    cuit: factory.cuit,
    address: factory.address,
    industryId: factory.industryId,
    paymentDescription: factory.paymentDescription,
  }
}

/** Formats a stored 11-digit CUIT as "XX-XXXXXXXX-X" for display. */
export function formatCuit(cuit: string): string {
  const digits = cuitDigits(cuit)
  if (digits.length !== CUIT_DIGITS) return cuit
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`
}
