/**
 * Algoritmo de hash de contraseñas. El dominio nunca ve bcrypt directo.
 *
 * Solo `hash()`: es lo único que CU-05 necesita (guardar la contraseña ya
 * hasheada al crear el usuario). `verify()` es de "Iniciar sesión" (CU-53,
 * otro sprint) — se agrega a este puerto cuando ese caso de uso exista,
 * no antes.
 */
export abstract class PasswordHasher {
  abstract hash(plain: string): Promise<string>;
}
