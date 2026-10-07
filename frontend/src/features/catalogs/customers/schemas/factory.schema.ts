import { z } from 'zod'
import type { Factory, FactoryInput } from '../types/factory'

/** Digits-only CUIT length (Argentina: 2 + 8 + 1). */
const CUIT_DIGITS = 11

/** Weights applied to the first 10 digits to compute the check digit. */
const CUIT_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2] as const

/** Prefixes the backend accepts (persona física / jurídica). */
const CUIT_PREFIXES = ['20', '23', '24', '27', '30', '33', '34']

/** Strips everything but digits, so "30-71234567-8" -> "30712345678". */
function cuitDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Validates the CUIT (prefix and check digit, módulo 11) over its 11 digits,
 * the same rules the backend applies. A computed check of 10 is not assignable.
 */
export function isValidCuit(digits: string): boolean {
  if (digits.length !== CUIT_DIGITS) return false
  if (!CUIT_PREFIXES.includes(digits.slice(0, 2))) return false
  const nums = digits.split('').map(Number)
  const sum = CUIT_WEIGHTS.reduce((acc, weight, i) => acc + weight * nums[i], 0)
  let check = 11 - (sum % 11)
  if (check === 11) check = 0
  if (check === 10) return false
  return check === nums[CUIT_DIGITS - 1]
}

/**
 * Validation for the factory form (FabricaCliente, CU-58/59). El CUIT y el
 * rubro son obligatorios; dirección y formas de pago son opcionales (las
 * columnas admiten null). Dashes/spaces in the CUIT are allowed and normalised
 * away by {@link toFactoryInput}.
 */
export const factoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre de la fábrica es obligatorio')
    .max(100, 'El nombre admite hasta 100 caracteres'),
  cuit: z
    .string()
    .trim()
    .min(1, 'El CUIT es obligatorio')
    .refine(
      (value) => value === '' || cuitDigits(value).length === CUIT_DIGITS,
      'El CUIT debe tener 11 dígitos',
    )
    .refine(
      (value) => value === '' || isValidCuit(cuitDigits(value)),
      'El CUIT no es válido (prefijo o dígito verificador)',
    ),
  // Optional: the DB column `factory_customer.address` is nullable.
  address: z.string().trim().max(255, 'La dirección admite hasta 255 caracteres'),
  // Required: the rubro (backend category) is mandatory for a factory.
  categoryId: z.string().min(1, 'Elegí un rubro'),
  // Optional: the DB column `factory_customer.pay_method` is nullable.
  payMethod: z.string().trim().max(255, 'Las formas de pago admiten hasta 255 caracteres'),
})

export type FactoryFormValues = z.infer<typeof factoryFormSchema>

export const emptyFactoryForm: FactoryFormValues = {
  name: '',
  cuit: '',
  address: '',
  categoryId: '',
  payMethod: '',
}

/** Maps validated form values to the API payload (CUIT normalised to digits). */
export function toFactoryInput(values: FactoryFormValues): FactoryInput {
  return {
    name: values.name.trim(),
    cuit: cuitDigits(values.cuit),
    address: values.address.trim(),
    categoryId: values.categoryId,
    payMethod: values.payMethod.trim(),
  }
}

/** Maps an existing factory to form values, for the edit modal. */
export function toFactoryFormValues(factory: Factory): FactoryFormValues {
  return {
    name: factory.name,
    // Con guiones, igual que se muestra en lectura.
    cuit: formatCuit(factory.cuit),
    address: factory.address,
    categoryId: factory.categoryId,
    payMethod: factory.payMethod,
  }
}

/** Formats a stored 11-digit CUIT as "XX-XXXXXXXX-X" for display. */
export function formatCuit(cuit: string): string {
  const digits = cuitDigits(cuit)
  if (digits.length !== CUIT_DIGITS) return cuit
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`
}
