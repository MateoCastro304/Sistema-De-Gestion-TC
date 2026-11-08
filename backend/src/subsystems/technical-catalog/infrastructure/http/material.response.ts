import { Material } from '../../core/domain/entities/material.entity';
import { MaterialListResult } from '../../core/domain/ports/material.repository';

/** Forma del recurso material según el contrato (§3.6). */
export type MaterialResponseBody = {
  id: number;
  name: string;
  quality: string;
  createdAt: string;
};

export class MaterialResponse {
  static from(material: Material): MaterialResponseBody {
    return {
      id: material.getId()!,
      name: material.getName(),
      quality: material.getQuality(),
      createdAt: material.getCreatedAt()!.toISOString(),
    };
  }
}

/** Sobre de GET /materials: la página, el total del filtro y page/limit ya resueltos. */
export type MaterialListResponseBody = {
  items: MaterialResponseBody[];
  total: number;
  page: number;
  limit: number;
};

export class MaterialListResponse {
  static from(result: MaterialListResult, page: number, limit: number): MaterialListResponseBody {
    return {
      items: result.items.map((item) => MaterialResponse.from(item)),
      total: result.total,
      page,
      limit,
    };
  }
}

/** Sobre de GET /materials/names: los nombres distintos, sin paginar (D-38). */
export type MaterialNamesResponseBody = { items: string[] };

export class MaterialNamesResponse {
  static from(names: string[]): MaterialNamesResponseBody {
    return { items: names };
  }
}
