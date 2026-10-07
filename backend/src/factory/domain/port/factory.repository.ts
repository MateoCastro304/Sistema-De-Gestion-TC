// Define QUÉ operaciones puede hacer el sistema con las fábricas, pero no define CÓMO se hacen.
import { Factory } from '../factory';


export type FactoryListParams = {
  page: number;
  limit: number;
  categoryId?: number;
  // Case-insensitive partial match on name.
  nameContains?: string;
  active?: boolean;
};

export type FactoryListResult = {
  items: Factory[]; // Factories encontradas
  total: number; // cuantas
};


export abstract class FactoryRepository {
  abstract save(factory: Factory): Promise<Factory>;
  abstract findById(id: number): Promise<Factory | null>;
  abstract findAll(): Promise<Factory[]>;
  abstract update(factory: Factory): Promise<void>;

  /*
   Whether any factory already uses this cuit. excludeId lets the update
   flow skip the record being modified so it does not clash with itself.
  */
  abstract existsByCuit(cuit: string, excludeId?: number): Promise<boolean>;


  abstract list(params: FactoryListParams): Promise<FactoryListResult>;
}
