import { getPrisma } from '../harness/test-app';

/**
 * Prefijo de los usuarios de estas pruebas. Sirve para buscarlos y para limpiarlos
 * sin tocar a los de otras suites: la base se comparte.
 */
export const TEST_USER_PREFIX = 'zzu-';

/** Guarda un usuario con Prisma: el estado previo que necesita la prueba. */
export function createUser(employeeId: number, username: string, roles: string[] = ['EC'], isActive = true) {
  return getPrisma().user.create({
    data: {
      employeeId,
      username: `${TEST_USER_PREFIX}${username}`,
      passwordHash: 'sin-contraseña',
      isActive,
      roles: { create: roles.map((code) => ({ role: { connect: { code } } })) },
    },
  });
}

/** Borra los usuarios de estas pruebas, con sus roles, sesiones y bloqueos. */
export async function deleteTestUsers(): Promise<void> {
  const prisma = getPrisma();
  const users = await prisma.user.findMany({
    where: { username: { startsWith: TEST_USER_PREFIX } },
    select: { id: true },
  });
  const userIds = users.map((user) => user.id);

  await prisma.loginAttempt.deleteMany({ where: { identifier: { startsWith: `u:${TEST_USER_PREFIX}` } } });
  await prisma.refreshToken.deleteMany({ where: { session: { userId: { in: userIds } } } });
  await prisma.userSession.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.userRole.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}
