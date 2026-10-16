import { http, HttpResponse } from 'msw'
import { MODULE_ROLES, ROLE_ORDER, type Rol } from '@/domain/roles'
import { apiError, validationError, type FieldError } from '@/shared/mocks/errors'
import { paginate, readPageOrError, readPathId } from '@/shared/mocks/paging'
import { authorize } from '@/shared/mocks/session'
import { containsText } from '@/shared/mocks/text'
import { findEmployee } from '@/features/catalogs/employees/api/employees.db'
import type { UserCreate } from '../types/user'
import { findUser, findUserByEmployee, sortRoles, statusOf, toUserResponse, usersDb } from './users.db'

/**
 * MSW handlers de usuarios (CU-05 Registrar, CU-07 Consultar), según el
 * contrato del Sprint 2 (§3.3). Sólo para el Administrador del Sistema.
 */

const ROLES = MODULE_ROLES.users

function validate(body: Partial<UserCreate>): FieldError[] {
  const errors: FieldError[] = []
  const username = body.username?.trim() ?? ''
  const password = body.password ?? ''
  const roles = body.roles ?? []

  if (body.employeeId === undefined || body.employeeId === null) {
    errors.push({ field: 'employeeId', message: 'Elegí el empleado' })
  } else if (!findEmployee(Number(body.employeeId))) {
    // Un empleado inexistente es un dato a corregir en el formulario: 400 (D-21).
    errors.push({ field: 'employeeId', message: 'No existe un empleado con ese identificador.' })
  }
  if (!username) errors.push({ field: 'username', message: 'Ingresá el nombre de usuario' })
  else if (username.length > 30) errors.push({ field: 'username', message: 'El nombre de usuario admite hasta 30 caracteres' })
  if (password.length < 8) errors.push({ field: 'password', message: 'La contraseña debe tener al menos 8 caracteres' })
  else if (password.length > 72) errors.push({ field: 'password', message: 'La contraseña admite hasta 72 caracteres' })
  if (roles.length === 0) errors.push({ field: 'roles', message: 'Asigná al menos un rol' })
  else if (roles.some((role) => !ROLE_ORDER.includes(role))) {
    errors.push({ field: 'roles', message: 'No existe un rol con ese código.' })
  } else if (new Set(roles).size !== roles.length) {
    errors.push({ field: 'roles', message: 'No repitas roles' })
  }
  return errors
}

export const userHandlers = [
  http.get('/api/users', ({ request }) => {
    const caller = authorize(request, ROLES)
    if (caller instanceof Response) return caller
    const pageParams = readPageOrError(request)
    if (pageParams instanceof Response) return pageParams

    const query = new URL(request.url).searchParams
    const search = query.get('search')?.trim() ?? ''
    const role = query.get('role') as Rol | null
    const includeInactive = query.get('includeInactive') === 'true'
    if (role && !ROLE_ORDER.includes(role)) {
      return validationError(
        request,
        [{ field: 'role', message: 'No existe un rol con ese código.' }],
        'Los parámetros de consulta no son válidos.',
      )
    }

    const matching = usersDb.users
      // Los bloqueados se listan siempre; los inactivos, sólo si se piden (D-28).
      .filter((u) => includeInactive || statusOf(u) !== 'INACTIVE')
      .filter((u) => !role || u.roles.includes(role))
      .map(toUserResponse)
      .filter(
        (u) =>
          !search ||
          [u.username, u.employee.firstName, u.employee.lastName, `${u.employee.firstName} ${u.employee.lastName}`].some(
            (text) => containsText(text, search),
          ),
      )
      .sort((a, b) => a.username.localeCompare(b.username, 'es'))

    return HttpResponse.json(paginate(matching, pageParams))
  }),

  http.get('/api/users/:userId', ({ request, params }) => {
    const caller = authorize(request, ROLES)
    if (caller instanceof Response) return caller
    const id = readPathId(request, params.userId, 'userId', 'El identificador del usuario no es válido.')
    if (id instanceof Response) return id

    const user = findUser(id)
    if (!user) return apiError(request, 404, 'No se encontró el usuario solicitado.', { code: 'USER_NOT_FOUND' })
    return HttpResponse.json(toUserResponse(user))
  }),

  http.post('/api/users', async ({ request }) => {
    const caller = authorize(request, ROLES)
    if (caller instanceof Response) return caller

    const body = (await request.json()) as Partial<UserCreate>
    const errors = validate(body)
    if (errors.length > 0) return validationError(request, errors)

    const employee = findEmployee(Number(body.employeeId))!
    if (!employee.active) {
      return apiError(request, 422, 'El empleado está dado de baja: no se le puede crear un usuario.', {
        code: 'EMPLOYEE_INACTIVE',
      })
    }
    // Un empleado tiene como máximo un usuario, contando los dados de baja (D-20).
    const existing = findUserByEmployee(employee.id)
    if (existing) {
      const message = `Este empleado ya tiene el usuario «${existing.username}»`
      return apiError(request, 409, message, {
        code: 'EMPLOYEE_ALREADY_HAS_USER',
        details: [{ field: 'employeeId', message }],
      })
    }
    // Único sin distinguir mayúsculas, incluidos los dados de baja (D-22).
    const username = body.username!.trim()
    if (usersDb.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      const message = 'El nombre de usuario ya está en uso'
      return apiError(request, 409, message, { code: 'USERNAME_TAKEN', details: [{ field: 'username', message }] })
    }

    const created = {
      id: usersDb.nextId++,
      username,
      password: body.password!,
      employeeId: employee.id,
      roles: sortRoles(body.roles!),
      active: true,
      blocked: false,
      failedAttempts: 0,
      lastAccessAt: null,
      createdAt: new Date().toISOString(),
    }
    usersDb.users.push(created)
    return HttpResponse.json(toUserResponse(created), { status: 201 })
  }),
]
