import { CategoriesService } from './categories.service';
import { CategoriesRepository } from '../infrastructure/categories.repository';
import { Category } from '../domain/category';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: jest.Mocked<CategoriesRepository>;

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<CategoriesRepository>;

    service = new CategoriesService(repository);
  });

  describe('create', () => {
    it('creates a category and saves it through the repository', async () => {
      repository.save.mockImplementation(async (category) => category);

      const result = await service.create({ name: 'Metalurgica' });

      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(result.name).toBe('Metalurgica');
      expect(result.active).toBe(true);
    });
  });

  describe('findOne', () => {
    it('returns the category found by the repository', async () => {
      const existing = Category.reconstitute(1, 'Metalurgica', true, new Date(), new Date());
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
      const existing = Category.reconstitute(1, 'Metalurgica', true, new Date(), new Date());
      repository.findById.mockResolvedValue(existing);
      repository.save.mockImplementation(async (category) => category);

      const result = await service.update(1, { name: 'Insumos' });

      expect(result?.name).toBe('Insumos');
      expect(repository.save).toHaveBeenCalledWith(existing);
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
      const existing = Category.reconstitute(1, 'Metalurgica', true, new Date(), new Date());
      repository.findById.mockResolvedValue(existing);
      repository.save.mockImplementation(async (category) => category);

      const result = await service.remove(1);

      expect(result?.active).toBe(false);
      expect(repository.save).toHaveBeenCalledWith(existing);
    });
  });
});
