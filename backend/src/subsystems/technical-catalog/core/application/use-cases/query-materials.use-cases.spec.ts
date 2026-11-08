import { InMemoryMaterialRepository } from '../../../infrastructure/persistence/in-memory/in-memory-material.repository';
import { ListMaterialNames } from './list-material-names.use-case';
import { ListMaterials } from './list-materials.use-case';
import { RegisterMaterial } from './register-material.use-case';

const CATALOG: [string, string][] = [
  ['Acero', '1045'],
  ['Acero', '1010'],
  ['Bronce', 'SAE 65'],
  ['Bronce', 'SAE 62'],
  ['Acero inoxidable', 'AISI 304'],
  ['Teflón', 'Virgen'],
];

describe('consulta de materiales', () => {
  let repository: InMemoryMaterialRepository;
  let list: ListMaterials;
  let listNames: ListMaterialNames;

  beforeEach(async () => {
    repository = new InMemoryMaterialRepository();
    list = new ListMaterials(repository);
    listNames = new ListMaterialNames(repository);
    const register = new RegisterMaterial(repository);
    for (const [name, quality] of CATALOG) await register.execute({ name, quality, authorId: 1 });
  });

  const describeAll = (items: { getName(): string; getQuality(): string }[]) =>
    items.map((m) => `${m.getName()} ${m.getQuality()}`);

  describe('ListMaterials', () => {
    it('lista todo ordenado por nombre y, dentro de cada uno, por calidad (escenario 2)', async () => {
      const result = await list.execute({ page: 1, limit: 20 });

      expect(describeAll(result.items)).toEqual([
        'Acero 1010',
        'Acero 1045',
        'Acero inoxidable AISI 304',
        'Bronce SAE 62',
        'Bronce SAE 65',
        'Teflón Virgen',
      ]);
      expect(result.total).toBe(6);
    });

    it('filtra por nombre exacto, sin distinguir mayúsculas ni acentos, y no mezcla "Acero inoxidable"', async () => {
      const result = await list.execute({ page: 1, limit: 20, name: 'ACERO' });

      expect(describeAll(result.items)).toEqual(['Acero 1010', 'Acero 1045']);
      expect((await list.execute({ page: 1, limit: 20, name: 'teflon' })).total).toBe(1);
    });

    it('filtra por calidad que contiene el texto (escenario 1)', async () => {
      const result = await list.execute({ page: 1, limit: 20, name: 'Acero', quality: '10' });

      expect(describeAll(result.items)).toEqual(['Acero 1010', 'Acero 1045']);
      expect(describeAll((await list.execute({ page: 1, limit: 20, name: 'Acero', quality: '104' })).items)).toEqual([
        'Acero 1045',
      ]);
    });

    it('trata un filtro de solo espacios como si no hubiera filtro', async () => {
      expect((await list.execute({ page: 1, limit: 20, name: '  ', quality: ' ' })).total).toBe(6);
    });

    it('pagina y el total es el del conjunto filtrado', async () => {
      const second = await list.execute({ page: 2, limit: 4 });

      expect(describeAll(second.items)).toEqual(['Bronce SAE 65', 'Teflón Virgen']);
      expect(second.total).toBe(6);
    });

    it('sin resultados devuelve items vacío y total 0, sin error (escenario 3)', async () => {
      expect(await list.execute({ page: 1, limit: 20, name: 'Inexistente' })).toEqual({ items: [], total: 0 });
    });
  });

  describe('ListMaterialNames', () => {
    it('devuelve los nombres distintos en orden alfabético (escenario 4)', async () => {
      expect(await listNames.execute()).toEqual(['Acero', 'Acero inoxidable', 'Bronce', 'Teflón']);
    });

    it('devuelve una lista vacía si no hay materiales', async () => {
      expect(await new ListMaterialNames(new InMemoryMaterialRepository()).execute()).toEqual([]);
    });
  });
});
