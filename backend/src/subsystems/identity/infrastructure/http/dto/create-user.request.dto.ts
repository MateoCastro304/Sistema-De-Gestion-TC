import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ROLES } from '../../../core/domain/value-objects/role.vo';
import type { Role } from '../../../core/domain/value-objects/role.vo';

/**
 * Body de POST /users (CU-05). Los mensajes de los campos obligatorios
 * calcan el texto exacto de los ejemplos de UserCreate.yaml — el frontend
 * los muestra tal cual, no son solo para debug.
 *
 * Orden de los decoradores: class-validator informa primero el de más abajo,
 * así que el de "campo obligatorio" va último y es el que sale cuando el campo
 * falta (los ejemplos de 400 del contrato).
 */
export class CreateUserRequestDto {
  @IsPositive({ message: 'Elegí el empleado' })
  @IsInt({ message: 'Elegí el empleado' })
  employeeId!: number;

  @MaxLength(30, { message: 'El nombre de usuario no puede superar los 30 caracteres' })
  @MinLength(1, { message: 'Ingresá el nombre de usuario' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Ingresá el nombre de usuario' })
  username!: string;

  @MaxLength(72, { message: 'La contraseña no puede superar los 72 caracteres' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @IsString({ message: 'La contraseña debe tener al menos 8 caracteres' })
  password!: string;

  @IsIn(ROLES, { each: true, message: 'No existe un rol con ese código.' })
  @ArrayUnique({ message: 'No repitas los roles' })
  @ArrayNotEmpty({ message: 'Asigná al menos un rol' })
  @IsArray({ message: 'Asigná al menos un rol' })
  roles!: Role[];
}
