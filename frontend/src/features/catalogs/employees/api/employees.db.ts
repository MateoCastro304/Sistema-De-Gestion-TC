import type { Employee, EmployeePosition } from '../types/employee'

/**
 * Tabla de empleados del mock: la semilla del prototipo (`semilla().emp`).
 * Los mocks de usuarios y de sesión la leen para el nombre de la persona.
 * Se resetea al recargar la página.
 *
 * Se guarda sin el resumen `user`: ese lo arma el handler con la tabla de
 * usuarios, igual que un JOIN en el backend.
 */

export type EmployeeRow = Omit<Employee, 'user'>

const SEED_DATE = '2026-03-12T12:00:00.000Z'

type SeedRow = [string, string, EmployeePosition, string, string, string, string, boolean]

const SEED: SeedRow[] = [
  ['Walter', 'Castro', 'HEAD', '20112233', 'Av. Colón 1820, Córdoba', 'wcastro@castrotorneria.com.ar', '+54 351 555-1001', true],
  ['Mónica', 'Ríos', 'ADMINISTRATION', '27234567', '', 'mrios@castrotorneria.com.ar', '+54 351 555-1002', true],
  ['Federico', 'Paz', 'ADMINISTRATION', '30456789', '', 'fpaz@castrotorneria.com.ar', '', true],
  ['Lucía', 'Benítez', 'ADMINISTRATION', '33567890', '', 'lbenitez@castrotorneria.com.ar', '', true],
  ['Raúl', 'Sánchez', 'WORKSHOP_HEAD', '22678901', 'Bv. San Juan 640, Córdoba', '', '+54 351 555-1005', true],
  ['Gabriela', 'Torres', 'ADMINISTRATION', '28789012', '', 'gtorres@castrotorneria.com.ar', '', true],
  ['Daniel', 'Castro', 'HEAD', '25890123', '', 'dcastro@castrotorneria.com.ar', '+54 351 555-1007', true],
  ['Hugo', 'Funes', 'ADMINISTRATION', '31901234', '', '', '', true],
  // Sin usuario: el alta de usuario los ofrece en el buscador de empleado.
  ['Matías', 'Castro', 'EMPLOYEE', '38012345', '', '', '+54 351 555-1009', true],
  ['Ezequiel', 'Moreno', 'EMPLOYEE', '40123456', 'Rivera Indarte 220, Córdoba', '', '', true],
  ['Carla', 'Videla', 'EMPLOYEE', '41234567', '', '', '', true],
  // Dado de baja: sólo aparece con "Incluir dados de baja". Su usuario (ogimenez) está inactivo.
  ['Omar', 'Giménez', 'EMPLOYEE', '6123456', '', '', '', false],
]

export const employeesDb = {
  employees: SEED.map(
    ([firstName, lastName, position, dni, address, email, phone, active], index): EmployeeRow => ({
      id: index + 1,
      firstName,
      lastName,
      dni,
      position,
      address: address || null,
      email: email || null,
      phone: phone || null,
      active,
      createdAt: SEED_DATE,
      updatedAt: SEED_DATE,
    }),
  ),
  nextId: SEED.length + 1,
}

export function findEmployee(id: number): EmployeeRow | undefined {
  return employeesDb.employees.find((e) => e.id === id)
}
