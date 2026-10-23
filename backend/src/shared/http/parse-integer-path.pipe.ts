import { BadRequestException, PipeTransform } from '@nestjs/common';

/**
 * Valida que un parámetro de ruta sea un entero y lo convierte a número. Si no
 * lo es, responde el 400 del contrato: `code: INVALID_PATH_PARAMETER` y un
 * `details` con el nombre del parámetro (§5.3).
 */
export class ParseIntegerPathPipe implements PipeTransform<string, number> {
  /**
   * @param field   nombre del parámetro en la ruta (`processTypeId`)
   * @param message mensaje general del 400 ("El identificador del tipo de proceso no es válido.")
   */
  constructor(
    private readonly field: string,
    private readonly message: string,
  ) {}

  transform(value: string): number {
    if (!/^-?\d+$/.test(value)) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        code: 'INVALID_PATH_PARAMETER',
        message: this.message,
        details: [{ field: this.field, message: 'Debe ser un número entero válido.' }],
      });
    }
    return Number(value);
  }
}
