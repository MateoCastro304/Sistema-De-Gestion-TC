import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength, ValidateIf } from 'class-validator';

/**
 * Body payload for PATCH /suppliers/{id}. Mirrors the SupplierUpdate schema
 * of the OpenAPI spec: every property is optional, and the ones whose
 * "absence" is a business action (cuit, contactName, contactEmail,
 * contactPhone, address) can arrive as null to clear the stored value.
 * supplierTypes is deliberately not declared because the aggregate treats
 * it as immutable, and active is out of scope for this sprint; both are
 * rejected as unknown properties by the global ValidationPipe. The domain
 * re-validates through its value objects — this DTO is only the outer
 * contract check.
 */
export class UpdateSupplierDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  legalName?: string;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{2}-[0-9]{8}-[0-9]{1}$/, {
    message: 'cuit must match pattern XX-XXXXXXXX-X',
  })
  cuit?: string | null;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactName?: string | null;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  contactEmail?: string | null;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  contactPhone?: string | null;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string | null;
}
