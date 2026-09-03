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
    cuit?: string
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
    cuit?: string
    supplierType: SupplierType
    contactName?: string
    contactEmail?: string
    contactPhone?: string
    address?: string
}
export interface SupplierUpdate {
    cuit?: string
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
export interface SupplierFormValues {
    cuit: string
    legalName: string
    supplierType: SupplierType
    contactName: string
    contactEmail: string
    contactPhone: string
    address: string
}
