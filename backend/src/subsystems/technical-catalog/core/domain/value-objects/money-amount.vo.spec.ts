import { MoneyAmount } from './money-amount.vo';

describe('MoneyAmount', () => {
  it.each([3100, 2.24, 1385.5, 0.01])('acepta %p', (value) => {
    expect(MoneyAmount.parse(value).amount?.getValue()).toBe(value);
  });

  it.each([
    [undefined, 'missing'],
    [null, 'missing'],
    [0, 'not-positive'],
    [-5, 'not-positive'],
    [Number.NaN, 'not-positive'],
    ['10', 'not-positive'],
    [1.234, 'too-many-decimals'],
    [10_000_000_000, 'too-large'],
  ])('rechaza %p con el problema %s', (value, problem) => {
    expect(MoneyAmount.parse(value).problem).toBe(problem);
  });

  it('expone el importe con dos decimales exactos', () => {
    expect(MoneyAmount.parse(1385.5).amount?.toFixed2()).toBe('1385.50');
  });
});
