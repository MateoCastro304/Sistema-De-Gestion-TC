import { Factory } from './factory';

export abstract class FactoryRepository {
  abstract save(factory: Factory): Promise<void>;
  abstract findById(id: string): Promise<Factory | null>;
  abstract findAll(): Promise<Factory[]>;
  abstract update(factory: Factory): Promise<void>;
}