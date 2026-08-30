/**Interfaz de los datos del proveedor que me llegan del back */
/** Lo que devuelve el backend en GET /suppliers y GET /suppliers/:id. */
export type SupplierType = 'Tercerizado' | 'Material' | 'Repuesto' | 'Pintura'

/**
 * Los cuatro tipos como valor, para los <select>. Tipado como SupplierType[]:
 * si el union cambia y esta lista no, deja de compilar.
 */
export const SUPPLIER_TYPES: SupplierType[] = [
    'Tercerizado',
    'Material',
    'Repuesto',
    'Pintura',
]

export interface Supplier {
    id: number
    legalName: string
    /** CUIT argentino, formato XX-XXXXXXXX-X. Inmutable: identidad fiscal. */
    taxId: string
      /** Rubro del proveedor. */
    supplierType: SupplierType
    contactName?: string
    contactEmail?: string
    contactPhone?: string
    address?: string
    active: boolean
    /** ISO 8601. Llega como string: JSON no tiene tipo fecha. */
    createdAt: string
    updatedAt: string
}
/**
 * Lo que se manda en POST /suppliers.
 * Sin id ni fechas: los genera el backend.
 */
export interface SupplierCreate {
    legalName: string
    taxId: string
    supplierType: SupplierType
    contactName?: string
    contactEmail?: string
    contactPhone?: string
    address?: string
}
/**
 * PATCH /suppliers/:id. Todo opcional (van solo los campos que cambiaron) y
 * sin taxId, que el contrato define como no modificable.
 */
export interface SupplierUpdate {
    legalName?: string
    supplierType?: SupplierType
    contactName?: string
    contactEmail?: string
    contactPhone?: string
    address?: string
}

/**
 * Valores del formulario. Strings obligatorios y nunca undefined: un input
 * controlado que arranca en undefined y despues recibe texto rompe en React.
 */
export interface SupplierFormEditValues {
    legalName: string
    supplierType: SupplierType
    contactName: string
    contactEmail: string
    contactPhone: string
    address: string
}

/** El alta es la edicion mas el CUIT, que solo se define al crear. */
export interface SupplierFormCreateValues extends SupplierFormEditValues {
    taxId: string
}
