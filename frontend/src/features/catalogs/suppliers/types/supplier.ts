/**
 * Tipos de proveedor, con los valores del contrato
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

/** Lo que devuelve el backend en GET /suppliers/:id y en cada item del listado. */
export interface Supplier {
    id: number
    legalName: string
    cuit?: string
    /**
     * Tipo del proveedor. Exactamente uno: se define en el alta y después
     * no se puede cambiar.
     */
    supplierType: SupplierType
    contactName?: string
    contactEmail?: string
    contactPhone?: string
    address?: string
    observation?: string
    active: boolean
    /** ISO 8601. Llega como string: JSON no tiene tipo fecha. */
    createdAt: string
    updatedAt: string
}

/**
 * Filtros de GET /suppliers. El backend busca y pagina; `search` es el
 * único cuadro de texto y matchea razón social, contacto o CUIT.
 */
export interface SupplierListParams {
    page?: number
    /** Máximo 100: el backend rechaza con 400 un valor más grande. */
    limit?: number
    type?: SupplierType
    search?: string
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
    observation?: string
}
/**
 * Lo que se manda en PATCH /suppliers/:id. Sólo los campos que cambian.
 * `null` en un opcional significa "borrar el dato". Sin supplierType: el
 * backend lo rechaza porque es inmutable.
 */
export interface SupplierUpdate {
    legalName?: string
    cuit?: string | null
    contactName?: string | null
    contactEmail?: string | null
    contactPhone?: string | null
    address?: string | null
    observation?: string | null
}

/**
 * Valores del formulario. Strings obligatorios y nunca undefined: un input
 * controlado que arranca en undefined y despues recibe texto rompe en React.
 */
export interface SupplierFormValues {
    cuit: string
    legalName: string
    /** '' = todavía no eligió ninguno (sólo pasa en el alta). */
    supplierType: SupplierType | ''
    contactName: string
    contactEmail: string
    contactPhone: string
    address: string
    observation: string
}

/**
 * Largos máximos del contrato (components/schemas/Supplier.yaml). Los inputs
 * los usan como maxLength para que el backend no devuelva un 400 por largo.
 */
export const SUPPLIER_MAX_LENGTH = {
    legalName: 80,
    contactName: 150,
    contactEmail: 120,
    contactPhone: 50,
    address: 255,
    observation: 255,
} as const
