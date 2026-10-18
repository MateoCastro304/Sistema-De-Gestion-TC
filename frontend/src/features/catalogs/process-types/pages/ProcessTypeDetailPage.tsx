import { Link, useParams } from 'react-router'
import { useCrumbTitle } from '@/app/providers/BreadcrumbContext'
import { isApiError } from '@/shared/api/ApiError'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { heroPhoto } from '@/shared/lib/heroPhoto'
import fotoCnc from '@/assets/foto-cnc.webp'
import { useProcessType, useProcessTypeHistory } from '../api/process-types.queries'
import { PriceHistoryTable } from '../components/PriceHistoryTable'
import { formatArs, formatUsd } from '../utils/money'
import { formatLongDateTime } from '../utils/dates'
import { useState } from 'react'
import { Button } from '@/shared/components/ui'
import { ProcessTypeEditor } from '../components/ProcessTypeEditor'

const LIST_PATH = '/catalogos/tipos-de-proceso'

/** CU-11 Consultar tipo de proceso: datos, registro e historial de precios. */
export function ProcessTypeDetailPage() {
  const { id } = useParams<{ id: string }>()
  // La URL trae texto; el contrato define el id como entero. "abc" → NaN.
  const processTypeId = Number(id)

  const { data: processType, isPending, error } = useProcessType(processTypeId)
  const history = useProcessTypeHistory(processTypeId)
  // false = viendo el detalle; true = modificando (CU-10).
  const [editing, setEditing] = useState(false)
  // El nombre en la miga de pan; `undefined` mientras carga.
  useCrumbTitle(processType?.name)

  const notFound = !Number.isInteger(processTypeId) || processTypeId <= 0 || (isApiError(error) && error.isNotFound)

  if (notFound) {
    return (
      <EmptyState
        card
        kind="no-results"
        title="No encontramos el tipo de proceso que buscabas."
        action={<Link className="btn btn--secondary" to={LIST_PATH}>Volver al listado</Link>}
      />
    )
  }

  if (error) {
    return (
      <EmptyState
        card
        kind="error"
        title="No se pudo cargar el tipo de proceso."
        action={<Link className="btn btn--secondary" to={LIST_PATH}>Volver al listado</Link>}
      >
        {isApiError(error) ? error.message : 'Revisá la conexión e intentá de nuevo.'}
      </EmptyState>
    )
  }

  if (isPending) {
    return (
      <div className="empty-state">
        <p className="empty-state__text">Cargando tipo de proceso…</p>
      </div>
    )
  }

  return (
    <>
            <div className="page-header page-header--foto" style={heroPhoto(fotoCnc)}>
        <div className="page-header__row">
          <div className="detail-header__left">
            {editing ? (
              <button type="button" className="back-link" onClick={() => setEditing(false)}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {processType.name}
              </button>
            ) : (
              <Link to={LIST_PATH} className="back-link">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Tipos de proceso
              </Link>
            )}
            <div>
              <h1 className="page-header__title">{editing ? 'Modificar tipo de proceso' : processType.name}</h1>
              <p className="page-header__subtitle">
                {editing
                  ? processType.name
                  : `${formatArs(processType.hourlyRateArs)} / h · ${formatUsd(processType.hourlyRateUsd)} / h`}
              </p>
            </div>
          </div>

          {!editing && (
            <div className="detail-header__actions">
              <Button onClick={() => setEditing(true)}>Modificar</Button>
            </div>
          )}
        </div>
      </div>
      {editing ? (
        <ProcessTypeEditor processType={processType} onDone={() => setEditing(false)} />
      ) : (
      <div className="detail-layout">
        <div className="detail-main">
          <section className="card">
            <h2 className="card__title">Datos del tipo de proceso</h2>
            <div className="card__grid card__grid--2">
              <div className="field card__full">
                <span className="field__label">Nombre</span>
                <span className="field__value">{processType.name}</span>
              </div>
              <div className="field card__full">
                <span className="field__label">Descripción</span>
                {processType.description ? (
                  <p className="field__value field__value--text">{processType.description}</p>
                ) : (
                  <p className="field__value field__value--text field__value--muted">Sin descripción.</p>
                )}
              </div>
              <div className="field">
                <span className="field__label">Precio hora en pesos</span>
                <span className="field__value">{formatArs(processType.hourlyRateArs)}</span>
              </div>
              <div className="field">
                <span className="field__label">Precio hora en dólares</span>
                <span className="field__value">{formatUsd(processType.hourlyRateUsd)}</span>
              </div>
            </div>
          </section>

          <section className="card">
            <h2 className="card__title">Historial de precios</h2>
            {history.isPending ? (
              <p className="field__value field__value--muted">Cargando historial…</p>
            ) : history.isError ? (
              <p className="field__value field__value--muted">No se pudo cargar el historial.</p>
            ) : (
              <PriceHistoryTable entries={history.data} />
            )}
            <p className="form-field__hint">Este historial no se puede modificar.</p>
          </section>
        </div>

        {/* Información del sistema: nunca se edita. Va en el panel oscuro, como en Proveedores. */}
        <aside className="detail-aside">
          <section className="card card--dark">
            <h2 className="card__title">Registro</h2>
            <div className="aside-list">
              <div className="field">
                <span className="field__label">Alta</span>
                <span className="field__value">{formatLongDateTime(processType.createdAt)}</span>
              </div>
              <div className="field">
                <span className="field__label">Última actualización</span>
                <span className="field__value">{formatLongDateTime(processType.updatedAt)}</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
      )}
    </>
  )
}
