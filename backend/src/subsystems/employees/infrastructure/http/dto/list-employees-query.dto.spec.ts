import { EmployeeValidationError } from '../../../core/domain/errors/employee-validation.error';
import { ListEmployeesQueryDto, toListEmployeesParams } from './list-employees-query.dto';

const query = (values: Partial<ListEmployeesQueryDto> = {}): ListEmployeesQueryDto =>
  Object.assign(new ListEmployeesQueryDto(), values);

function validationErrorOf(values: Partial<ListEmployeesQueryDto>): EmployeeValidationError {
  try {
    toListEmployeesParams(query(values));
  } catch (error) {
    if (error instanceof EmployeeValidationError) return error;
    throw error;
  }
  throw new Error('toListEmployeesParams should have thrown');
}

describe('toListEmployeesParams', () => {
  it('applies the defaults when the query is empty', () => {
    expect(toListEmployeesParams(query())).toEqual({
      page: 1,
      limit: 20,
      search: undefined,
      includeInactive: false,
    });
  });

  it('parses every param', () => {
    const params = toListEmployeesParams(
      query({ page: '2', limit: '50', search: '  castro ', includeInactive: 'true' }),
    );

    expect(params).toEqual({ page: 2, limit: 50, search: 'castro', includeInactive: true });
  });

  it('turns a blank search into undefined', () => {
    expect(toListEmployeesParams(query({ search: '   ' })).search).toBeUndefined();
  });

  it('accepts the limit bounds 1 and 100', () => {
    expect(toListEmployeesParams(query({ limit: '1' })).limit).toBe(1);
    expect(toListEmployeesParams(query({ limit: '100' })).limit).toBe(100);
  });

  it('accepts a search of exactly 120 characters', () => {
    expect(toListEmployeesParams(query({ search: 'a'.repeat(120) })).search).toHaveLength(120);
  });

  describe('invalid values', () => {
    it.each(['0', '-1', 'abc', '1.5', ''])('rejects page "%s"', (page) => {
      const error = validationErrorOf({ page });

      expect(error.message).toBe('Los parámetros de consulta no son válidos.');
      expect(error.details).toEqual([{ field: 'page', message: 'Debe ser un número entero mayor o igual a 1.' }]);
    });

    it.each(['0', '101', 'abc', '2.5'])('rejects limit "%s"', (limit) => {
      const error = validationErrorOf({ limit });

      expect(error.details).toEqual([{ field: 'limit', message: 'Debe ser un número entero entre 1 y 100.' }]);
    });

    it('rejects includeInactive other than true or false', () => {
      const error = validationErrorOf({ includeInactive: 'yes' });

      expect(error.details).toEqual([{ field: 'includeInactive', message: 'Debe ser true o false.' }]);
    });

    it('rejects a search longer than 120 characters', () => {
      const error = validationErrorOf({ search: 'a'.repeat(121) });

      expect(error.details).toEqual([{ field: 'search', message: 'No puede superar los 120 caracteres.' }]);
    });

    it('rejects a repeated param (array)', () => {
      const error = validationErrorOf({ search: ['a', 'b'] });

      expect(error.details).toEqual([{ field: 'search', message: 'Debe ser un texto.' }]);
    });

    it('reports every invalid param at once', () => {
      const error = validationErrorOf({ page: '0', limit: '0' });

      expect(error.details.map((d) => d.field)).toEqual(['page', 'limit']);
    });
  });
});
