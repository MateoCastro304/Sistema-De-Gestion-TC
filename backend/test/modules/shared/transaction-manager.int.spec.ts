import { INestApplication } from '@nestjs/common';

import { PrismaClientProvider } from '../../../src/shared/infrastructure/prisma/prisma-client.provider';
import { PrismaService } from '../../../src/shared/infrastructure/prisma/prisma.service';
import { TransactionManagerPort } from '../../../src/shared/transaction/transaction-manager.port';
import { startTestApp, stopTestApp, getPrisma } from '../../shared/harness/test-app';

describe('TransactionManagerPort', () => {
  let app: INestApplication;
  let transactions: TransactionManagerPort;
  let clients: PrismaClientProvider;

  beforeAll(async () => {
    app = await startTestApp();
    transactions = app.get(TransactionManagerPort);
    clients = app.get(PrismaClientProvider);
  });

  afterAll(async () => {
    await stopTestApp();
  });

  beforeEach(async () => {
    await getPrisma().customer.deleteMany(); // hijas primero
    await getPrisma().factory.deleteMany();
    await getPrisma().category.deleteMany();
  });

  describe('runInTransaction', () => {
    it('confirma todas las escrituras y devuelve el resultado', async () => {
      const result = await transactions.runInTransaction(async () => {
        await clients.current().category.create({ data: { name: 'Rubro A' } });
        await clients.current().category.create({ data: { name: 'Rubro B' } });
        return 'listo';
      });

      expect(result).toBe('listo');
      expect(await getPrisma().category.count()).toBe(2);
    });

    it('revierte todas las escrituras y propaga el error si una falla', async () => {
      const failing = transactions.runInTransaction(async () => {
        await clients.current().category.create({ data: { name: 'Rubro A' } });
        throw new Error('falla a mitad de camino');
      });

      await expect(failing).rejects.toThrow('falla a mitad de camino');
      expect(await getPrisma().category.count()).toBe(0);
    });

    it('une una llamada anidada a la transacción abierta: revertir la externa revierte también la interna', async () => {
      const failing = transactions.runInTransaction(async () => {
        await transactions.runInTransaction(async () => {
          await clients.current().category.create({ data: { name: 'Rubro interno' } });
        });
        throw new Error('falla la externa');
      });

      await expect(failing).rejects.toThrow('falla la externa');
      expect(await getPrisma().category.count()).toBe(0);
    });

    it('no ve las escrituras de una transacción abierta desde fuera de ella hasta que se confirma', async () => {
      let countOutsideBeforeCommit = -1;

      await transactions.runInTransaction(async () => {
        await clients.current().category.create({ data: { name: 'Rubro A' } });
        countOutsideBeforeCommit = await getPrisma().category.count();
      });

      expect(countOutsideBeforeCommit).toBe(0);
      expect(await getPrisma().category.count()).toBe(1);
    });
  });

  describe('PrismaClientProvider', () => {
    it('fuera de una transacción entrega el cliente común', () => {
      expect(clients.hasActiveTransaction()).toBe(false);
      expect(clients.current()).toBe(app.get(PrismaService));
    });
  });
});
