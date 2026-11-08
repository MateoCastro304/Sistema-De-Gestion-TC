import { TextKey } from '../../../../../shared/domain/text-key';
import { Material } from '../../../core/domain/entities/material.entity';
import { compareKeys, compareMaterials } from '../../../core/domain/material-order';
import {
  MaterialListParams,
  MaterialListResult,
  MaterialRepository,
} from '../../../core/domain/ports/material.repository';

/** Fake para los specs de los casos de uso; no se usa en runtime. */
export class InMemoryMaterialRepository extends MaterialRepository {
  saved: Material[] = [];

  async existsByKeys(nameKey: string, qualityKey: string): Promise<boolean> {
    return this.saved.some((m) => m.getNameKey() === nameKey && m.getQualityKey() === qualityKey);
  }

  async findNameByKey(nameKey: string): Promise<string | null> {
    return this.saved.find((m) => m.getNameKey() === nameKey)?.getName() ?? null;
  }

  async list({ page, limit, name, quality }: MaterialListParams): Promise<MaterialListResult> {
    const nameKey = TextKey.create(name ?? '').getValue();
    const qualityKey = TextKey.create(quality ?? '').getValue();
    const matching = this.saved
      .filter((m) => !nameKey || m.getNameKey() === nameKey)
      .filter((m) => m.getQualityKey().includes(qualityKey))
      .sort(compareMaterials);
    return { items: matching.slice((page - 1) * limit, page * limit), total: matching.length };
  }

  async listNames(): Promise<string[]> {
    const byKey = new Map(this.saved.map((m) => [m.getNameKey(), m.getName()]));
    return [...byKey.entries()].sort(([a], [b]) => compareKeys(a, b)).map(([, name]) => name);
  }

  async save(material: Material): Promise<Material> {
    const stored = Material.reconstruct({
      id: this.saved.length + 1,
      name: material.getName(),
      quality: material.getQuality(),
      nameKey: material.getNameKey(),
      qualityKey: material.getQualityKey(),
      createdByUserId: material.getCreatedByUserId(),
      createdAt: new Date(),
    });
    this.saved.push(stored);
    return stored;
  }
}
