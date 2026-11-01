import { Injectable } from '@nestjs/common';
import { ProcessType } from '../../domain/entities/process-type.entity';
import { ProcessTypeNotFound } from '../../domain/errors/process-type-not-found.error';
import { ProcessTypeRepository } from '../../domain/ports/process-type.repository';

/** Devuelve un tipo de proceso con su precio hora vigente (CU-11). */
@Injectable()
export class GetProcessTypeById {
  constructor(private readonly repository: ProcessTypeRepository) {}

  async execute(id: number): Promise<ProcessType> {
    const processType = await this.repository.findById(id);
    if (!processType) throw new ProcessTypeNotFound();
    return processType;
  }
}
