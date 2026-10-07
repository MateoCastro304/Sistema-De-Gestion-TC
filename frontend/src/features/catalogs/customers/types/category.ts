/**
 * Rubro (business sector) a factory belongs to. Es un catálogo con su propio
 * ABMC (CU-41..44), a cargo de otra persona: este feature SOLO lo consume (lee
 * la lista) para el selector de la fábrica. Por eso acá no hay tipo de alta ni
 * de edición. Los rubros semilla incluyen "Particular" (clientes no empresa).
 */
export interface Category {
  id: string
  name: string
  /** Logical-delete flag. */
  isActive: boolean
}
