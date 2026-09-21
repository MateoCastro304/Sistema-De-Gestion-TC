import { IsString, IsNotEmpty, IsOptional, IsInt, IsPositive, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFactoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  cuit!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address!: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  paymentDescription?: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  categoryId!: number;
}
