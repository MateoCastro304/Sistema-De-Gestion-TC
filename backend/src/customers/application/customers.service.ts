import { Injectable, NotFoundException } from '@nestjs/common';
import { Customer } from '../domain/customer';
import { CustomerRepository } from '../domain/customer.repository';
import { CreateCustomerDto } from '../http/dto/create-customer.dto';
import { UpdateCustomerDto } from '../http/dto/update-customer.dto';
import { FactoryRepository } from '../../factory/domain/factory.repository';

@Injectable()
export class CustomersService {
  constructor(
    private readonly customersRepository: CustomerRepository,
    private readonly factoryRepository: FactoryRepository, // ✅ Inyectado correctamente
  ) {}

  // --- CREAR ---
  async create(dto: CreateCustomerDto): Promise<Customer> {
    // 1. Verificar que la fábrica asociada exista en BDD
    const factoryExists = await this.factoryRepository.findById(dto.factoryId);
    if (!factoryExists) {
      throw new NotFoundException(`Factory with ID ${dto.factoryId} not found`);
    }

    // 2. Instanciar el Customer (ya no recibe `id` como parámetro)
    const customer = Customer.create(
      dto.name,
      dto.lastName,
      dto.phone,
      dto.mail,
      dto.factoryId,
    );

    // 3. Persistir (el repositorio asigna el ID autogenerado)
    return await this.customersRepository.save(customer);
  }

  // --- LISTAR TODOS ---
  async findAll(): Promise<Customer[]> {
    return await this.customersRepository.findAll();
  }

  // --- BUSCAR POR ID ---
  async findById(id: number): Promise<Customer> { // ✅ Recibe number
    const customer = await this.customersRepository.findById(id);
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`); // ✅ Corregida la variable y mensaje
    }
    return customer;
  }

  // --- ACTUALIZAR ---
  async update(id: number, dto: UpdateCustomerDto): Promise<Customer> {
    // 1. Buscar si el cliente existe
    const customer = await this.findById(id);

    // 2. Aplicar los cambios sobre la entidad recuperada
    customer.update(
      dto.name ?? customer.getName(),
      dto.lastName ?? customer.getLastName(),
      dto.phone ?? customer.getPhone(),
      dto.mail ?? customer.getMail(),
      dto.factoryId ?? customer.getFactoryId(),
    );

    // 3. Re-persistir los cambios en el repositorio
    await this.customersRepository.update(customer);

    return customer;
  }
}