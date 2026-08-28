import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { Badge, Button } from '@/shared/components/ui'
import { isApiError } from '@/shared/api/ApiError'
import { cn } from '@/shared/lib/cn'
import { useSupplier } from '../api/useSupplier'
import { SUPPLIER_TYPES } from '../types/supplier'

/** ISO 8601 -> "22 ago 2026". Las fechas viajan como string, no como Date. */
function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(new Date(iso))
}

interface FieldProps {
  label: string
  value?: string
  /** Nombre del campo en el payload; sale del contrato. */
  name: string
  editing: boolean
  /** El CUIT se muestra siempre pero nunca se edita: es identidad fiscal. */
  readOnly?: boolean
  hint?: string
}

/**
 * Un dato del proveedor. En modo lectura es un texto; en modo edición, el
 * mismo lugar pasa a ser un input. La etiqueta y la celda de la grilla no
 * cambian, así el layout no salta al entrar y salir de la edición.
 */
function Field({ label, value, name, editing, readOnly = false, hint }: FieldProps) {
  return (
    <div className="info-grid__item">
      <span className="info-grid__label">{label}</span>

      {editing ? (
        <>
          <input
            id={name}
            name={name}
            className={cn(
              'form-field__input',
              readOnly && 'form-field__input--disabled',
            )}
            defaultValue={value ?? ''}
            disabled={readOnly}
          />
          {hint && <span className="form-field__hint">{hint}</span>}
        </>
      ) : (
        <span className="info-grid__value">{value?.trim() ? value : '—'}</span>
      )}
    </div>
  )
}

export function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>()
  // La URL siempre trae strings; el contrato define el id como entero.
  const supplierId = Number(id)

  const { data: supplier, isPending, error } = useSupplier(supplierId)

  /** Alterna entre ver y editar. Todavía no guarda: falta la mutación. */
  const [isEditing, setIsEditing] = useState(false)

  const notFound = !Number.isInteger(supplierId) || (isApiError(error) && error.isNotFound)

  if (notFound) {
    return (
      <div className="empty-state">
        <p className="empty-state__text">
          No encontramos el proveedor que buscabas.{' '}
          <Link className="table__action" to="/catalogs/suppliers">
            Volver al listado
          </Link>
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="callout callout--warning">
        <span>{isApiError(error) ? error.message : 'Ocurrió un error inesperado.'}</span>
      </div>
    )
  }

  if (isPending || !supplier) {
    return (
      <div className="empty-state">
        <p className="empty-state__text">Cargando proveedor…</p>
      </div>
    )
  }

  return (
    <>
      <div className="detail-header">
        <div className="detail-header__left">
          <Link
            to="/catalogs/suppliers"
            className="detail-header__back"
            aria-label="Volver al listado de proveedores"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          <div>
            <div className="detail-header__title-row">
              <h1 className="detail-header__title">{supplier.legalName}</h1>
              {supplier.active ? (
                <Badge variant="si">Activo</Badge>
              ) : (
                <Badge variant="pendiente">Inactivo</Badge>
              )}
            </div>
            <span className="detail-header__meta">
              CUIT {supplier.taxId} · {supplier.supplierType}
            </span>
          </div>
        </div>

        <div className="detail-header__actions">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button variant="primary" disabled>
                Guardar cambios
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={() => setIsEditing(true)}>
              Editar
            </Button>
          )}
        </div>
      </div>

      <div className="detail-layout">
        <div className="detail-main">
          <section className="info-card">
            <h2 className="info-card__title">Datos generales</h2>
            <div className="info-grid">
              <Field
                label="Razón social"
                name="legalName"
                value={supplier.legalName}
                editing={isEditing}
              />
              <Field
                label="CUIT"
                name="taxId"
                value={supplier.taxId}
                editing={isEditing}
                readOnly
                hint="El CUIT no se puede modificar."
              />

              <div className="info-grid__item">
                <span className="info-grid__label">Tipo</span>
                {isEditing ? (
                  <select
                    id="supplierType"
                    name="supplierType"
                    className="form-field__select"
                    defaultValue={supplier.supplierType}
                  >
                    {SUPPLIER_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="info-grid__value">{supplier.supplierType}</span>
                )}
              </div>

              <div className="info-grid__item info-grid__item--full">
                <span className="info-grid__label">Dirección</span>
                {isEditing ? (
                  <input
                    id="address"
                    name="address"
                    className="form-field__input"
                    defaultValue={supplier.address ?? ''}
                  />
                ) : (
                  <p className="info-grid__text">
                    {supplier.address?.trim() ? supplier.address : '—'}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="info-card">
            <h2 className="info-card__title">Contacto</h2>
            <div className="info-grid">
              <Field
                label="Persona de contacto"
                name="contactName"
                value={supplier.contactName}
                editing={isEditing}
              />
              <Field
                label="Email"
                name="contactEmail"
                value={supplier.contactEmail}
                editing={isEditing}
              />
              <Field
                label="Teléfono"
                name="contactPhone"
                value={supplier.contactPhone}
                editing={isEditing}
              />
            </div>
          </section>
        </div>

        {/* El registro es información del sistema: nunca se edita a mano. */}
        <aside className="detail-aside">
          <section className="info-card">
            <h2 className="info-card__title">Registro</h2>
            <div className="info-grid">
              <div className="info-grid__item info-grid__item--full">
                <span className="info-grid__label">Estado</span>
                <span className="info-grid__value">
                  {supplier.active ? 'Activo' : 'Dado de baja'}
                </span>
              </div>
              <div className="info-grid__item info-grid__item--full">
                <span className="info-grid__label">Alta</span>
                <span className="info-grid__value">{formatDate(supplier.createdAt)}</span>
              </div>
              <div className="info-grid__item info-grid__item--full">
                <span className="info-grid__label">Última modificación</span>
                <span className="info-grid__value">{formatDate(supplier.updatedAt)}</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </>
  )
}
