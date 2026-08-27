import { z } from 'zod'
import type { IndustryInput } from '../types/industry'

/** Validation for the inline "nuevo rubro" form. */
export const industryFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre del rubro es obligatorio'),
})

export type IndustryFormValues = z.infer<typeof industryFormSchema>

export const emptyIndustryForm: IndustryFormValues = { name: '' }

export function toIndustryInput(values: IndustryFormValues): IndustryInput {
  return { name: values.name.trim() }
}
