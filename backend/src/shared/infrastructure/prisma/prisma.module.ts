import { Global, Module } from '@nestjs/common';
import { TransactionManagerPort } from '../../transaction/transaction-manager.port';
import { PrismaClientProvider } from './prisma-client.provider';
import { PrismaTransactionManager } from './prisma-transaction-manager';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [
    PrismaService,
    PrismaClientProvider,
    { provide: TransactionManagerPort, useClass: PrismaTransactionManager },
  ],
  exports: [PrismaService, PrismaClientProvider, TransactionManagerPort],
})
export class PrismaModule {}
