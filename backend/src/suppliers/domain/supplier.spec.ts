import { Supplier } from './supplier';

describe('Supplier (domain)', () => {
  it('creates a supplier with a valid name', () => {
    const supplier = new Supplier('1', 'Acero SRL');
    expect(supplier.name).toBe('Acero SRL');
  });

  it('throws when the name is empty', () => {
    expect(() => new Supplier('1', '')).toThrow('Supplier name cannot be empty');
  });

  it('allows renaming to a valid name', () => {
    const supplier = new Supplier('1', 'Acero SRL');
    supplier.rename('Metales SA');
    expect(supplier.name).toBe('Metales SA');
  });

  it('throws when renaming to an empty name', () => {
    const supplier = new Supplier('1', 'Acero SRL');
    expect(() => supplier.rename('')).toThrow('Supplier name cannot be empty');
  });
});
