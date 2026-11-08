import { TextKey } from '../../../../../shared/domain/text-key';
import { MaterialFieldError, MaterialValidationError } from '../errors/material-validation.error';

export const MATERIAL_NAME_MAX_LENGTH = 60;
export const MATERIAL_QUALITY_MAX_LENGTH = 60;

/** Datos de entrada del alta, tal como llegan: cualquier campo puede faltar. */
export type NewMaterialData = {
  name?: string | null;
  quality?: string | null;
};

/** Una fila de la base, para {@link Material.reconstruct}. */
export type MaterialSnapshot = {
  id: number;
  name: string;
  quality: string;
  nameKey: string;
  qualityKey: string;
  createdByUserId: number | null;
  createdAt: Date;
};

/**
 * Material del catálogo: se identifica por su nombre y su calidad ("Acero 1010"
 * y "Acero 1045" son dos materiales). No guarda precio, proveedor ni
 * presentación: eso se elige al cotizar (D-36). La combinación de claves
 * normalizadas es única, sin distinguir mayúsculas, acentos ni espacios repetidos.
 */
export class Material {
  private constructor(
    private readonly id: number | null,
    private readonly name: string,
    private readonly quality: string,
    private readonly nameKey: string,
    private readonly qualityKey: string,
    /** Quién lo dio de alta: el usuario de la sesión. */
    private readonly createdByUserId: number | null,
    private readonly createdAt: Date | null,
  ) {}

  /** Alta. Valida los dos campos y informa cada error por separado. */
  static create(data: NewMaterialData, createdByUserId: number): Material {
    const errors: MaterialFieldError[] = [];

    const name = (data.name ?? '').trim();
    if (name === '') errors.push({ field: 'name', message: 'Ingresá el material' });
    else if (name.length > MATERIAL_NAME_MAX_LENGTH)
      errors.push({ field: 'name', message: `El material admite como máximo ${MATERIAL_NAME_MAX_LENGTH} caracteres` });

    const quality = (data.quality ?? '').trim();
    if (quality === '') errors.push({ field: 'quality', message: 'Ingresá la calidad' });
    else if (quality.length > MATERIAL_QUALITY_MAX_LENGTH)
      errors.push({
        field: 'quality',
        message: `La calidad admite como máximo ${MATERIAL_QUALITY_MAX_LENGTH} caracteres`,
      });

    if (errors.length > 0) throw new MaterialValidationError(errors);

    return new Material(
      null,
      name,
      quality,
      TextKey.create(name).getValue(),
      TextKey.create(quality).getValue(),
      createdByUserId,
      null,
    );
  }

  /**
   * Mismo material con la grafía del nombre que ya existe en el catálogo (D-37):
   * un "acero" escrito a mano queda como "Acero". La clave no cambia, porque las
   * dos grafías se normalizan igual.
   */
  withNameSpelling(existingName: string): Material {
    return new Material(
      this.id,
      existingName,
      this.quality,
      this.nameKey,
      this.qualityKey,
      this.createdByUserId,
      this.createdAt,
    );
  }

  /** Rehidrata desde la base; los datos ya pasaron la validación al guardarse. */
  static reconstruct(snapshot: MaterialSnapshot): Material {
    return new Material(
      snapshot.id,
      snapshot.name,
      snapshot.quality,
      snapshot.nameKey,
      snapshot.qualityKey,
      snapshot.createdByUserId,
      snapshot.createdAt,
    );
  }

  getId(): number | null {
    return this.id;
  }
  getName(): string {
    return this.name;
  }
  getQuality(): string {
    return this.quality;
  }
  getNameKey(): string {
    return this.nameKey;
  }
  getQualityKey(): string {
    return this.qualityKey;
  }
  getCreatedByUserId(): number | null {
    return this.createdByUserId;
  }
  getCreatedAt(): Date | null {
    return this.createdAt;
  }
}
