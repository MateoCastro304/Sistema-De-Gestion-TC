import { http, HttpResponse } from 'msw'
import { MODULE_ROLES } from '@/domain/roles'
import { apiError, validationError, type FieldError } from '@/shared/mocks/errors'
import { paginate, readPageOrError } from '@/shared/mocks/paging'
import { authorize } from '@/shared/mocks/session'
import { containsText, sameText } from '@/shared/mocks/text'
import type { Material, MaterialCreate } from '../types/material'

/**
 * MSW handlers de materiales (CU-37 Registrar, CU-39 Consultar), según el
 * contrato del Sprint 2 (§3.6). Para el Administrativo Técnico y el
 * Encargado de Cotización. Los datos son la semilla del prototipo
 * (`semilla().mat`) y se resetean al recargar la página.
 */

const ROLES = MODULE_ROLES.materials

const SEED_DATE = '2026-03-12T12:00:00.000Z'

const SEED: [string, string][] = [
  ['Acero', '1010'], ['Acero', '1045'], ['Acero', 'F-24'],
  ['Acero inoxidable', 'AISI 304'], ['Acero inoxidable', 'AISI 316'],
  ['Aluminio', '6061'], ['Aluminio', '7075'],
  ['Bronce', 'SAE 62'], ['Bronce', 'SAE 65'],
  ['Fundición gris', 'FG 20'],
  ['Nylon', 'PA 6'],
  ['POM', 'Acetal'],
  ['Teflón', 'PTFE'],
]

const db = {
  materials: SEED.map(([name, quality], index): Material => ({ id: index + 1, name, quality, createdAt: SEED_DATE })),
  nextId: SEED.length + 1,
}

const ALREADY_EXISTS = 'Ya existe un material registrado con ese nombre y calidad'

/** Por nombre y, dentro de cada nombre, por calidad con orden natural ("SAE 62" antes que "SAE 65"). */
function byNameAndQuality(a: Material, b: Material) {
  return a.name.localeCompare(b.name, 'es') || a.quality.localeCompare(b.quality, 'es', { numeric: true })
}

function distinctNames(): string[] {
  return [...new Set(db.materials.map((m) => m.name))].sort((a, b) => a.localeCompare(b, 'es'))
}

function validate(body: Partial<MaterialCreate>): FieldError[] {
  const errors: FieldError[] = []
  const name = body.name?.trim() ?? ''
  const quality = body.quality?.trim() ?? ''
  if (!name) errors.push({ field: 'name', message: 'Ingresá el material' })
  else if (name.length > 60) errors.push({ field: 'name', message: 'El material admite hasta 60 caracteres' })
  if (!quality) errors.push({ field: 'quality', message: 'Ingresá la calidad' })
  else if (quality.length > 60) errors.push({ field: 'quality', message: 'La calidad admite hasta 60 caracteres' })
  return errors
}

export const materialHandlers = [
  // Va antes de cualquier `/api/materials/:algo` que se sume después.
  http.get('/api/materials/names', ({ request }) => {
    const caller = authorize(request, ROLES)
    if (caller instanceof Response) return caller
    return HttpResponse.json({ items: distinctNames() })
  }),

  http.get('/api/materials', ({ request }) => {
    const caller = authorize(request, ROLES)
    if (caller instanceof Response) return caller
    const pageParams = readPageOrError(request)
    if (pageParams instanceof Response) return pageParams

    const query = new URL(request.url).searchParams
    const name = query.get('name')?.trim() ?? ''
    const quality = query.get('quality')?.trim() ?? ''
    const matching = db.materials
      // `name` es coincidencia exacta; `quality`, "contiene".
      .filter((m) => !name || sameText(m.name, name))
      .filter((m) => containsText(m.quality, quality))
      .sort(byNameAndQuality)
    return HttpResponse.json(paginate(matching, pageParams))
  }),

  http.post('/api/materials', async ({ request }) => {
    const caller = authorize(request, ROLES)
    if (caller instanceof Response) return caller

    const body = (await request.json()) as Partial<MaterialCreate>
    const errors = validate(body)
    if (errors.length > 0) return validationError(request, errors)

    const quality = body.quality!.trim()
    // Un nombre que ya existe se guarda con su grafía: "acero" queda "Acero" (D-37).
    const typedName = body.name!.trim()
    const name = distinctNames().find((existing) => sameText(existing, typedName)) ?? typedName

    if (db.materials.some((m) => sameText(m.name, name) && sameText(m.quality, quality))) {
      // Sobre `quality`: el nombre se repite, la calidad dentro de ese nombre no.
      return apiError(request, 409, ALREADY_EXISTS, {
        code: 'MATERIAL_ALREADY_EXISTS',
        details: [{ field: 'quality', message: ALREADY_EXISTS }],
      })
    }

    const created: Material = { id: db.nextId++, name, quality, createdAt: new Date().toISOString() }
    db.materials.push(created)
    return HttpResponse.json(created, { status: 201 })
  }),
]
