import { Material } from './entities/material.entity';
import { compareKeys, compareMaterials } from './material-order';

const material = (name: string, quality: string, id: number) =>
  Material.reconstruct({
    id,
    name,
    quality,
    nameKey: name.toLowerCase(),
    qualityKey: quality.toLowerCase(),
    createdByUserId: null,
    createdAt: new Date(),
  });

const qualitiesOf = (materials: Material[]) => materials.map((m) => `${m.getName()} ${m.getQuality()}`);

describe('orden de materiales', () => {
  it('ordena la calidad con orden natural de los números', () => {
    const sorted = [
      material('Acero', '1045', 1),
      material('Bronce', 'SAE 65', 2),
      material('Acero', '1010', 3),
      material('Bronce', 'SAE 62', 4),
      material('Bronce', 'SAE 10', 5),
      material('Bronce', 'SAE 9', 6),
    ].sort(compareMaterials);

    expect(qualitiesOf(sorted)).toEqual([
      'Acero 1010',
      'Acero 1045',
      'Bronce SAE 9',
      'Bronce SAE 10',
      'Bronce SAE 62',
      'Bronce SAE 65',
    ]);
  });

  it('ordena primero por nombre y recién después por calidad', () => {
    const sorted = [material('Bronce', '1', 1), material('Acero', '9', 2), material('Acero inoxidable', '1', 3)].sort(
      compareMaterials,
    );

    expect(qualitiesOf(sorted)).toEqual(['Acero 9', 'Acero inoxidable 1', 'Bronce 1']);
  });

  it('desempata por id', () => {
    const sorted = [material('Acero', '1010', 2), material('Acero', '1010', 1)].sort(compareMaterials);

    expect(sorted.map((m) => m.getId())).toEqual([1, 2]);
  });

  it('compara claves con orden natural', () => {
    expect(compareKeys('sae 9', 'sae 10')).toBeLessThan(0);
    expect(compareKeys('acero', 'acero inoxidable')).toBeLessThan(0);
  });
});
