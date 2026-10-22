export type ActiveFactorySummary = {
  id: number;
  name: string;
};

export abstract class FactoryQuery {
  abstract getActiveFactoriesForCategory(categoryId: number): Promise<ActiveFactorySummary[]>;
}
