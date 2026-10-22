import { Table, type Column } from '@/shared/components/ui'
import type { ProcessTypeHistoryEntry } from '../types/process-type'
import { formatArs, formatUsd } from '../utils/money'
import { formatLongDateTime } from '../utils/dates'

const COLUMNS: Column<ProcessTypeHistoryEntry>[] = [
  { header: 'Fecha y hora', render: (entry) => formatLongDateTime(entry.changedAt) },
  { header: 'Usuario', render: (entry) => entry.changedBy.username },
  { header: 'Valor anterior (US$)', render: (entry) => formatUsd(entry.previousValueUsd) },
  { header: 'Valor nuevo (US$)', render: (entry) => formatUsd(entry.newValueUsd) },
  { header: 'Tipo de cambio', render: (entry) => formatArs(entry.exchangeRate) },
]

/**
 * "Historial de precios" del detalle (CU-10 esc. 4, CU-11 esc. 3): del más
 * reciente al más antiguo, como lo devuelve la API, sin paginar y sin
 * ninguna acción sobre las filas (RNF10).
 */
export function PriceHistoryTable({ entries }: { entries: ProcessTypeHistoryEntry[] }) {
  if (entries.length === 0) {
    return <p className="field__value field__value--muted">Todavía no hubo cambios en este tipo de proceso.</p>
  }
  return (
    <Table
      variant="cards"
      gridTemplate="170px 110px minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)"
      columns={COLUMNS}
      data={entries}
      rowKey={(entry) => entry.id}
    />
  )
}