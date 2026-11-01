import { ArgumentsHost, Logger } from '@nestjs/common';
import { DomainError } from '../../../../../shared/domain/errors/domain.error';
import { EmployeeDniTaken } from '../../../core/domain/errors/employee-dni-taken.error';
import { EmployeeNotFound } from '../../../core/domain/errors/employee-not-found.error';
import { EmployeeValidationError } from '../../../core/domain/errors/employee-validation.error';
import { InvalidEmployeeId } from '../../../core/domain/errors/invalid-employee-id.error';
import { EmployeesExceptionFilter } from './employees-exception.filter';

class UnmappedError extends DomainError {}

function run(exception: DomainError, url = '/api/employees') {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ url }),
    }),
  } as unknown as ArgumentsHost;

  new EmployeesExceptionFilter().catch(exception, host);

  return { status: status.mock.calls[0][0] as number, body: json.mock.calls[0][0] as Record<string, unknown> };
}

describe('EmployeesExceptionFilter', () => {
  it('maps EmployeeValidationError to 400 VALIDATION_ERROR with its details', () => {
    const details = [{ field: 'dni', message: 'Ingresá el DNI' }];

    const { status, body } = run(new EmployeeValidationError('Los datos enviados no son válidos.', details));

    expect(status).toBe(400);
    expect(body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      code: 'VALIDATION_ERROR',
      message: 'Los datos enviados no son válidos.',
      path: '/api/employees',
      details,
    });
  });

  it('maps InvalidEmployeeId to 400 INVALID_PATH_PARAMETER', () => {
    const { status, body } = run(new InvalidEmployeeId(), '/api/employees/abc');

    expect(status).toBe(400);
    expect(body).toMatchObject({
      code: 'INVALID_PATH_PARAMETER',
      message: 'El identificador del empleado no es válido.',
      path: '/api/employees/abc',
      details: [{ field: 'employeeId', message: 'Debe ser un número entero válido.' }],
    });
  });

  it('maps EmployeeNotFound to 404 EMPLOYEE_NOT_FOUND without details', () => {
    const { status, body } = run(new EmployeeNotFound(99), '/api/employees/99');

    expect(status).toBe(404);
    expect(body).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      code: 'EMPLOYEE_NOT_FOUND',
      message: 'No se encontró el empleado solicitado.',
      path: '/api/employees/99',
    });
    expect(body).not.toHaveProperty('details');
  });

  it('maps EmployeeDniTaken to 409 EMPLOYEE_DNI_TAKEN with a detail on dni', () => {
    const { status, body } = run(new EmployeeDniTaken('42345678'));

    expect(status).toBe(409);
    expect(body).toMatchObject({
      statusCode: 409,
      error: 'Conflict',
      code: 'EMPLOYEE_DNI_TAKEN',
      message: 'Ya existe un empleado con ese DNI',
      details: [{ field: 'dni', message: 'Ya existe un empleado con ese DNI' }],
    });
  });

  it('includes an ISO timestamp in every body', () => {
    const { body } = run(new EmployeeNotFound(1));

    expect(new Date(body.timestamp as string).toISOString()).toBe(body.timestamp);
  });

  it('answers 500 and logs an unmapped DomainError', () => {
    const logSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const { status, body } = run(new UnmappedError('boom'));

    expect(status).toBe(500);
    expect(body).toMatchObject({ statusCode: 500, error: 'Internal Server Error' });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
