import { Cuit } from './cuit';
import { DomainValidationError } from './errors/domain-validation.error';

/**
 * Los CUIT de estos casos no son inventados: se calcularon con el mismo
 * algoritmo que implementa el value object (pesos 5,4,3,2,7,6,5,4,3,2 sobre
 * los primeros 10 digitos, modulo 11). Si hace falta otro, hay que calcularlo,
 * no escribir digitos al azar: once digitos cualesquiera casi nunca forman un
 * CUIT valido.
 */
const VALID_FORMATTED = '30-71234567-1';
const VALID_BARE = '30712345671';

describe('Cuit (value object)', () => {
  // ---------------------------------------------------------------------------
  // create — accepts
  // ---------------------------------------------------------------------------
  describe('accepts', () => {
    it('a CUIT written with dashes', () => {
      expect(Cuit.create(VALID_FORMATTED).getCuitValue()).toBe(VALID_BARE);
    });

    it('a CUIT written as 11 bare digits', () => {
      expect(Cuit.create(VALID_BARE).getCuitValue()).toBe(VALID_BARE);
    });

    it.each([
      ['dashes', '30-71234567-1'],
      ['spaces', '30 71234567 1'],
      ['dots', '30.71234567.1'],
      ['mixed separators', '30-71234567 1'],
      ['surrounding spaces', ' 30712345671 '],
    ])('normalises %s away', (_label, raw) => {
      expect(Cuit.create(raw).getCuitValue()).toBe(VALID_BARE);
    });

    // Los prefijos asignables: 20/23/24/27 son personas fisicas, 30/33/34
    // personas juridicas. Cualquier otro se rechaza.
    it.each([
      ['20', '20-00000002-8'],
      ['23', '23-00000001-9'],
      ['24', '24-00000001-5'],
      ['27', '27-00000001-4'],
      ['30', '30-00000001-5'],
      ['33', '33-00000001-4'],
      ['34', '34-00000001-0'],
    ])('the valid prefix %s', (_prefix, raw) => {
      expect(() => Cuit.create(raw)).not.toThrow();
    });

    it('a CUIT whose check digit is 0', () => {
      // Cuando 11 - (suma % 11) da 11, el digito verificador es 0 y no 11.
      expect(Cuit.create('30-00000009-0').getCuitValue()).toBe('30000000090');
    });
  });

  // ---------------------------------------------------------------------------
  // create — rejects
  // ---------------------------------------------------------------------------
  describe('rejects', () => {
    it('null', () => {
      expect(() => Cuit.create(null as unknown as string)).toThrow(DomainValidationError);
      expect(() => Cuit.create(null as unknown as string)).toThrow('CUIT cannot be null');
    });

    it('undefined', () => {
      expect(() => Cuit.create(undefined as unknown as string)).toThrow('CUIT cannot be null');
    });

    it('an empty string', () => {
      expect(() => Cuit.create('')).toThrow('CUIT must have 11 digits');
    });

    it('fewer than 11 digits', () => {
      expect(() => Cuit.create('3071234567')).toThrow('CUIT must have 11 digits');
    });

    it('more than 11 digits', () => {
      expect(() => Cuit.create('307123456711')).toThrow('CUIT must have 11 digits');
    });

    it('a value that is 11 characters long but not all digits', () => {
      // Llega con el largo justo, asi que pasa el primer chequeo y lo tiene
      // que frenar el de digitos.
      expect(() => Cuit.create('30A71234567')).toThrow('CUIT must contain only digits');
    });

    it('letters with separators', () => {
      expect(() => Cuit.create('e-stonoesuncu-it')).toThrow(DomainValidationError);
    });

    it.each(['21', '22', '25', '26', '28', '29', '31', '32', '35', '99', '00'])(
      'the unassignable prefix %s',
      (prefix) => {
        expect(() => Cuit.create(`${prefix}712345671`)).toThrow(`CUIT prefix ${prefix} is not valid`);
      },
    );

    it('a wrong check digit', () => {
      // Mismos 10 primeros digitos que VALID_FORMATTED, con el verificador
      // cambiado.
      expect(() => Cuit.create('30-71234567-9')).toThrow('CUIT check digit is invalid');
    });

    it('a CUIT that is not assignable because the check digit would be 10', () => {
      // Cuando la suma deja resto 1, el verificador daria 10, que no existe:
      // ese numero base no corresponde a ningun CUIT, y el mensaje lo
      // distingue de un verificador simplemente equivocado.
      expect(() => Cuit.create('30-00000004-5')).toThrow('CUIT is not assignable (check = 10)');
    });
  });

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------
  describe('getters', () => {
    it('getCuitValue returns the bare digits, with no separators', () => {
      expect(Cuit.create(VALID_FORMATTED).getCuitValue()).toBe(VALID_BARE);
    });

    it('getFormatted returns the display form with dashes', () => {
      expect(Cuit.create(VALID_BARE).getFormatted()).toBe(VALID_FORMATTED);
    });

    it('getFormatted is stable no matter how the CUIT was written', () => {
      expect(Cuit.create('30.71234567.1').getFormatted()).toBe(VALID_FORMATTED);
    });
  });

  // ---------------------------------------------------------------------------
  // equals
  // ---------------------------------------------------------------------------
  describe('equals', () => {
    it('two CUIT with the same digits are equal even if written differently', () => {
      // Es la propiedad que hace que exista el value object: la comparacion es
      // por valor normalizado, no por el texto que mando el cliente.
      expect(Cuit.create(VALID_FORMATTED).equals(Cuit.create(VALID_BARE))).toBe(true);
    });

    it('two different CUIT are not equal', () => {
      expect(Cuit.create(VALID_FORMATTED).equals(Cuit.create('27-23456789-1'))).toBe(false);
    });

    it('a CUIT equals itself', () => {
      const cuit = Cuit.create(VALID_FORMATTED);
      expect(cuit.equals(cuit)).toBe(true);
    });
  });
});
