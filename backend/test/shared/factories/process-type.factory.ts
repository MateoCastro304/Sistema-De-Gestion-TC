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

/** Guarda con Prisma un tipo de proceso como estado previo de la prueba. */
export async function createProcessType(name = 'Mecanizado Torno Manual') {
  return getPrisma().processType.create({
    data: {
      name,
      nameKey: TextKey.create(name).getValue(),
      hourlyRateArs: new Prisma.Decimal('1557.00'),
      hourlyRateUsd: new Prisma.Decimal('1.13'),
      exchangeRate: new Prisma.Decimal('1377.88'),
    },
  });
}
