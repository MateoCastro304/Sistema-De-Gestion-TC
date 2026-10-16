import { Injectable } from '@nestjs/common';
import {
  SupplierListParams,
  SupplierListResult,
  SupplierRepository,
} from '../../../core/domain/ports/supplier.repository';
import { Supplier } from '../../../core/domain/entities/supplier';
import { Cuit } from '../../../../../shared/domain/cuit';

/**
 * In-memory implementation of the SupplierRepository port. Mimics the
 * semantics the real Prisma adapter will have — uniqueness among active rows
 * only, case-insensitive on legalName, listings restricted to active
 * suppliers, free-text search over legalName, contactName and cuit, total
 * computed over the filtered set — so use-case specs and
 * local runs behave the same. Serves double duty: registered by
 * SuppliersModule as the runtime adapter until the Prisma one lands, and
 * imported by the specs as their fake.
 */
@Injectable()
export class InMemorySupplierRepository implements SupplierRepository {
  private items: Supplier[] = [];
  private nextId: number = 1;

  async findById(id: number): Promise<Supplier | null> {
    const supplier = this.items.find((s) => s.getId() === id);
    return supplier || null;
  }

  async existsByCuit(cuit: Cuit, excludeId?: number): Promise<boolean> {
    return this.items.some((s) => s.getActive() && s.getCuit()?.equals(cuit) === true && s.getId() !== excludeId);
  }

  async existsByLegalName(legalName: string, excludeId?: number): Promise<boolean> {
    const needle = legalName.trim().toLowerCase();
    return this.items.some(
      (s) => s.getActive() && s.getLegalName().toLowerCase() === needle && s.getId() !== excludeId,
    );
  }

  async list(params: SupplierListParams): Promise<SupplierListResult> {
    let filtered = this.items.filter((s) => s.getActive());

    if (params.type) {
      filtered = filtered.filter((s) => s.getSupplierType() === params.type);
    }

    if (params.search?.trim()) {
      const needle = params.search.trim().toLowerCase();
      // The cuit is stored as 11 bare digits, so the separators the user types
      // are dropped before comparing. An empty result after stripping (the
      // needle had no digits) must not match every supplier.
      const digits = needle.replace(/[\s\-.]/g, '');

      filtered = filtered.filter((s) => {
        if (s.getLegalName().toLowerCase().includes(needle)) return true;
        if (s.getContactName()?.toLowerCase().includes(needle)) return true;
        if (digits && s.getCuit()?.getCuitValue().includes(digits)) return true;
        return false;
      });
    }

    const total = filtered.length;
    const start = (params.page - 1) * params.limit;
    const items = filtered.slice(start, start + params.limit);

    return { items, total };
  }

  async save(supplier: Supplier): Promise<Supplier> {
    if (supplier.getId() === null) {
      const stored = Supplier.reconstruct({
        id: this.nextId++,
        legalName: supplier.getLegalName(),
        cuit: supplier.getCuit()?.getCuitValue() ?? null,
        supplierType: supplier.getSupplierType(),
        contactName: supplier.getContactName(),
        contactEmail: supplier.getContactEmail()?.getValue() ?? null,
        contactPhone: supplier.getContactPhone()?.getValue() ?? null,
        address: supplier.getAddress(),
        observation: supplier.getObservation(),
        active: supplier.getActive(),
        createdAt: supplier.getCreatedAt(),
        updatedAt: supplier.getUpdatedAt(),
      });

      this.items.push(stored);
      return stored;
    }

    const idx = this.items.findIndex((s) => s.getId() === supplier.getId());
    if (idx === -1) {
      throw new Error(`Supplier ${supplier.getId()} not found in memory`);
    }
    this.items[idx] = supplier;
    return supplier;
  }

  /** Total number of stored suppliers. Used by tests to assert side effects. */
  count(): number {
    return this.items.length;
  }
}
