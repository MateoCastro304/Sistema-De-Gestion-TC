import { Supplier } from './supplier';
import { SupplierType } from '../value-objects/supplier-type';

const VALID_CUIT = '30-71234567-1';
const VALID_CUIT_NORMALIZED = '30712345671';
const VALID_EMAIL = 'sales@acerosdelsur.com';
const VALID_PHONE = '+54 9 351 444-5678';
const VALID_PHONE_NORMALIZED = '+5493514445678';

describe('Supplier (domain)', () => {
  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('creates a supplier with only the required fields', () => {
      const s = Supplier.create('Aceros del Sur S.A.', 'MATERIAL');

      expect(s.getId()).toBeNull();
      expect(s.getLegalName()).toBe('Aceros del Sur S.A.');
      expect(s.getSupplierType()).toBe('MATERIAL');
      expect(s.getCuit()).toBeNull();
      expect(s.getContactName()).toBeNull();
      expect(s.getContactEmail()).toBeNull();
      expect(s.getContactPhone()).toBeNull();
      expect(s.getAddress()).toBeNull();
      expect(s.getActive()).toBe(true);
    });

    it('accepts and stores every optional field', () => {
      const s = Supplier.create('Aceros del Sur S.A.', 'MATERIAL', {
        cuit: VALID_CUIT,
        contactName: 'Diego Fernandez',
        contactEmail: VALID_EMAIL,
        contactPhone: VALID_PHONE,
        address: 'Av. Circunvalacion 4500',
      });

      expect(s.getCuit()?.getCuitValue()).toBe(VALID_CUIT_NORMALIZED);
      expect(s.getContactName()).toBe('Diego Fernandez');
      expect(s.getContactEmail()?.getValue()).toBe(VALID_EMAIL);
      expect(s.getContactPhone()?.getValue()).toBe(VALID_PHONE_NORMALIZED);
      expect(s.getAddress()).toBe('Av. Circunvalacion 4500');
      expect(s.getSupplierType()).toBe('MATERIAL');
    });

    it('trims the legal name', () => {
      const s = Supplier.create('  Aceros del Sur  ', 'MATERIAL');
      expect(s.getLegalName()).toBe('Aceros del Sur');
    });

    it('turns blank optional strings into null', () => {
      const s = Supplier.create('Aceros del Sur', 'MATERIAL', {
        contactName: '   ',
        address: '',
      });
      expect(s.getContactName()).toBeNull();
      expect(s.getAddress()).toBeNull();
    });

    it('starts active', () => {
      expect(Supplier.create('X', 'MATERIAL').getActive()).toBe(true);
    });

    describe('invariants', () => {
      it('rejects an empty legal name', () => {
        expect(() => Supplier.create('', 'MATERIAL')).toThrow('Legal name is required');
      });

      it('rejects a blank legal name', () => {
        expect(() => Supplier.create('    ', 'MATERIAL')).toThrow('Legal name is required');
      });

      // The limits below mirror the column widths of the `supplier` table.
      it('accepts a legal name of exactly 80 characters', () => {
        expect(Supplier.create('a'.repeat(80), 'MATERIAL').getLegalName()).toHaveLength(80);
      });

      it('rejects a legal name over 80 characters', () => {
        expect(() => Supplier.create('a'.repeat(81), 'MATERIAL')).toThrow(/Legal name must not exceed/);
      });

      it('rejects a contact name over 150 characters', () => {
        expect(() => Supplier.create('X', 'MATERIAL', { contactName: 'a'.repeat(151) })).toThrow(
          /Contact name must not exceed/,
        );
      });

      it('rejects an address over 255 characters', () => {
        expect(() => Supplier.create('X', 'MATERIAL', { address: 'a'.repeat(256) })).toThrow(/Address must not exceed/);
      });

      it('rejects an observation over 255 characters', () => {
        expect(() => Supplier.create('X', 'MATERIAL', { observation: 'a'.repeat(256) })).toThrow(
          /Observation must not exceed/,
        );
      });

      it('rejects an unknown supplier type', () => {
        expect(() => Supplier.create('X', 'UNKNOWN' as SupplierType)).toThrow(/Invalid supplier type/);
      });

      it('propagates value-object errors (invalid CUIT)', () => {
        expect(() => Supplier.create('X', 'MATERIAL', { cuit: '123' })).toThrow(/CUIT/);
      });

      it('propagates value-object errors (invalid email)', () => {
        expect(() => Supplier.create('X', 'MATERIAL', { contactEmail: 'not-an-email' })).toThrow(/email/i);
      });

      it('propagates value-object errors (invalid phone)', () => {
        expect(() => Supplier.create('X', 'MATERIAL', { contactPhone: 'abc' })).toThrow(/Phone/);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // reconstruct
  // ---------------------------------------------------------------------------
  describe('reconstruct', () => {
    it('rebuilds a supplier keeping id, active flag and timestamps', () => {
      const createdAt = new Date('2026-01-01T10:00:00Z');
      const updatedAt = new Date('2026-02-01T10:00:00Z');

      const s = Supplier.reconstruct({
        id: 42,
        legalName: 'Aceros del Sur',
        cuit: VALID_CUIT,
        supplierType: 'MATERIAL',
        contactName: 'Diego',
        contactEmail: VALID_EMAIL,
        contactPhone: VALID_PHONE,
        address: 'Av. Falsa 123',
        observation: 'Entrega los martes',
        active: false,
        createdAt,
        updatedAt,
      });

      expect(s.getId()).toBe(42);
      expect(s.getLegalName()).toBe('Aceros del Sur');
      expect(s.getCuit()?.getCuitValue()).toBe(VALID_CUIT_NORMALIZED);
      expect(s.getSupplierType()).toBe('MATERIAL');
      expect(s.getContactName()).toBe('Diego');
      expect(s.getContactEmail()?.getValue()).toBe(VALID_EMAIL);
      expect(s.getContactPhone()?.getValue()).toBe(VALID_PHONE_NORMALIZED);
      expect(s.getAddress()).toBe('Av. Falsa 123');
      expect(s.getObservation()).toBe('Entrega los martes');
      expect(s.getActive()).toBe(false);
      expect(s.getCreatedAt()).toEqual(createdAt);
      expect(s.getUpdatedAt()).toEqual(updatedAt);
    });

    it('accepts null in all optional fields', () => {
      const now = new Date('2026-01-01T10:00:00Z');
      const s = Supplier.reconstruct({
        id: 1,
        legalName: 'X',
        cuit: null,
        supplierType: 'MATERIAL',
        contactName: null,
        contactEmail: null,
        contactPhone: null,
        address: null,
        observation: null,
        active: true,
        createdAt: now,
        updatedAt: now,
      });

      expect(s.getCuit()).toBeNull();
      expect(s.getContactName()).toBeNull();
      expect(s.getContactEmail()).toBeNull();
      expect(s.getContactPhone()).toBeNull();
      expect(s.getAddress()).toBeNull();
      expect(s.getObservation()).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    const build = () =>
      Supplier.create('Aceros del Sur', 'MATERIAL', {
        cuit: VALID_CUIT,
        contactName: 'Diego',
        contactEmail: VALID_EMAIL,
        contactPhone: VALID_PHONE,
        address: 'Av. Falsa 123',
        observation: 'Entrega los martes',
      });

    it('leaves absent fields untouched', () => {
      const s = build();

      s.update({ contactName: 'Nuevo Contacto' });

      expect(s.getContactName()).toBe('Nuevo Contacto');
      expect(s.getLegalName()).toBe('Aceros del Sur');
      expect(s.getCuit()?.getCuitValue()).toBe(VALID_CUIT_NORMALIZED);
      expect(s.getAddress()).toBe('Av. Falsa 123');
    });

    it('clears optional fields when null is sent', () => {
      const s = build();

      s.update({
        cuit: null,
        contactName: null,
        contactEmail: null,
        contactPhone: null,
        address: null,
        observation: null,
      });

      expect(s.getCuit()).toBeNull();
      expect(s.getContactName()).toBeNull();
      expect(s.getContactEmail()).toBeNull();
      expect(s.getContactPhone()).toBeNull();
      expect(s.getAddress()).toBeNull();
      expect(s.getObservation()).toBeNull();
    });

    it('replaces the observation', () => {
      const s = build();
      s.update({ observation: 'Solo entregas pactadas' });
      expect(s.getObservation()).toBe('Solo entregas pactadas');
    });

    it('trims the legal name', () => {
      const s = build();
      s.update({ legalName: '  Nuevo Nombre  ' });
      expect(s.getLegalName()).toBe('Nuevo Nombre');
    });

    it('normalizes blank optional strings to null', () => {
      const s = build();
      s.update({ contactName: '   ', address: '', observation: '  ' });
      expect(s.getContactName()).toBeNull();
      expect(s.getAddress()).toBeNull();
      expect(s.getObservation()).toBeNull();
    });

    it('keeps the supplierType unchanged after an update', () => {
      const s = build();
      s.update({ legalName: 'Nuevo Nombre' });
      expect(s.getSupplierType()).toEqual('MATERIAL');
    });

    describe('rejects invalid input and leaves the supplier untouched', () => {
      it('empty legal name', () => {
        const s = build();
        expect(() => s.update({ legalName: '   ' })).toThrow('Legal name is required');
        expect(s.getLegalName()).toBe('Aceros del Sur');
      });

      it('legal name over 80 characters', () => {
        const s = build();
        expect(() => s.update({ legalName: 'a'.repeat(81) })).toThrow(/Legal name must not exceed/);
        expect(s.getLegalName()).toBe('Aceros del Sur');
      });

      it('contact name over 150 characters', () => {
        const s = build();
        expect(() => s.update({ contactName: 'a'.repeat(151) })).toThrow(/Contact name must not exceed/);
        expect(s.getContactName()).toBe('Diego');
      });

      it('address over 255 characters', () => {
        const s = build();
        expect(() => s.update({ address: 'a'.repeat(256) })).toThrow(/Address must not exceed/);
        expect(s.getAddress()).toBe('Av. Falsa 123');
      });

      it('observation over 255 characters', () => {
        const s = build();
        expect(() => s.update({ observation: 'a'.repeat(256) })).toThrow(/Observation must not exceed/);
        expect(s.getObservation()).toBe('Entrega los martes');
      });

      it('invalid CUIT keeps the previous CUIT', () => {
        const s = build();
        expect(() => s.update({ cuit: '123' })).toThrow(/CUIT/);
        expect(s.getCuit()?.getCuitValue()).toBe(VALID_CUIT_NORMALIZED);
      });

      it('invalid email keeps the previous email', () => {
        const s = build();
        expect(() => s.update({ contactEmail: 'no-email' })).toThrow(/email/i);
        expect(s.getContactEmail()?.getValue()).toBe(VALID_EMAIL);
      });

      it('invalid phone keeps the previous phone', () => {
        const s = build();
        expect(() => s.update({ contactPhone: 'abc' })).toThrow(/Phone/);
        expect(s.getContactPhone()?.getValue()).toBe(VALID_PHONE_NORMALIZED);
      });

      it('a mixed valid + invalid payload does not apply the valid part', () => {
        const s = build();
        expect(() => s.update({ legalName: 'Nuevo Nombre', cuit: 'invalid' })).toThrow(/CUIT/);
        expect(s.getLegalName()).toBe('Aceros del Sur');
        expect(s.getCuit()?.getCuitValue()).toBe(VALID_CUIT_NORMALIZED);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // deactivate / activate
  // ---------------------------------------------------------------------------
  describe('deactivate', () => {
    it('deactivates an active supplier', () => {
      const s = Supplier.create('X', 'MATERIAL');
      s.deactivate();
      expect(s.getActive()).toBe(false);
    });

    it('throws when deactivating an already inactive supplier', () => {
      const s = Supplier.create('X', 'MATERIAL');
      s.deactivate();
      expect(() => s.deactivate()).toThrow('Supplier is already inactive');
    });

    it('has no way back: the aggregate exposes no activate()', () => {
      const s = Supplier.create('X', 'MATERIAL');
      s.deactivate();

      // There is no reactivation by design — an inactive supplier releases its
      // CUIT and legal name, so bringing it back could duplicate whoever took
      // them. Asserted here so reintroducing activate() breaks a test.
      expect('activate' in s).toBe(false);
      expect(s.getActive()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // timestamps
  // ---------------------------------------------------------------------------
  describe('timestamps', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('sets createdAt equal to updatedAt on creation', () => {
      jest.setSystemTime(new Date('2026-01-01T10:00:00Z'));
      const s = Supplier.create('X', 'MATERIAL');
      expect(s.getCreatedAt()).toEqual(s.getUpdatedAt());
    });

    it('updates updatedAt on update but keeps createdAt', () => {
      jest.setSystemTime(new Date('2026-01-01T10:00:00Z'));
      const s = Supplier.create('X', 'MATERIAL');
      const createdAt = s.getCreatedAt();

      jest.setSystemTime(new Date('2026-06-01T10:00:00Z'));
      s.update({ legalName: 'Y' });

      expect(s.getCreatedAt()).toEqual(createdAt);
      expect(s.getUpdatedAt()).toEqual(new Date('2026-06-01T10:00:00Z'));
    });

    it('updates updatedAt on deactivate', () => {
      jest.setSystemTime(new Date('2026-01-01T10:00:00Z'));
      const s = Supplier.create('X', 'MATERIAL');

      jest.setSystemTime(new Date('2026-06-01T10:00:00Z'));
      s.deactivate();

      expect(s.getUpdatedAt()).toEqual(new Date('2026-06-01T10:00:00Z'));
    });

    it('does not update updatedAt when update is rejected', () => {
      jest.setSystemTime(new Date('2026-01-01T10:00:00Z'));
      const s = Supplier.create('X', 'MATERIAL');
      const before = s.getUpdatedAt();

      jest.setSystemTime(new Date('2026-06-01T10:00:00Z'));
      expect(() => s.update({ legalName: '' })).toThrow();

      expect(s.getUpdatedAt()).toEqual(before);
    });
  });
});
