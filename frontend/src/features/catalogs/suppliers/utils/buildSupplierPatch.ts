import type { SupplierFormEditValues, SupplierUpdate, Supplier } from "../types/supplier";
/**
 * Devuelve solo los campos que cambiaron. Recorta antes de comparar: un
 * espacio de mas no es un cambio real y no merece un PATCH.
 */
export function buildSupplierPatch(original: Supplier, values: SupplierFormEditValues):SupplierUpdate {
    const patch: SupplierUpdate = {}

    const legalName = values.legalName.trim()
    if (legalName !== original.legalName) {
        patch.legalName = legalName
    }

    if (values.supplierType !== original.supplierType) {
    patch.supplierType = values.supplierType
    }

    // El `?? ''` normaliza el original: sin eso, undefined !== '' daria un
    // cambio fantasma en cada guardado de los campos opcionales vacios.
    const contactName = values.contactName.trim()
    if (contactName !== (original.contactName ?? '')) {
        patch.contactName = contactName
    }

    const contactEmail = values.contactEmail.trim()
    if (contactEmail !== (original.contactEmail ?? '')) {
        patch.contactEmail = contactEmail
    }

    const address = values.address.trim()
    if (address !== (original.address ?? '')) {
        patch.address = address
    }

    const contactPhone = values.contactPhone.trim()
    if (contactPhone !== (original.contactPhone ?? '')) {
        patch.contactPhone = contactPhone
    }
    return patch
} 
