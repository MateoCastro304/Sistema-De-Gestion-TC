import { z } from 'zod'
import { cuitDigits, cuitError, formatCuit, isValidCuit } from '@/shared/lib/cuit'
import type { Factory, FactoryInput } from '../types/factory'

// Se reexportan para lo que ya los importaba de acá.
export { formatCuit, isValidCuit }

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
    // Un solo chequeo que dice QUÉ está mal (largo, prefijo o dígito
    // verificador), en vez de un "no es válido" genérico.
    .superRefine((value, ctx) => {
      if (value === '') return
      const message = cuitError(value)
      if (message) ctx.addIssue({ code: 'custom', message })
    }),
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
