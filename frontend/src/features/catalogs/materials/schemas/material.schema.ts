import { z } from 'zod'
import type { MaterialCreate } from '../types/material'

/** Límite del contrato (§3.6, `POST /materials`) para los dos campos. */
export const MATERIAL_MAX_LENGTH = 60

/**
 * Formulario "Nuevo material" (CU-37). Los mensajes son los del contrato y
 * del prototipo. Los espacios de los extremos no cuentan: "  " es vacío.
 *
 * Lo que sólo la API sabe NO se valida acá: que nombre y calidad no estén
 * repetidos (409 MATERIAL_ALREADY_EXISTS, sobre "Calidad").
 */
export const materialFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Ingresá el material')
    .max(MATERIAL_MAX_LENGTH, `El material admite hasta ${MATERIAL_MAX_LENGTH} caracteres`),
  quality: z
    .string()
    .trim()
    .min(1, 'Ingresá la calidad')
    .max(MATERIAL_MAX_LENGTH, `La calidad admite hasta ${MATERIAL_MAX_LENGTH} caracteres`),
})

export type MaterialFormValues = z.input<typeof materialFormSchema>

/** Formulario vacío: así arranca cada vez que se abre la ventana. */
export function emptyMaterialForm(): MaterialFormValues {
  return { name: '', quality: '' }
}

/** Cuerpo del alta, sin los espacios de los extremos. */
export function toMaterialCreate(values: MaterialFormValues): MaterialCreate {
  return { name: values.name.trim(), quality: values.quality.trim() }
}