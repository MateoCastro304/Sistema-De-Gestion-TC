import { Injectable, NotFoundException } from "@nestjs/common";
import { Customer } from "../domain/customer";
import { CustomerRepository } from "../domain/customer.repository";

@Injectable()

export class CustomerInMemoryRepository implements CustomerRepository {
    // Creo un mapeo de los Clientes
    private readonly customers: Map<number, Customer> = new Map();

    private autoIncrementId = 1;

    async save(customer: Customer): Promise<Customer> {
        const generatedId = this.autoIncrementId++;
        const savedCustomer = Customer.reconstruct(
        generatedId,
        customer.getName(),
        customer.getLastName(),
        customer.getPhone(),
        customer.getMail(),
        customer.getFactoryId(),
        customer.isActive(),
      );

      this.customers.set(generatedId, savedCustomer);
      return savedCustomer;
    }

    async findById(id: number): Promise<Customer | null> {
        const customer = this.customers.get(id);
        return customer || null;
    }

    async findAll(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async update(customer: Customer): Promise<void> {
  const id = customer.getId();

  if (!id || !this.customers.has(id)) {
    throw new NotFoundException(`Customer with ID ${id} not found`);
  }

  this.customers.set(id, customer);
}

}