import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { MAX_PAGE_LIMIT } from '../../../shared/domain/pagination';
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
 * limit is capped (MAX_PAGE_LIMIT, shared by every listing) so a client
 * cannot ask for the whole catalogue in one request and turn the pagination
 * into a full table scan.
 */
export class ListSuppliersQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_LIMIT)
  limit: number = 20;

  @IsOptional()
  @IsIn(SUPPLIER_TYPES)
  type?: SupplierType;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}
