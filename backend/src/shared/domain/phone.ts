export class Phone {
  private static readonly MIN_DIGITS = 8;
  private static readonly MAX_DIGITS = 15; // maximo del estandar E.164

  private constructor(private readonly value: string) {}

  static create(raw: string): Phone {
    if (raw === null || raw === undefined) {
      throw new Error('Phone cannot be null');
    }

    // Se conserva el + inicial (prefijo internacional) y se descartan los
    // separadores de presentacion: espacios, guiones, puntos y parentesis.
    const trimmed = raw.trim();
    const hasCountryPrefix = trimmed.startsWith('+');
    const digits = trimmed.replace(/^\+/, '').replace(/[\s\-.()]/g, '');

    if (!digits) {
      throw new Error('Phone cannot be empty');
    }

    if (!/^\d+$/.test(digits)) {
      throw new Error('Phone must contain only digits and separators');
    }

    if (digits.length < Phone.MIN_DIGITS || digits.length > Phone.MAX_DIGITS) {
      throw new Error(`Phone must have between ${Phone.MIN_DIGITS} and ${Phone.MAX_DIGITS} digits`);
    }

    return new Phone(hasCountryPrefix ? `+${digits}` : digits);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Phone): boolean {
    return this.value === other.value;
  }
}
