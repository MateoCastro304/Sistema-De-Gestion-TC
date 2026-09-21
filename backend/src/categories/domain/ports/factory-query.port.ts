export abstract class FactoryQuery {
    abstract hasActiveFactoriesForCategory(categoryId: number): Promise<boolean>;
}
