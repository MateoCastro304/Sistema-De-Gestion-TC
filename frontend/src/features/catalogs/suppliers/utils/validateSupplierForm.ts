import { isApiError } from "@/shared/api/ApiError";
import { cuitDigits, hasCuitLength, isValidCuit } from "@/shared/lib/cuit";
import type { SupplierCreate, SupplierFormValues } from "../types/supplier";

export type SupplierFormErrors = Partial<Record<keyof SupplierFormValues, string>>

/** Digitos y los separadores que el backend descarta: espacios, + ( ) - y punto. */
const PHONE_PATTERN = /^\+?[\d\s().-]+$/

/** Algo, arroba, algo, punto, algo. El backend valida el formato completo. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateSupplierForm(values: SupplierFormValues): SupplierFormErrors {
    const errors: SupplierFormErrors = {}
    const phone = values.contactPhone.trim()
    const cuit = values.cuit.trim()
    if (cuit) {
        // Mismas reglas que el backend: 11 digitos, prefijo y verificador.
        if (!hasCuitLength(cuit)) {
            errors.cuit = 'El CUIT debe tener 11 dígitos.'
        } else if (!isValidCuit(cuitDigits(cuit))) {
            errors.cuit = 'El CUIT no es válido (prefijo o dígito verificador).'
        }
    }
    if (phone) {
        // Mismos limites que el backend: entre 8 y 15 digitos (E.164).
        const digits = phone.replace(/\D/g, '').length
        if (!PHONE_PATTERN.test(phone)) {
            errors.contactPhone = 'El teléfono solo admite números, espacios y los signos + ( ) - .'
        } else if (digits < 8) {
            errors.contactPhone = 'El teléfono parece incompleto.'
        } else if (digits > 15) {
            errors.contactPhone = 'El teléfono no puede tener más de 15 dígitos.'
        }
    }

    if (!values.legalName.trim()) {
        errors.legalName = 'La razón social es obligatoria.'
    }

    if (values.supplierTypes.length === 0) {
        errors.supplierTypes = 'Elegí al menos un tipo.'
    }

    const email = values.contactEmail.trim()
    if (email && !EMAIL_PATTERN.test(email)) {
        errors.contactEmail = 'El email no parece válido.'
    }

    return errors
}

/**
 * Un 409 dice que choco el CUIT o la razon social. El backend manda cual
 * en `field`; el mensaje se escribe aca porque el suyo viene en ingles.
 * Devuelve null si el error no es un conflicto de esos dos campos.
 */
export function conflictErrors(error: unknown): SupplierFormErrors | null {
    if (!isApiError(error) || !error.isConflict) return null
    if (error.field === 'legalName') {
        return { legalName: 'Ya existe un proveedor con esa razón social.' }
    }
    if (error.field === 'cuit') {
        return { cuit: 'Ya existe un proveedor con ese CUIT.' }
    }
    return null
}

/**
 * Mensaje para el toast cuando falla un guardado que no es un conflicto de
 * campo. El backend manda sus mensajes en ingles ("CUIT check digit is
 * invalid"), asi que solo se muestran tal cual los de red o de servidor,
 * que http.ts ya arma en español.
 */
export function supplierErrorMessage(error: unknown, fallback: string): string {
    if (isApiError(error) && (error.isNetworkError || error.isServer)) return error.message
    if (isApiError(error) && error.isNotFound) return 'El proveedor ya no existe.'
    return fallback
}

export function toSupplierCreate(values: SupplierFormValues): SupplierCreate {
    return {
        legalName: values.legalName.trim(),
        cuit: values.cuit.trim() || undefined,
        supplierTypes: values.supplierTypes,
        // `||` y no `??` a proposito: aca '' significa "no cargo nada" y se
        // convierte en undefined, que JSON.stringify descarta del payload.
        contactName: values.contactName.trim() || undefined,
        contactEmail: values.contactEmail.trim() || undefined,
        contactPhone: values.contactPhone.trim() || undefined,
        address: values.address.trim() || undefined,
    }
}
