import { CategoriesService } from './categories.service';
import { CategoriesRepository } from '../domain/ports/categories.repository';
import { Category } from '../domain/category';
import { FactoryRepository } from '../../factory/domain/factory.repository';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: jest.Mocked<CategoriesRepository>;
  let factoryRepository: jest.Mocked<FactoryRepository>;
  let moduleRef: { get: jest.Mock };

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<CategoriesRepository>;

    factoryRepository = {
      findAll: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<FactoryRepository>;

    moduleRef = { get: jest.fn().mockReturnValue(factoryRepository) };

    service = new CategoriesService(repository, moduleRef as any);
  });

  describe('create', () => {
    it('creates a category and saves it through the repository', async () => {
      repository.findByName.mockResolvedValue(null);
      repository.save.mockImplementation(async (category) => category);

      const result = await service.create({ name: 'Metalurgica' });

      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(result.getName()).toBe('Metalurgica');
      expect(result.getActive()).toBe(true);
    });

    it('throws Conflict when the name already exists and is active', async () => {
      const existing = Category.reconstruct(1, 'Autopartes', true, new Date(), new Date());
      repository.findByName.mockResolvedValue(existing);

      await expect(service.create({ name: 'autopartes' })).rejects.toThrow('Ya existe un rubro con ese nombre');
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('throws Conflict with categoryId when the name exists but is inactive', async () => {
      const existing = Category.reconstruct(1, 'Petrolera', false, new Date(), new Date());
      repository.findByName.mockResolvedValue(existing);

      await expect(service.create({ name: 'Petrolera' })).rejects.toMatchObject({
        response: { categoryId: 1 },
      });
    });
  });

  describe('findOne', () => {
    it('returns the category found by the repository', async () => {
      const existing = Category.reconstruct(1, 'Metalurgica', true, new Date(), new Date());
      repository.findById.mockResolvedValue(existing);

      const result = await service.findOne(1);

      expect(repository.findById).toHaveBeenCalledWith(1);
      expect(result).toBe(existing);
    });

    it('returns null when the category does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('returns null when the category does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      const result = await service.update(999, { name: 'Nuevo nombre' });

      expect(result).toBeNull();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('renames the category and saves it', async () => {
      const existing = Category.reconstruct(1, 'Metalurgica', true, new Date(), new Date());
      repository.findById.mockResolvedValue(existing);
      repository.save.mockImplementation(async (category) => category);

      const result = await service.update(1, { name: 'Insumos' });

      expect(result?.getName()).toBe('Insumos');
      expect(repository.save).toHaveBeenCalledWith(existing);
    });

    it('throws Conflict when trying to rename to an existing active category name', async () => {
      const category = Category.reconstruct(1, 'Metalmecanica', true, new Date(), new Date());
      const other = Category.reconstruct(2, 'Metalurgica', true, new Date(), new Date());
      repository.findById.mockResolvedValue(category);
      repository.findByName.mockResolvedValue(other);

      await expect(service.update(1, { name: 'Metalurgica' })).rejects.toThrow('Ya existe un rubro con ese nombre');
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('allows saving with the same name without triggering a collision', async () => {
      const category = Category.reconstruct(1, 'Metalurgica', true, new Date(), new Date());
      repository.findById.mockResolvedValue(category);
      repository.findByName.mockResolvedValue(category); // se encuentra a si misma
      repository.save.mockImplementation(async (c) => c);

      const result = await service.update(1, { name: 'Metalurgica' });

      expect(result?.getName()).toBe('Metalurgica');
      expect(repository.save).toHaveBeenCalled();
    });

    it('throws Conflict when the category is inactive', async () => {
      const category = Category.reconstruct(1, 'Metalurgica', false, new Date(), new Date());
      repository.findById.mockResolvedValue(category);

      await expect(service.update(1, { name: 'Nuevo nombre' })).rejects.toThrow(
        'Debe reactivar el rubro antes de modificarlo',
      );
      expect(repository.save).not.toHaveBeenCalled();
      expect(repository.findByName).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('returns null when the category does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      const result = await service.remove(999);

      expect(result).toBeNull();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('deactivates the category instead of deleting it', async () => {
      const existing = Category.reconstruct(1, 'Metalurgica', true, new Date(), new Date());
      repository.findById.mockResolvedValue(existing);
      repository.save.mockImplementation(async (category) => category);

      const result = await service.remove(1);

      expect(result?.getActive()).toBe(false);
      expect(repository.save).toHaveBeenCalledWith(existing);
    });

    it('throws Conflict when there are active factories associated', async () => {
      const existing = Category.reconstruct(1, 'Autopartes', true, new Date(), new Date());
      repository.findById.mockResolvedValue(existing);
      factoryRepository.findAll.mockResolvedValue([
        { getId: () => 10, getName: () => 'Fabrica A', getCategoryId: () => 1, isActive: () => true } as any,
        { getId: () => 11, getName: () => 'Fabrica B', getCategoryId: () => 1, isActive: () => true } as any,
        { getId: () => 12, getName: () => 'Fabrica C', getCategoryId: () => 1, isActive: () => false } as any,
        { getId: () => 13, getName: () => 'Fabrica D', getCategoryId: () => 2, isActive: () => true } as any,
      ]);

      await expect(service.remove(1)).rejects.toThrow(/existen 2 fábricas activas/);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });
});
