import { BadRequestException } from '@nestjs/common';
import { ParseIntegerPathPipe } from './parse-integer-path.pipe';

describe('ParseIntegerPathPipe', () => {
  const pipe = new ParseIntegerPathPipe('processTypeId', 'El identificador del tipo de proceso no es válido.');

  it.each([
    ['7', 7],
    ['0042', 42],
  ])('convierte "%s" en %p', (input, expected) => {
    expect(pipe.transform(input)).toBe(expected);
  });

  it.each(['abc', '1.5', '', '12abc', '1e3'])('rechaza "%s" con INVALID_PATH_PARAMETER', (input) => {
    let error: BadRequestException | undefined;
    try {
      pipe.transform(input);
    } catch (e) {
      error = e as BadRequestException;
    }

    expect(error).toBeInstanceOf(BadRequestException);
    expect(error!.getResponse()).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      code: 'INVALID_PATH_PARAMETER',
      message: 'El identificador del tipo de proceso no es válido.',
      details: [{ field: 'processTypeId', message: 'Debe ser un número entero válido.' }],
    });
  });
});
