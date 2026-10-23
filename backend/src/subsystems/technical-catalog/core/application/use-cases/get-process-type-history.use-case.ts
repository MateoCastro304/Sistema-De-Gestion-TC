import { Injectable } from '@nestjs/common';
import { ProcessTypePriceChange } from '../../domain/entities/process-type-price-change.entity';
import { ProcessTypeNotFound } from '../../domain/errors/process-type-not-found.error';
import { ProcessTypeRepository } from '../../domain/ports/process-type.repository';

/**
 * Devuelve el historial de precios de un tipo de proceso, del más reciente al
 * más antiguo (CU-11). Comprueba primero que el tipo exista: sin eso, un id
 * inexistente se confundiría con un tipo que nunca cambió de precio.
 */
@Injectable()
export class GetProcessTypeHistory {
  constructor(private readonly repository: ProcessTypeRepository) {}

  async execute(processTypeId: number): Promise<ProcessTypePriceChange[]> {
    if (!(await this.repository.findById(processTypeId))) throw new ProcessTypeNotFound();
    return await this.repository.findPriceHistory(processTypeId);
  }
}
