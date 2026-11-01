import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from './prisma.service';

/**
 * Entrega el cliente de Prisma que le corresponde a la operación en curso: el
 * de la transacción activa si la hay, o el `PrismaService` común. Los
 * repositorios piden el cliente acá en lugar de inyectar `PrismaService`, así
 * participan de la transacción sin recibirla por parámetro.
 *
 * La transacción activa se propaga con `AsyncLocalStorage`: vale para todo lo
 * que se ejecuta (incluso asíncrono) dentro de `runWith`, y para nada más.
 */
@Injectable()
export class PrismaClientProvider {
  private readonly storage = new AsyncLocalStorage<Prisma.TransactionClient>();

  constructor(private readonly prisma: PrismaService) {}

  current(): Prisma.TransactionClient {
    return this.storage.getStore() ?? this.prisma;
  }

  hasActiveTransaction(): boolean {
    return this.storage.getStore() !== undefined;
  }

  /** Corre `work` con `client` como cliente activo. Lo usa el administrador de transacciones. */
  runWith<T>(client: Prisma.TransactionClient, work: () => Promise<T>): Promise<T> {
    return this.storage.run(client, work);
  }
}
