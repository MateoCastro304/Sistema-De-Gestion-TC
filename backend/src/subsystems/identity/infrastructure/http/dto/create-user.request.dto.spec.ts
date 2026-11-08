import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationExceptionFactory } from '../../../../../shared/http/validation-exception.factory';
import { CreateUserRequestDto } from './create-user.request.dto';
import { ListUsersRequestDto } from './list-users.request.dto';

// La misma configuración que app.setup.ts, para ver el 400 que ve el cliente.
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  exceptionFactory: (errors) => ValidationExceptionFactory.create(errors),
});

async function detailsOf(type: new () => object, value: object) {
  try {
    await pipe.transform(value, { type: 'body', metatype: type });
  } catch (error) {
    if (error instanceof BadRequestException) {
      return (error.getResponse() as { details: { field: string; message: string }[] }).details;
    }
    throw error;
  }
  return null;
}

const valid = { employeeId: 9, username: 'mcastro', password: 'Tz8kq4Rmw2', roles: ['EC', 'ER'] };

describe('CreateUserRequestDto (POST /users body)', () => {
  it('accepts the contract example', async () => {
    expect(await detailsOf(CreateUserRequestDto, valid)).toBeNull();
  });

  it('reports the contract messages when the required fields are missing', async () => {
    const details = await detailsOf(CreateUserRequestDto, {});

    expect(details).toEqual(
      expect.arrayContaining([
        { field: 'employeeId', message: 'Elegí el empleado' },
        { field: 'username', message: 'Ingresá el nombre de usuario' },
        { field: 'password', message: 'La contraseña debe tener al menos 8 caracteres' },
        { field: 'roles', message: 'Asigná al menos un rol' },
      ]),
    );
  });

  it('reports an empty username', async () => {
    expect(await detailsOf(CreateUserRequestDto, { ...valid, username: '   ' })).toEqual([
      { field: 'username', message: 'Ingresá el nombre de usuario' },
    ]);
  });

  it('rejects a password shorter than 8 and one longer than 72', async () => {
    expect(await detailsOf(CreateUserRequestDto, { ...valid, password: 'corta' })).toEqual([
      { field: 'password', message: 'La contraseña debe tener al menos 8 caracteres' },
    ]);
    expect(await detailsOf(CreateUserRequestDto, { ...valid, password: 'a'.repeat(73) })).toEqual([
      { field: 'password', message: 'La contraseña no puede superar los 72 caracteres' },
    ]);
  });

  it('rejects an empty roles list, a repeated role and an unknown role', async () => {
    expect(await detailsOf(CreateUserRequestDto, { ...valid, roles: [] })).toEqual([
      { field: 'roles', message: 'Asigná al menos un rol' },
    ]);
    expect(await detailsOf(CreateUserRequestDto, { ...valid, roles: ['EC', 'EC'] })).toEqual([
      { field: 'roles', message: 'No repitas los roles' },
    ]);
    expect(await detailsOf(CreateUserRequestDto, { ...valid, roles: ['XX'] })).toEqual([
      { field: 'roles', message: 'No existe un rol con ese código.' },
    ]);
  });

  it('rejects a body with fields the contract does not define', async () => {
    expect(await detailsOf(CreateUserRequestDto, { ...valid, isActive: false })).not.toBeNull();
  });
});

describe('ListUsersRequestDto (GET /users query)', () => {
  it('applies the defaults and reads includeInactive as a boolean', async () => {
    const query = (await pipe.transform(
      { includeInactive: 'true' },
      { type: 'query', metatype: ListUsersRequestDto },
    )) as ListUsersRequestDto;

    expect(query).toMatchObject({ page: 1, limit: 20, includeInactive: true });
  });

  it('rejects an unknown role code', async () => {
    expect(await detailsOf(ListUsersRequestDto, { role: 'XX' })).toEqual([
      { field: 'role', message: 'No existe un rol con ese código.' },
    ]);
  });
});
