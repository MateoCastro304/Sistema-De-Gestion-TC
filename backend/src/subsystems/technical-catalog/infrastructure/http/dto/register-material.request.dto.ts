import { IsOptional, IsString } from 'class-validator';

/**
 * Cuerpo de POST /materials. Solo validación sintáctica (tipo de cada campo);
 * faltantes y largos los valida la entidad, que informa un error por campo.
 * `IsOptional` deja pasar `undefined` y `null` para que sea la entidad quien
 * responda "Ingresá …".
 */
export class RegisterMaterialRequestDto {
  @IsOptional()
  @IsString({ message: 'Ingresá el material' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Ingresá la calidad' })
  quality?: string;
}
