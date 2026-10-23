import { Injectable } from '@nestjs/common';
import { NewProcessTypeData, ProcessType } from '../../domain/entities/process-type.entity';
import { ProcessTypeNameTaken } from '../../domain/errors/process-type-name-taken.error';
import { ProcessTypeRepository } from '../../domain/ports/process-type.repository';

export type RegisterProcessTypeInput = NewProcessTypeData;

/**
 * Da de alta un tipo de proceso (CU-09). La entidad valida los datos; acá solo
 * se comprueba la unicidad del nombre antes de escribir. Si dos altas
 * simultáneas llegan a la vez, el repositorio traduce la violación del
 * UNIQUE a {@link ProcessTypeNameTaken}.
 */
@Injectable()
export class RegisterProcessType {
  constructor(private readonly repository: ProcessTypeRepository) {}

  async execute(input: RegisterProcessTypeInput): Promise<ProcessType> {
    const processType = ProcessType.create(input);

    if (await this.repository.existsByNameKey(processType.getNameKey())) {
      throw new ProcessTypeNameTaken();
    }

    return await this.repository.save(processType);
  }
}
