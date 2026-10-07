import { ActiveFactorySummary } from '../ports/factory-query.port';

export class CategoryHasActiveFactories extends Error {
  constructor(
    public readonly categoryId: number,
    public readonly factories: ActiveFactorySummary[],
  ) {
    super(
      `No es posible dar de baja el rubro: existen ${factories.length} fábricas activas asociadas. Reasignelas antes de continuar`,
    );
    this.name = 'CategoryHasActiveFactories';
  }
}
