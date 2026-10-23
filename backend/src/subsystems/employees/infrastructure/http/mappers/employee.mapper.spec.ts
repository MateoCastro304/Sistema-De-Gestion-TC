import { Employee } from '../../../core/domain/entities/employee';
import { toEmployeeResponse } from './employee.mapper';

const row = {
  id: 1,
  firstName: 'Walter',
  lastName: 'Castro',
  dni: '20112233',
  position: 'HEAD' as const,
  address: 'Av. Colón 1820, Córdoba',
  email: 'wcastro@castrotorneria.com.ar',
  phone: '+54 351 555-1001',
  active: true,
  createdAt: new Date('2026-03-12T12:00:00.000Z'),
  updatedAt: new Date('2026-03-12T12:00:00.000Z'),
};

describe('toEmployeeResponse', () => {
  it('serializes an employee with its user, as in the contract example', () => {
    const employee = Employee.reconstruct({
      ...row,
      user: { id: 1, username: 'wcastro', roles: ['AS'], status: 'ACTIVE' },
    });

    expect(toEmployeeResponse(employee)).toEqual({
      id: 1,
      firstName: 'Walter',
      lastName: 'Castro',
      dni: '20112233',
      position: 'HEAD',
      address: 'Av. Colón 1820, Córdoba',
      email: 'wcastro@castrotorneria.com.ar',
      phone: '+54 351 555-1001',
      active: true,
      user: { id: 1, username: 'wcastro', roles: ['AS'], status: 'ACTIVE' },
      createdAt: '2026-03-12T12:00:00.000Z',
      updatedAt: '2026-03-12T12:00:00.000Z',
    });
  });

  it('serializes user as null when the employee has none', () => {
    const employee = Employee.reconstruct(row);

    expect(toEmployeeResponse(employee).user).toBeNull();
  });

  it('does not share the roles array with the entity', () => {
    const employee = Employee.reconstruct({
      ...row,
      user: { id: 1, username: 'wcastro', roles: ['AS'], status: 'ACTIVE' },
    });

    toEmployeeResponse(employee).user!.roles.push('JT');

    expect(employee.getUser()!.roles).toEqual(['AS']);
  });
});
