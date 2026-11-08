import { InMemoryMaterialRepository } from '../../../infrastructure/persistence/in-memory/in-memory-material.repository';
import { MaterialAlreadyExists } from '../../domain/errors/material-already-exists.error';
import { MaterialValidationError } from '../../domain/errors/material-validation.error';
import { RegisterMaterial } from './register-material.use-case';

const input = { name: 'Acero', quality: '4140', authorId: 7 };

describe('RegisterMaterial', () => {
  let repository: InMemoryMaterialRepository;
  let useCase: RegisterMaterial;

  beforeEach(() => {
    repository = new InMemoryMaterialRepository();
    useCase = new RegisterMaterial(repository);
  });

  it('guarda el material con su creador y lo devuelve con su id (escenario 1)', async () => {
    const created = await useCase.execute(input);

    expect(created.getId()).toBe(1);
    expect(created.getName()).toBe('Acero');
    expect(created.getQuality()).toBe('4140');
    expect(created.getCreatedByUserId()).toBe(7);
    expect(repository.saved).toHaveLength(1);
  });

  it('permite repetir el nombre con otra calidad', async () => {
    await useCase.execute({ ...input, quality: '1045' });

    await expect(useCase.execute({ ...input, quality: '1010' })).resolves.toBeDefined();
    expect(repository.saved).toHaveLength(2);
  });

  it.each([
    ['otra grafía y espacios', 'acero', ' 1045 '],
    ['acentos', 'Acéro', '1045'],
    ['espacios repetidos', ' ACERO ', '1045'],
  ])('rechaza la combinación repetida (%s) y no guarda nada (escenario 2)', async (_label, name, quality) => {
    await useCase.execute({ ...input, quality: '1045' });

    await expect(useCase.execute({ ...input, name, quality })).rejects.toBeInstanceOf(MaterialAlreadyExists);
    expect(repository.saved).toHaveLength(1);
  });

  it('rechaza la calidad repetida aunque tenga espacios repetidos adentro', async () => {
    await useCase.execute({ ...input, name: 'Bronce', quality: 'SAE 65' });

    await expect(useCase.execute({ ...input, name: 'Bronce', quality: 'sae   65' })).rejects.toBeInstanceOf(
      MaterialAlreadyExists,
    );
  });

  it('guarda con la grafía del nombre que ya existe (escenario 5)', async () => {
    await useCase.execute(input);

    const created = await useCase.execute({ ...input, name: 'acero', quality: '1045' });

    expect(created.getName()).toBe('Acero');
    expect(await repository.listNames()).toEqual(['Acero']);
  });

  it('un nombre nuevo escrito a mano se guarda tal cual y aparece en la lista de nombres (escenario 4)', async () => {
    await useCase.execute(input);

    await useCase.execute({ ...input, name: 'Nylon', quality: 'PA6' });

    expect(await repository.listNames()).toEqual(['Acero', 'Nylon']);
  });

  it('valida los datos antes de consultar la unicidad (escenario 3)', async () => {
    await expect(useCase.execute({ ...input, name: '', quality: '' })).rejects.toBeInstanceOf(MaterialValidationError);
    expect(repository.saved).toHaveLength(0);
  });
});
