import { Category } from './category';

describe('Category (domain)', () => {
  it('creates a category with a valid name', () => {
    const category = new Category('1', 'Metalurgica');
    expect(category.name).toBe('Metalurgica');
  });

  it('throws when the name is empty', () => {
    expect(() => new Category('1', '')).toThrow('Category name cannot be empty');
  });

  it('allows renaming to a valid name', () => {
    const category = new Category('1', 'Metalurgica');
    category.rename('Insumos');
    expect(category.name).toBe('Insumos');
  });

  it('throws when renaming to an empty name', () => {
    const category = new Category('1', 'Metalurgica');
    expect(() => category.rename('')).toThrow('Category name cannot be empty');
  });
});
