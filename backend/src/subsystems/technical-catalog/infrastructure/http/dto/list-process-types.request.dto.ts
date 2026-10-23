import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { MAX_PAGE_LIMIT } from '../../../../../shared/domain/pagination';

/**
 * Consulta de GET /process-types. Los valores por defecto viven acá (decisión
 * de forma del pedido), así el caso de uso siempre recibe enteros definidos.
 * Cualquier otro parámetro lo rechaza el ValidationPipe global.
 */
export class ListProcessTypesRequestDto {
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
  @MaxLength(120)
  search?: string;
}
