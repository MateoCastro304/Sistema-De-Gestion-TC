import { z } from 'zod'
import type { IndustryInput } from '../types/industry'

/**
 * Validation for the inline "nuevo rubro" form. `name` is optional: the DB
 * column `industry.name` is nullable.
 */
export const industryFormSchema = z.object({
  name: z.string().trim(),
})

export type IndustryFormValues = z.infer<typeof industryFormSchema>

export const emptyIndustryForm: IndustryFormValues = { name: '' }

export function toIndustryInput(values: IndustryFormValues): IndustryInput {
  return { name: values.name.trim() }
}
