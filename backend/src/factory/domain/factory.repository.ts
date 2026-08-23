import { Factory } from "./factory";

export interface FactoryRepository {
  create(factory: Factory): Promise<Factory>;
  findById(id: string): Promise<Factory | null>;
  findAll(): Promise<Factory[]>;
  update(id: string, factory: Factory): Promise<Factory | null>;
  delete(id: string): Promise<boolean>;
}