import { Injectable, NotFoundException } from "@nestjs/common";
import { Customer } from "../domain/customer";
import { CustomerRepository } from "../domain/customer.repository";

@Injectable()

export class CustomerInMemoryRepository implements CustomerRepository {
    // Creo un mapeo de los Clientes
    private readonly customers: Map<string, Customer> = new Map();

    async save(customer: Customer): Promise<void> {
        this.customers.set(customer.getId(), customer);

    }

    async findById(id: string): Promise<Customer | null> {
        const customer = this.customers.get(id);
        return customer || null;
    }

    async findAll(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async update(customer: Customer): Promise<void> {
    if (!this.customers.has(customer.getId())) {
      throw new NotFoundException(`Customer with ID ${customer.getId()} not found`);
    }
    this.customers.set(customer.getId(), customer);
  }

}