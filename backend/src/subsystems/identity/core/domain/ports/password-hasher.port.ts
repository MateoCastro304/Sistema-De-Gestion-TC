/** Hash de contraseñas con sal (RNF08). Nunca se devuelve ni se registra en logs. */
export abstract class PasswordHasher {
  abstract hash(plain: string): Promise<string>;

  abstract verify(plain: string, hash: string): Promise<boolean>;
}
