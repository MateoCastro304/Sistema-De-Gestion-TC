import { z } from 'zod'
import type { Factory, FactoryInput } from '../types/factory'

/** Digits-only CUIT length (Argentina: 2 + 8 + 1). */
const CUIT_DIGITS = 11

/** Weights applied to the first 10 digits to compute the check digit. */
const CUIT_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2] as const

/** Strips everything but digits, so "30-71234567-8" -> "30712345678". */
function cuitDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Validates the CUIT check digit (módulo 11) over its 11 digits. The first 10
 * digits are weighted and summed; the expected 11th digit is `11 - (sum % 11)`,
 * with 11 → 0 and 10 → 9 per the AFIP convention.
 */
export function isValidCuit(digits: string): boolean {
  if (digits.length !== CUIT_DIGITS) return false
  const nums = digits.split('').map(Number)
  const sum = CUIT_WEIGHTS.reduce((acc, weight, i) => acc + weight * nums[i], 0)
  let check = 11 - (sum % 11)
  if (check === 11) check = 0
  if (check === 10) check = 9
  return check === nums[CUIT_DIGITS - 1]
}

/**
 * Validation for the factory form (FabricaCliente, CU-58/59). CUIT is optional;
 * when provided it must have the expected 11-digit length and a valid check
 * digit. Dashes/spaces are allowed and normalised away by {@link toFactoryInput}.
 */
export const factoryFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre de la fábrica es obligatorio'),
  code: z
    .string()
    .trim()
    .min(1, 'El código de fábrica es obligatorio')
    .refine(
      (value) => /^[A-Za-z0-9]{3,4}$/.test(value),
      'El código debe tener entre 3 y 4 caracteres alfanuméricos',
    ),
  cuit: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || cuitDigits(value).length === CUIT_DIGITS,
      'El CUIT debe tener 11 dígitos',
    )
    .refine(
      (value) => value === '' || isValidCuit(cuitDigits(value)),
      'El dígito verificador del CUIT no es válido',
    ),
  // Optional: the DB column `factory_customer.address` is nullable.
  address: z.string().trim(),
  // Optional: the DB column `factory_customer.industry_id` is nullable.
  industryId: z.string().min(1, 'Elegí un rubro'),
  payMethod: z
    .string()
    .trim()
    .min(1, 'Ingresá las formas de pago'),
})

export type FactoryFormValues = z.infer<typeof factoryFormSchema>

export const emptyFactoryForm: FactoryFormValues = {
  name: '',
  code: '',
  cuit: '',
  address: '',
  industryId: '',
  payMethod: '',
}

/**
 * Maps validated form values to the API payload (CUIT normalised to digits,
 * factory code uppercased since it prefixes the internal piece ids).
 */
export function toFactoryInput(values: FactoryFormValues): FactoryInput {
  return {
    name: values.name.trim(),
    code: values.code.trim().toUpperCase(),
    cuit: cuitDigits(values.cuit),
    address: values.address.trim(),
    industryId: values.industryId,
    payMethod: values.payMethod.trim(),
  }
}

/** Maps an existing factory to form values, for the edit modal. */
export function toFactoryFormValues(factory: Factory): FactoryFormValues {
  return {
    name: factory.name,
    code: factory.code,
    // Con guiones, igual que se muestra en lectura.
    cuit: formatCuit(factory.cuit),
    address: factory.address,
    industryId: factory.industryId,
    payMethod: factory.payMethod,
  }
}

/** Formats a stored 11-digit CUIT as "XX-XXXXXXXX-X" for display. */
export function formatCuit(cuit: string): string {
  const digits = cuitDigits(cuit)
  if (digits.length !== CUIT_DIGITS) return cuit
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`
}
