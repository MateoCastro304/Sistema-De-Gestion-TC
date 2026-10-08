import { Injectable, NotFoundException } from "@nestjs/common";
import { Customer } from "../domain/customer";
import { CustomerRepository, CustomerListParams, CustomerListResult } from "../domain/port/customer.repository";

@Injectable()
export class CustomerInMemoryRepository implements CustomerRepository {
  private readonly customers: Map<string, Customer> = new Map();
  private readonly lastIdByFactory: Map<number, number> = new Map();

  private key(factoryId: number, id: number): string {
    return `${factoryId}:${id}`;
  }

  async save(customer: Customer): Promise<Customer> {
    const factoryId = customer.getFactoryId();
    const generatedId = (this.lastIdByFactory.get(factoryId) ?? 0) + 1;
    this.lastIdByFactory.set(factoryId, generatedId);

    const savedCustomer = Customer.reconstruct(
      generatedId,
      customer.getName(),
      customer.getLastName(),
      customer.getPhone(),
      customer.getMail(),
      factoryId,
      customer.isActive(),
      customer.getCreatedAt(),
      customer.getUpdatedAt(),
    );

    this.customers.set(this.key(factoryId, generatedId), savedCustomer);
    return savedCustomer;
  }

  async findById(factoryId: number, id: number): Promise<Customer | null> {
    return this.customers.get(this.key(factoryId, id)) ?? null;
  }

  async findAll(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async update(customer: Customer): Promise<void> {
    const id = customer.getId();
    const factoryId = customer.getFactoryId();

    if (!id || !this.customers.has(this.key(factoryId, id))) {
      throw new NotFoundException(`Customer ${id} not found in factory ${factoryId}`);
    }

    this.customers.set(this.key(factoryId, id), customer);
  }

  async existsByMail(mail: string, factoryId: number, excludeId?: number): Promise<boolean> {
    return Array.from(this.customers.values()).some(
      (customer) =>
        customer.isActive() &&
        customer.getFactoryId() === factoryId &&
        customer.getMail() === mail &&
        customer.getId() !== excludeId,
    );
  }

  async list(params: CustomerListParams): Promise<CustomerListResult> {
    const { page, limit, factoryId, nameContains, active } = params;

    let items = Array.from(this.customers.values());

    if (factoryId !== undefined) {
      items = items.filter((customer) => customer.getFactoryId() === factoryId);
    }

    if (active !== undefined) {
      items = items.filter((customer) => customer.isActive() === active);
    }

    if (nameContains) {
      const needle = nameContains.toLowerCase();
      items = items.filter(
        (customer) =>
          customer.getName().toLowerCase().includes(needle) ||
          (customer.getLastName() ?? '').toLowerCase().includes(needle),
      );
    }

    const total = items.length;
    const start = (page - 1) * limit;
    const paged = items.slice(start, start + limit);

    return { items: paged, total };
  }
}
