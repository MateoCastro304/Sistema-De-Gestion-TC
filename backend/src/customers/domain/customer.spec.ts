import { Customer } from './customer';

describe('Customer (domain)', () => {
  it('creates a customer with a valid name', () => {
    const customer = new Customer('1', 'Acme SRL');
    expect(customer.name).toBe('Acme SRL');
  });

  it('throws when the name is empty', () => {
    expect(() => new Customer('1', '')).toThrow('Customer name cannot be empty');
  });

  it('allows renaming to a valid name', () => {
    const customer = new Customer('1', 'Acme SRL');
    customer.rename('Beta SA');
    expect(customer.name).toBe('Beta SA');
  });

  it('throws when renaming to an empty name', () => {
    const customer = new Customer('1', 'Acme SRL');
    expect(() => customer.rename('')).toThrow('Customer name cannot be empty');
  });
});
