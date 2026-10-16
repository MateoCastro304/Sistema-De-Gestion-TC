import type { ExchangeRate, ProcessType, ProcessTypeHistoryEntry } from '../types/process-type'

/**
 * Tabla de tipos de proceso del mock y su historial de precios: la semilla
 * del prototipo (`semilla().tp`), con las fechas pasadas de la hora de
 * Córdoba a UTC. El historial guarda sólo los cambios del precio en dólares,
 * con el valor anterior y el nuevo en US$ (D-32). Se resetea al recargar la página.
 */

/** Cotización "del backend" que precarga el formulario (la del prototipo). */
export const CURRENT_EXCHANGE_RATE: ExchangeRate = { rate: 1385.5, updatedAt: '2026-10-15T12:30:00.000Z' }

type HistorySeed = Omit<ProcessTypeHistoryEntry, 'id'>

interface ProcessTypeRow {
  processType: ProcessType
  /** Del más reciente al más antiguo, como lo devuelve la API. */
  history: ProcessTypeHistoryEntry[]
}

const LBENITEZ = { id: 4, username: 'lbenitez' }
const FPAZ = { id: 3, username: 'fpaz' }

let historyId = 1
const row = (processType: Omit<ProcessType, 'updatedAt'>, history: HistorySeed[] = []): ProcessTypeRow => ({
  // "Última actualización" = el cambio más reciente, o el alta si no hubo.
  processType: { ...processType, updatedAt: history[0]?.changedAt ?? processType.createdAt },
  history: history.map((entry) => ({ id: historyId++, ...entry })),
})

export const processTypesDb = {
  rows: [
    row(
      {
        id: 1,
        name: 'Mecanizado Torno Manual',
        description: 'Torneado convencional: cilindrado, refrentado, roscado y ranurado.',
        hourlyRateArs: 1557,
        hourlyRateUsd: 1.13,
        exchangeRate: 1377.88,
        createdAt: '2026-03-12T12:10:00.000Z',
      },
      [
        { changedAt: '2026-10-01T13:22:00.000Z', changedBy: LBENITEZ, exchangeRateArs: 1377.88, previousValueUsd: 1.21, newValueUsd: 1.13 },
        { changedAt: '2026-07-04T14:05:00.000Z', changedBy: FPAZ, exchangeRateArs: 1286.78, previousValueUsd: 1.07, newValueUsd: 1.21 },
      ],
    ),
    row(
      {
        id: 2,
        name: 'Mecanizado Torno CNC',
        description: 'Torneado por control numérico para series y piezas de precisión.',
        hourlyRateArs: 2547,
        hourlyRateUsd: 1.85,
        exchangeRate: 1376.76,
        createdAt: '2026-03-12T12:14:00.000Z',
      },
      [
        { changedAt: '2026-10-01T13:24:00.000Z', changedBy: LBENITEZ, exchangeRateArs: 1376.76, previousValueUsd: 1.98, newValueUsd: 1.85 },
        { changedAt: '2026-07-04T14:08:00.000Z', changedBy: FPAZ, exchangeRateArs: 1286.36, previousValueUsd: 1.76, newValueUsd: 1.98 },
      ],
    ),
    row(
      {
        id: 3,
        name: 'Fresado',
        description: 'Fresado de caras, chaveteros y engranajes.',
        hourlyRateArs: 1890,
        hourlyRateUsd: 1.37,
        exchangeRate: 1379.56,
        createdAt: '2026-03-12T12:20:00.000Z',
      },
      [
        { changedAt: '2026-10-01T13:26:00.000Z', changedBy: LBENITEZ, exchangeRateArs: 1379.56, previousValueUsd: 1.47, newValueUsd: 1.37 },
      ],
    ),
    // Sin cambios: el detalle muestra "Todavía no hubo cambios en este tipo de proceso."
    row({
      id: 4,
      name: 'Soldadura / Herrería',
      description: 'Soldadura eléctrica y MIG, armado de estructuras.',
      hourlyRateArs: 1420,
      hourlyRateUsd: 1.03,
      exchangeRate: 1378.64,
      createdAt: '2026-04-15T17:02:00.000Z',
    }),
    row({
      id: 5,
      name: 'Rectificado',
      description: 'Rectificado cilíndrico y plano para tolerancias finas.',
      hourlyRateArs: 2210,
      hourlyRateUsd: 1.6,
      exchangeRate: 1381.25,
      createdAt: '2026-04-15T17:10:00.000Z',
    }),
    row({
      id: 6,
      name: 'Ensamblaje',
      description: 'Armado final de conjuntos.',
      hourlyRateArs: 1250,
      hourlyRateUsd: 0.91,
      exchangeRate: 1373.63,
      createdAt: '2026-06-02T11:30:00.000Z',
    }),
    row({
      id: 7,
      name: 'Armado / Desarmado',
      description: 'Desarme, inspección y rearmado en trabajos de reparación.',
      hourlyRateArs: 1180,
      hourlyRateUsd: 0.86,
      exchangeRate: 1385.5,
      createdAt: '2026-06-02T11:34:00.000Z',
    }),
  ],
  nextId: 8,
  nextHistoryId: historyId,
}

export function findProcessTypeRow(id: number): ProcessTypeRow | undefined {
  return processTypesDb.rows.find((r) => r.processType.id === id)
}
