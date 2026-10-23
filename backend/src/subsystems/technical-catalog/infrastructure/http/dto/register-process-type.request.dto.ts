import { IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * Cuerpo de POST /process-types. Solo validación sintáctica (tipo de cada
 * campo); faltantes, rangos, decimales y largos los valida la entidad, que
 * informa un error por campo. `IsOptional` deja pasar `undefined` y `null`
 * para que sea la entidad quien responda "Ingresá …".
 */
export class RegisterProcessTypeRequestDto {
  @IsOptional()
  @IsString({ message: 'Ingresá el nombre del tipo de proceso' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'La descripción tiene que ser un texto' })
  description?: string | null;

  @IsOptional()
  @IsNumber({}, { message: 'El precio hora en pesos tiene que ser un número mayor a 0' })
  hourlyRateArs?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El precio hora en dólares tiene que ser un número mayor a 0' })
  hourlyRateUsd?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El tipo de cambio tiene que ser un número mayor a 0' })
  exchangeRate?: number;
}
