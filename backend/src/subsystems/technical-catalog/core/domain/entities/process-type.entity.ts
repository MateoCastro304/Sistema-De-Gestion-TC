import { TextKey } from '../../../../../shared/domain/text-key';
import { FieldError, ProcessTypeValidationError } from '../errors/process-type-validation.error';
import { AmountProblem, MoneyAmount } from '../value-objects/money-amount.vo';

export const NAME_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;

/** Datos de entrada del alta, tal como llegan: cualquier campo puede faltar. */
export type NewProcessTypeData = {
  name?: string | null;
  description?: string | null;
  hourlyRateArs?: number | null;
  hourlyRateUsd?: number | null;
  exchangeRate?: number | null;
};

/** Una fila de la base, para {@link ProcessType.reconstruct}. */
export type ProcessTypeSnapshot = {
  id: number;
  name: string;
  nameKey: string;
  description: string | null;
  hourlyRateArs: number;
  hourlyRateUsd: number;
  exchangeRate: number;
  createdAt: Date;
  updatedAt: Date;
};

type RateField = 'hourlyRateArs' | 'hourlyRateUsd' | 'exchangeRate';

/** Cómo se nombra cada importe en los mensajes y qué dice cuando falta. */
const RATE_LABELS: Record<RateField, { label: string; missing: string }> = {
  hourlyRateArs: { label: 'precio hora en pesos', missing: 'Ingresá el precio hora en pesos' },
  hourlyRateUsd: { label: 'precio hora en dólares', missing: 'Ingresá el precio hora en dólares' },
  exchangeRate: {
    label: 'tipo de cambio',
    missing: 'Ingresá un tipo de cambio mayor a 0, con hasta dos decimales',
  },
};

/**
 * Tipo de proceso propio del taller con su precio hora en pesos y en dólares
 * (RN16). Los dos precios y el tipo de cambio se guardan tal como llegan: el
 * cálculo que los vincula es del cliente (D-29).
 */
export class ProcessType {
  private constructor(
    private readonly id: number | null,
    private readonly name: string,
    private readonly nameKey: string,
    private readonly description: string | null,
    private readonly hourlyRateArs: MoneyAmount,
    private readonly hourlyRateUsd: MoneyAmount,
    private readonly exchangeRate: MoneyAmount,
    private readonly createdAt: Date | null,
    private readonly updatedAt: Date | null,
  ) {}

  /** Alta. Valida todos los campos y informa cada error por separado. */
  static create(data: NewProcessTypeData): ProcessType {
    const errors: FieldError[] = [];

    const name = (data.name ?? '').trim();
    if (name === '') errors.push({ field: 'name', message: 'Ingresá el nombre del tipo de proceso' });
    else if (name.length > NAME_MAX_LENGTH)
      errors.push({ field: 'name', message: `El nombre admite como máximo ${NAME_MAX_LENGTH} caracteres` });

    const description = (data.description ?? '').trim();
    if (description.length > DESCRIPTION_MAX_LENGTH)
      errors.push({
        field: 'description',
        message: `La descripción admite como máximo ${DESCRIPTION_MAX_LENGTH} caracteres`,
      });

    const amounts = {} as Record<RateField, MoneyAmount>;
    for (const field of Object.keys(RATE_LABELS) as RateField[]) {
      const parsed = MoneyAmount.parse(data[field]);
      if (parsed.amount) amounts[field] = parsed.amount;
      else errors.push({ field, message: ProcessType.amountMessage(field, parsed.problem) });
    }

    if (errors.length > 0) throw new ProcessTypeValidationError(errors);

    return new ProcessType(
      null,
      name,
      TextKey.create(name).getValue(),
      description === '' ? null : description,
      amounts.hourlyRateArs,
      amounts.hourlyRateUsd,
      amounts.exchangeRate,
      null,
      null,
    );
  }

  /** Rehidrata desde la base; los datos ya pasaron la validación al guardarse. */
  static reconstruct(snapshot: ProcessTypeSnapshot): ProcessType {
    return new ProcessType(
      snapshot.id,
      snapshot.name,
      snapshot.nameKey,
      snapshot.description,
      ProcessType.storedAmount(snapshot.hourlyRateArs),
      ProcessType.storedAmount(snapshot.hourlyRateUsd),
      ProcessType.storedAmount(snapshot.exchangeRate),
      snapshot.createdAt,
      snapshot.updatedAt,
    );
  }

  private static storedAmount(value: number): MoneyAmount {
    const parsed = MoneyAmount.parse(value);
    if (!parsed.amount) throw new Error(`Importe inválido en la base: ${value}`);
    return parsed.amount;
  }

  private static amountMessage(field: RateField, problem: AmountProblem): string {
    const { label, missing } = RATE_LABELS[field];
    switch (problem) {
      case 'missing':
        return missing;
      case 'too-many-decimals':
        return `El ${label} admite como máximo dos decimales`;
      case 'too-large':
        return `El ${label} no puede superar ${MoneyAmount.MAX}`;
      default:
        return `El ${label} tiene que ser un número mayor a 0`;
    }
  }

  getId(): number | null {
    return this.id;
  }
  getName(): string {
    return this.name;
  }
  getNameKey(): string {
    return this.nameKey;
  }
  getDescription(): string | null {
    return this.description;
  }
  getHourlyRateArs(): MoneyAmount {
    return this.hourlyRateArs;
  }
  getHourlyRateUsd(): MoneyAmount {
    return this.hourlyRateUsd;
  }
  getExchangeRate(): MoneyAmount {
    return this.exchangeRate;
  }
  getCreatedAt(): Date | null {
    return this.createdAt;
  }
  getUpdatedAt(): Date | null {
    return this.updatedAt;
  }
}
