import { http, HttpResponse } from 'msw'
import { MODULE_ROLES } from '@/domain/roles'
import { apiError, validationError, type FieldError } from '@/shared/mocks/errors'
import { paginate, readPageOrError, readPathId } from '@/shared/mocks/paging'
import { authorize } from '@/shared/mocks/session'
import { containsText } from '@/shared/mocks/text'
import { findUserByEmployee, sortRoles, statusOf } from '@/features/catalogs/users/api/users.db'
import {
  EMPLOYEE_POSITIONS,
  EMPLOYEE_POSITION_LABELS,
  type Employee,
  type EmployeeCreate,
} from '../types/employee'
import { employeesDb, findEmployee, type EmployeeRow } from './employees.db'

/**
 * MSW handlers de empleados (CU-45 Registrar, CU-47 Consultar), según el
 * contrato del Sprint 2 (§3.2). Sólo para el Administrador del Sistema.
 */

const ROLES = MODULE_ROLES.employees
const MAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Con el resumen de su usuario, como un JOIN del backend. */
function toEmployeeResponse(row: EmployeeRow): Employee {
  const user = findUserByEmployee(row.id)
  return {
    ...row,
    user: user ? { id: user.id, username: user.username, roles: sortRoles(user.roles), status: statusOf(user) } : null,
  }
}

/** Texto recortado; vacío pasa a `null`, como guarda el backend. */
const optional = (value: string | null | undefined) => value?.trim() || null

function validate(body: Partial<EmployeeCreate>): FieldError[] {
  const errors: FieldError[] = []
  const firstName = body.firstName?.trim() ?? ''
  const lastName = body.lastName?.trim() ?? ''
  const dni = body.dni?.trim() ?? ''
  const email = optional(body.email)

  if (!firstName) errors.push({ field: 'firstName', message: 'Ingresá el nombre' })
  else if (firstName.length > 100) errors.push({ field: 'firstName', message: 'El nombre admite hasta 100 caracteres' })
  if (!lastName) errors.push({ field: 'lastName', message: 'Ingresá el apellido' })
  else if (lastName.length > 100) errors.push({ field: 'lastName', message: 'El apellido admite hasta 100 caracteres' })
  if (!dni) errors.push({ field: 'dni', message: 'Ingresá el DNI' })
  else if (!/^\d{7,8}$/.test(dni)) errors.push({ field: 'dni', message: 'El DNI tiene que tener 7 u 8 números' })
  if (!body.position) errors.push({ field: 'position', message: 'Elegí el puesto' })
  else if (!EMPLOYEE_POSITIONS.includes(body.position)) errors.push({ field: 'position', message: 'Elegí un puesto de la lista' })
  if ((optional(body.address)?.length ?? 0) > 200) {
    errors.push({ field: 'address', message: 'La dirección admite hasta 200 caracteres' })
  }
  if (email && (!MAIL_RE.test(email) || email.length > 120)) {
    errors.push({ field: 'email', message: 'Revisá el formato del email' })
  }
  if ((optional(body.phone)?.length ?? 0) > 50) {
    errors.push({ field: 'phone', message: 'El teléfono admite hasta 50 caracteres' })
  }
  return errors
}

export const employeeHandlers = [
  http.get('/api/employees', ({ request }) => {
    const caller = authorize(request, ROLES)
    if (caller instanceof Response) return caller
    const pageParams = readPageOrError(request)
    if (pageParams instanceof Response) return pageParams

    const query = new URL(request.url).searchParams
    const search = query.get('search')?.trim() ?? ''
    const includeInactive = query.get('includeInactive') === 'true'
    const hasUser = query.get('hasUser')

    const matching = employeesDb.employees
      .filter((e) => includeInactive || e.active)
      .filter((e) => hasUser === null || Boolean(findUserByEmployee(e.id)) === (hasUser === 'true'))
      // Nombre, apellido, DNI o el rótulo del puesto ("jefe" encuentra a los jefes).
      .filter(
        (e) =>
          !search ||
          [e.firstName, e.lastName, `${e.firstName} ${e.lastName}`, e.dni, EMPLOYEE_POSITION_LABELS[e.position]].some(
            (text) => containsText(text, search),
          ),
      )
      .sort((a, b) => a.lastName.localeCompare(b.lastName, 'es') || a.firstName.localeCompare(b.firstName, 'es'))

    return HttpResponse.json(paginate(matching.map(toEmployeeResponse), pageParams))
  }),

  http.get('/api/employees/:employeeId', ({ request, params }) => {
    const caller = authorize(request, ROLES)
    if (caller instanceof Response) return caller
    const id = readPathId(request, params.employeeId, 'employeeId', 'El identificador del empleado no es válido.')
    if (id instanceof Response) return id

    const employee = findEmployee(id)
    if (!employee) {
      return apiError(request, 404, 'No se encontró el empleado solicitado.', { code: 'EMPLOYEE_NOT_FOUND' })
    }
    // Un dado de baja también se devuelve, con active: false.
    return HttpResponse.json(toEmployeeResponse(employee))
  }),

  http.post('/api/employees', async ({ request }) => {
    const caller = authorize(request, ROLES)
    if (caller instanceof Response) return caller

    const body = (await request.json()) as Partial<EmployeeCreate>
    const errors = validate(body)
    if (errors.length > 0) return validationError(request, errors)

    const dni = body.dni!.trim()
    // Único entre todos, incluidos los dados de baja (D-15).
    if (employeesDb.employees.some((e) => e.dni === dni)) {
      const message = 'Ya existe un empleado con ese DNI'
      return apiError(request, 409, message, { code: 'EMPLOYEE_DNI_TAKEN', details: [{ field: 'dni', message }] })
    }

    const now = new Date().toISOString()
    const created: EmployeeRow = {
      id: employeesDb.nextId++,
      firstName: body.firstName!.trim(),
      lastName: body.lastName!.trim(),
      dni,
      position: body.position!,
      address: optional(body.address),
      email: optional(body.email),
      phone: optional(body.phone),
      // Queda activo y sin usuario.
      active: true,
      createdAt: now,
      updatedAt: now,
    }
    employeesDb.employees.push(created)
    return HttpResponse.json(toEmployeeResponse(created), { status: 201 })
  }),
]
