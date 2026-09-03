import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

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

  @IsInt()
  @IsString()
  @IsNotEmpty()
  categoryId!: number;
}