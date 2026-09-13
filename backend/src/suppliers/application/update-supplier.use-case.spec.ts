import { UpdateSupplier } from './update-supplier.use-case';
import { InMemorySupplierRepository } from '../infrastructure/in-memory-supplier.repository';
import { SupplierAlreadyExists } from '../domain/errors/supplier-already-exists.error';
import { SupplierNotFound } from '../domain/errors/supplier-not-found.error';
import { Supplier } from '../domain/supplier';

const VALID_CUIT = '30-71234567-1';
const VALID_CUIT_NORMALIZED = '30712345671';
const OTHER_VALID_CUIT = '27-23456789-1';

describe('UpdateSupplier (use case)', () => {
  let repo: InMemorySupplierRepository;
  let useCase: UpdateSupplier;

  beforeEach(() => {
    repo = new InMemorySupplierRepository();
    useCase = new UpdateSupplier(repo);
  });

  const seed = async (
    legalName: string,
    options: { cuit?: string; active?: boolean } = {},
  ): Promise<Supplier> => {
    const draft = Supplier.create(legalName, ['MATERIAL'], {
      cuit: options.cuit,
      contactName: 'Diego',
      contactEmail: 'diego@example.com',
      contactPhone: '+54 9 351 444-5678',
      address: 'Av. Falsa 123',
    });
    const stored = await repo.save(draft);
    if (options.active === false) {
      stored.deactivate();
      await repo.save(stored);
    }
    return stored;
  };

  // ---------------------------------------------------------------------------
  // happy path
  // ---------------------------------------------------------------------------
  describe('happy path', () => {
    it('updates a single optional field and leaves the rest untouched', async () => {
      const stored = await seed('Aceros del Sur', { cuit: VALID_CUIT });

      const result = await useCase.execute(stored.getId()!, { contactName: 'Nuevo' });

      expect(result.getContactName()).toBe('Nuevo');
      expect(result.getLegalName()).toBe('Aceros del Sur');
      expect(result.getCuit()?.getCuitValue()).toBe(VALID_CUIT_NORMALIZED);
    });

    it('updates several fields at once', async () => {
      const stored = await seed('Aceros del Sur');

      const result = await useCase.execute(stored.getId()!, {
        legalName: 'Nueva Razon Social',
        contactName: 'Nuevo Contacto',
        address: 'Av. Nueva 456',
      });

      expect(result.getLegalName()).toBe('Nueva Razon Social');
      expect(result.getContactName()).toBe('Nuevo Contacto');
      expect(result.getAddress()).toBe('Av. Nueva 456');
    });

    it('trims the legal name before saving', async () => {
      const stored = await seed('Aceros del Sur');

      const result = await useCase.execute(stored.getId()!, {
        legalName: '  Aceros Nuevo  ',
      });

      expect(result.getLegalName()).toBe('Aceros Nuevo');
    });

    it('clears optional fields when null is sent', async () => {
      const stored = await seed('Aceros del Sur', { cuit: VALID_CUIT });

      const result = await useCase.execute(stored.getId()!, {
        cuit: null,
        contactName: null,
        contactEmail: null,
        contactPhone: null,
        address: null,
      });

      expect(result.getCuit()).toBeNull();
      expect(result.getContactName()).toBeNull();
      expect(result.getContactEmail()).toBeNull();
      expect(result.getContactPhone()).toBeNull();
      expect(result.getAddress()).toBeNull();
    });

    it('accepts an empty input without failing', async () => {
      const stored = await seed('Aceros del Sur');

      const result = await useCase.execute(stored.getId()!, {});

      expect(result.getLegalName()).toBe('Aceros del Sur');
    });
  });

  // ---------------------------------------------------------------------------
  // not found
  // ---------------------------------------------------------------------------
  describe('not found', () => {
    it('throws SupplierNotFound when the id does not exist', async () => {
      const call = useCase.execute(999, { contactName: 'X' });

      await expect(call).rejects.toBeInstanceOf(SupplierNotFound);
      await expect(call).rejects.toMatchObject({ id: 999 });
    });
  });

  // ---------------------------------------------------------------------------
  // uniqueness (with excludeId)
  // ---------------------------------------------------------------------------
  describe('uniqueness', () => {
    it('rejects a duplicate cuit belonging to another supplier', async () => {
      await seed('Otro Proveedor', { cuit: VALID_CUIT });
      const stored = await seed('Aceros del Sur', { cuit: OTHER_VALID_CUIT });

      const call = useCase.execute(stored.getId()!, { cuit: VALID_CUIT });

      await expect(call).rejects.toBeInstanceOf(SupplierAlreadyExists);
      await expect(call).rejects.toMatchObject({
        field: 'cuit',
        value: VALID_CUIT_NORMALIZED,
      });
    });

    it('rejects a duplicate legalName belonging to another supplier', async () => {
      await seed('Otro Proveedor');
      const stored = await seed('Aceros del Sur');

      const call = useCase.execute(stored.getId()!, { legalName: 'Otro Proveedor' });

      await expect(call).rejects.toBeInstanceOf(SupplierAlreadyExists);
      await expect(call).rejects.toMatchObject({
        field: 'legalName',
        value: 'Otro Proveedor',
      });
    });

    it('allows keeping the same cuit on the same supplier', async () => {
      const stored = await seed('Aceros del Sur', { cuit: VALID_CUIT });

      const result = await useCase.execute(stored.getId()!, { cuit: VALID_CUIT });

      expect(result.getCuit()?.getCuitValue()).toBe(VALID_CUIT_NORMALIZED);
    });

    it('allows keeping the same legalName on the same supplier', async () => {
      const stored = await seed('Aceros del Sur');

      const result = await useCase.execute(stored.getId()!, {
        legalName: 'Aceros del Sur',
      });

      expect(result.getLegalName()).toBe('Aceros del Sur');
    });

    it('detects a duplicate cuit even when the other supplier is inactive', async () => {
      await seed('Otro Proveedor', { cuit: VALID_CUIT, active: false });
      const stored = await seed('Aceros del Sur');

      const call = useCase.execute(stored.getId()!, { cuit: VALID_CUIT });

      await expect(call).rejects.toBeInstanceOf(SupplierAlreadyExists);
    });

    it('detects a duplicate legalName even when the other supplier is inactive', async () => {
      await seed('Otro Proveedor', { active: false });
      const stored = await seed('Aceros del Sur');

      const call = useCase.execute(stored.getId()!, { legalName: 'Otro Proveedor' });

      await expect(call).rejects.toBeInstanceOf(SupplierAlreadyExists);
    });

    it('does not check cuit uniqueness when clearing it with null', async () => {
      const stored = await seed('Aceros del Sur', { cuit: VALID_CUIT });

      const result = await useCase.execute(stored.getId()!, { cuit: null });

      expect(result.getCuit()).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // domain validation propagates
  // ---------------------------------------------------------------------------
  describe('domain validation propagates', () => {
    it('rejects a malformed cuit and leaves the supplier untouched', async () => {
      const stored = await seed('Aceros del Sur', { cuit: VALID_CUIT });

      await expect(
        useCase.execute(stored.getId()!, { cuit: '123' }),
      ).rejects.toThrow(/CUIT/);

      const fresh = (await repo.findById(stored.getId()!))!;
      expect(fresh.getCuit()?.getCuitValue()).toBe(VALID_CUIT_NORMALIZED);
    });

    it('rejects an invalid email and leaves the supplier untouched', async () => {
      const stored = await seed('Aceros del Sur');

      await expect(
        useCase.execute(stored.getId()!, { contactEmail: 'not-an-email' }),
      ).rejects.toThrow(/email/i);

      const fresh = (await repo.findById(stored.getId()!))!;
      expect(fresh.getContactEmail()?.getValue()).toBe('diego@example.com');
    });

    it('rejects an invalid phone and leaves the supplier untouched', async () => {
      const stored = await seed('Aceros del Sur');

      await expect(
        useCase.execute(stored.getId()!, { contactPhone: 'abc' }),
      ).rejects.toThrow(/Phone/);

      const fresh = (await repo.findById(stored.getId()!))!;
      expect(fresh.getContactPhone()?.getValue()).toBe('+5493514445678');
    });

    it('rejects an oversized legal name', async () => {
      const stored = await seed('Aceros del Sur');

      await expect(
        useCase.execute(stored.getId()!, { legalName: 'a'.repeat(121) }),
      ).rejects.toThrow(/Legal name must not exceed/);
    });

    it('rejects a blank legal name', async () => {
      const stored = await seed('Aceros del Sur');

      await expect(
        useCase.execute(stored.getId()!, { legalName: '   ' }),
      ).rejects.toThrow('Legal name is required');
    });

    it('does not apply the valid part of a mixed valid + invalid payload', async () => {
      const stored = await seed('Aceros del Sur');

      await expect(
        useCase.execute(stored.getId()!, {
          legalName: 'Nuevo Nombre',
          contactEmail: 'not-an-email',
        }),
      ).rejects.toThrow(/email/i);

      const fresh = (await repo.findById(stored.getId()!))!;
      expect(fresh.getLegalName()).toBe('Aceros del Sur');
    });
  });
});
