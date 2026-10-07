import { Injectable, NotFoundException } from "@nestjs/common";
import { FactoryRepository, FactoryListParams, FactoryListResult } from "../domain/port/factory.repository";
import { Factory } from "../domain/factory";

@Injectable()

export class FactoryInMemoryRepository implements FactoryRepository {
    private readonly factories: Map<number, Factory> = new Map();
    private autoIncrementId = 1;

    async save(factory: Factory): Promise<Factory> {
        const generatedId = this.autoIncrementId ++;

        const savedFactory = Factory.reconstruct(
            generatedId,
            factory.getCuit(),
            factory.getName(),
            factory.getAddress(),
            factory.getPaymentDescription(),
            factory.getCategoryId(),
            factory.isActive(),
        );
        this.factories.set(generatedId, savedFactory);
        return savedFactory;
    }

    async findById(id: number): Promise<Factory | null> {
        return this.factories.get(id) || null;
    }

    async findAll(): Promise<Factory[]> {
        return Array.from(this.factories.values())
    }

    async update(factory: Factory): Promise<void> {
        const id = factory.getId();
        if (!id || !this.factories.has(id)){
            throw new NotFoundException(`Factory with ID ${id} not found`);

        }

        this.factories.set(id, factory);
    }

    async existsByCuit(cuit: string, excludeId?: number): Promise<boolean> {
        return Array.from(this.factories.values()).some(
            (factory) => factory.getCuit() === cuit && factory.getId() !== excludeId,
        );
    }

    async list(params: FactoryListParams): Promise<FactoryListResult> {
        const { page, limit, categoryId, nameContains, active } = params;

        let items = Array.from(this.factories.values());

        if (categoryId !== undefined) {
            items = items.filter((factory) => factory.getCategoryId() === categoryId);
        }

        if (active !== undefined) {
            items = items.filter((factory) => factory.isActive() === active);
        }

        if (nameContains) {
            const needle = nameContains.toLowerCase();
            items = items.filter((factory) => factory.getName().toLowerCase().includes(needle));
        }

        const total = items.length;
        const start = (page - 1) * limit;
        const paged = items.slice(start, start + limit);

        return { items: paged, total };
    }

}