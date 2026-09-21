import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Customer } from '../domain/customer';
import { CustomerRepository, CustomerListParams, CustomerListResult } from '../domain/port/customer.repository';
import { CreateCustomerDto } from '../http/dto/create-customer.dto';
import { UpdateCustomerDto } from '../http/dto/update-customer.dto';
import { FactoryRepository } from '../../factory/domain/port/factory.repository';
import { CustomerAlreadyExists } from '../domain/errors/customer-already-exists.error';
import { Mail } from '../../shared/domain/mail';

@Injectable()
export class CustomersService {
  constructor(
    private readonly customersRepository: CustomerRepository,
    private readonly factoryRepository: FactoryRepository,
  ) {}

  // --- CREAR ---
  async create(factoryId: number, dto: CreateCustomerDto): Promise<Customer> {
    const factory = await this.factoryRepository.findById(factoryId);
    if (!factory) {
      throw new NotFoundException(`Factory with ID ${factoryId} not found`);
    }
    if (!factory.isActive()) {
      throw new ConflictException(`Factory with ID ${factoryId} is inactive`);
    }

    const customer = Customer.create(dto.name, dto.lastName, dto.phone, dto.mail, factoryId);

    const mailTaken = await this.customersRepository.existsByMail(customer.getMail(), factoryId);
    if (mailTaken) {
      throw new ConflictException(new CustomerAlreadyExists(customer.getMail()).message);
    }

    return await this.customersRepository.save(customer);
  }

  // --- LISTAR TODOS ---
  async findAll(): Promise<Customer[]> {
    return await this.customersRepository.findAll();
  }

  // --- LISTADO PAGINADO ---
  async list(params: CustomerListParams): Promise<CustomerListResult> {
    if (params.page < 1 || params.limit < 1) {
      throw new BadRequestException('page and limit must be positive integers');
    }
    return await this.customersRepository.list(params);
  }

  // --- BUSCAR POR (FÁBRICA, ID) ---
  async findById(factoryId: number, id: number): Promise<Customer> {
    const customer = await this.customersRepository.findById(factoryId, id);
    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found in factory ${factoryId}`);
    }
    return customer;
  }

  // --- ACTUALIZAR ---
  async update(factoryId: number, id: number, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findById(factoryId, id);

    if (dto.mail !== undefined) {
      const normalizedMail = Mail.create(dto.mail).getValue();
      const mailTaken = await this.customersRepository.existsByMail(
        normalizedMail,
        factoryId,
        customer.getId() ?? undefined,
      );
      if (mailTaken) {
        throw new ConflictException(new CustomerAlreadyExists(normalizedMail).message);
      }
    }

    // La fábrica no se puede cambiar: forma parte de la clave primaria.
    customer.update(
      dto.name ?? customer.getName(),
      dto.lastName ?? customer.getLastName(),
      dto.phone ?? customer.getPhone(),
      dto.mail ?? customer.getMail(),
      customer.getFactoryId(),
    );

    await this.customersRepository.update(customer);

    return customer;
  }

  // --- DESACTIVAR (BAJA LÓGICA) ---
  async deactivate(factoryId: number, id: number): Promise<void> {
    const customer = await this.findById(factoryId, id);
    customer.deactivate();
    await this.customersRepository.update(customer);
  }

  // --- ACTIVAR ---
  async activate(factoryId: number, id: number): Promise<void> {
    const customer = await this.findById(factoryId, id);
    customer.activate();
    await this.customersRepository.update(customer);
  }
}
