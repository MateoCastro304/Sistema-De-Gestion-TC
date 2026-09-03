import { Category } from '../../domain/category';

export class CategoryResponseDto {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;

    private constructor(id: number, name: string, createdAt: Date, updatedAt: Date) {
        this.id = id;
        this.name = name;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    } 

    static fromDomain(category: Category): CategoryResponseDto {
        return new CategoryResponseDto(category.getId() as number, category.getName(), category.getCreatedAt(), category.getUpdatedAt());
    }
}
