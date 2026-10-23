import { computeUserStatus } from './user-status';

describe('computeUserStatus', () => {
  it('is ACTIVE when active and not blocked', () => {
    expect(computeUserStatus({ active: true, blocked: false })).toBe('ACTIVE');
  });

  it('is BLOCKED when active and blocked', () => {
    expect(computeUserStatus({ active: true, blocked: true })).toBe('BLOCKED');
  });

  it('is INACTIVE when dado de baja', () => {
    expect(computeUserStatus({ active: false, blocked: false })).toBe('INACTIVE');
  });

  it('is INACTIVE when dado de baja and blocked: the baja wins', () => {
    expect(computeUserStatus({ active: false, blocked: true })).toBe('INACTIVE');
  });
});
