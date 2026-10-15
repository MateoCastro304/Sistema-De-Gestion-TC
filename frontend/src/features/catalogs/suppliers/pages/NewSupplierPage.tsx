import { useState } from 'react'
import type { ChangeEvent, SubmitEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { heroPhoto } from '@/shared/lib/heroPhoto'
import fotoTaller from '@/assets/foto-brida.webp'
import { Button, CheckBox, EntityIcon, Input } from '@/shared/components/ui'
import { TYPE_ICONS } from '../utils/supplierTone'
import { cn } from '@/shared/lib/cn'
import { useToast } from '@/app/providers/ToastContext'
import { useCreateSupplier } from '../api/useCreateSupplier'
import { SUPPLIER_MAX_LENGTH, SUPPLIER_TYPES, SUPPLIER_TYPE_LABELS } from '../types/supplier'
import type { SupplierFormValues, SupplierType } from '../types/supplier'
import {
  conflictErrors,
  supplierErrorMessage,
  toSupplierCreate,
  validateSupplierForm,
} from '../utils/validateSupplierForm'
import type { SupplierFormErrors } from '../utils/validateSupplierForm'

/** Fuera del componente: es constante y no tiene por que recrearse por render. */
const EMPTY_FORM: SupplierFormValues = {
  legalName: '',
  cuit: '',
  // Vacio a proposito: el tipo no se puede cambiar despues, asi que no se
  // preselecciona ninguno y el usuario lo elige a conciencia.
  supplierType: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  observation: '',
}

export function NewSupplierPage() {
  const [form, setForm] = useState<SupplierFormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<SupplierFormErrors>({})
  const { mutate, isPending: isSaving } = useCreateSupplier()
  const showToast = useToast()
  const navigate = useNavigate()

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  /** Elige el tipo. Es uno solo: marcar otro reemplaza al anterior. */
  function selectType(type: SupplierType) {
    setForm((current) => ({ ...current, supplierType: type }))
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationErrors = validateSupplierForm(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    mutate(toSupplierCreate(form), {
      onSuccess: (created) => {
        showToast('success', 'Proveedor creado exitosamente.')
        void navigate(`/catalogos/proveedores/${created.id}`)
      },
      onError: (error) => {
        // CUIT o razón social repetidos: el mensaje pertenece al campo,
        // no a un toast suelto.
        const fieldErrors = conflictErrors(error)
        if (fieldErrors) {
          setErrors(fieldErrors)
          return
        }
        showToast('error', supplierErrorMessage(error, 'No se pudo crear el proveedor.'))
      },
    })
  }

  return (
    // card-stack: el <form> es un unico hijo de .content y no hereda su gap.
    // noValidate: apaga los mensajes del navegador para que ganen los nuestros.
    <form onSubmit={handleSubmit} noValidate className="card-stack">
      {/* Rediseño: el mismo panel azul del listado y del detalle, para
          que las tres pantallas de Proveedores se lean como una sola. */}
      <div className="page-header page-header--foto" style={heroPhoto(fotoTaller)}>
        <div className="page-header__row">
          {/* La flecha redonda de volver, igual que en "Nuevo encargado" y
              "Nueva fábrica": era la única pantalla de alta sin ella. */}
          <div className="detail-header__left">
            <Link to="/catalogos/proveedores" className="back-link">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Proveedores
            </Link>
            <div>
              <h1 className="page-header__title">Nuevo proveedor</h1>
              <p className="page-header__subtitle">Datos del proveedor a registrar.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Una sola tarjeta con las dos secciones y los botones al pie,
          como en el prototipo. */}
      <section className="card card--form">
        <div className="form-section">
          <h2 className="card__title">Datos generales</h2>

          <div className="card__grid card__grid--2">
            <Input
              id="legalName"
              name="legalName"
              label="Razón social"
              full
              maxLength={SUPPLIER_MAX_LENGTH.legalName}
              value={form.legalName}
              onChange={handleChange}
              error={errors.legalName}
            />

            <Input
              id="cuit"
              name="cuit"
              label="CUIT"
              maxLength={13}
              value={form.cuit}
              onChange={handleChange}
              error={errors.cuit}
              hint="Formato XX-XXXXXXXX-X"
            />

            {/* Al lado del CUIT, como en el prototipo. */}
            <Input
              id="address"
              name="address"
              label="Dirección"
              maxLength={SUPPLIER_MAX_LENGTH.address}
              value={form.address}
              onChange={handleChange}
              error={errors.address}
            />

            {/* Un proveedor tiene un solo tipo: las casillas se comportan
                como opciones excluyentes. El <label> envuelve la casilla:
                tocar el texto también la elige. */}
            <div
              className={cn('form-field', 'card__full', errors.supplierType && 'form-field--error')}
              role="group"
              aria-labelledby="supplierType-label"
            >
              <span className="form-field__label" id="supplierType-label">
                Tipo
              </span>
              <div className="check-group">
                {SUPPLIER_TYPES.map((type) => (
                  <label
                    key={type}
                    className={cn(
                      'check-option',
                      form.supplierType === type && 'check-option--on',
                    )}
                  >
                    <CheckBox
                      checked={form.supplierType === type}
                      onChange={() => selectType(type)}
                    />
                    <EntityIcon name={TYPE_ICONS[type]} />
                    {SUPPLIER_TYPE_LABELS[type]}
                  </label>
                ))}
              </div>
              {errors.supplierType ? (
                <span className="form-field__error">{errors.supplierType}</span>
              ) : (
                <span className="form-field__hint">
                  Elegí uno. Después del alta no se puede cambiar.
                </span>
              )}
            </div>

            <Input
              id="observation"
              name="observation"
              label="Observación"
              full
              maxLength={SUPPLIER_MAX_LENGTH.observation}
              value={form.observation}
              onChange={handleChange}
              error={errors.observation}
            />
          </div>
        </div>

        <div className="form-section">
          <h2 className="card__title">Contacto</h2>

          <div className="card__grid card__grid--2">
            <Input
              id="contactName"
              name="contactName"
              label="Persona de contacto"
              maxLength={SUPPLIER_MAX_LENGTH.contactName}
              value={form.contactName}
              onChange={handleChange}
              error={errors.contactName}
            />

            <Input
              id="contactPhone"
              name="contactPhone"
              type="tel"
              label="Teléfono"
              maxLength={SUPPLIER_MAX_LENGTH.contactPhone}
              value={form.contactPhone}
              onChange={handleChange}
              error={errors.contactPhone}
            />

            <Input
              id="contactEmail"
              name="contactEmail"
              type="email"
              label="Email"
              full
              maxLength={SUPPLIER_MAX_LENGTH.contactEmail}
              value={form.contactEmail}
              onChange={handleChange}
              error={errors.contactEmail}
            />
          </div>
        </div>

        <div className="form-actions">
          <Button
            variant="outline"
            onClick={() => navigate('/catalogos/proveedores')}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Creando…' : 'Crear proveedor'}
          </Button>
        </div>
      </section>
    </form>
  )
}
