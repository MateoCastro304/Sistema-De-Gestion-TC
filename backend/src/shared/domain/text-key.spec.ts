import { TextKey } from './text-key';

describe('TextKey', () => {
  it.each([
    ['Mecanizado Torno Manual', 'mecanizado torno manual'],
    ['  mecanizado   torno manual ', 'mecanizado torno manual'],
    ['Mecanizado Tórno Manual', 'mecanizado torno manual'],
    ['TEFLÓN', 'teflon'],
  ])('normaliza "%s" a "%s"', (input, expected) => {
    expect(TextKey.create(input).getValue()).toBe(expected);
  });

  it('considera iguales los textos que solo difieren en mayúsculas, acentos o espacios', () => {
    expect(TextKey.create('Teflón').equals(TextKey.create(' TEFLON '))).toBe(true);
    expect(TextKey.create('Teflón').equals(TextKey.create('Nylon'))).toBe(false);
  });
});
