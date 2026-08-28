/**Interfaz de los datos del proveedor que me llegan del back */
/** Lo que devuelve el backend en GET /suppliers y GET /suppliers/:id. */
export type SupplierType = 'Tercerizado' | 'Material' | 'Repuesto' | 'Pintura'

/**
 * Los cuatro tipos como valor, para poblar los <select> de los formularios.
 * Está tipado como SupplierType[], así que si el union cambia y esta lista
 * no, deja de compilar.
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
 * Lo que se manda en PATCH /suppliers/:id.
 * Todo opcional (se mandan solo los campos que cambiaron) y sin taxId,
 * que el contrato define como no modificable.
 */
export interface SupplierUpdate {
    legalName?: string
    supplierType?: SupplierType
    contactName?: string
    contactEmail?: string
    contactPhone?: string
    address?: string
    active?: boolean
}
