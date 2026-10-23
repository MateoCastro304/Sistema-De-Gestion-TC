import { ProcessTypePriceChange } from '../../../core/domain/entities/process-type-price-change.entity';
import { ProcessType } from '../../../core/domain/entities/process-type.entity';
import {
  ProcessTypeListParams,
  ProcessTypeListResult,
  ProcessTypeRepository,
} from '../../../core/domain/ports/process-type.repository';
import { TextKey } from '../../../../../shared/domain/text-key';

/** Fake para los specs de los casos de uso; no se usa en runtime. */
export class InMemoryProcessTypeRepository extends ProcessTypeRepository {
  readonly saved: ProcessType[] = [];
  readonly history = new Map<number, ProcessTypePriceChange[]>();

  async existsByNameKey(nameKey: string): Promise<boolean> {
    return this.saved.some((p) => p.getNameKey() === nameKey);
  }

  async findById(id: number): Promise<ProcessType | null> {
    return this.saved.find((p) => p.getId() === id) ?? null;
  }

  async list({ page, limit, search }: ProcessTypeListParams): Promise<ProcessTypeListResult> {
    const key = TextKey.create(search ?? '').getValue();
    const matching = this.saved
      .filter((p) => p.getNameKey().includes(key))
      .sort((a, b) => a.getNameKey().localeCompare(b.getNameKey()));
    return { items: matching.slice((page - 1) * limit, page * limit), total: matching.length };
  }

  async findPriceHistory(processTypeId: number): Promise<ProcessTypePriceChange[]> {
    return this.history.get(processTypeId) ?? [];
  }

  async save(processType: ProcessType): Promise<ProcessType> {
    const now = new Date();
    const stored = ProcessType.reconstruct({
      id: this.saved.length + 1,
      name: processType.getName(),
      nameKey: processType.getNameKey(),
      description: processType.getDescription(),
      hourlyRateArs: processType.getHourlyRateArs().getValue(),
      hourlyRateUsd: processType.getHourlyRateUsd().getValue(),
      exchangeRate: processType.getExchangeRate().getValue(),
      createdAt: now,
      updatedAt: now,
    });
    this.saved.push(stored);
    return stored;
  }
}
