import { Prisma } from '../../../src/generated/prisma/client';
import { TextKey } from '../../../src/shared/domain/text-key';
import { getPrisma } from '../harness/test-app';

/** Cuerpo de POST /process-types con los nombres del contrato; no toca la base. */
export function aProcessTypeBody(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Mecanizado Torno CNC 5 ejes',
    description: null,
    hourlyRateArs: 3100,
    hourlyRateUsd: 2.24,
    exchangeRate: 1385.5,
    ...overrides,
  };
}

type ProcessTypeOverrides = {
  description?: string | null;
  hourlyRateArs?: string;
  hourlyRateUsd?: string;
  exchangeRate?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

/** Guarda con Prisma un tipo de proceso como estado previo de la prueba. */
export async function createProcessType(name = 'Mecanizado Torno Manual', overrides: ProcessTypeOverrides = {}) {
  return getPrisma().processType.create({
    data: {
      name,
      nameKey: TextKey.create(name).getValue(),
      description: overrides.description ?? null,
      hourlyRateArs: new Prisma.Decimal(overrides.hourlyRateArs ?? '1557.00'),
      hourlyRateUsd: new Prisma.Decimal(overrides.hourlyRateUsd ?? '1.13'),
      exchangeRate: new Prisma.Decimal(overrides.exchangeRate ?? '1377.88'),
      ...(overrides.createdAt ? { createdAt: overrides.createdAt } : {}),
      ...(overrides.updatedAt ? { updatedAt: overrides.updatedAt } : {}),
    },
  });
}

/** Guarda un empleado con su usuario, el mínimo para ser el autor de un cambio de precio. */
export async function createAuthor(username: string, dni: string) {
  const employee = await getPrisma().employee.create({
    data: {
      firstName: username,
      lastName: 'Prueba',
      dni,
      position: 'EMPLOYEE',
      searchKey: `${username} prueba`,
    },
  });
  return getPrisma().user.create({
    data: { employeeId: employee.id, username, passwordHash: 'hash-de-prueba' },
  });
}

/** Guarda un registro del historial de precios de un tipo de proceso. */
export async function createPriceChange(
  processTypeId: number,
  changedByUserId: number,
  changedAt: string,
  values: { exchangeRate: string; previousValueUsd: string; newValueUsd: string },
) {
  return getPrisma().processTypePriceHistory.create({
    data: {
      processTypeId,
      changedByUserId,
      changedAt: new Date(changedAt),
      exchangeRate: new Prisma.Decimal(values.exchangeRate),
      previousValueUsd: new Prisma.Decimal(values.previousValueUsd),
      newValueUsd: new Prisma.Decimal(values.newValueUsd),
    },
  });
}
