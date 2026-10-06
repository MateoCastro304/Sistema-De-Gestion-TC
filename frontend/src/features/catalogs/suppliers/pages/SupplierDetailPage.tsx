import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { Avatar, Badge, Button, Select } from '@/shared/components/ui'
import { isApiError } from '@/shared/api/ApiError'
import { cn } from '@/shared/lib/cn'
import { useSupplier } from '../api/useDetailSupplier'
import { SUPPLIER_TYPES } from '../types/supplier'
import type {SupplierFormValues} from '../types/supplier'
import type { ChangeEvent } from 'react'
import { useUpdateSupplier } from '../api/useUpdateSupplier'
import { buildSupplierPatch } from '../utils/buildSupplierPatch'
import { TYPE_TONES } from '../utils/supplierTone'
import { useToast } from '@/app/providers/ToastContext'
import { validateSupplierForm } from '../utils/validateSupplierForm'
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
  /*
    Rediseño: la celda cambia de clase según el modo, porque el CSS
    tiene dos tratamientos distintos.
      - lectura: .field + .field__label + .field__value (rótulo chico
        en versalitas arriba, dato grande abajo).
      - edición: .form-field, que estiliza al <input> por elemento
        (`.form-field input`), sin necesidad de clase en el input.
    La estructura y el estado no cambian: sigue siendo la misma celda
    de la grilla, así el layout no salta al entrar y salir de edición.
  */
  return (
    <div className={cn(editing ? 'form-field' : 'field', error && 'form-field--error')}>
      {/* En edición es un <label> real apuntando al input (que ya tenía
          id={name}); en lectura no hay control al que apuntar, así que
          queda como texto. */}
      {editing ? (
        <label htmlFor={name}>{label}</label>
      ) : (
        <span className="field__label">{label}</span>
      )}

      {editing ? (
        <>
          <input
            id={name}
            name={name}
            className={cn(readOnly && 'form-field__input--disabled')}
            value={value}
            onChange={onChange}
            disabled={readOnly}
            maxLength={maxLength}
            aria-invalid={error ? true : undefined}
          />
          {error ? (<span className="form-field__error">{error}</span>
              ) : hint ? (<span className="form-field__hint">{hint}</span>) : null}
        </>
      ) : (
        <span className="field__value">{value.trim() ? value : '—'}</span>
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
  const [form, setForm] = useState<SupplierFormValues | null >(null)
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

    const validationErrors = validateSupplierForm(form)
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
        showToast('success', 'Proveedor actualizado.')
      },
      onError: (mutationError) => {
        if (isApiError(mutationError) && mutationError.isConflict) {
          setErrors({ cuit: mutationError.message })
          return
        }
        showToast('error', isApiError(mutationError) ? mutationError.message : 'Ocurrió un error inesperado.')
      }
    })
  }

  return (
    <>
      {/* Rediseño: el encabezado del detalle es el mismo panel azul del
          listado. Cambia la envoltura y las clases; los datos, el botón
          de volver y las acciones son los de antes. */}
      <div className="page-header">
        <div className="page-header__row">
          <div className="detail-header__left">
            <Link
              to="/catalogs/suppliers"
              /* --icon es el botón redondo del panel: mismo link, misma
                 ruta, sólo cambia cómo se ve sobre el fondo oscuro. */
              className="btn btn--icon"
              aria-label="Volver al listado de proveedores"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

            {/* El cuadrado con las iniciales, en su tamaño grande y con
                el color del rubro: el mismo que se ve en el listado, así
                se reconoce que es el mismo proveedor. */}
            <Avatar name={supplier.legalName} tone={TYPE_TONES[supplier.supplierType]} size="lg" />

            <div>
              {/* Sin badge de estado: si el proveedor se ve, esta activo. Los
                  eliminados no se listan y responden 404 por id. */}
              <div className="detail-header__title-row">
                <h1 className="page-header__title">{supplier.legalName}</h1>
              </div>
              {/* El rubro va como etiqueta y no como texto separado por
                  un punto: es el mismo dato, pero se reconoce de un
                  vistazo igual que en el listado. */}
              <span className="page-header__subtitle detail-header__meta">
                {supplier.cuit ? `CUIT: ${supplier.cuit}` : null}
                <Badge variant={TYPE_TONES[supplier.supplierType]}>
                  {supplier.supplierType}
                </Badge>
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
              cuit: supplier.cuit ?? '',
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
      </div>

      <div className="detail-layout">
        <div className="detail-main">
          <section className="card">
            <h2 className="card__title">Datos generales</h2>
            <div className="card__grid">
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
                name="cuit"
                value={form?.cuit ?? supplier.cuit ?? ''}
                editing={isEditing}
                hint="Formato XX-XXXXXXXX-X"
                maxLength={13}
                onChange={handleChange}
                error= {errors.cuit}
              />

              <div className={isEditing ? 'form-field' : 'field'}>
                {isEditing ? (
                  <label htmlFor="supplierType">Tipo</label>
                ) : (
                  <span className="field__label">Tipo</span>
                )}
                {isEditing ? (
                  /* El Select devuelve el valor, no un evento, así que no
                     pasa por handleChange: actualiza el campo directo. */
                  <Select
                    id="supplierType"
                    name="supplierType"
                    value={form?.supplierType ?? supplier.supplierType}
                    onChange={(supplierType) =>
                      setForm((current) => (current ? { ...current, supplierType } : current))
                    }
                    options={SUPPLIER_TYPES.map((type) => ({ value: type, label: type }))}
                  />
                ) : (
                  /* En lectura el rubro se muestra como etiqueta de color,
                     con el mismo tono que en el listado. */
                  <span className="field__value">
                    <Badge variant={TYPE_TONES[supplier.supplierType]}>
                      {supplier.supplierType}
                    </Badge>
                  </span>
                )}
              </div>

              <div className={cn(isEditing ? 'form-field' : 'field', 'card__full')}>
                {isEditing ? (
                  <label htmlFor="address">Dirección</label>
                ) : (
                  <span className="field__label">Dirección</span>
                )}
                {isEditing ? (
                  <input
                    id="address"
                    name="address"
                    maxLength={200}
                    value={form?.address ?? supplier.address ?? ''}
                    onChange={handleChange}
                  />
                ) : (
                  <p className="field__value">
                    {supplier.address?.trim() ? supplier.address : '—'}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="card">
            <h2 className="card__title">Contacto</h2>
            <div className="card__grid">
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

        {/* El registro es información del sistema: nunca se edita a mano.
            Va en el panel oscuro justamente por eso: se distingue de un
            vistazo de las tarjetas blancas, que sí son editables. */}
        <aside className="detail-aside">
          <section className="card card--dark">
            <h2 className="card__title">Registro</h2>
            <div className="card__grid">
              <div className="field card__full">
                <span className="field__label">Alta</span>
                <span className="field__value">{formatDate(supplier.createdAt)}</span>
              </div>
              <div className="field card__full">
                <span className="field__label">Última modificación</span>
                <span className="field__value">{formatDate(supplier.updatedAt)}</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </>
  )
}
