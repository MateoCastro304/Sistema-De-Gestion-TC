import { Transform, Type } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsPositive, MaxLength } from 'class-validator';

// El frontend manda '' cuando un campo opcional queda vacío: se guarda como null.
const emptyToNull = ({ value }: TransformFnParams) =>
  typeof value === 'string' && value.trim() === '' ? null : value;

export class CreateFactoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  cuit!: string;

  @Transform(emptyToNull)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string | null;

  @Transform(emptyToNull)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  payMethod?: string | null;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  categoryId!: number;
}
