import { IsString, IsNotEmpty, IsOptional, IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFactoryDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  cuit!: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsString()
  @IsOptional()
  paymentDescription?: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  categoryId!: number;
}
