import { IsEmail, IsIn, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
import { SUPPLIER_TYPES } from '../../domain/supplier-type';
import type { SupplierType } from '../../domain/supplier-type';

/**
 * Body payload for POST /suppliers. Mirrors the SupplierCreate schema of the
 * OpenAPI spec: legalName and supplierType are required, every other field
 * is optional. The constraints declared here (length, enum, CUIT pattern,
 * email format) are enforced by the global ValidationPipe before the request
 * reaches the controller, so an invalid payload fails at the boundary with a
 * 400 instead of leaking into the use case. The domain still re-validates
 * through its value objects; this DTO is only the outer contract check.
 */
export class CreateSupplierDto {
  @IsString()
  @Length(1, 80)
  legalName!: string;

  @IsIn(SUPPLIER_TYPES)
  supplierType!: SupplierType;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{2}-[0-9]{8}-[0-9]{1}$/, {
    message: 'cuit must match pattern XX-XXXXXXXX-X',
  })
  cuit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  contactName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  observation?: string;
}
