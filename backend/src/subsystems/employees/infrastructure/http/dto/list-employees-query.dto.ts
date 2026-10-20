import { Allow } from 'class-validator';
import { MAX_PAGE_LIMIT } from '../../../../../shared/domain/pagination';
import { EmployeeFieldError, EmployeeValidationError } from '../../../core/domain/errors/employee-validation.error';
import { EmployeeListParams } from '../../../core/domain/ports/employee.repository';

const MAX_SEARCH_LENGTH = 120;


export class ListEmployeesQueryDto {
  @Allow()
  page?: unknown;

  @Allow()
  limit?: unknown;

  @Allow()
  search?: unknown;

  @Allow()
  includeInactive?: unknown;
}

function parseInteger(raw: unknown, fallback: number, min: number, max: number): number | null {
  if (raw === undefined) return fallback;
  if (typeof raw !== 'string' || !/^-?\d+$/.test(raw.trim())) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value >= min && value <= max ? value : null;
}

export function toListEmployeesParams(query: ListEmployeesQueryDto): EmployeeListParams {
  const details: EmployeeFieldError[] = [];

  const page = parseInteger(query.page, 1, 1, Number.MAX_SAFE_INTEGER);
  if (page === null) {
    details.push({ field: 'page', message: 'Debe ser un número entero mayor o igual a 1.' });
  }

  const limit = parseInteger(query.limit, 20, 1, MAX_PAGE_LIMIT);
  if (limit === null) {
    details.push({ field: 'limit', message: `Debe ser un número entero entre 1 y ${MAX_PAGE_LIMIT}.` });
  }

  let includeInactive = false;
  if (query.includeInactive !== undefined) {
    if (query.includeInactive === 'true' || query.includeInactive === 'false') {
      includeInactive = query.includeInactive === 'true';
    } else {
      details.push({ field: 'includeInactive', message: 'Debe ser true o false.' });
    }
  }

  let search: string | undefined;
  if (query.search !== undefined) {
    if (typeof query.search !== 'string') {
      details.push({ field: 'search', message: 'Debe ser un texto.' });
    } else if (query.search.length > MAX_SEARCH_LENGTH) {
      details.push({ field: 'search', message: `No puede superar los ${MAX_SEARCH_LENGTH} caracteres.` });
    } else {
      search = query.search.trim() || undefined;
    }
  }

  if (details.length > 0 || page === null || limit === null) {
    throw new EmployeeValidationError('Los parámetros de consulta no son válidos.', details);
  }

  return { page, limit, search, includeInactive };
}
