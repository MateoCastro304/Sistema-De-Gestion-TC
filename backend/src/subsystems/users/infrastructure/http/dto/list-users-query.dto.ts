import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ROLES, Role } from '../../../core/domain/value-objects/role';

// Propio de users, sin depender de shared/domain/pagination.ts a propósito.
const MAX_PAGE_LIMIT = 100;

/**
 * Query params de GET /users (CU-07). page/limit con default acá: el caso
 * de uso siempre ve enteros definidos. `search` busca en username y en
 * nombre/apellido del empleado (lo resuelve el repositorio). `role` filtra
 * por un rol asignado (Escenario 2). `includeInactive` agrega los dados de
 * baja al listado (por defecto solo activos/bloqueados).
 */
export class ListUsersQueryDto {
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

  @IsOptional()
  @IsIn(ROLES, { message: 'No existe un rol con ese código.' })
  role?: Role;

  // Query params llegan como string ("true"/"false"); Boolean("false") da
  // true en JS, por eso la comparación explícita en vez de @Type(Boolean).
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  includeInactive?: boolean;
}
