import { Factory } from './factory';

export abstract class FactoryRepository {
  abstract save(factory: Factory): Promise<Factory>;
  abstract findById(id: number): Promise<Factory | null>;
  abstract findAll(): Promise<Factory[]>;
  abstract update(factory: Factory): Promise<void>;
}
