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
import { SUPPLIER_TYPES, SUPPLIER_TYPE_LABELS } from '../types/supplier'
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
  supplierTypes: [],
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
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

  /** Agrega o saca un tipo, manteniendo el orden de SUPPLIER_TYPES. */
  function toggleType(type: SupplierType) {
    setForm((current) => ({
      ...current,
      supplierTypes: SUPPLIER_TYPES.filter((option) =>
        option === type
          ? !current.supplierTypes.includes(option)
          : current.supplierTypes.includes(option),
      ),
    }))
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationErrors = validateSupplierForm(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    mutate(toSupplierCreate(form), {
      onSuccess: (created) => {
        showToast('success', 'Proveedor creado exitosamente.')
        navigate(`/catalogos/proveedores/${created.id}`)
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
              <p className="page-header__subtitle">Registrá los datos del proveedor.</p>
            </div>
          </div>
        </div>
      </div>

      <section className="card">
        <h2 className="card__title">Datos generales</h2>

        <div className="card__grid">
          <Input
            id="legalName"
            name="legalName"
            label="Razón social"
            full
            maxLength={120}
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

          {/* Un proveedor puede tener varios tipos, así que son casillas y
              no un desplegable. El <label> envuelve la casilla: tocar el
              texto también la alterna. */}
          <div
            className={cn('form-field', 'card__full', errors.supplierTypes && 'form-field--error')}
            role="group"
            aria-labelledby="supplierTypes-label"
          >
            <span className="form-field__label" id="supplierTypes-label">
              Tipo
            </span>
            <div className="check-group">
              {SUPPLIER_TYPES.map((type) => (
                <label
                  key={type}
                  className={cn(
                    'check-option',
                    form.supplierTypes.includes(type) && 'check-option--on',
                  )}
                >
                  <CheckBox
                    checked={form.supplierTypes.includes(type)}
                    onChange={() => toggleType(type)}
                  />
                  <EntityIcon name={TYPE_ICONS[type]} />
                  {SUPPLIER_TYPE_LABELS[type]}
                </label>
              ))}
            </div>
            {errors.supplierTypes ? (
              <span className="form-field__error">{errors.supplierTypes}</span>
            ) : (
              <span className="form-field__hint">
                Elegí uno o más. Después del alta no se puede cambiar.
              </span>
            )}
          </div>

          <Input
            id="address"
            name="address"
            label="Dirección"
            full
            maxLength={200}
            value={form.address}
            onChange={handleChange}
            error={errors.address}
          />
        </div>
      </section>

      <section className="card">
        <h2 className="card__title">Contacto</h2>

        <div className="card__grid">
          <Input
            id="contactName"
            name="contactName"
            label="Persona de contacto"
            maxLength={120}
            value={form.contactName}
            onChange={handleChange}
            error={errors.contactName}
          />

          <Input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            label="Teléfono"
            maxLength={40}
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
            maxLength={120}
            value={form.contactEmail}
            onChange={handleChange}
            error={errors.contactEmail}
          />
        </div>
      </section>

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
    </form>
  )
}
