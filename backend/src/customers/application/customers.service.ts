import { Injectable } from '@nestjs/common';
import { Customer } from '../domain/customer';
import { CustomersRepository } from '../infrastructure/customers.repository';
import { CreateCustomerDto } from '../http/dto/create-customer.dto';
import { UpdateCustomerDto } from '../http/dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly customersRepository: CustomersRepository) {}

  create(dto: CreateCustomerDto): Promise<Customer> {
    // TODO: generar un id real (uuid o el que asigne la DB) cuando conectemos Prisma
    const customer = new Customer('temp-id', dto.name);
    return this.customersRepository.save(customer);
  }

  findAll(): Promise<Customer[]> {
    return this.customersRepository.findAll();
  }

  findOne(id: string): Promise<Customer | null> {
    return this.customersRepository.findById(id);
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer | null> {
    const customer = await this.customersRepository.findById(id);
    if (!customer) return null;
    if (dto.name) customer.rename(dto.name);
    return this.customersRepository.save(customer);
  }

  remove(id: string): Promise<void> {
    return this.customersRepository.delete(id);
  }
}
