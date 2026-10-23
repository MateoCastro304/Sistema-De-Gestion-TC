import { ProcessTypeValidationError } from '../errors/process-type-validation.error';
import { ProcessType, ProcessTypeChanges } from './process-type.entity';

const CREATED = new Date('2026-03-12T12:10:00.000Z');
const BEFORE = new Date('2026-10-01T13:22:00.000Z');
const NOW = new Date('2026-10-15T13:30:00.000Z');

function aProcessType(): ProcessType {
  return ProcessType.reconstruct({
    id: 1,
    name: 'Mecanizado Torno Manual',
    nameKey: 'mecanizado torno manual',
    description: 'Torneado convencional.',
    hourlyRateArs: 1557,
    hourlyRateUsd: 1.13,
    exchangeRate: 1377.88,
    createdAt: CREATED,
    updatedAt: BEFORE,
  });
}

function detailsOf(changes: ProcessTypeChanges): { field: string; message: string }[] {
  try {
    aProcessType().modify(changes, NOW);
  } catch (error) {
    if (error instanceof ProcessTypeValidationError) return error.details;
    throw error;
  }
  throw new Error('no lanzó');
}

describe('ProcessType.modify', () => {
  describe('cambio de precio', () => {
    it('al cambiar dólares y tipo de cambio mantiene los pesos y trae un registro de historial', () => {
      const result = aProcessType().modify({ hourlyRateUsd: 1.12, exchangeRate: 1390 }, NOW);

      expect(result.changed).toBe(true);
      expect(result.next.getHourlyRateArs().getValue()).toBe(1557);
      expect(result.next.getHourlyRateUsd().getValue()).toBe(1.12);
      expect(result.next.getExchangeRate().getValue()).toBe(1390);
      expect(result.next.getUpdatedAt()).toEqual(NOW);
      expect(result.next.getCreatedAt()).toEqual(CREATED);
      expect(result.priceChange?.previousValueUsd.getValue()).toBe(1.13);
      expect(result.priceChange?.newValueUsd.getValue()).toBe(1.12);
      expect(result.priceChange?.exchangeRate.getValue()).toBe(1390);
    });

    it('genera un solo registro aunque cambien los dos precios', () => {
      const result = aProcessType().modify({ hourlyRateArs: 1700, hourlyRateUsd: 1.22, exchangeRate: 1393.44 }, NOW);

      expect(result.priceChange?.previousValueUsd.getValue()).toBe(1.13);
      expect(result.priceChange?.newValueUsd.getValue()).toBe(1.22);
    });

    it('ignora el tipo de cambio si ningún precio cambia (D-52)', () => {
      const result = aProcessType().modify({ hourlyRateArs: 1557, exchangeRate: 1500 }, NOW);

      expect(result.changed).toBe(false);
      expect(result.next.getExchangeRate().getValue()).toBe(1377.88);
    });

    it('exige el tipo de cambio cuando llega un precio', () => {
      expect(detailsOf({ hourlyRateUsd: 1.12 })).toEqual([
        { field: 'exchangeRate', message: 'Ingresá un tipo de cambio mayor a 0, con hasta dos decimales' },
      ]);
    });

    it('informa un error por campo con precio no positivo o con más de dos decimales', () => {
      expect(detailsOf({ hourlyRateArs: 0, hourlyRateUsd: 1.234, exchangeRate: 1390 })).toEqual([
        { field: 'hourlyRateArs', message: 'El precio hora en pesos tiene que ser un número mayor a 0' },
        { field: 'hourlyRateUsd', message: 'El precio hora en dólares admite como máximo dos decimales' },
      ]);
    });
  });

  describe('cambio de nombre o descripción', () => {
    it('actualiza updatedAt y no genera registro de historial', () => {
      const result = aProcessType().modify({ name: '  Torno Manual  ' }, NOW);

      expect(result.changed).toBe(true);
      expect(result.next.getName()).toBe('Torno Manual');
      expect(result.next.getNameKey()).toBe('torno manual');
      expect(result.next.getUpdatedAt()).toEqual(NOW);
      expect(result.priceChange).toBeNull();
      expect(result.nameKeyChanged()).toBe(true);
    });

    it('cambiar solo mayúsculas o acentos del nombre es un cambio que no requiere volver a comprobar la unicidad', () => {
      const result = aProcessType().modify({ name: 'Mecanizado Tórno Manual' }, NOW);

      expect(result.changed).toBe(true);
      expect(result.nameKeyChanged()).toBe(false);
    });

    it.each([null, '', '   '])('borra la descripción cuando llega %p', (description) => {
      const result = aProcessType().modify({ description }, NOW);

      expect(result.changed).toBe(true);
      expect(result.next.getDescription()).toBeNull();
      expect(result.priceChange).toBeNull();
    });

    it('rechaza el nombre vacío, el nombre largo y la descripción larga', () => {
      expect(detailsOf({ name: '  ' })).toEqual([{ field: 'name', message: 'Ingresá el nombre del tipo de proceso' }]);
      expect(detailsOf({ name: 'a'.repeat(101), description: 'b'.repeat(501) }).map((d) => d.field)).toEqual([
        'name',
        'description',
      ]);
    });
  });

  describe('sin cambios', () => {
    it('devuelve el mismo tipo de proceso, sin historial y sin tocar updatedAt (D-31)', () => {
      const original = aProcessType();

      const result = original.modify(
        {
          name: 'Mecanizado Torno Manual',
          description: 'Torneado convencional.',
          hourlyRateUsd: 1.13,
          exchangeRate: 1377.88,
        },
        NOW,
      );

      expect(result.changed).toBe(false);
      expect(result.next).toBe(original);
      expect(result.next.getUpdatedAt()).toEqual(BEFORE);
      expect(result.priceChange).toBeNull();
    });

    it('rechaza un cuerpo sin ningún campo con el mensaje del contrato', () => {
      let error: ProcessTypeValidationError | undefined;
      try {
        aProcessType().modify({}, NOW);
      } catch (e) {
        error = e as ProcessTypeValidationError;
      }

      expect(error).toBeInstanceOf(ProcessTypeValidationError);
      expect(error?.message).toBe('Enviá al menos un campo para modificar.');
      expect(error?.details).toEqual([]);
    });
  });
});
