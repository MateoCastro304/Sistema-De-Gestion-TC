import { Injectable } from '@nestjs/common';
import { MaterialListParams, MaterialListResult, MaterialRepository } from '../../domain/ports/material.repository';

export type ListMaterialsInput = MaterialListParams;

/** Devuelve una página del catálogo de materiales, ordenada por nombre y calidad (CU-39). */
@Injectable()
export class ListMaterials {
  constructor(private readonly repository: MaterialRepository) {}

  async execute(input: ListMaterialsInput): Promise<MaterialListResult> {
    return await this.repository.list(input);
  }
}
