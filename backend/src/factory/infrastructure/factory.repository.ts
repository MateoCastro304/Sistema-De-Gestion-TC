import { Injectable, NotFoundException } from "@nestjs/common";
import { FactoryRepository } from "../domain/factory.repository";
import { Factory } from "../domain/factory";

@Injectable()

export class FactoryInMemoryRepository implements FactoryRepository {
    private readonly factories: Map<string, Factory> = new Map();

    async save(factory: Factory): Promise<void> {
        this.factories.set(factory.getId(), factory);
    }

    async findById(id: string): Promise<Factory | null> {
        const factory = this.factories.get(id);
        return factory || null;
    }

    async findAll(): Promise<Factory[]> {
        return Array.from(this.factories.values())
    }

    async update(factory: Factory): Promise<void> {
        if (!this.factories.has(factory.getId())){
            throw new NotFoundException(`Factory with ID ${factory.getId()} not found`);
        }

        this.factories.set(factory.getId(), factory)
    }

}