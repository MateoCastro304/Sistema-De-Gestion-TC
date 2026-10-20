import { ListEmployees } from './list-employees.use-case';
import { InMemoryEmployeeRepository } from '../../../infrastructure/persistence/in-memory/in-memory-employee.repository';
import { Employee } from '../../domain/entities/employee';
import { EmployeePosition } from '../../domain/value-objects/employee-position';

describe('ListEmployees (use case)', () => {
  let repo: InMemoryEmployeeRepository;
  let useCase: ListEmployees;

  beforeEach(() => {
    repo = new InMemoryEmployeeRepository();
    useCase = new ListEmployees(repo);
  });

  const draft = (firstName: string, lastName: string, dni: string, position: EmployeePosition = 'EMPLOYEE') =>
    Employee.create({ firstName, lastName, dni, position });

  const seed = async (firstName: string, lastName: string, dni: string, position: EmployeePosition = 'EMPLOYEE') =>
    await repo.save(draft(firstName, lastName, dni, position));

  const defaults = { page: 1, limit: 20, includeInactive: false };
  const lastNames = (items: Employee[]) => items.map((e) => e.getLastName());

  // ---------------------------------------------------------------------------
  // pagination
  // ---------------------------------------------------------------------------
  describe('pagination', () => {
    it('returns an empty page and total 0 when there are no employees', async () => {
      const result = await useCase.execute(defaults);

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('returns the requested page with the total of the whole set', async () => {
      await seed('Ana', 'Álvarez', '20000001');
      await seed('Beto', 'Benítez', '20000002');
      await seed('Carla', 'Castro', '20000003');

      const second = await useCase.execute({ ...defaults, page: 2, limit: 2 });

      expect(lastNames(second.items)).toEqual(['Castro']);
      expect(second.total).toBe(3);
    });

    it('returns an empty page, with the real total, past the last page', async () => {
      await seed('Ana', 'Álvarez', '20000001');

      const result = await useCase.execute({ ...defaults, page: 5 });

      expect(result.items).toEqual([]);
      expect(result.total).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // ordering
  // ---------------------------------------------------------------------------
  describe('ordering', () => {
    it('orders by last name, ignoring case and accents', async () => {
      await seed('Zoe', 'Videla', '20000001');
      await seed('Ana', 'álvarez', '20000002');
      await seed('Luis', 'Castro', '20000003');

      const result = await useCase.execute(defaults);

      expect(lastNames(result.items)).toEqual(['álvarez', 'Castro', 'Videla']);
    });

    it('breaks last name ties by first name', async () => {
      await seed('Walter', 'Castro', '20000001');
      await seed('Alicia', 'Castro', '20000002');

      const result = await useCase.execute(defaults);

      expect(result.items.map((e) => e.getFirstName())).toEqual(['Alicia', 'Walter']);
    });

    it('breaks full-name ties by id', async () => {
      const first = await seed('Ana', 'Castro', '20000001');
      const second = await seed('Ana', 'Castro', '20000002');

      const result = await useCase.execute(defaults);

      expect(result.items.map((e) => e.getId())).toEqual([first.getId(), second.getId()]);
    });
  });

  // ---------------------------------------------------------------------------
  // inactive employees
  // ---------------------------------------------------------------------------
  describe('inactive employees', () => {
    beforeEach(async () => {
      await seed('Ana', 'Álvarez', '20000001');
      repo.seedInactive(draft('Beto', 'Benítez', '20000002'));
    });

    it('excludes inactive employees by default', async () => {
      const result = await useCase.execute(defaults);

      expect(lastNames(result.items)).toEqual(['Álvarez']);
      expect(result.total).toBe(1);
    });

    it('includes inactive employees with includeInactive', async () => {
      const result = await useCase.execute({ ...defaults, includeInactive: true });

      expect(lastNames(result.items)).toEqual(['Álvarez', 'Benítez']);
      expect(result.total).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // search
  // ---------------------------------------------------------------------------
  describe('search', () => {
    beforeEach(async () => {
      await seed('Walter', 'Castro', '20112233', 'HEAD');
      await seed('Julián', 'Ferreyra', '42345678', 'EMPLOYEE');
      await seed('Gabriela', 'Torres', '28789012', 'ADMINISTRATION');
      await seed('Mario', 'Peralta', '30111222', 'WORKSHOP_HEAD');
    });

    it('matches the first name', async () => {
      const result = await useCase.execute({ ...defaults, search: 'walter' });

      expect(lastNames(result.items)).toEqual(['Castro']);
    });

    it('matches the last name', async () => {
      const result = await useCase.execute({ ...defaults, search: 'torres' });

      expect(lastNames(result.items)).toEqual(['Torres']);
    });

    it('matches part of the dni', async () => {
      const result = await useCase.execute({ ...defaults, search: '4234' });

      expect(lastNames(result.items)).toEqual(['Ferreyra']);
    });

    it('matches the position label', async () => {
      const result = await useCase.execute({ ...defaults, search: 'administración' });

      expect(lastNames(result.items)).toEqual(['Torres']);
    });

    it('matches the label of a multi-word position', async () => {
      const result = await useCase.execute({ ...defaults, search: 'jefe de taller' });

      expect(lastNames(result.items)).toEqual(['Peralta']);
    });

    it('ignores case and accents', async () => {
      const withAccent = await useCase.execute({ ...defaults, search: 'JULIAN' });
      const withoutAccent = await useCase.execute({ ...defaults, search: 'administracion' });

      expect(lastNames(withAccent.items)).toEqual(['Ferreyra']);
      expect(lastNames(withoutAccent.items)).toEqual(['Torres']);
    });

    it('requires every word to match, in any field', async () => {
      const both = await useCase.execute({ ...defaults, search: 'walter castro' });
      const mismatch = await useCase.execute({ ...defaults, search: 'walter torres' });

      expect(lastNames(both.items)).toEqual(['Castro']);
      expect(mismatch.items).toEqual([]);
    });

    it('returns everything when the search is empty', async () => {
      const result = await useCase.execute({ ...defaults, search: '' });

      expect(result.total).toBe(4);
    });

    it('returns an empty page and total 0 when nothing matches', async () => {
      const result = await useCase.execute({ ...defaults, search: 'zzz' });

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('computes the total over the filtered set, not over the page', async () => {
      const result = await useCase.execute({ ...defaults, limit: 1, search: 'a' });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBeGreaterThan(1);
    });

    it('combines search with includeInactive', async () => {
      repo.seedInactive(draft('Walter', 'Castro Viejo', '10000001'));

      const active = await useCase.execute({ ...defaults, search: 'castro' });
      const all = await useCase.execute({ ...defaults, search: 'castro', includeInactive: true });

      expect(active.total).toBe(1);
      expect(all.total).toBe(2);
    });
  });
});
