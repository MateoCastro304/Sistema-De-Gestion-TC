/**
 * Material (CU-37 Registrar, CU-39 Consultar), con la forma del contrato del
 * Sprint 2 (§3.6). Se identifica por nombre y calidad: "Acero 1010" y
 * "Acero 1045" son dos materiales distintos. El catálogo no guarda precio,
 * proveedor ni presentación: eso se elige al cotizar.
 */

export interface Material {
  id: number
  /** "Acero", "Bronce", "Nylon". */
  name: string
  /** "1045", "SAE 65", "AISI 304". */
  quality: string
  createdAt: string
}

export interface MaterialCreate {
  name: string
  quality: string
}

export interface MaterialListParams {
  page?: number
  limit?: number
  /** Coincidencia exacta, sin distinguir mayúsculas ni acentos. */
  name?: string
  /** "Contiene", sin distinguir mayúsculas ni acentos. */
  quality?: string
}
