import { Category } from "./category";

describe('Category (domain)', () => {
  it('creates a category with a valid name', () => {
    const category = Category.create('Metalurgica');
    expect(category.getName()).toBe('Metalurgica');
  });

  it('throws when the name is empty', () => {
    expect(() => Category.create('')).toThrow('Category name cannot be empty');
  });

  it('trims the name on creation', () => {
    const category = Category.create('  Metalurgica  ');
    expect(category.getName()).toBe('Metalurgica');
  });

  it('throws when the name is only whitespace', () => {
    expect(() => Category.create('   ')).toThrow('Category name cannot be empty');
  });

  it('allows renaming to a valid name', () => {
    const category = Category.create('Metalurgica');
    category.rename('Insumos');
    expect(category.getName()).toBe('Insumos');
  });

  it('trims the name on rename', () => {
    const category = Category.create('Metalurgica');
    category.rename('  Insumos  ');
    expect(category.getName()).toBe('Insumos');
  });

  it('throws when renaming to an empty name', () => {
    const category = Category.create('Metalurgica');
    expect(() => category.rename('')).toThrow('Category name cannot be empty');
  });

  it('leaves the category untouched when rename is rejected', () => {
    const category = Category.create('Metalurgica');
    const originalUpdatedAt = category.getUpdatedAt();

    expect(() => category.rename('ab')).toThrow('Category name must be at least 3 characters long');

    expect(category.getName()).toBe('Metalurgica');
    expect(category.getUpdatedAt()).toEqual(originalUpdatedAt);
  });

  describe('timestamps', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('sets createdAt equal to updatedAt when created', () => {
      jest.setSystemTime(new Date('2026-01-01T10:00:00Z'));

      const category = Category.create('Metalurgica');

      expect(category.getCreatedAt()).toEqual(category.getUpdatedAt());
    });

    it('updates updatedAt on rename, but keeps createdAt unchanged', () => {
      jest.setSystemTime(new Date('2026-01-01T10:00:00Z'));
      const category = Category.create('Metalurgica');
      const originalCreatedAt = category.getCreatedAt();

      jest.setSystemTime(new Date('2026-06-01T10:00:00Z'));
      category.rename('Insumos');

      expect(category.getCreatedAt()).toEqual(originalCreatedAt);
      expect(category.getUpdatedAt()).toEqual(new Date('2026-06-01T10:00:00Z'));
    });

    it('updates updatedAt on deactivate', () => {
      jest.setSystemTime(new Date('2026-01-01T10:00:00Z'));
      const category = Category.create('Metalurgica');

      jest.setSystemTime(new Date('2026-06-01T10:00:00Z'));
      category.deactivate();

      expect(category.getUpdatedAt()).toEqual(new Date('2026-06-01T10:00:00Z'));
    });
  });
});
