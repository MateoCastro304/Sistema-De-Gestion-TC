import { ProcessType } from '../../../core/domain/entities/process-type.entity';
import { ProcessTypeRepository } from '../../../core/domain/ports/process-type.repository';

/** Fake para los specs de los casos de uso; no se usa en runtime. */
export class InMemoryProcessTypeRepository extends ProcessTypeRepository {
  readonly saved: ProcessType[] = [];

  async existsByNameKey(nameKey: string): Promise<boolean> {
    return this.saved.some((p) => p.getNameKey() === nameKey);
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
