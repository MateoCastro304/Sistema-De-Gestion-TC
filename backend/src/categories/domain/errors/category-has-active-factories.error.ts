export class CategoryHasActiveFactories extends Error {
    constructor(public readonly categoryId: number) {
        super(`Category with ID ${categoryId} has active factories and cannot be deactivated`);
        this.name = 'CategoryHasActiveFactories';
    }
}
