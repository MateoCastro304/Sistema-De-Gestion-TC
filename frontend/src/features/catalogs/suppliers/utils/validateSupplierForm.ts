import type { SupplierFormCreateValues, SupplierCreate, SupplierFormEditValues } from "../types/supplier";

export type SupplierFormErrors = Partial<Record<keyof SupplierFormCreateValues, string>>

const CUIT_PATTERN = /^\d{2}-\d{8}-\d$/

/** Digitos y los signos de formato habituales. Nada de letras. */
const PHONE_PATTERN = /^[\d\s+()-]+$/

export function validateSupplierEditForm(values: SupplierFormEditValues): SupplierFormErrors {
    const errors: SupplierFormErrors = {}
    const phone = values.contactPhone.trim()

    if (phone) {
        if (!PHONE_PATTERN.test(phone)) {
            errors.contactPhone = 'El teléfono solo admite números, espacios y los signos + ( ) -'
            // Saca todo lo que no sea digito y cuenta: evita un "+54" solo.
        } else if (phone.replace(/\D/g, '').length < 8) {
            errors.contactPhone = 'El teléfono parece incompleto.'
        }
    }

    if (!values.legalName.trim()) {
        errors.legalName = 'La razón social es obligatoria.'
    }

    const email = values.contactEmail.trim()
    if (email && !email.includes('@')) {
        errors.contactEmail = 'El email no parece válido.'
    }

    return errors
}
export function validateSupplierForm(values: SupplierFormCreateValues): SupplierFormErrors {
    // Reusa las reglas comunes y suma el CUIT, que solo existe en el alta.
    const errors = validateSupplierEditForm(values)

    if (!CUIT_PATTERN.test(values.taxId.trim())) {
        errors.taxId = 'El CUIT debe tener el formato XX-XXXXXXXX-X.'
    }
    return errors
}
export function toSupplierCreate(values: SupplierFormCreateValues): SupplierCreate {
    return {
        legalName: values.legalName.trim(),
        taxId: values.taxId.trim(),
        supplierType: values.supplierType,
        // `||` y no `??` a proposito: aca '' significa "no cargo nada" y se
        // convierte en undefined, que JSON.stringify descarta del payload.
        contactName: values.contactName.trim() || undefined,
        contactEmail: values.contactEmail.trim() || undefined,
        contactPhone: values.contactPhone.trim() || undefined,
        address: values.address.trim() || undefined,
    }
}