/**
 * Tipo de proceso (CU-09 Registrar, CU-10 Modificar, CU-11 Consultar), con la
 * forma del contrato del Sprint 2 (§3.4 y §3.5). Los dos precios hora están
 * vinculados por el tipo de cambio; el cálculo lo hace el cliente y la API
 * los guarda tal como llegan (D-29).
 */

export interface ProcessType {
  /** No cambia nunca, aunque se renombre el tipo. */
  id: number
  name: string
  description: string | null
  /** Mayor a 0, hasta dos decimales. */
  hourlyRateArs: number
  hourlyRateUsd: number
  /** Pesos por dólar con el que se vincularon los precios la última vez. */
  exchangeRate: number
  createdAt: string
  /** "Última actualización": igual a `createdAt` si nunca cambió. */
  updatedAt: string
}

export interface ProcessTypeCreate {
  name: string
  description?: string | null
  hourlyRateArs: number
  hourlyRateUsd: number
  exchangeRate: number
}

/** Al menos un campo. `exchangeRate` es obligatorio si viaja alguno de los precios. */
export type ProcessTypeUpdate = Partial<ProcessTypeCreate>

/**
 * Un registro de `GET /process-types/{id}/history` ("Historial de precios").
 * Hay uno por cada modificación que cambió el precio hora en dólares; los
 * valores van siempre en dólares (D-32).
 */
export interface ProcessTypeHistoryEntry {
  id: number
  changedAt: string
  changedBy: { id: number; username: string }
  /** Tipo de cambio con el que se calculó el precio nuevo. */
  exchangeRateArs: number
  previousValueUsd: number
  newValueUsd: number
}

/** `GET /exchange-rate`: la cotización actual del dólar. */
export interface ExchangeRate {
  rate: number
  updatedAt: string
}

export interface ProcessTypeListParams {
  page?: number
  limit?: number
  search?: string
}
