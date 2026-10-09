import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { heroPhoto } from '@/shared/lib/heroPhoto'
import fotoTaller from '@/assets/foto-piezas-bronce.webp'
import { Avatar, Badge, Button } from '@/shared/components/ui'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { isApiError } from '@/shared/api/ApiError'
import { cn } from '@/shared/lib/cn'
import { useSupplier } from '../api/useDetailSupplier'
import { SUPPLIER_TYPE_LABELS } from '../types/supplier'
import type {SupplierFormValues, SupplierType} from '../types/supplier'
import type { ChangeEvent } from 'react'
import { useUpdateSupplier } from '../api/useUpdateSupplier'
import { buildSupplierPatch } from '../utils/buildSupplierPatch'
import { TYPE_ICONS, TYPE_TONES, supplierIcon, supplierTone } from '../utils/supplierTone'
import { useToast } from '@/app/providers/ToastContext'
import { conflictErrors, supplierErrorMessage, validateSupplierForm } from '../utils/validateSupplierForm'
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

/** Las etiquetas de rubro, una por tipo y cada una con su color. */
function TypeBadges({ types }: { types: SupplierType[] }) {
  return (
    <>
      {types.map((type) => (
        <Badge key={type} variant={TYPE_TONES[type]} icon={TYPE_ICONS[type]}>
          {SUPPLIER_TYPE_LABELS[type]}
        </Badge>
      ))}
    </>
  )
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
      <EmptyState
        card
        kind="no-results"
        title="No encontramos el proveedor que buscabas."
        action={
          <Link className="btn btn--secondary" to="/catalogos/proveedores">
            Volver al listado
          </Link>
        }
      >
        Puede que lo hayan eliminado.
      </EmptyState>
    )
  }

  if (error) {
    return (
      <EmptyState
        card
        kind="error"
        title="No se pudo cargar el proveedor."
        action={
          <Link className="btn btn--secondary" to="/catalogos/proveedores">
            Volver al listado
          </Link>
        }
      >
        {isApiError(error) ? error.message : 'Revisá la conexión e intentá de nuevo.'}
      </EmptyState>
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
        // CUIT o razón social repetidos: el mensaje va en su campo.
        const fieldErrors = conflictErrors(mutationError)
        if (fieldErrors) {
          setErrors(fieldErrors)
          return
        }
        showToast('error', supplierErrorMessage(mutationError, 'No se pudo actualizar el proveedor.'))
      }
    })
  }

  return (
    <>
      {/* Rediseño: el encabezado del detalle es el mismo panel azul del
          listado. Cambia la envoltura y las clases; los datos, el botón
          de volver y las acciones son los de antes. */}
      <div className="page-header page-header--foto" style={heroPhoto(fotoTaller)}>
        <div className="page-header__row">
          <div className="detail-header__left">
            <Link to="/catalogos/proveedores" className="back-link">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Proveedores
            </Link>

            {/* El cuadrado con las iniciales, en su tamaño grande y con
                el color del rubro: el mismo que se ve en el listado, así
                se reconoce que es el mismo proveedor. */}
            <Avatar
              name={supplier.legalName}
              icon={supplierIcon(supplier.supplierTypes)}
              tone={supplierTone(supplier.supplierTypes)}
              size="lg"
            />

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
                <TypeBadges types={supplier.supplierTypes} />
              </span>
            </div>
          </div>

          {/* --editing: en celular estos botones se esconden y los toman
              los del pie del formulario (ver form-actions--mobile). */}
          <div className={cn('detail-header__actions', isEditing && 'detail-header__actions--editing')}>
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
              supplierTypes: supplier.supplierTypes,
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

              {/* El tipo se define en el alta y no se puede cambiar: el
                  backend rechaza el PATCH si lo recibe. Por eso queda como
                  dato también en edición, con una aclaración al pie. */}
              <div className="field">
                <span className="field__label">Tipo</span>
                <span className="field__value field__value--badges">
                  <TypeBadges types={supplier.supplierTypes} />
                </span>
                {isEditing && (
                  <span className="form-field__hint">No se puede modificar.</span>
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

      {/* Sólo en celular: en una pantalla angosta los botones del panel
          quedan arriba de todo y, después de completar el formulario, había
          que volver a subir para guardar. */}
      {isEditing && (
        <div className="form-actions form-actions--mobile">
          <Button variant="outline" onClick={() => {setForm(null); setErrors({})}} disabled={isSaving}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handlePatch} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      )}
    </>
  )
}
