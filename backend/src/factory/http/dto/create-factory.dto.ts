import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

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

  @IsString()
  @IsNotEmpty()
  categoryId!: number;
}