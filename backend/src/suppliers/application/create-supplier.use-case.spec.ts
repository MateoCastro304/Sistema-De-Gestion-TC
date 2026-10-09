import { CreateSupplier } from './create-supplier.use-case';
import { InMemorySupplierRepository } from '../infrastructure/in-memory-supplier.repository';
import { SupplierAlreadyExists } from '../domain/errors/supplier-already-exists.error';
import { SupplierType } from '../domain/supplier-type';

const VALID_CUIT = '30-71234567-1';
const VALID_CUIT_NORMALIZED = '30712345671';
const OTHER_VALID_CUIT = '27-23456789-1';

describe('CreateSupplier (use case)', () => {
  let repo: InMemorySupplierRepository;
  let useCase: CreateSupplier;

  beforeEach(() => {
    repo = new InMemorySupplierRepository();
    useCase = new CreateSupplier(repo);
  });

  // ---------------------------------------------------------------------------
  // happy path
  // ---------------------------------------------------------------------------
  describe('happy path', () => {
    it('persists a supplier with only the required fields', async () => {
      const result = await useCase.execute({
        legalName: 'Aceros del Sur S.A.',
        supplierType: 'MATERIAL',
      });

      expect(result.getId()).not.toBeNull();
      expect(result.getLegalName()).toBe('Aceros del Sur S.A.');
      expect(result.getSupplierType()).toBe('MATERIAL');
      expect(result.getActive()).toBe(true);
      expect(result.getCuit()).toBeNull();
      expect(repo.count()).toBe(1);
    });

    it('persists a supplier with every optional field', async () => {
      const result = await useCase.execute({
        legalName: 'Aceros del Sur S.A.',
        supplierType: 'MATERIAL',
        cuit: VALID_CUIT,
        contactName: 'Diego Fernandez',
        contactEmail: 'sales@acerosdelsur.com',
        contactPhone: '+54 9 351 444-5678',
        address: 'Av. Circunvalacion 4500',
      });

      expect(result.getCuit()?.getCuitValue()).toBe(VALID_CUIT_NORMALIZED);
      expect(result.getContactName()).toBe('Diego Fernandez');
      expect(result.getContactEmail()?.getValue()).toBe('sales@acerosdelsur.com');
      expect(result.getContactPhone()?.getValue()).toBe('+5493514445678');
      expect(result.getAddress()).toBe('Av. Circunvalacion 4500');
      expect(result.getSupplierType()).toBe('MATERIAL');
      expect(repo.count()).toBe(1);
    });

    it('trims the legal name before persisting', async () => {
      const result = await useCase.execute({
        legalName: '  Aceros del Sur  ',
        supplierType: 'MATERIAL',
      });

      expect(result.getLegalName()).toBe('Aceros del Sur');
    });

    it('allows two suppliers without cuit to coexist', async () => {
      await useCase.execute({
        legalName: 'Aceros del Sur',
        supplierType: 'MATERIAL',
      });
      await useCase.execute({
        legalName: 'Insumos del Norte',
        supplierType: 'MATERIAL',
      });

      expect(repo.count()).toBe(2);
    });

    it('allows two suppliers with distinct cuits and legal names', async () => {
      await useCase.execute({
        legalName: 'Aceros del Sur',
        supplierType: 'MATERIAL',
        cuit: VALID_CUIT,
      });
      await useCase.execute({
        legalName: 'Insumos del Norte',
        supplierType: 'MATERIAL',
        cuit: OTHER_VALID_CUIT,
      });

      expect(repo.count()).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // uniqueness
  // ---------------------------------------------------------------------------
  describe('uniqueness', () => {
    it('rejects a duplicate cuit with SupplierAlreadyExists', async () => {
      await useCase.execute({
        legalName: 'Aceros del Sur',
        supplierType: 'MATERIAL',
        cuit: VALID_CUIT,
      });

      const call = useCase.execute({
        legalName: 'Otro Proveedor',
        supplierType: 'PROCESS',
        cuit: VALID_CUIT,
      });

      await expect(call).rejects.toBeInstanceOf(SupplierAlreadyExists);
      await expect(call).rejects.toMatchObject({
        field: 'cuit',
        value: VALID_CUIT_NORMALIZED,
      });
      expect(repo.count()).toBe(1);
    });

    it('rejects a duplicate legalName with SupplierAlreadyExists', async () => {
      await useCase.execute({
        legalName: 'Aceros del Sur',
        supplierType: 'MATERIAL',
      });

      const call = useCase.execute({
        legalName: 'Aceros del Sur',
        supplierType: 'PROCESS',
      });

      await expect(call).rejects.toBeInstanceOf(SupplierAlreadyExists);
      await expect(call).rejects.toMatchObject({
        field: 'legalName',
        value: 'Aceros del Sur',
      });
      expect(repo.count()).toBe(1);
    });

    it('detects a duplicate legalName after trimming the incoming value', async () => {
      await useCase.execute({
        legalName: 'Aceros del Sur',
        supplierType: 'MATERIAL',
      });

      const call = useCase.execute({
        legalName: '   Aceros del Sur   ',
        supplierType: 'PROCESS',
      });

      await expect(call).rejects.toBeInstanceOf(SupplierAlreadyExists);
      expect(repo.count()).toBe(1);
    });

    it('rejects a duplicate legalName ignoring case', async () => {
      await useCase.execute({ legalName: 'Proveedor Prueba 01', supplierType: 'MATERIAL' });

      const call = useCase.execute({ legalName: 'PROVEEDOR PRUEBA 01', supplierType: 'PROCESS' });

      await expect(call).rejects.toBeInstanceOf(SupplierAlreadyExists);
      expect(repo.count()).toBe(1);
    });

    // Uniqueness only looks at active suppliers. The baja is logical and there
    // is no reactivation, so a supplier dado de baja must not hold its CUIT or
    // its legal name hostage forever.
    it('allows reusing the cuit of an inactive supplier', async () => {
      const first = await useCase.execute({
        legalName: 'EDASA',
        supplierType: 'MATERIAL',
        cuit: VALID_CUIT,
      });
      first.deactivate();
      await repo.save(first);

      const second = await useCase.execute({
        legalName: 'OxyCam',
        supplierType: 'PROCESS',
        cuit: VALID_CUIT,
      });

      // A brand new supplier, not the old one brought back to life.
      expect(second.getId()).not.toBe(first.getId());
      expect(second.getLegalName()).toBe('OxyCam');
      expect(second.getActive()).toBe(true);
      expect(repo.count()).toBe(2);
    });

    it('allows reusing the legalName of an inactive supplier', async () => {
      const first = await useCase.execute({
        legalName: 'Aceros del Sur',
        supplierType: 'MATERIAL',
      });
      first.deactivate();
      await repo.save(first);

      const second = await useCase.execute({
        legalName: 'Aceros del Sur',
        supplierType: 'PROCESS',
      });

      expect(second.getId()).not.toBe(first.getId());
      expect(second.getActive()).toBe(true);
      expect(repo.count()).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // domain validation propagates
  // ---------------------------------------------------------------------------
  describe('domain validation propagates', () => {
    it('rejects a malformed cuit without touching the repository', async () => {
      await expect(
        useCase.execute({
          legalName: 'Aceros del Sur',
          supplierType: 'MATERIAL',
          cuit: '123',
        }),
      ).rejects.toThrow(/CUIT/);

      expect(repo.count()).toBe(0);
    });

    it('rejects an unknown supplier type', async () => {
      await expect(
        useCase.execute({
          legalName: 'Aceros del Sur',
          supplierType: 'UNKNOWN' as SupplierType,
        }),
      ).rejects.toThrow(/Invalid supplier type/);

      expect(repo.count()).toBe(0);
    });

    it('rejects an invalid contact email', async () => {
      await expect(
        useCase.execute({
          legalName: 'Aceros del Sur',
          supplierType: 'MATERIAL',
          contactEmail: 'not-an-email',
        }),
      ).rejects.toThrow(/email/i);

      expect(repo.count()).toBe(0);
    });

    it('rejects an invalid contact phone', async () => {
      await expect(
        useCase.execute({
          legalName: 'Aceros del Sur',
          supplierType: 'MATERIAL',
          contactPhone: 'abc',
        }),
      ).rejects.toThrow(/Phone/);

      expect(repo.count()).toBe(0);
    });

    it('rejects a blank legal name', async () => {
      await expect(
        useCase.execute({
          legalName: '   ',
          supplierType: 'MATERIAL',
        }),
      ).rejects.toThrow('Legal name is required');

      expect(repo.count()).toBe(0);
    });
  });
});
