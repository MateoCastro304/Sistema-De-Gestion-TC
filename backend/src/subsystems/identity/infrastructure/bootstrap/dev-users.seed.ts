import type { PrismaClient } from '../../../../generated/prisma/client';
import { TextKey } from '../../../../shared/domain/text-key';
import { PasswordHasher } from '../../core/domain/ports/password-hasher.port';

/** Largo mínimo de una contraseña (RNF08). */
const MIN_PASSWORD_LENGTH = 8;

export type DevUser = {
  username: string;
  /** Contraseña de desarrollo, conocida a propósito: ver la advertencia de `DEV_USERS`. */
  password: string;
  /** Códigos de los roles: JT, ERP, EC, ER, AT y/o AS. */
  roles: string[];
  firstName: string;
  lastName: string;
  /** Único entre todos los empleados; 8 dígitos, con prefijo propio para no chocar con datos reales. */
  dni: string;
  position: 'ADMINISTRATION' | 'WORKSHOP_HEAD' | 'HEAD' | 'EMPLOYEE';
};

/**
 * Un usuario de desarrollo por rol, más `superadmin` con todos los roles, para poder
 * probar a mano la sesión y la matriz de permisos (en Swagger o en la pantalla de
 * ingreso) sin armar usuarios antes.
 * `admin` es el primer empleado del sistema, el que después da de alta a los demás.
 *
 * ADVERTENCIA: las contraseñas están en el repositorio, así que son públicas.
 * Solo sirven en bases de desarrollo descartables: el seed no corre con
 * `NODE_ENV=production`, pero nunca se debe sembrar una base compartida.
 */
export const DEV_USERS: readonly DevUser[] = [
  { username: 'admin', password: 'admin123', roles: ['AS'], firstName: 'Administrador', lastName: 'del Sistema', dni: '10000001', position: 'ADMINISTRATION' },
  { username: 'recepcion', password: 'recepcion123', roles: ['ERP'], firstName: 'Encargado', lastName: 'de Recepción', dni: '10000002', position: 'EMPLOYEE' },
  { username: 'cotizacion', password: 'cotizacion123', roles: ['EC'], firstName: 'Encargado', lastName: 'de Cotización', dni: '10000003', position: 'EMPLOYEE' },
  { username: 'tecnico', password: 'tecnico123', roles: ['AT'], firstName: 'Administrativo', lastName: 'Técnico', dni: '10000004', position: 'EMPLOYEE' },
  { username: 'taller', password: 'taller123', roles: ['JT'], firstName: 'Jefe', lastName: 'de Taller', dni: '10000005', position: 'WORKSHOP_HEAD' },
  { username: 'reportes', password: 'reportes123', roles: ['ER'], firstName: 'Encargado', lastName: 'de Reportes', dni: '10000006', position: 'EMPLOYEE' },
  { username: 'superadmin', password: 'superadmin123', roles: ['JT', 'ERP', 'EC', 'ER', 'AT', 'AS'], firstName: 'Super', lastName: 'Administrador', dni: '10000007', position: 'ADMINISTRATION' },
];

export type SeedDevUsersResult = {
  /** Usernames que se crearon en esta corrida. */
  created: string[];
  /** Usernames que ya existían y no se tocaron. */
  existing: string[];
};

/**
 * Crea los usuarios de desarrollo, cada uno con su contraseña de `DEV_USERS`
 * (solo se guarda el hash). Es idempotente: un usuario que ya existe no se
 * modifica (ni su contraseña ni sus roles), y un empleado que ya existe se
 * reutiliza.
 *
 * @param users usuarios a sembrar; por defecto `DEV_USERS`.
 * @throws {Error} si alguna contraseña tiene menos de 8 caracteres; no se crea nada.
 */
export async function seedDevUsers(
  prisma: PrismaClient,
  hasher: PasswordHasher,
  users: readonly DevUser[] = DEV_USERS,
): Promise<SeedDevUsersResult> {
  const weak = users.find((dev) => dev.password.length < MIN_PASSWORD_LENGTH);
  if (weak) {
    throw new Error(
      `La contraseña de "${weak.username}" tiene que tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    );
  }

  const result: SeedDevUsersResult = { created: [], existing: [] };

  for (const dev of users) {
    if (await prisma.user.findUnique({ where: { username: dev.username } })) {
      result.existing.push(dev.username);
      continue;
    }

    const employee =
      (await prisma.employee.findUnique({ where: { dni: dev.dni } })) ??
      (await prisma.employee.create({
        data: {
          firstName: dev.firstName,
          lastName: dev.lastName,
          dni: dev.dni,
          position: dev.position,
          searchKey: TextKey.create(`${dev.firstName} ${dev.lastName}`).getValue(),
        },
      }));

    await prisma.user.create({
      data: {
        employeeId: employee.id,
        username: dev.username,
        passwordHash: await hasher.hash(dev.password),
        roles: { create: dev.roles.map((code) => ({ role: { connect: { code } } })) },
      },
    });
    result.created.push(dev.username);
  }

  return result;
}
