import { Injectable } from '@nestjs/common';
import { Prisma, Supplier as SupplierRow } from '../../generated/prisma/client';
import { Cuit } from '../../shared/domain/cuit';
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service';
import { SupplierAlreadyExists } from '../domain/errors/supplier-already-exists.error';
import { SupplierListParams, SupplierListResult, SupplierRepository } from '../domain/ports/supplier.repository';
import { Supplier } from '../domain/supplier';

/**
 * Adaptador Prisma del puerto SupplierRepository.
 *
 * Replica la semantica del repositorio en memoria, que es la que ejercitan los
 * specs de los casos de uso: unicidad solo entre activos, razon social sin
 * distinguir mayusculas, listados restringidos a los activos y total calculado
 * sobre el conjunto filtrado.
 *
 * Las marcas de tiempo no se escriben desde aca: `created_at` tiene DEFAULT y
 * `updated_at` esta declarado `@updatedAt`, asi que las maneja Prisma y se leen
 * de vuelta de la fila guardada. Por eso cada metodo de escritura devuelve
 * `toDomain(row)` y no el agregado que recibio.
 */
@Injectable()
export class SupplierPrismaRepository implements SupplierRepository {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  /**
   * Sin filtrar por `is_active`, a proposito: el puerto documenta que devolver
   * o no un inactivo es decision del caso de uso, y DeactivateSupplier necesita
   * poder distinguir "no existe" de "ya estaba inactivo".
   */
  async findById(id: number): Promise<Supplier | null> {
    const row = await this.prisma.supplier.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  // Espeja el indice parcial supplier_cuit_active_key.
  async existsByCuit(cuit: Cuit, excludeId?: number): Promise<boolean> {
    const count = await this.prisma.supplier.count({
      where: {
        isActive: true,
        cuit: cuit.getCuitValue(),
        ...(excludeId === undefined ? {} : { id: { not: excludeId } }),
      },
    });
    return count > 0;
  }

  // Espeja el indice supplier_legal_name_active_key, que es sobre LOWER().
  async existsByLegalName(legalName: string, excludeId?: number): Promise<boolean> {
    const count = await this.prisma.supplier.count({
      where: {
        isActive: true,
        legalName: { equals: legalName.trim(), mode: 'insensitive' },
        ...(excludeId === undefined ? {} : { id: { not: excludeId } }),
      },
    });
    return count > 0;
  }

  async list(params: SupplierListParams): Promise<SupplierListResult> {
    const where = SupplierPrismaRepository.buildWhere(params);

    // En una sola transaccion para que la pagina y el total se calculen sobre
    // el mismo estado: con dos consultas sueltas, un alta concurrente deja un
    // total que no cuadra con los items devueltos.
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.supplier.findMany({
        where,
        orderBy: { id: 'asc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return { items: rows.map((row) => this.toDomain(row)), total };
  }

  // -------------------------------------------------------------------------
  // Commands
  // -------------------------------------------------------------------------

  async save(supplier: Supplier): Promise<Supplier> {
    const id = supplier.getId();

    const data = {
      legalName: supplier.getLegalName(),
      supplierType: supplier.getSupplierType(),
      cuit: supplier.getCuit()?.getCuitValue() ?? null,
      contactName: supplier.getContactName(),
      contactEmail: supplier.getContactEmail()?.getValue() ?? null,
      contactPhone: supplier.getContactPhone()?.getValue() ?? null,
      address: supplier.getAddress(),
      observation: supplier.getObservation(),
      isActive: supplier.getActive(),
    };

    try {
      const row =
        id === null
          ? await this.prisma.supplier.create({ data })
          : await this.prisma.supplier.update({ where: { id }, data });

      return this.toDomain(row);
    } catch (error) {
      throw SupplierPrismaRepository.translate(error, supplier);
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private static buildWhere(params: SupplierListParams): Prisma.SupplierWhereInput {
    const search = params.search?.trim();

    // El cuit se guarda como 11 digitos pelados, asi que se descartan los
    // separadores que escribio el usuario. Si no queda ningun digito, la rama
    // del cuit no se agrega: `contains: ''` matchearia todas las filas.
    const digits = search?.replace(/[\s\-.]/g, '');

    return {
      isActive: true,
      ...(params.type === undefined ? {} : { supplierType: params.type }),
      ...(search
        ? {
            OR: [
              { legalName: { contains: search, mode: 'insensitive' as const } },
              { contactName: { contains: search, mode: 'insensitive' as const } },
              ...(digits ? [{ cuit: { contains: digits } }] : []),
            ],
          }
        : {}),
    };
  }

  /**
   * Traduce la violacion de unicidad de la base al error de dominio.
   *
   * Los chequeos de existsBy* cubren el caso normal, pero entre ese SELECT y
   * este INSERT hay una ventana: dos altas simultaneas con el mismo CUIT pasan
   * las dos validaciones y una la rechaza el indice. Sin esta traduccion eso
   * saldria como 500 en vez de 409.
   *
   * `meta.target` trae el nombre del indice que se violo, que son los dos
   * parciales escritos a mano en la migracion.
   */
  private static translate(error: unknown, supplier: Supplier): unknown {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
      return error;
    }

    const target = JSON.stringify(error.meta?.target ?? '');

    if (target.includes('cuit')) {
      return new SupplierAlreadyExists('cuit', supplier.getCuit()?.getCuitValue() ?? '');
    }
    if (target.includes('legal_name')) {
      return new SupplierAlreadyExists('legalName', supplier.getLegalName());
    }

    return error;
  }

  private toDomain(row: SupplierRow): Supplier {
    return Supplier.reconstruct({
      id: row.id,
      legalName: row.legalName,
      cuit: row.cuit,
      supplierType: row.supplierType,
      contactName: row.contactName,
      contactEmail: row.contactEmail,
      contactPhone: row.contactPhone,
      address: row.address,
      observation: row.observation,
      active: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
