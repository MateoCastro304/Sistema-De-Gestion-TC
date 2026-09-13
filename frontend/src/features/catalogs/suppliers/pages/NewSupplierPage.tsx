import { useState } from 'react'
import type { ChangeEvent, SubmitEvent } from 'react'
import { useNavigate } from 'react-router'
import { Button, Input } from '@/shared/components/ui'
import { isApiError } from '@/shared/api/ApiError'
import { useToast } from '@/app/providers/ToastContext'
import { useCreateSupplier } from '../api/useCreateSupplier'
import { SUPPLIER_TYPES } from '../types/supplier'
import type { SupplierFormValues } from '../types/supplier'
import { toSupplierCreate, validateSupplierForm } from '../utils/validateSupplierForm'
import type { SupplierFormErrors } from '../utils/validateSupplierForm'

/** Fuera del componente: es constante y no tiene por que recrearse por render. */
const EMPTY_FORM: SupplierFormValues = {
  legalName: '',
  cuit: '',
  supplierType: 'Material',
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

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationErrors = validateSupplierForm(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    mutate(toSupplierCreate(form), {
      onSuccess: (created) => {
        showToast('success', 'Proveedor creado exitosamente.')
        navigate(`/catalogs/suppliers/${created.id}`)
      },
      onError: (error) => {
        // CUIT repetido: el mensaje pertenece al campo, no a un toast suelto.
        if (isApiError(error) && error.isConflict) {
          setErrors({ cuit: error.message })
          return
        }
        showToast(
          'error',
          isApiError(error) ? error.message : 'Ocurrió un error inesperado.',
        )
      },
    })
  }

  return (
    // card-stack: el <form> es un unico hijo de .content y no hereda su gap.
    // noValidate: apaga los mensajes del navegador para que ganen los nuestros.
    <form onSubmit={handleSubmit} noValidate className="card-stack">
      <div className="content__heading">
        <div>
          <h1 className="content__title">Nuevo proveedor</h1>
          <p className="content__subtitle">Datos del proveedor a registrar</p>
        </div>
      </div>

      <section className="form-card">
        <h2 className="form-card__title">Datos generales</h2>

        <div className="form-grid">
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

          {/* El <select> no lo cubre <Input>, va a mano con las mismas clases. */}
          <div className="form-field">
            <label className="form-field__label" htmlFor="supplierType">
              Tipo
            </label>
            <select
              id="supplierType"
              name="supplierType"
              className="form-field__select"
              value={form.supplierType}
              onChange={handleChange}
            >
              {SUPPLIER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
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

      <section className="form-card">
        <h2 className="form-card__title">Contacto</h2>

        <div className="form-grid">
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
          onClick={() => navigate('/catalogs/suppliers')}
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
