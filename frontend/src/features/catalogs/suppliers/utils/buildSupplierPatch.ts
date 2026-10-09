import { formatCuit } from "@/shared/lib/cuit";
import type { SupplierFormValues, SupplierUpdate, Supplier } from "../types/supplier";

/** Los opcionales que el contrato deja borrar mandando null. */
const CLEARABLE_FIELDS = ['cuit', 'contactName', 'contactEmail', 'contactPhone', 'address', 'observation'] as const

/**
 * Devuelve solo los campos que cambiaron. Recorta antes de comparar: un
 * espacio de mas no es un cambio real y no merece un PATCH.
 *
 * El tipo no entra: es inmutable y el backend rechaza el PATCH entero
 * si lo recibe.
 */
export function buildSupplierPatch(original: Supplier, values: SupplierFormValues):SupplierUpdate {
    const patch: SupplierUpdate = {}

    const legalName = values.legalName.trim()
    if (legalName !== original.legalName) {
        patch.legalName = legalName
    }

    for (const field of CLEARABLE_FIELDS) {
        // El CUIT viaja siempre como XX-XXXXXXXX-X, que es como lo exige y
        // lo devuelve el backend, aunque se haya escrito sin guiones.
        const value = field === 'cuit' ? formatCuit(values.cuit.trim()) : values[field].trim()
        // El `?? ''` normaliza el original: sin eso, undefined !== '' daria un
        // cambio fantasma en cada guardado de los campos opcionales vacios.
        if (value !== (original[field] ?? '')) {
            // Vaciar un campo es null, no '': el backend valida el formato de
            // lo que llega y un string vacio no pasa como CUIT ni como email.
            patch[field] = value === '' ? null : value
        }
    }
    return patch
}
