import { Injectable } from '@nestjs/common';
import {
  ProcessTypeListParams,
  ProcessTypeListResult,
  ProcessTypeRepository,
} from '../../domain/ports/process-type.repository';

export type ListProcessTypesInput = ProcessTypeListParams;

/** Devuelve una página del catálogo de tipos de proceso, ordenada por nombre (CU-11). */
@Injectable()
export class ListProcessTypes {
  constructor(private readonly repository: ProcessTypeRepository) {}

  async execute(input: ListProcessTypesInput): Promise<ProcessTypeListResult> {
    return await this.repository.list(input);
  }
}
