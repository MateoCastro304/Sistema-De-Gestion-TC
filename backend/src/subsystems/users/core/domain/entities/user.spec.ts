import { User } from './user';

describe('User (domain)', () => {
  const validData = {
    employeeId: 1,
    username: 'mcastro',
    passwordHash: 'hashed-value',
    roles: ['EC'] as const,
  };

  it('creates a user as active, unblocked, with no prior access', () => {
    const user = User.create({ ...validData, roles: [...validData.roles] });

    expect(user.getId()).toBeNull();
    expect(user.getUsername()).toBe('mcastro');
    expect(user.getActive()).toBe(true);
    expect(user.isBlocked()).toBe(false);
    expect(user.getFailedAttempts()).toBe(0);
    expect(user.getLastAccessAt()).toBeNull();
    expect(user.getStatus()).toBe('ACTIVE');
  });

  it('trims the username', () => {
    const user = User.create({ ...validData, username: '  mcastro  ', roles: ['EC'] });
    expect(user.getUsername()).toBe('mcastro');
  });

  it('throws when the username is empty', () => {
    expect(() => User.create({ ...validData, username: '', roles: ['EC'] })).toThrow(
      'Ingresá el nombre de usuario',
    );
  });

  it('throws when the username exceeds 30 characters', () => {
    expect(() =>
      User.create({ ...validData, username: 'a'.repeat(31), roles: ['EC'] }),
    ).toThrow('El nombre de usuario no puede superar los 30 caracteres');
  });

  // RN44 / CU-05 Escenario 5
  it('throws when no role is assigned', () => {
    expect(() => User.create({ ...validData, roles: [] })).toThrow('Asigná al menos un rol');
  });

  it('allows several roles, per CU-05 Escenario 2', () => {
    const user = User.create({ ...validData, roles: ['EC', 'ER'] });
    expect(user.getRoles()).toEqual(['EC', 'ER']);
  });

  it('returns a copy from getRoles, not the internal array', () => {
    const user = User.create({ ...validData, roles: ['EC'] });
    const roles = user.getRoles();
    roles.push('AS');
    expect(user.getRoles()).toEqual(['EC']);
  });

  describe('getStatus()', () => {
    const reconstructBase = {
      id: 1,
      employeeId: 1,
      username: 'mcastro',
      passwordHash: 'hashed-value',
      roles: ['EC'] as const,
      failedAttempts: 0,
      lastAccessAt: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    };

    it('is ACTIVE when active and not blocked', () => {
      const user = User.reconstruct({ ...reconstructBase, roles: ['EC'], active: true, blocked: false });
      expect(user.getStatus()).toBe('ACTIVE');
    });

    it('is BLOCKED when active but blocked', () => {
      const user = User.reconstruct({ ...reconstructBase, roles: ['EC'], active: true, blocked: true });
      expect(user.getStatus()).toBe('BLOCKED');
    });

    it('is INACTIVE when deactivated, regardless of blocked', () => {
      const user = User.reconstruct({ ...reconstructBase, roles: ['EC'], active: false, blocked: true });
      expect(user.getStatus()).toBe('INACTIVE');
    });
  });
});
