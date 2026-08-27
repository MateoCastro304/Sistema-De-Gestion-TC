import { Injectable, NotFoundException } from '@nestjs/common';
import { Customer } from '../domain/customer';
import { CustomerRepository } from '../domain/customer.repository';
import { UpdateCustomerDto } from '../http/dto/update-customer.dto';
import { randomUUID } from 'crypto';
import { CreateCustomerDto } from '../http/dto/create-customer.dto';
import { FactoryRepository } from '../../factory/domain/factory.repository';


@Injectable()
export class CustomersService{
    
    constructor( private readonly customersRepostitory: CustomerRepository){}

    // --- CREAR ---
    async create(dto: CreateCustomerDto): Promise<Customer> {
        const factoryExists = await this.factoryRepository.findById(dto.factoryId);
        
        const customer = Customer.create(
            id,
            dto.name,
            dto.lastName,
            dto.phone,
            dto.mail,
            dto.factoryID,
        );
        await this.customersRepostitory.save(customer);
        return customer
    }

    async finAll(): Promise<Customer[]>{
        return this.customersRepostitory.findAll();
    }

    async findById(id: string): Promise<Customer | null>{
        const customer = await this.customersRepostitory.findById(id)
        if (!Customer){
            throw new NotFoundException(`Factory with ID ${id} not found`);
        }
        return customer
    }

    async update(id: string, dto: Customer): Promise<Customer>{
        
    }

    
}