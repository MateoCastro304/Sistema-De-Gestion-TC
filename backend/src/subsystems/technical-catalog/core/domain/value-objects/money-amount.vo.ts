/** Por qué un importe no es válido; cada entidad lo traduce a su mensaje de campo. */
export type AmountProblem = 'missing' | 'not-positive' | 'too-many-decimals' | 'too-large';

export type AmountParse = { amount: MoneyAmount; problem?: never } | { amount?: never; problem: AmountProblem };

/**
 * Importe positivo con hasta dos decimales (D-35) que entra en un
 * DECIMAL(12,2). Cualquier instancia es válida: se valida una sola vez, en
 * `parse`.
 */
export class MoneyAmount {
  static readonly MAX = 9_999_999_999.99;

  private constructor(private readonly value: number) {}

  static parse(value: unknown): AmountParse {
    if (value === undefined || value === null) return { problem: 'missing' };
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return { problem: 'not-positive' };
    if (value > MoneyAmount.MAX) return { problem: 'too-large' };
    if (!/^\d+(\.\d{1,2})?$/.test(String(value))) return { problem: 'too-many-decimals' };
    return { amount: new MoneyAmount(value) };
  }

  getValue(): number {
    return this.value;
  }

  /** Texto con exactamente dos decimales, para guardarlo como decimal exacto. */
  toFixed2(): string {
    return this.value.toFixed(2);
  }
}
