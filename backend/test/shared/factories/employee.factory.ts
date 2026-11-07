import { TextKey } from '../../../src/shared/domain/text-key';
import { getPrisma } from '../harness/test-app';

/**
 * Apellido con el que empiezan todos los empleados de estas pruebas. Sirve para
 * buscarlos y para limpiarlos sin tocar a los de otras suites: la base se comparte.
 */
export const TEST_EMPLOYEE_PREFIX = 'Zzprueba';

/**
 * Contador en vez de aleatorio: el DNI es único entre todos los empleados, incluidos
 * los dados de baja (D-15), y un valor repetido haría fallar un alta con un 409 que
 * nadie pidió. El rango (50.000.000 en adelante) no se pisa con el de `signInAs`.
 */
let dniSequence = 0;

export function aDni(): string {
  dniSequence += 1;
  return String(50_000_000 + dniSequence);
}

/** Cuerpo de `POST /employees` con los nombres del contrato. No toca la base. */
export function anEmployeeBody(overrides: Record<string, unknown> = {}) {
  return {
    firstName: 'Julián',
    lastName: `${TEST_EMPLOYEE_PREFIX} Ferreyra`,
    dni: aDni(),
    position: 'EMPLOYEE',
    ...overrides,
  };
}

type EmployeeOverrides = { firstName?: string; lastName?: string; dni?: string; isActive?: boolean };

/** Guarda un empleado con Prisma: el estado previo que necesita la prueba. */
export function createEmployee(overrides: EmployeeOverrides = {}) {
  const firstName = overrides.firstName ?? 'Ana';
  const lastName = overrides.lastName ?? `${TEST_EMPLOYEE_PREFIX} Gómez`;

  return getPrisma().employee.create({
    data: {
      firstName,
      lastName,
      dni: overrides.dni ?? aDni(),
      position: 'EMPLOYEE',
      searchKey: TextKey.create(`${firstName} ${lastName}`).getValue(),
      isActive: overrides.isActive ?? true,
    },
  });
}

/** Borra los empleados de estas pruebas. Los que tienen usuario los limpia `stopTestApp`. */
export async function deleteTestEmployees(): Promise<void> {
  await getPrisma().employee.deleteMany({
    where: { lastName: { startsWith: TEST_EMPLOYEE_PREFIX }, user: { is: null } },
  });
}
