import { Injectable } from '@nestjs/common';
import { TransactionManagerPort } from '../../transaction/transaction-manager.port';
import { PrismaClientProvider } from './prisma-client.provider';
import { PrismaService } from './prisma.service';

/** Adaptador de {@link TransactionManagerPort} sobre las transacciones interactivas de Prisma. */
@Injectable()
export class PrismaTransactionManager extends TransactionManagerPort {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clients: PrismaClientProvider,
  ) {
    super();
  }

  async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    // Una llamada anidada se une a la transacción abierta: revertir la externa revierte también lo suyo.
    if (this.clients.hasActiveTransaction()) return await work();

    return await this.prisma.$transaction((tx) => this.clients.runWith(tx, work));
  }
}
