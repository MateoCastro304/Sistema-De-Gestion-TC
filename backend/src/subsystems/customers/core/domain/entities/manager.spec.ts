import { Manager } from './manager';

describe('Manager Entity', () => {
  const validName = 'Juan';
  const validLastName = 'Pérez';
  const validPhone = '+54 11 5555-5555';
  // El teléfono se guarda sin separadores.
  const normalizedPhone = '+541155555555';
  const validMail = 'Juan.Perez@Example.com';
  const validFactoryId = 1;

  describe('create()', () => {
    it('debería crear una instancia de Manager válida', () => {
      const manager = Manager.create(validName, validLastName, validPhone, validMail, validFactoryId);

      expect(manager).toBeDefined();
      expect(manager.getId()).toBeNull(); // Nace sin ID antes de persistir
      expect(manager.getName()).toBe(validName);
      expect(manager.getLastName()).toBe(validLastName);
      expect(manager.getPhone()).toBe(normalizedPhone);
      expect(manager.getMail()).toBe('juan.perez@example.com');
      expect(manager.getFactoryId()).toBe(validFactoryId);
      expect(manager.isActive()).toBe(true);
    });

    it('debería normalizar el mail a minúsculas y sin espacios', () => {
      const manager = Manager.create(
        validName,
        validLastName,
        validPhone,
        '  Juan.Perez@Example.com  ',
        validFactoryId,
      );
      expect(manager.getMail()).toBe('juan.perez@example.com');
    });

    it('debería recortar los espacios en blanco de los campos de texto', () => {
      const manager = Manager.create('  Juan  ', '  Pérez  ', '  11 5555-1234  ', validMail, validFactoryId);
      expect(manager.getName()).toBe('Juan');
      expect(manager.getLastName()).toBe('Pérez');
      expect(manager.getPhone()).toBe('1155551234');
    });

    it('debería rechazar un teléfono inválido', () => {
      expect(() => Manager.create(validName, validLastName, 'abc', validMail, validFactoryId)).toThrow(
        'Phone must contain only digits and separators',
      );
      expect(() => Manager.create(validName, validLastName, '123', validMail, validFactoryId)).toThrow(
        'Phone must have between 8 and 15 digits',
      );
    });

    it('debería lanzar un error si el nombre está vacío', () => {
      expect(() => Manager.create('   ', validLastName, validPhone, validMail, validFactoryId)).toThrow(
        'Manager name cannot be empty',
      );
    });

    it('debería permitir un apellido ausente (null o vacío)', () => {
      const withNull = Manager.create(validName, null, validPhone, validMail, validFactoryId);
      const withBlank = Manager.create(validName, '  ', validPhone, validMail, validFactoryId);

      expect(withNull.getLastName()).toBeNull();
      expect(withBlank.getLastName()).toBeNull();
    });

    it('debería permitir crear un cliente solo con mail', () => {
      const manager = Manager.create(validName, validLastName, null, validMail, validFactoryId);

      expect(manager.getPhone()).toBeNull();
      expect(manager.getMail()).toBe('juan.perez@example.com');
    });

    it('debería permitir crear un cliente solo con teléfono', () => {
      const manager = Manager.create(validName, validLastName, validPhone, null, validFactoryId);

      expect(manager.getPhone()).toBe(normalizedPhone);
      expect(manager.getMail()).toBeNull();
    });

    it('debería tratar un teléfono con solo espacios como ausente', () => {
      const manager = Manager.create(validName, validLastName, '   ', validMail, validFactoryId);
      expect(manager.getPhone()).toBeNull();
    });

    it('debería lanzar un error si no hay teléfono ni mail', () => {
      expect(() => Manager.create(validName, validLastName, null, null, validFactoryId)).toThrow(
        'Manager must have at least one contact: phone or mail',
      );
      expect(() => Manager.create(validName, validLastName, '   ', '   ', validFactoryId)).toThrow(
        'Manager must have at least one contact: phone or mail',
      );
    });

    it('debería lanzar un error si el mail tiene un formato inválido', () => {
      expect(() => Manager.create(validName, validLastName, validPhone, 'no-es-un-mail', validFactoryId)).toThrow(
        'Invalid email format',
      );
    });

    it('debería lanzar un error si el factoryId no es un entero positivo', () => {
      expect(() => Manager.create(validName, validLastName, validPhone, validMail, 0)).toThrow(
        'Factory id must be a positive integer',
      );
    });
  });

  describe('reconstruct()', () => {
    it('debería reconstruir una entidad Manager persistida previamente', () => {
      const manager = Manager.reconstruct(10, validName, validLastName, validPhone, validMail, validFactoryId, false);

      expect(manager.getId()).toBe(10);
      expect(manager.getName()).toBe(validName);
      expect(manager.isActive()).toBe(false);
    });

    it('debería reconstruir un cliente con apellido, teléfono y mail en null', () => {
      const manager = Manager.reconstruct(10, validName, null, null, null, validFactoryId, true);

      expect(manager.getLastName()).toBeNull();
      expect(manager.getPhone()).toBeNull();
      expect(manager.getMail()).toBeNull();
    });
  });

  describe('update()', () => {
    it('debería actualizar todas las propiedades correctamente', () => {
      const manager = Manager.create(validName, validLastName, validPhone, validMail, validFactoryId);

      manager.update('Ana', 'Gómez', '11 5555-9999', 'ana.gomez@example.com', 2);

      expect(manager.getName()).toBe('Ana');
      expect(manager.getLastName()).toBe('Gómez');
      expect(manager.getPhone()).toBe('1155559999');
      expect(manager.getMail()).toBe('ana.gomez@example.com');
      expect(manager.getFactoryId()).toBe(2);
    });

    it('debería permitir quitar apellido y teléfono si queda el mail', () => {
      const manager = Manager.create(validName, validLastName, validPhone, validMail, validFactoryId);

      manager.update(validName, null, null, validMail, validFactoryId);

      expect(manager.getLastName()).toBeNull();
      expect(manager.getPhone()).toBeNull();
      expect(manager.getMail()).toBe('juan.perez@example.com');
    });

    it('debería rechazar un update que deja al cliente sin contacto y no modificar nada', () => {
      const manager = Manager.create(validName, validLastName, validPhone, validMail, validFactoryId);

      expect(() => manager.update('Otro', 'Nombre', null, null, validFactoryId)).toThrow(
        'Manager must have at least one contact: phone or mail',
      );
      expect(manager.getName()).toBe(validName);
      expect(manager.getPhone()).toBe(normalizedPhone);
    });

    it('debería recortar los espacios en blanco en las modificaciones', () => {
      const manager = Manager.create(validName, validLastName, validPhone, validMail, validFactoryId);

      manager.setName('   Nombre Nuevo  ');
      manager.setLastName('   Apellido Nuevo  ');
      manager.setPhone('   11 5555-0000   ');

      expect(manager.getName()).toBe('Nombre Nuevo');
      expect(manager.getLastName()).toBe('Apellido Nuevo');
      expect(manager.getPhone()).toBe('1155550000');
    });
  });

  describe('deactivate()', () => {
    it('debería desactivar un cliente activo', () => {
      const manager = Manager.create(validName, validLastName, validPhone, validMail, validFactoryId);
      manager.deactivate();
      expect(manager.isActive()).toBe(false);
    });

    it('debería lanzar un error si se intenta desactivar un cliente ya inactivo', () => {
      const manager = Manager.reconstruct(1, validName, validLastName, validPhone, validMail, validFactoryId, false);
      expect(() => manager.deactivate()).toThrow('Manager is already inactive');
    });
  });
});
