/**
 * Texto normalizado para comparar sin distinguir mayúsculas, acentos ni
 * espacios repetidos (contrato, §4 "Comparación de textos"). Es el único lugar
 * que define ese criterio: lo usan por igual la unicidad al escribir y los
 * filtros de búsqueda al leer.
 */
export class TextKey {
  private constructor(private readonly value: string) {}

  static create(text: string): TextKey {
    const normalized = text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
    return new TextKey(normalized);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: TextKey): boolean {
    return this.value === other.value;
  }
}
