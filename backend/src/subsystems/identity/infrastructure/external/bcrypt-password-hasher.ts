import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { PasswordHasher } from '../../core/domain/ports/password-hasher.port';

/** Costo por defecto de bcrypt: unos cientos de milisegundos por hash en un servidor común. */
export const DEFAULT_BCRYPT_COST = 12;

/** Hash de contraseñas con bcrypt, que ya incluye una sal distinta por hash (RNF08). */
@Injectable()
export class BcryptPasswordHasher extends PasswordHasher {
  constructor(private readonly cost: number = DEFAULT_BCRYPT_COST) {
    super();
  }

  hash(plain: string): Promise<string> {
    return hash(plain, this.cost);
  }

  async verify(plain: string, storedHash: string): Promise<boolean> {
    try {
      return await compare(plain, storedHash);
    } catch {
      // Un hash guardado con formato inválido es un dato roto, no un motivo para
      // responder 500: para quien intenta ingresar es una contraseña incorrecta.
      return false;
    }
  }
}
