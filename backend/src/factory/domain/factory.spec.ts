import { Factory } from './factory';

describe('Factory Entity', () => {
  const validCuit = '20-12345678-6';
  const normalizedValidCuit = '20123456786';
  const validName = 'Fábrica Central';
  const validAddress = 'Av. Siempreviva 742';
  const validPaymentDescription = 'Transferencia a 30 días';
  const validCategoryId = 1;

  describe('create()', () => {
    it('debería crear una instancia de Factory válida', () => {
      const factory = Factory.create(
        validCuit,
        validName,
        validAddress,
        validPaymentDescription,
        validCategoryId,
      );

      expect(factory).toBeDefined();
      expect(factory.getId()).toBeNull(); // Nace sin ID antes de persisitir
      expect(factory.getCuit()).toBe(normalizedValidCuit);
      expect(factory.getName()).toBe(validName);
      expect(factory.getAddress()).toBe(validAddress);
      expect(factory.getPaymentDescription()).toBe(validPaymentDescription);
      expect(factory.getCategoryId()).toBe(validCategoryId);
      expect(factory.isActive()).toBe(true);
    });

    it('debería asignar null en paymentDescription si se pasa null', () => {
      const factory = Factory.create(validCuit, validName, validAddress, null, validCategoryId);
      expect(factory.getPaymentDescription()).toBeNull();
    });

    it('debería permitir crear una fábrica sin dirección', () => {
      const withNull = Factory.create(validCuit, validName, null, null, validCategoryId);
      const withBlank = Factory.create(validCuit, validName, '   ', null, validCategoryId);

      expect(withNull.getAddress()).toBeNull();
      expect(withBlank.getAddress()).toBeNull();
    });

    it('debería lanzar un error si el cuit está vacío', () => {
      expect(() =>
        Factory.create('', validName, validAddress, validPaymentDescription, validCategoryId),
      ).toThrow('CUIT must have 11 digits');
    });

    it('debería lanzar un error si el cuit no tiene 11 dígitos', () => {
      expect(() =>
        Factory.create('123', validName, validAddress, null, validCategoryId),
      ).toThrow('CUIT must have 11 digits');
    });

    it('debería lanzar un error si el dígito verificador del cuit es inválido', () => {
      expect(() =>
        Factory.create('20-12345678-9', validName, validAddress, null, validCategoryId),
      ).toThrow('CUIT check digit is invalid');
    });

    it('debería lanzar un error si el nombre está vacío', () => {
      expect(() =>
        Factory.create(validCuit, '   ', validAddress, validPaymentDescription, validCategoryId),
      ).toThrow('Factory name cannot be empty');
    });
  });

  describe('reconstruct()', () => {
    it('debería reconstruir una entidad Factory persistida previamente', () => {
      const factory = Factory.reconstruct(
        10,
        validCuit,
        validName,
        validAddress,
        validPaymentDescription,
        validCategoryId,
        false,
      );

      expect(factory.getId()).toBe(10);
      expect(factory.getCuit()).toBe(normalizedValidCuit);
      expect(factory.isActive()).toBe(false);
    });

    it('debería reconstruir una fábrica sin dirección ni forma de pago', () => {
      const factory = Factory.reconstruct(10, validCuit, validName, null, null, validCategoryId, true);

      expect(factory.getAddress()).toBeNull();
      expect(factory.getPaymentDescription()).toBeNull();
    });
  });

  describe('update()', () => {
    it('debería actualizar todas las propiedades correctamente', () => {
      const factory = Factory.create(validCuit, validName, validAddress, validPaymentDescription, validCategoryId);

      factory.update('30-98765432-1', 'Nueva Fábrica', 'Calle Falsa 123', 'Contando', 2);

      expect(factory.getCuit()).toBe('30987654321');
      expect(factory.getName()).toBe('Nueva Fábrica');
      expect(factory.getAddress()).toBe('Calle Falsa 123');
      expect(factory.getPaymentDescription()).toBe('Contando');
      expect(factory.getCategoryId()).toBe(2);
    });

    it('debería permitir limpiar la dirección y la forma de pago', () => {
      const factory = Factory.create(validCuit, validName, validAddress, validPaymentDescription, validCategoryId);

      factory.update(validCuit, validName, null, null, validCategoryId);

      expect(factory.getAddress()).toBeNull();
      expect(factory.getPaymentDescription()).toBeNull();
    });
  });

  describe('deactivate() y activate()', () => {
    it('debería desactivar una fábrica activa', () => {
      const factory = Factory.create(validCuit, validName, validAddress, null, validCategoryId);
      factory.deactivate();
      expect(factory.isActive()).toBe(false);
    });

    it('debería lanzar un error si se intenta desactivar una fábrica que ya está inactiva', () => {
      const factory = Factory.reconstruct(1, validCuit, validName, validAddress, null, validCategoryId, false);
      expect(() => factory.deactivate()).toThrow('Factory is already inactive');
    });

    it('debería activar una fábrica inactiva', () => {
      const factory = Factory.reconstruct(1, validCuit, validName, validAddress, null, validCategoryId, false);
      factory.activate();
      expect(factory.isActive()).toBe(true);
    });

    it('debería lanzar un error si se intenta activar una fábrica que ya está activa', () => {
      const factory = Factory.create(validCuit, validName, validAddress, null, validCategoryId);
      expect(() => factory.activate()).toThrow('Factory is already active');
    });
  });

  describe('changeMethods', () => {
    it('debería recortar los espacios en blanco (trim) en las modificaciones', () => {
      const factory = Factory.create(validCuit, validName, validAddress, null, validCategoryId);

      factory.setCuit('  20-11111111-2  ');
      factory.setName('   Nombre Nuevo  ');
      factory.setAdress('   Dirección Nueva  ');
      factory.setPaymentDescription('   Pago Efectivo   ');

      expect(factory.getCuit()).toBe('20111111112');
      expect(factory.getName()).toBe('Nombre Nuevo');
      expect(factory.getAddress()).toBe('Dirección Nueva');
      expect(factory.getPaymentDescription()).toBe('Pago Efectivo');
    });
  });
});
