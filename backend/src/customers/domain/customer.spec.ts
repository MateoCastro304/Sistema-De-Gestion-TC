import { Customer } from './customer';

describe('Customer Entity', () => {
  const validName = 'Juan';
  const validLastName = 'Pérez';
  const validPhone = '+54 11 5555-5555';
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
      expect(customer.getPhone()).toBe(validPhone);
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
        '  123  ',
        validMail,
        validFactoryId,
      );
      expect(customer.getName()).toBe('Juan');
      expect(customer.getLastName()).toBe('Pérez');
      expect(customer.getPhone()).toBe('123');
    });

    it('debería lanzar un error si el nombre está vacío', () => {
      expect(() =>
        Customer.create('   ', validLastName, validPhone, validMail, validFactoryId),
      ).toThrow('Customer name cannot be empty');
    });

    it('debería lanzar un error si el apellido está vacío', () => {
      expect(() =>
        Customer.create(validName, '', validPhone, validMail, validFactoryId),
      ).toThrow('Customer lastName cannot be empty');
    });

    it('debería lanzar un error si el teléfono está vacío', () => {
      expect(() =>
        Customer.create(validName, validLastName, '   ', validMail, validFactoryId),
      ).toThrow('Customer phone cannot be empty');
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

      customer.update('Ana', 'Gómez', '999', 'ana.gomez@example.com', 2);

      expect(customer.getName()).toBe('Ana');
      expect(customer.getLastName()).toBe('Gómez');
      expect(customer.getPhone()).toBe('999');
      expect(customer.getMail()).toBe('ana.gomez@example.com');
      expect(customer.getFactoryId()).toBe(2);
    });

    it('debería recortar los espacios en blanco en las modificaciones', () => {
      const customer = Customer.create(
        validName,
        validLastName,
        validPhone,
        validMail,
        validFactoryId,
      );

      customer.changeName('   Nombre Nuevo  ');
      customer.changeLastName('   Apellido Nuevo  ');
      customer.changePhone('   555   ');

      expect(customer.getName()).toBe('Nombre Nuevo');
      expect(customer.getLastName()).toBe('Apellido Nuevo');
      expect(customer.getPhone()).toBe('555');
    });
  });

  describe('deactivate() y activate()', () => {
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

    it('debería activar un cliente inactivo', () => {
      const customer = Customer.reconstruct(
        1,
        validName,
        validLastName,
        validPhone,
        validMail,
        validFactoryId,
        false,
      );
      customer.activate();
      expect(customer.isActive()).toBe(true);
    });

    it('debería lanzar un error si se intenta activar un cliente ya activo', () => {
      const customer = Customer.create(
        validName,
        validLastName,
        validPhone,
        validMail,
        validFactoryId,
      );
      expect(() => customer.activate()).toThrow('Customer is already active');
    });
  });
});
