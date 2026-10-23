import { IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * Cuerpo de PATCH /process-types/{id}. Todos los campos son opcionales; solo
 * validación sintáctica (tipo de cada campo). Que llegue al menos uno, que el
 * tipo de cambio acompañe a un precio y los rangos, decimales y largos los
 * valida la entidad. `IsOptional` deja pasar `null` para que sea la entidad
 * quien responda ("Ingresá …", o borre la descripción).
 */
export class UpdateProcessTypeRequestDto {
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
