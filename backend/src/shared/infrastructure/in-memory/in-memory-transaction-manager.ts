import { TransactionManagerPort } from '../../transaction/transaction-manager.port';

/**
 * Fake para los specs de los casos de uso: ejecuta el trabajo sin transacción
 * real y cuenta cuántas veces se abrió una. No se usa en runtime.
 */
export class InMemoryTransactionManager extends TransactionManagerPort {
  runs = 0;

  async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    this.runs++;
    return await work();
  }
}
