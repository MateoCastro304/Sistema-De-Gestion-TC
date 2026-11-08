import { Injectable } from '@nestjs/common';
import { Material, NewMaterialData } from '../../domain/entities/material.entity';
import { MaterialAlreadyExists } from '../../domain/errors/material-already-exists.error';
import { MaterialRepository } from '../../domain/ports/material.repository';

export type RegisterMaterialInput = NewMaterialData & {
  /** Usuario de la sesión que registra el material. */
  authorId: number;
};

/**
 * Da de alta un material (CU-37). La entidad valida los datos; acá se comprueba
 * la unicidad de nombre y calidad y se resuelve la grafía del nombre (D-37).
 * Si dos altas simultáneas llegan a la vez, el repositorio traduce la violación
 * del UNIQUE a {@link MaterialAlreadyExists}.
 */
@Injectable()
export class RegisterMaterial {
  constructor(private readonly repository: MaterialRepository) {}

  async execute({ authorId, ...data }: RegisterMaterialInput): Promise<Material> {
    const material = Material.create(data, authorId);

    if (await this.repository.existsByKeys(material.getNameKey(), material.getQualityKey())) {
      throw new MaterialAlreadyExists();
    }

    // Si el nombre ya existe, se guarda con su grafía: el filtro no ofrece "Acero" y "acero" como dos opciones.
    const existingName = await this.repository.findNameByKey(material.getNameKey());
    return await this.repository.save(existingName ? material.withNameSpelling(existingName) : material);
  }
}
