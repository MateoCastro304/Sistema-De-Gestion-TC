import { http } from 'msw'
import { MODULE_ROLES } from '@/domain/roles'
import { authorize } from '@/shared/mocks/session'
import { customerHandlers } from '@/features/catalogs/customers/api/customers.mocks'
import { supplierHandlers } from '@/features/catalogs/suppliers/api/suppliers.mocks'
import { categoryHandlers } from '@/features/catalogs/categories/api/categories.mocks'
import { authHandlers } from '@/features/auth/api/auth.mocks'
import { employeeHandlers } from '@/features/catalogs/employees/api/employees.mocks'
import { userHandlers } from '@/features/catalogs/users/api/users.mocks'
import { processTypeHandlers } from '@/features/catalogs/process-types/api/process-types.mocks'
import { materialHandlers } from '@/features/catalogs/materials/api/materials.mocks'

/**
 * Cuándo los endpoints del Sprint 1 empiezan a pedir sesión y rol (contrato
 * del Sprint 2, §7.2, D-40). Queda en `false` mientras el frontend no mande
 * el token: prenderlo antes deja a todas las pantallas del Sprint 1 en 401.
 * El día que el login esté hecho se pasa a `true`; los tests E2E del Sprint 1
 * siguen andando porque ya arrancan con sesión (`e2e/support/session.ts`).
 */
const SPRINT_1_REQUIRES_SESSION = false

/** Quién opera cada catálogo del Sprint 1 (contrato del Sprint 2, "Matriz por recurso"). */
const SPRINT_1_ROLES: [path: string, roles: readonly string[]][] = [
  ['/api/suppliers*', MODULE_ROLES.suppliers],
  ['/api/categories*', MODULE_ROLES.categories],
  ['/api/factories*', MODULE_ROLES.factories],
  ['/api/managers*', MODULE_ROLES.customers],
]

/**
 * Van primero: si la petición no tiene sesión o rol responden el 401/403;
 * si pasa, el resolver no devuelve nada y MSW sigue con el handler del
 * feature.
 */
const sprint1Guards = SPRINT_1_ROLES.map(([path, roles]) =>
  http.all(path, ({ request }) => {
    if (!SPRINT_1_REQUIRES_SESSION) return
    const caller = authorize(request, roles)
    if (caller instanceof Response) return caller
  }),
)

/**
 * All MSW request handlers, aggregated. As more catalogs get mocked, spread
 * their handler arrays here.
 */
export const handlers = [
  ...sprint1Guards,
  // Sprint 1
  ...customerHandlers,
  ...supplierHandlers,
  ...categoryHandlers,
  // Sprint 2
  ...authHandlers,
  ...employeeHandlers,
  ...userHandlers,
  ...processTypeHandlers,
  ...materialHandlers,
]
