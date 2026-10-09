import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { SUPPLIER_TYPES } from '../../domain/supplier-type';
import type { SupplierType } from '../../domain/supplier-type';

/**
 * Query params for GET /suppliers. Defaults for page and limit live here
 * because request-shape decisions belong to the HTTP layer; the use case
 * always sees defined integers. The type filter is exclusive — a supplier
 * carries a single type, so ?type=MATERIAL returns only the material ones —
 * and ?search= is the single text box of the UI, matching legalName,
 * contactName or cuit.
 *
 * limit is capped so a client cannot ask for the whole catalogue in one
 * request and turn the pagination into a full table scan.
 */
export class ListSuppliersQueryDto {
  static readonly MAX_LIMIT = 100;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(ListSuppliersQueryDto.MAX_LIMIT)
  limit: number = 20;

  @IsOptional()
  @IsIn(SUPPLIER_TYPES)
  type?: SupplierType;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}
