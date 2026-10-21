import { Injectable, NotFoundException } from '@nestjs/common';
import { Manager } from '../../../core/domain/entities/manager';
import { ManagerRepository, ManagerListParams, ManagerListResult } from '../../../core/domain/ports/manager.repository';

@Injectable()
export class ManagerInMemoryRepository implements ManagerRepository {
  private readonly managers: Map<string, Manager> = new Map();
  private readonly lastIdByFactory: Map<number, number> = new Map();

  private key(factoryId: number, id: number): string {
    return `${factoryId}:${id}`;
  }

  async save(manager: Manager): Promise<Manager> {
    const factoryId = manager.getFactoryId();
    const generatedId = (this.lastIdByFactory.get(factoryId) ?? 0) + 1;
    this.lastIdByFactory.set(factoryId, generatedId);

    const savedManager = Manager.reconstruct(
      generatedId,
      manager.getName(),
      manager.getLastName(),
      manager.getPhone(),
      manager.getMail(),
      factoryId,
      manager.isActive(),
      manager.getCreatedAt(),
      manager.getUpdatedAt(),
    );

    this.managers.set(this.key(factoryId, generatedId), savedManager);
    return savedManager;
  }

  async findById(factoryId: number, id: number): Promise<Manager | null> {
    return this.managers.get(this.key(factoryId, id)) ?? null;
  }

  async findAll(): Promise<Manager[]> {
    return Array.from(this.managers.values());
  }

  async update(manager: Manager): Promise<void> {
    const id = manager.getId();
    const factoryId = manager.getFactoryId();

    if (!id || !this.managers.has(this.key(factoryId, id))) {
      throw new NotFoundException(`Manager ${id} not found in factory ${factoryId}`);
    }

    this.managers.set(this.key(factoryId, id), manager);
  }

  async existsByMail(mail: string, factoryId: number, excludeId?: number): Promise<boolean> {
    return Array.from(this.managers.values()).some(
      (manager) =>
        manager.isActive() &&
        manager.getFactoryId() === factoryId &&
        manager.getMail() === mail &&
        manager.getId() !== excludeId,
    );
  }

  async list(params: ManagerListParams): Promise<ManagerListResult> {
    const { page, limit, factoryId, nameContains, active } = params;

    let items = Array.from(this.managers.values());

    if (factoryId !== undefined) {
      items = items.filter((manager) => manager.getFactoryId() === factoryId);
    }

    if (active !== undefined) {
      items = items.filter((manager) => manager.isActive() === active);
    }

    if (nameContains) {
      const needle = nameContains.toLowerCase();
      items = items.filter(
        (manager) =>
          manager.getName().toLowerCase().includes(needle) ||
          (manager.getLastName() ?? '').toLowerCase().includes(needle),
      );
    }

    const total = items.length;
    const start = (page - 1) * limit;
    const paged = items.slice(start, start + limit);

    return { items: paged, total };
  }
}
