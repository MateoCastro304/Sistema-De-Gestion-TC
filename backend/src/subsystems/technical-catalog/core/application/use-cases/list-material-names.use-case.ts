import { Injectable } from '@nestjs/common';
import { MaterialRepository } from '../../domain/ports/material.repository';

/** Devuelve los nombres de material distintos, en orden alfabético y sin paginar (CU-37 y CU-39, D-38). */
@Injectable()
export class ListMaterialNames {
  constructor(private readonly repository: MaterialRepository) {}

  async execute(): Promise<string[]> {
    return await this.repository.listNames();
  }
}
