import { Customer } from './customer';

describe('Customer Entity', () => {
  const validName = 'Juan';
  const validLastName = 'Pérez';
  const validPhone = '+54 11 5555-5555';
  // El teléfono se guarda sin separadores.
  const normalizedPhone = '+541155555555';
  const validMail = 'Juan.Perez@Example.com';
  const validFactoryId = 1;

  describe('create()', () => {
    it('debería crear una instancia de Customer válida', () => {
      const customer = Customer.create(
        validName,
        validLastName,
        validPhone,
        validMail,
        validFactoryId,
      );

      expect(customer).toBeDefined();
      expect(customer.getId()).toBeNull(); // Nace sin ID antes de persistir
      expect(customer.getName()).toBe(validName);
      expect(customer.getLastName()).toBe(validLastName);
      expect(customer.getPhone()).toBe(normalizedPhone);
      expect(customer.getMail()).toBe('juan.perez@example.com');
      expect(customer.getFactoryId()).toBe(validFactoryId);
      expect(customer.isActive()).toBe(true);
    });

    it('debería normalizar el mail a minúsculas y sin espacios', () => {
      const customer = Customer.create(
        validName,
        validLastName,
        validPhone,
        '  Juan.Perez@Example.com  ',
        validFactoryId,
      );
      expect(customer.getMail()).toBe('juan.perez@example.com');
    });

    it('debería recortar los espacios en blanco de los campos de texto', () => {
      const customer = Customer.create(
        '  Juan  ',
        '  Pérez  ',
        '  11 5555-1234  ',
        validMail,
        validFactoryId,
      );
      expect(customer.getName()).toBe('Juan');
      expect(customer.getLastName()).toBe('Pérez');
      expect(customer.getPhone()).toBe('1155551234');
    });

    it('debería rechazar un teléfono inválido', () => {
      expect(() =>
        Customer.create(validName, validLastName, 'abc', validMail, validFactoryId),
      ).toThrow('Phone must contain only digits and separators');
      expect(() =>
        Customer.create(validName, validLastName, '123', validMail, validFactoryId),
      ).toThrow('Phone must have between 8 and 15 digits');
    });

    it('debería lanzar un error si el nombre está vacío', () => {
      expect(() =>
        Customer.create('   ', validLastName, validPhone, validMail, validFactoryId),
      ).toThrow('Customer name cannot be empty');
    });

    it('debería permitir un apellido ausente (null o vacío)', () => {
      const withNull = Customer.create(validName, null, validPhone, validMail, validFactoryId);
      const withBlank = Customer.create(validName, '  ', validPhone, validMail, validFactoryId);

      expect(withNull.getLastName()).toBeNull();
      expect(withBlank.getLastName()).toBeNull();
    });

    it('debería permitir crear un cliente solo con mail', () => {
      const customer = Customer.create(validName, validLastName, null, validMail, validFactoryId);

      expect(customer.getPhone()).toBeNull();
      expect(customer.getMail()).toBe('juan.perez@example.com');
    });

    it('debería permitir crear un cliente solo con teléfono', () => {
      const customer = Customer.create(validName, validLastName, validPhone, null, validFactoryId);

      expect(customer.getPhone()).toBe(normalizedPhone);
      expect(customer.getMail()).toBeNull();
    });

    it('debería tratar un teléfono con solo espacios como ausente', () => {
      const customer = Customer.create(validName, validLastName, '   ', validMail, validFactoryId);
      expect(customer.getPhone()).toBeNull();
    });

    it('debería lanzar un error si no hay teléfono ni mail', () => {
      expect(() =>
        Customer.create(validName, validLastName, null, null, validFactoryId),
      ).toThrow('Customer must have at least one contact: phone or mail');
      expect(() =>
        Customer.create(validName, validLastName, '   ', '   ', validFactoryId),
      ).toThrow('Customer must have at least one contact: phone or mail');
    });

    it('debería lanzar un error si el mail tiene un formato inválido', () => {
      expect(() =>
        Customer.create(validName, validLastName, validPhone, 'no-es-un-mail', validFactoryId),
      ).toThrow('Invalid email format');
    });

    it('debería lanzar un error si el factoryId no es un entero positivo', () => {
      expect(() =>
        Customer.create(validName, validLastName, validPhone, validMail, 0),
      ).toThrow('Factory id must be a positive integer');
    });
  });

  describe('reconstruct()', () => {
    it('debería reconstruir una entidad Customer persistida previamente', () => {
      const customer = Customer.reconstruct(
        10,
        validName,
        validLastName,
        validPhone,
        validMail,
        validFactoryId,
        false,
      );

      expect(customer.getId()).toBe(10);
      expect(customer.getName()).toBe(validName);
      expect(customer.isActive()).toBe(false);
    });

    it('debería reconstruir un cliente con apellido, teléfono y mail en null', () => {
      const customer = Customer.reconstruct(10, validName, null, null, null, validFactoryId, true);

      expect(customer.getLastName()).toBeNull();
      expect(customer.getPhone()).toBeNull();
      expect(customer.getMail()).toBeNull();
    });
  });

  describe('update()', () => {
    it('debería actualizar todas las propiedades correctamente', () => {
      const customer = Customer.create(
        validName,
        validLastName,
        validPhone,
        validMail,
        validFactoryId,
      );

      customer.update('Ana', 'Gómez', '11 5555-9999', 'ana.gomez@example.com', 2);

      expect(customer.getName()).toBe('Ana');
      expect(customer.getLastName()).toBe('Gómez');
      expect(customer.getPhone()).toBe('1155559999');
      expect(customer.getMail()).toBe('ana.gomez@example.com');
      expect(customer.getFactoryId()).toBe(2);
    });

    it('debería permitir quitar apellido y teléfono si queda el mail', () => {
      const customer = Customer.create(
        validName,
        validLastName,
        validPhone,
        validMail,
        validFactoryId,
      );

      customer.update(validName, null, null, validMail, validFactoryId);

      expect(customer.getLastName()).toBeNull();
      expect(customer.getPhone()).toBeNull();
      expect(customer.getMail()).toBe('juan.perez@example.com');
    });

    it('debería rechazar un update que deja al cliente sin contacto y no modificar nada', () => {
      const customer = Customer.create(
        validName,
        validLastName,
        validPhone,
        validMail,
        validFactoryId,
      );

      expect(() => customer.update('Otro', 'Nombre', null, null, validFactoryId)).toThrow(
        'Customer must have at least one contact: phone or mail',
      );
      expect(customer.getName()).toBe(validName);
      expect(customer.getPhone()).toBe(normalizedPhone);
    });

    it('debería recortar los espacios en blanco en las modificaciones', () => {
      const customer = Customer.create(
        validName,
        validLastName,
        validPhone,
        validMail,
        validFactoryId,
      );

      customer.setName('   Nombre Nuevo  ');
      customer.setLastName('   Apellido Nuevo  ');
      customer.setPhone('   11 5555-0000   ');

      expect(customer.getName()).toBe('Nombre Nuevo');
      expect(customer.getLastName()).toBe('Apellido Nuevo');
      expect(customer.getPhone()).toBe('1155550000');
    });
  });

  describe('deactivate()', () => {
    it('debería desactivar un cliente activo', () => {
      const customer = Customer.create(
        validName,
        validLastName,
        validPhone,
        validMail,
        validFactoryId,
      );
      customer.deactivate();
      expect(customer.isActive()).toBe(false);
    });

    it('debería lanzar un error si se intenta desactivar un cliente ya inactivo', () => {
      const customer = Customer.reconstruct(
        1,
        validName,
        validLastName,
        validPhone,
        validMail,
        validFactoryId,
        false,
      );
      expect(() => customer.deactivate()).toThrow('Customer is already inactive');
    });
  });
});
