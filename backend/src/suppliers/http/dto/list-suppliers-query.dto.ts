import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { SUPPLIER_TYPES, SupplierType } from '../../domain/supplier-type';

/**
 * Query params for GET /suppliers. Defaults for page and limit live here
 * because request-shape decisions belong to the HTTP layer; the use case
 * always sees defined integers. types arrives as a comma-separated string
 * in the URL (?types=MATERIAL,PROCESS) and is split into an array before
 * validation runs, keeping URL-encoding conventions out of the rest of
 * the stack.
 */
export class ListSuppliersQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 20;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsIn(SUPPLIER_TYPES, { each: true })
  types?: SupplierType[];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  legalNameContains?: string;
}
