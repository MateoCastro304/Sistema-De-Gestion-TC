import { ProcessTypeValidationError } from '../errors/process-type-validation.error';
import { ProcessType } from './process-type.entity';

const valid = {
  name: 'Mecanizado Torno CNC 5 ejes',
  description: null,
  hourlyRateArs: 3100,
  hourlyRateUsd: 2.24,
  exchangeRate: 1385.5,
};

function detailsOf(data: object): { field: string; message: string }[] {
  try {
    ProcessType.create({ ...valid, ...data });
  } catch (error) {
    if (error instanceof ProcessTypeValidationError) return error.details;
    throw error;
  }
  throw new Error('no lanzó');
}

describe('ProcessType.create', () => {
  it('guarda los precios tal como llegan y calcula la clave del nombre', () => {
    const pt = ProcessType.create({ ...valid, name: '  Mecanizado   Tórno ' });

    expect(pt.getName()).toBe('Mecanizado   Tórno');
    expect(pt.getNameKey()).toBe('mecanizado torno');
    expect(pt.getHourlyRateArs().getValue()).toBe(3100);
    expect(pt.getHourlyRateUsd().getValue()).toBe(2.24);
    expect(pt.getExchangeRate().getValue()).toBe(1385.5);
  });

  it('guarda la descripción vacía como null', () => {
    expect(ProcessType.create({ ...valid, description: '  ' }).getDescription()).toBeNull();
  });

  it('informa un error por campo cuando faltan los obligatorios', () => {
    const details = detailsOf({ name: '', hourlyRateArs: undefined, hourlyRateUsd: null, exchangeRate: undefined });

    expect(details).toEqual([
      { field: 'name', message: 'Ingresá el nombre del tipo de proceso' },
      { field: 'hourlyRateArs', message: 'Ingresá el precio hora en pesos' },
      { field: 'hourlyRateUsd', message: 'Ingresá el precio hora en dólares' },
      { field: 'exchangeRate', message: 'Ingresá un tipo de cambio mayor a 0, con hasta dos decimales' },
    ]);
  });

  it('informa precio no positivo y más de dos decimales', () => {
    expect(detailsOf({ hourlyRateArs: 0, hourlyRateUsd: 1.234 })).toEqual([
      { field: 'hourlyRateArs', message: 'El precio hora en pesos tiene que ser un número mayor a 0' },
      { field: 'hourlyRateUsd', message: 'El precio hora en dólares admite como máximo dos decimales' },
    ]);
  });

  it('rechaza el nombre de más de 100 caracteres y la descripción de más de 500', () => {
    const fields = detailsOf({ name: 'a'.repeat(101), description: 'b'.repeat(501) }).map((d) => d.field);
    expect(fields).toEqual(['name', 'description']);
  });
});
