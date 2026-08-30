import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { Button } from '@/shared/components/ui'
import { isApiError } from '@/shared/api/ApiError'
import { cn } from '@/shared/lib/cn'
import { useSupplier } from '../api/useDetailSupplier'
import { SUPPLIER_TYPES } from '../types/supplier'
import type {SupplierFormEditValues} from '../types/supplier'
import type { ChangeEvent } from 'react'
import { useUpdateSupplier } from '../api/useUpdateSupplier'
import { buildSupplierPatch } from '../utils/buildSupplierPatch'
import { useToast } from '@/app/providers/ToastContext'
import { validateSupplierEditForm } from '../utils/validateSupplierForm'
import type { SupplierFormErrors } from '../utils/validateSupplierForm'
/** ISO 8601 -> "22 ago 2026". Las fechas viajan como string, no como Date. */
function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(new Date(iso))
}
type FieldChangeHandler = (
  event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
) => void
interface FieldProps {
  label: string
  value: string
  /** Nombre del campo en el payload; sale del contrato. */
  name: string
  editing: boolean
  onChange?: FieldChangeHandler
  /** El CUIT se muestra siempre pero nunca se edita: es identidad fiscal. */
  readOnly?: boolean
  hint?: string
  error?:string
  /** Largo maximo del contrato (components/schemas/Supplier.yaml). */
  maxLength?: number
}

/**
 * En lectura es texto; en edicion, un input en el mismo lugar. La celda de la
 * grilla no cambia, asi el layout no salta al entrar y salir de la edicion.
 */
function Field({ label, value, name, editing, onChange, error, maxLength, readOnly = false, hint }: FieldProps) {
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
            value={value}
            onChange={onChange}
            disabled={readOnly}
            maxLength={maxLength}
            aria-invalid={error ? true : undefined}
          />
          {error ? (<span className="form-field__hint form-field__hint--error">{error}</span>
              ) : hint ? (<span className="form-field__hint">{hint}</span>) : null}
        </>
      ) : (
        <span className="info-grid__value">{value.trim() ? value : '—'}</span>
      )}
    </div>
  )
}

export function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>()
  // La URL siempre trae strings; el contrato define el id como entero.
  const supplierId = Number(id)


  const { data: supplier, isPending, error } = useSupplier(supplierId)
  /** `null` = modo lectura. Un objeto = editando, con los valores en curso. */
  const [form, setForm] = useState<SupplierFormEditValues | null >(null)
  const { mutate, isPending:isSaving } = useUpdateSupplier(supplierId)
  const [errors, setErrors] = useState<SupplierFormErrors>({})
  const showToast = useToast()

  const isEditing = form !== null
  const notFound = !Number.isInteger(supplierId) || (isApiError(error) && error.isNotFound)
  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    // El `name` del input es la clave del estado: un solo handler para todos.
    const {name, value } = event.target
    setForm((current) => (current ? {...current, [name]:value} : current))
  }
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

  
  // Va despues de los early returns porque necesita que `supplier` exista.
  const patch = form ? buildSupplierPatch(supplier, form) : null
  const hasChanges = patch !== null && Object.keys(patch).length > 0
  function handlePatch() {
    // Ademas de guarda, esto le prueba a TS que patch y form no son null.
    if (!patch || !form) return

    const validationErrors = validateSupplierEditForm(form)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) return

    // El contrato exige minProperties:1, asi que un patch vacio no se manda;
    // igual el boton responde cerrando la edicion en vez de no hacer nada.
    if (!hasChanges) {
      setForm(null)
      return
    }
    mutate(patch, {
      onSuccess: () => {
        setForm(null)
        setErrors({})
        showToast('success', 'Proveedor Actualizado')
      },
      onError: (mutationError) => {
        showToast('error', isApiError(mutationError) ? mutationError.message : 'Ocurrio un error inesperado')
      }
    })
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
            {/* Sin badge de estado: si el proveedor se ve, esta activo. Los
                eliminados no se listan y responden 404 por id. */}
            <div className="detail-header__title-row">
              <h1 className="detail-header__title">{supplier.legalName}</h1>
            </div>
            <span className="detail-header__meta">
              CUIT {supplier.taxId} · {supplier.supplierType}
            </span>
          </div>
        </div>

        <div className="detail-header__actions">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => {setForm(null); setErrors({})}} disabled={isSaving}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handlePatch} disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={() => setForm({
              legalName: supplier.legalName,
              supplierType: supplier.supplierType,
              contactName: supplier.contactName ?? '',
              contactEmail: supplier.contactEmail ?? '',
              contactPhone: supplier.contactPhone ?? '',
              address: supplier.address ?? '',
            })}>
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
                value={form?.legalName ?? supplier.legalName}
                editing={isEditing}
                onChange={handleChange}
                maxLength={120}
                error={errors.legalName}
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
                    value={form?.supplierType ?? supplier.supplierType}
                    onChange={handleChange}
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
                    maxLength={200}
                    value={form?.address ?? supplier.address ?? ''}
                    onChange={handleChange}
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
                value={form?.contactName ?? supplier.contactName ?? ''}
                editing={isEditing}
                onChange={handleChange}
                maxLength={120}
                error={errors.contactName}
              />
              <Field
                label="Email"
                name="contactEmail"
                value={form?.contactEmail ?? supplier.contactEmail ?? ''}
                editing={isEditing}
                onChange={handleChange}
                maxLength={120}
                error={errors.contactEmail}
              />
              <Field
                label="Teléfono"
                name="contactPhone"
                value={form?.contactPhone ?? supplier.contactPhone ?? ''}
                editing={isEditing}
                onChange={handleChange}
                maxLength={40}
                error={errors.contactPhone}
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
