import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { MAX_PAGE_LIMIT } from '../../../../../shared/domain/pagination';
import { MATERIAL_NAME_MAX_LENGTH, MATERIAL_QUALITY_MAX_LENGTH } from '../../../core/domain/entities/material.entity';

/**
 * Consulta de GET /materials. Los valores por defecto viven acá (decisión de
 * forma del pedido), así el caso de uso siempre recibe enteros definidos.
 * Cualquier otro parámetro lo rechaza el ValidationPipe global.
 */
export class ListMaterialsRequestDto {
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
  @IsString()
  @MaxLength(MATERIAL_NAME_MAX_LENGTH)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MATERIAL_QUALITY_MAX_LENGTH)
  quality?: string;
}
