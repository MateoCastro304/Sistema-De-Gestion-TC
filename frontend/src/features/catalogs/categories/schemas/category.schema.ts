import { z } from 'zod'
import type { Category, CategoryInput } from '../types/category'

/** Upper bound declared by the contract (`Category.yaml#/properties/name`). */
const NAME_MIN_LENGTH = 3
const NAME_MAX_LENGTH = 80

/**
 * Validation for the rubro form (CU-41 Registrar Rubro, CU-42 Modificar Rubro).
 * Mirrors the contract: `name` is required and at most 80 characters.
 *
 * Uniqueness is NOT checked here: only the backend knows the whole catalog, so
 * it answers 409 and the modal surfaces that error as a toast.
 */
export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre del rubro es obligatorio')
    // El backend rechaza nombres de menos de 3 caracteres.
    .min(NAME_MIN_LENGTH, `El nombre debe tener al menos ${NAME_MIN_LENGTH} caracteres`)
    .max(
      NAME_MAX_LENGTH,
      `El nombre no puede superar los ${NAME_MAX_LENGTH} caracteres`,
    ),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>

/** Defaults for the create modal, and what the form resets to on open. */
export const emptyCategoryForm: CategoryFormValues = { name: '' }

/** Maps validated form values to the API payload. */
export function toCategoryInput(values: CategoryFormValues): CategoryInput {
  return { name: values.name.trim() }
}

/** Maps an existing rubro to form values, for the edit modal. */
export function toCategoryFormValues(category: Category): CategoryFormValues {
  return { name: category.name }
}
