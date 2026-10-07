import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

// El frontend manda '' cuando un campo opcional queda vacío: se guarda como null.
const emptyToNull = ({ value }: TransformFnParams) =>
  typeof value === 'string' && value.trim() === '' ? null : value;

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName!: string;

  @Transform(emptyToNull)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string | null;

  @Transform(emptyToNull)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string | null;

  @Transform(emptyToNull)
  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  mail?: string | null;
}
