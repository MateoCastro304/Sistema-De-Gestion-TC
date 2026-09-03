export class Cuit {
    private static readonly WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    private static readonly VALID_PREFIXES = ['20', '23', '24', '27', '30', '33', '34'];

    private constructor(private readonly value: string) {}

    static create(raw: string): Cuit {
        if (raw === null || raw === undefined) {
            throw new Error('CUIT cannot be null');
        }

        const normalized = raw.replace(/[\s\-.]/g, '');

        if (normalized.length !== 11) {
            throw new Error('CUIT must have 11 digits');
        }

        if (!/^\d{11}$/.test(normalized)) {
            throw new Error('CUIT must contain only digits');
        }

        const prefix = normalized.substring(0,2);
        if (!Cuit.VALID_PREFIXES.includes(prefix)) {
            throw new Error(`CUIT prefix ${prefix} is not valid`);
        }

        const expected = Cuit.calculateCheckDigit(normalized);
        const actual = Number(normalized[10])
        if (expected !== actual) {
            throw new Error('CUIT check digit is invalid');
        }

        return new Cuit(normalized);
    }

    private static calculateCheckDigit(cuit: string): number {
        let sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += Number(cuit[i]) * Cuit.WEIGHTS[i];
        }

        const remainder = sum % 11;
        const check = 11 - remainder;

        if (check === 11) return 0;
        if (check === 10) throw new Error('CUIT is not assignable (check = 10)');

        return check;
    }

    getValue(): string { return this.value; }

    // This funtionality will be used if the frontend needs it 
    getFormatted(): string {
        return `${this.value.substring(0,2)}-${this.value.substring(2,10)}-${this.value[10]}`
    }

    equals(other: Cuit): boolean {
        return this.value === other.value;
    }
}