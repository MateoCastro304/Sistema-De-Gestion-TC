/**
 * Rubros de un proveedor, con los valores del contrato
 * (docs/openapi/components/schemas/Supplier.yaml). Viajan así por la red;
 * en pantalla se muestran con SUPPLIER_TYPE_LABELS.
 */
export type SupplierType = 'PROCESS' | 'REPLACEMENT' | 'MATERIAL' | 'PAINT'

/**
 * Los cuatro tipos como valor, en el orden en que se ofrecen en el alta.
 * Tipado como SupplierType[]: si el union cambia y esta lista no, deja de
 * compilar.
 */
export const SUPPLIER_TYPES: SupplierType[] = ['MATERIAL', 'PROCESS', 'REPLACEMENT', 'PAINT']

/** Texto en pantalla de cada tipo. El Record obliga a cubrir los cuatro. */
export const SUPPLIER_TYPE_LABELS: Record<SupplierType, string> = {
    MATERIAL: 'Material',
    PROCESS: 'Tercerizado',
    REPLACEMENT: 'Repuesto',
    PAINT: 'Pintura',
}

/** Lo que devuelve el backend en GET /suppliers y GET /suppliers/:id. */
export interface Supplier {
    id: number
    legalName: string
    cuit?: string
    /**
     * Rubros del proveedor. Siempre al menos uno, y puede haber varios: es
     * común que el mismo proveedor venda material y además tercerice.
     * Se definen en el alta y después no se pueden cambiar.
     */
    supplierTypes: SupplierType[]
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
    supplierTypes: SupplierType[]
    contactName?: string
    contactEmail?: string
    contactPhone?: string
    address?: string
}
/**
 * Lo que se manda en PATCH /suppliers/:id. Sólo los campos que cambian.
 * `null` en un opcional significa "borrar el dato". Sin supplierTypes: el
 * backend los rechaza porque son inmutables.
 */
export interface SupplierUpdate {
    legalName?: string
    cuit?: string | null
    contactName?: string | null
    contactEmail?: string | null
    contactPhone?: string | null
    address?: string | null
}

/**
 * Valores del formulario. Strings obligatorios y nunca undefined: un input
 * controlado que arranca en undefined y despues recibe texto rompe en React.
 */
export interface SupplierFormValues {
    cuit: string
    legalName: string
    supplierTypes: SupplierType[]
    contactName: string
    contactEmail: string
    contactPhone: string
    address: string
}
