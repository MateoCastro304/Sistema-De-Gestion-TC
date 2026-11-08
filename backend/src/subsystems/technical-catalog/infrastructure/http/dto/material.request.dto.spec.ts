import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationExceptionFactory } from '../../../../../shared/http/validation-exception.factory';
import { ListMaterialsRequestDto } from './list-materials.request.dto';
import { RegisterMaterialRequestDto } from './register-material.request.dto';

// La misma configuración que app.setup.ts, para ver el 400 que ve el cliente.
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  exceptionFactory: (errors) => ValidationExceptionFactory.create(errors),
});

async function detailsOf(type: new () => object, kind: 'body' | 'query', value: object) {
  try {
    await pipe.transform(value, { type: kind, metatype: type });
  } catch (error) {
    if (error instanceof BadRequestException) {
      return (error.getResponse() as { details: { field: string; message: string }[] }).details;
    }
    throw error;
  }
  return null;
}

describe('RegisterMaterialRequestDto (POST /materials body)', () => {
  it('acepta el ejemplo del contrato y deja que la entidad valide los faltantes', async () => {
    expect(await detailsOf(RegisterMaterialRequestDto, 'body', { name: 'Acero', quality: '4140' })).toBeNull();
    expect(await detailsOf(RegisterMaterialRequestDto, 'body', {})).toBeNull();
  });

  it('rechaza un campo que no es texto con el mensaje del contrato', async () => {
    expect(await detailsOf(RegisterMaterialRequestDto, 'body', { name: 5, quality: 7 })).toEqual([
      { field: 'name', message: 'Ingresá el material' },
      { field: 'quality', message: 'Ingresá la calidad' },
    ]);
  });

  it('rechaza campos que el contrato no define', async () => {
    expect(
      await detailsOf(RegisterMaterialRequestDto, 'body', { name: 'Acero', quality: '1', price: 3 }),
    ).not.toBeNull();
  });
});

describe('ListMaterialsRequestDto (GET /materials query)', () => {
  it('aplica los valores por defecto', async () => {
    const query = (await pipe.transform(
      {},
      { type: 'query', metatype: ListMaterialsRequestDto },
    )) as ListMaterialsRequestDto;

    expect(query).toMatchObject({ page: 1, limit: 20 });
  });

  it.each([
    ['page=0', { page: '0' }, 'page'],
    ['limit=0', { limit: '0' }, 'limit'],
    ['limit=101', { limit: '101' }, 'limit'],
    ['name de más de 60 caracteres', { name: 'a'.repeat(61) }, 'name'],
    ['quality de más de 60 caracteres', { quality: 'a'.repeat(61) }, 'quality'],
    ['un parámetro que no existe', { color: 'rojo' }, 'color'],
  ])('rechaza %s con VALIDATION_ERROR sobre el parámetro (escenario 6)', async (_label, query, field) => {
    const details = await detailsOf(ListMaterialsRequestDto, 'query', query);

    expect(details?.map((d) => d.field)).toEqual([field]);
  });

  it('acepta 60 caracteres justos y limit=100', async () => {
    expect(await detailsOf(ListMaterialsRequestDto, 'query', { name: 'a'.repeat(60), limit: '100' })).toBeNull();
  });
});
