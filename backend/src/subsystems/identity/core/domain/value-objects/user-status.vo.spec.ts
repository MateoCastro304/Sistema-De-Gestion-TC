import { UserStatusResolver } from './user-status.vo';

describe('UserStatusResolver', () => {
  const resolve = (facts: Partial<Parameters<typeof UserStatusResolver.resolve>[0]> = {}) =>
    UserStatusResolver.resolve({ userActive: true, employeeActive: true, locked: false, ...facts });

  it('is ACTIVE when nothing is wrong', () => {
    expect(resolve()).toBe('ACTIVE');
  });

  it('is BLOCKED when it has a login lock in force', () => {
    expect(resolve({ locked: true })).toBe('BLOCKED');
  });

  it('is INACTIVE when the user was dado de baja', () => {
    expect(resolve({ userActive: false })).toBe('INACTIVE');
  });

  it('is INACTIVE when the employee was dado de baja, even if the user is active (D-26)', () => {
    expect(resolve({ employeeActive: false })).toBe('INACTIVE');
  });

  it('is INACTIVE when dado de baja and also locked: the baja wins', () => {
    expect(resolve({ userActive: false, locked: true })).toBe('INACTIVE');
    expect(resolve({ employeeActive: false, locked: true })).toBe('INACTIVE');
  });
});
