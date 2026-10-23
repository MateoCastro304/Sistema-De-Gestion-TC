import { ProcessType } from '../../core/domain/entities/process-type.entity';

export type ProcessTypeResponseBody = {
  id: number;
  name: string;
  description: string | null;
  hourlyRateArs: number;
  hourlyRateUsd: number;
  exchangeRate: number;
  createdAt: string;
  updatedAt: string;
};

/** Arma el recurso tipo de proceso del contrato (§3.4). */
export class ProcessTypeResponse {
  static from(processType: ProcessType): ProcessTypeResponseBody {
    return {
      id: processType.getId()!,
      name: processType.getName(),
      description: processType.getDescription(),
      hourlyRateArs: processType.getHourlyRateArs().getValue(),
      hourlyRateUsd: processType.getHourlyRateUsd().getValue(),
      exchangeRate: processType.getExchangeRate().getValue(),
      createdAt: processType.getCreatedAt()!.toISOString(),
      updatedAt: processType.getUpdatedAt()!.toISOString(),
    };
  }
}
