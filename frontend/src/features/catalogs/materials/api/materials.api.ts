import { http } from '@/shared/api/http'
import type { Page } from '@/shared/api/pagination'
import type { Material, MaterialCreate, MaterialListParams } from '../types/material'

const MATERIALS = '/materials'

/** CU-39 Listado de materiales: filtro por material, búsqueda por calidad y página. */
export async function listMaterials(params?: MaterialListParams): Promise<Page<Material>> {
  const { data } = await http.get<Page<Material>>(MATERIALS, { params })
  return data
}

/**
 * Cantidad del encabezado ("13 materiales registrados"): `limit=1` sin
 * filtros y se toma `total` (contrato §3.6).
 */
export async function countMaterials(): Promise<number> {
  const { total } = await listMaterials({ page: 1, limit: 1 })
  return total
}

/**
 * Los nombres de material distintos, en orden alfabético: las opciones del
 * filtro "Todos los materiales" y del campo "Material" del alta. No se pagina
 * (D-38): son unas decenas como mucho. La API responde `{ items }` y acá se
 * devuelve directamente la lista.
 */
export async function listMaterialNames(): Promise<string[]> {
  const { data } = await http.get<{ items: string[] }>(`${MATERIALS}/names`)
  return data.items
}

/**
 * CU-37 Registrar material: `201` con el material creado. Si el nombre ya
 * existe con otra grafía ("acero"), la API lo guarda con la del existente
 * ("Acero", D-37). Un nombre y calidad repetidos → `409 MATERIAL_ALREADY_EXISTS`
 * sobre `quality`.
 */
export async function createMaterial(input: MaterialCreate): Promise<Material> {
  const { data } = await http.post<Material>(MATERIALS, input)
  return data
}