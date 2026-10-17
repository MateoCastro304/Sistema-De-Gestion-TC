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
import { ROLES, Role } from '../../../core/domain/value-objects/role';

/**
 * Body de POST /users (CU-05). Los mensajes de los campos obligatorios
 * calcan el texto exacto de los ejemplos de UserCreate.yaml — el frontend
 * los muestra tal cual, no son solo para debug.
 */
export class CreateUserDto {
  @IsInt({ message: 'Elegí el empleado' })
  @IsPositive({ message: 'Elegí el empleado' })
  employeeId!: number;

  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(1, { message: 'Ingresá el nombre de usuario' })
  @MaxLength(30, { message: 'El nombre de usuario no puede superar los 30 caracteres' })
  username!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(72, { message: 'La contraseña no puede superar los 72 caracteres' })
  password!: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'Asigná al menos un rol' })
  @ArrayUnique()
  @IsIn(ROLES, { each: true })
  roles!: Role[];
}
