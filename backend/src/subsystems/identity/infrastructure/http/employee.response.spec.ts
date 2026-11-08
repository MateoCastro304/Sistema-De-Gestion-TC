import { Employee } from '../../core/domain/entities/employee.entity';
import { EmployeeListResponse, EmployeeResponse } from './employee.response';

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

describe('EmployeeResponse', () => {
  it('serializes an employee with its user, as in the contract example', () => {
    const employee = Employee.reconstruct({
      ...row,
      user: { id: 1, username: 'wcastro', roles: ['AS'], status: 'ACTIVE' },
    });

    expect(EmployeeResponse.from(employee)).toEqual({
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

    expect(EmployeeResponse.from(employee).user).toBeNull();
  });

  it('does not share the roles array with the entity', () => {
    const employee = Employee.reconstruct({
      ...row,
      user: { id: 1, username: 'wcastro', roles: ['AS'], status: 'ACTIVE' },
    });

    EmployeeResponse.from(employee).user!.roles.push('JT');

    expect(employee.getUser()!.roles).toEqual(['AS']);
  });

  it('never exposes who created the employee (D-43)', () => {
    const employee = Employee.reconstruct({ ...row, createdByUserId: 7 });

    expect(EmployeeResponse.from(employee)).not.toHaveProperty('createdByUserId');
  });
});

describe('EmployeeListResponse', () => {
  it('wraps the page with the total and the effective page and limit', () => {
    const employee = Employee.reconstruct(row);

    const body = EmployeeListResponse.from({ items: [employee], total: 11 }, 2, 5);

    expect(body.total).toBe(11);
    expect(body.page).toBe(2);
    expect(body.limit).toBe(5);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].id).toBe(1);
  });

  it('returns an empty list, not an error, when there are no results', () => {
    expect(EmployeeListResponse.from({ items: [], total: 0 }, 1, 20)).toEqual({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
    });
  });
});
