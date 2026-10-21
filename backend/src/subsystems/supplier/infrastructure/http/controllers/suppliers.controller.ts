import {
  Controller,
  Body,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import { CreateSupplier } from '../../../core/application/use-cases/create-supplier.use-case';
import { DeactivateSupplier } from '../../../core/application/use-cases/deactivate-supplier.use-case';
import { GetSupplierById } from '../../../core/application/use-cases/get-supplier-by-id.use-case';
import { ListSuppliers } from '../../../core/application/use-cases/list-suppliers.use-case';
import { UpdateSupplier } from '../../../core/application/use-cases/update-supplier.use-case';
import { CreateSupplierDto } from '../dto/create-supplier.dto';
import { ListSuppliersQueryDto } from '../dto/list-suppliers-query.dto';
import { UpdateSupplierDto } from '../dto/update-supplier.dto';
import { DomainErrorFilter } from '../filters/domain-error.filter';
import { SupplierListResponse, SupplierResponse, toSupplierResponse } from '../mappers/supplier.mapper';

/**
 * HTTP entry point for every operation on the Supplier aggregate. Each
 * endpoint mirrors a path in the OpenAPI spec and delegates to the matching
 * use case, converting the returned aggregate to SupplierResponse before
 * writing it out. The controller carries no business logic and no
 * try/catch: input validation is handled by the global ValidationPipe via
 * the DTOs, and errors bubble up to DomainErrorFilter, which translates
 * DomainError subclasses to the right HTTP status.
 */
@Controller('suppliers')
@UseFilters(DomainErrorFilter)
export class SuppliersController {
  constructor(
    private readonly createSupplier: CreateSupplier,
    private readonly getSupplierById: GetSupplierById,
    private readonly listSuppliers: ListSuppliers,
    private readonly updateSupplier: UpdateSupplier,
    private readonly deactivateSupplier: DeactivateSupplier,
  ) {}

  /**
   * Devuelve la pagina junto con el total, igual que /factories y /customers.
   * Sin el total el cliente no puede saber si quedaron proveedores afuera y
   * termina pidiendo una pagina enorme para traer todo y filtrar en el
   * navegador, que es justo lo que esto viene a sacar.
   */
  @Get()
  async list(@Query() query: ListSuppliersQueryDto): Promise<SupplierListResponse> {
    const { items, total } = await this.listSuppliers.execute(query);
    return {
      items: items.map(toSupplierResponse),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number): Promise<SupplierResponse> {
    const supplier = await this.getSupplierById.execute(id);
    return toSupplierResponse(supplier);
  }

  @Post()
  async create(@Body() body: CreateSupplierDto): Promise<SupplierResponse> {
    const supplier = await this.createSupplier.execute(body);
    return toSupplierResponse(supplier);
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateSupplierDto): Promise<SupplierResponse> {
    const supplier = await this.updateSupplier.execute(id, body);
    return toSupplierResponse(supplier);
  }

  /**
   * Baja logica. Responde 204 sin cuerpo: el cliente ya no tiene nada que
   * mostrar del proveedor, porque a partir de aca deja de existir para toda
   * consulta. No hay endpoint inverso.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.deactivateSupplier.execute(id);
  }
}
