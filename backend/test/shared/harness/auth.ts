import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import request from 'supertest';

import { getPrisma } from './test-app';

/** Un cliente HTTP que ya manda la sesión de un usuario: `api.get('/suppliers')`. */
export type Api = {
  get(url: string): request.Test;
  post(url: string): request.Test;
  put(url: string): request.Test;
  patch(url: string): request.Test;
  delete(url: string): request.Test;
  /** El access token, por si el test lo necesita (por ejemplo para vencerlo a mano). */
  accessToken: string;
  userId: number;
  sessionId: string;
};

let sequence = 0;

/**
 * Crea un usuario con los roles dados, le abre una sesión de verdad en la base y
 * devuelve un cliente HTTP que manda su access token. Es lo que usan las pruebas
 * de los endpoints que exigen sesión (D-40).
 *
 * Firma el JWT con el mismo secreto que la app, sin pasar por `POST /auth/login`:
 * así no se paga bcrypt en cada suite. La autenticación en sí se prueba en
 * `test/modules/identity`.
 *
 * Las tablas de identidad se vacían al cerrar la app (`stopTestApp`).
 */
export async function signInAs(app: INestApplication, ...roleCodes: string[]): Promise<Api> {
  const prisma = getPrisma();
  sequence += 1;
  const unique = `${sequence}-${randomBytes(3).toString('hex')}`;

  const employee = await prisma.employee.create({
    data: {
      firstName: 'Test',
      lastName: `Usuario ${unique}`,
      // 8 dígitos, únicos entre suites (la base se comparte).
      dni: String(70000000 + Math.floor(Math.random() * 29999999)),
      position: 'EMPLOYEE',
      searchKey: `test usuario ${unique}`,
    },
  });
  const user = await prisma.user.create({
    data: {
      employeeId: employee.id,
      username: `test-${unique}`,
      passwordHash: 'sin-contraseña-no-se-usa-para-ingresar',
      roles: { create: roleCodes.map((code) => ({ role: { connect: { code } } })) },
    },
  });
  const now = Date.now();
  const session = await prisma.userSession.create({
    data: {
      userId: user.id,
      expiresAt: new Date(now + 7 * 24 * 3600 * 1000),
      refreshTokens: { create: { tokenHash: randomBytes(32).toString('hex') } },
    },
  });

  const accessToken = new JwtService({ secret: process.env.JWT_SECRET }).sign(
    { sub: String(user.id), sid: session.id },
    { algorithm: 'HS256', expiresIn: 900 },
  );
  const server = app.getHttpServer();
  const authorized = (test: request.Test) => test.set('Authorization', `Bearer ${accessToken}`);

  return {
    get: (url) => authorized(request(server).get(url)),
    post: (url) => authorized(request(server).post(url)),
    put: (url) => authorized(request(server).put(url)),
    patch: (url) => authorized(request(server).patch(url)),
    delete: (url) => authorized(request(server).delete(url)),
    accessToken,
    userId: user.id,
    sessionId: session.id,
  };
}
