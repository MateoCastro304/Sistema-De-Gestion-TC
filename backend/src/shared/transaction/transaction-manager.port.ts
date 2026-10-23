/**
 * Ejecuta una secuencia de escrituras de forma atómica: o se confirman todas o
 * no se aplica ninguna. El dominio y los casos de uso no conocen la
 * transacción del motor: envuelven sus pasos en `runInTransaction` y los
 * repositorios, por debajo, usan la transacción activa.
 *
 * Reglas de uso (docs/arquitectura/backend.md, "Transacciones"):
 * - Las lecturas de validación se hacen antes de abrirla.
 * - Dentro no se llama a servicios externos (PDF, S3, correo, WhatsApp).
 */
export abstract class TransactionManagerPort {
  /**
   * Corre `work` dentro de una transacción y devuelve su resultado. Si `work`
   * lanza, se revierte todo y el error se propaga. Si ya hay una transacción
   * activa, `work` se une a ella en vez de abrir otra.
   */
  abstract runInTransaction<T>(work: () => Promise<T>): Promise<T>;
}
