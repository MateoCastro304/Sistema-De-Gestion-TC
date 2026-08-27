import { Injectable, NotFoundException } from "@nestjs/common";
import { FactoryRepository } from "../domain/factory.repository";
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

}