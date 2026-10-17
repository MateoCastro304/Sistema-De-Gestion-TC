import { UserValidationError } from '../errors/user-validation.error';

/**
 * Contraseña en texto plano, validada ANTES de hashear (el dominio nunca
 * guarda ni ve la contraseña real fuera de este paso). 72 es el límite de
 * bcrypt, no una elección arbitraria.
 */
export class Password {
  private constructor(private readonly value: string) {}

  static create(value: string): Password {
    if (!value || value.length < 8) {
      throw new UserValidationError('La contraseña debe tener al menos 8 caracteres', 'password');
    }
    if (value.length > 72) {
      throw new UserValidationError('La contraseña no puede superar los 72 caracteres', 'password');
    }
    return new Password(value);
  }

  getValue(): string {
    return this.value;
  }
}
