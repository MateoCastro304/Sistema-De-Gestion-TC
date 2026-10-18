import { z } from 'zod'
import type { ProcessType, ProcessTypeCreate, ProcessTypeUpdate } from '../types/process-type'
import { formatMoney, parseMoney, type MoneyProblem } from '../utils/money'

/** Límites del contrato (§3.4, `POST /process-types`). */
const NAME_MAX_LENGTH = 100
const DESCRIPTION_MAX_LENGTH = 500

const EXCHANGE_RATE_MESSAGE = 'Ingresá un tipo de cambio mayor a 0, con hasta dos decimales'

type Currency = 'pesos' | 'dólares'

/** Los mensajes del prototipo y del contrato para cada problema de un precio. */
function priceMessage(problem: MoneyProblem, currency: Currency): string {
  switch (problem) {
    case 'missing':
      return `Ingresá el precio hora en ${currency}`
    case 'invalid':
      return `El precio hora en ${currency} tiene que ser un número mayor a 0`
    case 'decimals':
      return `El precio hora en ${currency} admite como máximo dos decimales`
  }
}

/** Un precio hora: texto que tiene que poder leerse como monto válido. */
function priceField(currency: Currency) {
  return z.string().superRefine((value, ctx) => {
    const parsed = parseMoney(value)
    if (!parsed.ok) ctx.addIssue({ code: 'custom', message: priceMessage(parsed.problem, currency) })
  })
}

/**
 * Formulario de tipo de proceso (CU-09 Registrar, CU-10 Modificar). Los
 * montos son texto porque el usuario los escribe con formato argentino; se
 * pasan a número recién al armar el cuerpo para la API.
 *
 * La unicidad del nombre NO se valida acá: sólo la API conoce el catálogo
 * entero y responde 409 PROCESS_TYPE_NAME_TAKEN.
 */
export const processTypeFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Ingresá el nombre del tipo de proceso')
    .max(NAME_MAX_LENGTH, `El nombre admite hasta ${NAME_MAX_LENGTH} caracteres`),
  description: z
    .string()
    .trim()
    .max(DESCRIPTION_MAX_LENGTH, `La descripción admite hasta ${DESCRIPTION_MAX_LENGTH} caracteres`),
  hourlyRateArs: priceField('pesos'),
  hourlyRateUsd: priceField('dólares'),
  exchangeRate: z.string().refine((value) => parseMoney(value).ok, EXCHANGE_RATE_MESSAGE),
})

export type ProcessTypeFormValues = z.infer<typeof processTypeFormSchema>

/** Un monto que el schema ya validó. Si no se puede leer, es un bug: se corta acá. */
function toAmount(value: string): number {
  const parsed = parseMoney(value)
  if (!parsed.ok) throw new Error(`Monto sin validar: "${value}"`)
  return parsed.value
}

/** El tipo de cambio para el campo: la cotización del backend o vacío si no la hay (502). */
function rateField(rate: number | undefined): string {
  return rate === undefined ? '' : formatMoney(rate)
}

/** Formulario vacío del alta, con el tipo de cambio precargado. */
export function emptyProcessTypeForm(rate?: number): ProcessTypeFormValues {
  return { name: '', description: '', hourlyRateArs: '', hourlyRateUsd: '', exchangeRate: rateField(rate) }
}

/**
 * Formulario de modificar: los valores actuales y la cotización de hoy (no
 * el tipo de cambio guardado). Los precios no se recalculan al abrir.
 */
export function toProcessTypeFormValues(processType: ProcessType, rate?: number): ProcessTypeFormValues {
  return {
    name: processType.name,
    description: processType.description ?? '',
    hourlyRateArs: formatMoney(processType.hourlyRateArs),
    hourlyRateUsd: formatMoney(processType.hourlyRateUsd),
    exchangeRate: rateField(rate),
  }
}

/** Cuerpo del alta. La descripción vacía viaja como `null`. */
export function toProcessTypeCreate(values: ProcessTypeFormValues): ProcessTypeCreate {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    hourlyRateArs: toAmount(values.hourlyRateArs),
    hourlyRateUsd: toAmount(values.hourlyRateUsd),
    exchangeRate: toAmount(values.exchangeRate),
  }
}

/**
 * Cuerpo del PATCH: sólo lo que cambió respecto de `current`. Si cambió algún
 * precio, viaja también el tipo de cambio con el que se calculó (contrato:
 * obligatorio si llega un precio). Vacío = "No hay cambios para guardar".
 */
export function buildProcessTypePatch(current: ProcessType, values: ProcessTypeFormValues): ProcessTypeUpdate {
  const next = toProcessTypeCreate(values)
  const patch: ProcessTypeUpdate = {}
  if (next.name !== current.name) patch.name = next.name
  if (next.description !== current.description) patch.description = next.description
  if (next.hourlyRateArs !== current.hourlyRateArs) patch.hourlyRateArs = next.hourlyRateArs
  if (next.hourlyRateUsd !== current.hourlyRateUsd) patch.hourlyRateUsd = next.hourlyRateUsd
  if (patch.hourlyRateArs !== undefined || patch.hourlyRateUsd !== undefined) {
    patch.exchangeRate = next.exchangeRate
  }
  return patch
}