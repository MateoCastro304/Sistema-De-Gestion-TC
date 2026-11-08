import { MaterialValidationError } from '../errors/material-validation.error';
import { Material } from './material.entity';

function detailsOf(data: Parameters<typeof Material.create>[0]) {
  try {
    Material.create(data, 1);
  } catch (error) {
    if (error instanceof MaterialValidationError) return error.details;
    throw error;
  }
  throw new Error('Material.create should have thrown');
}

describe('Material', () => {
  describe('create', () => {
    it('guarda nombre y calidad sin espacios en los extremos y arma las claves normalizadas', () => {
      const material = Material.create({ name: '  Fundición  gris ', quality: ' SAE  65 ' }, 7);

      expect(material.getId()).toBeNull();
      expect(material.getName()).toBe('Fundición  gris');
      expect(material.getQuality()).toBe('SAE  65');
      expect(material.getNameKey()).toBe('fundicion gris');
      expect(material.getQualityKey()).toBe('sae 65');
      expect(material.getCreatedByUserId()).toBe(7);
    });

    it('acepta exactamente 60 caracteres en cada campo', () => {
      const material = Material.create({ name: 'a'.repeat(60), quality: '1'.repeat(60) }, 1);

      expect(material.getName()).toHaveLength(60);
    });

    it.each([
      ['falta', undefined],
      ['es null', null],
      ['está vacío', ''],
      ['son solo espacios', '   '],
    ])('informa los dos campos cuando %s', (_label, value) => {
      expect(detailsOf({ name: value, quality: value })).toEqual([
        { field: 'name', message: 'Ingresá el material' },
        { field: 'quality', message: 'Ingresá la calidad' },
      ]);
    });

    it('informa cada campo que supera los 60 caracteres', () => {
      expect(detailsOf({ name: 'a'.repeat(61), quality: 'b'.repeat(61) })).toEqual([
        { field: 'name', message: 'El material admite como máximo 60 caracteres' },
        { field: 'quality', message: 'La calidad admite como máximo 60 caracteres' },
      ]);
    });

    it('informa solo el campo inválido', () => {
      expect(detailsOf({ name: 'Acero', quality: '' })).toEqual([{ field: 'quality', message: 'Ingresá la calidad' }]);
    });
  });

  describe('withNameSpelling', () => {
    it('usa la grafía existente del nombre sin cambiar las claves ni la calidad', () => {
      const material = Material.create({ name: 'acero', quality: '4140' }, 3).withNameSpelling('Acero');

      expect(material.getName()).toBe('Acero');
      expect(material.getNameKey()).toBe('acero');
      expect(material.getQuality()).toBe('4140');
      expect(material.getCreatedByUserId()).toBe(3);
    });
  });
});
