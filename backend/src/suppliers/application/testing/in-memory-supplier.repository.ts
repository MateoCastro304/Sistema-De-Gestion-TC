import { SupplierListParams, SupplierListResult, SupplierRepository } from '../../domain/ports/supplier.repository';
import { Supplier } from '../../domain/supplier';
import { Cuit } from '../../domain/cuit';

export class InMemorySupplierRepository extends SupplierRepository {
  private items: Supplier[] = [];
  private nextId: number = 1;

  async findById(id: number): Promise<Supplier | null> {
    const supplier = this.items.find((s) => s.getId() === id);
    return supplier || null;
  }

  async existsByCuit(cuit: Cuit, excludeId?: number): Promise<boolean> {
    return this.items.some((s) => s.getCuit()?.equals(cuit) === true && s.getId() !== excludeId);
  }

  async existsByLegalName(legalName: string, excludeId?: number): Promise<boolean> {
    return this.items.some((s) => s.getLegalName() === legalName && s.getId() !== excludeId);
  }

  async list(params: SupplierListParams): Promise<SupplierListResult> {
    let filtered = [...this.items];

    if (params.types && params.types.length > 0) {
      filtered = filtered.filter((s) => s.getSupplierTypes().some((t) => params.types!.includes(t)));
    }

    if (params.legalNameContains) {
      const needle = params.legalNameContains.toLowerCase();
      filtered = filtered.filter((s) => s.getLegalName().toLowerCase().includes(needle));
    }

    const total = filtered.length;
    const start = (params.page - 1) * params.limit;
    const items = filtered.slice(start, start + params.limit);

    return { items, total };
  }

  async save(supplier: Supplier): Promise<Supplier> {
    if (supplier.getId() === null) {
      const stored = Supplier.reconstruct(
        this.nextId++,
        supplier.getLegalName(),
        supplier.getCuit()?.getCuitValue() ?? null,
        supplier.getSupplierTypes(),
        supplier.getContactName(),
        supplier.getContactEmail()?.getValue() ?? null,
        supplier.getContactPhone()?.getValue() ?? null,
        supplier.getAddress(),
        supplier.getActive(),
        supplier.getCreatedAt(),
        supplier.getUpdatedAt(),
      );

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
