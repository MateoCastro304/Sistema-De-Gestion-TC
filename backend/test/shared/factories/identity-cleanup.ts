import type { PrismaService } from '../../../src/shared/infrastructure/prisma/prisma.service';

/**
 * Vacía las tablas de identidad, hijas primero (las FK de sesión y de rol son
 * RESTRICT). Las pruebas de identidad lo corren al empezar cada caso **y al
 * terminar**: todas las suites comparten una base, y si quedan sesiones, la
 * limpieza de otra suite que borra usuarios falla según el orden en que Jest las
 * ejecute.
 */
export async function clearIdentityTables(prisma: PrismaService): Promise<void> {
  await prisma.loginAttempt.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.user.deleteMany();
  await prisma.employee.deleteMany();
}
