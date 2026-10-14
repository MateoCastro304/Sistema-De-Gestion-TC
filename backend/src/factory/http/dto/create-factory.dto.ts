import { Transform, Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsPositive, MaxLength } from 'class-validator';
import { emptyToNull } from '../../../shared/http/empty-to-null.transform';

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
