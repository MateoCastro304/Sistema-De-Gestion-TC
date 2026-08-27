import { Injectable } from '@nestjs/common';
import { Customer } from '../domain/customer';
import { CustomerRepository } from '../domain/customer.repository';
import { UpdateCustomerDto } from '../http/dto/update-customer.dto';
import { randomUUID } from 'crypto';
import { CreateCustomerDto } from '../http/dto/create-customer.dto';


@Injectable()
export class CustomersService{
    
    constructor( private readonly customersRepostitory: CustomerRepository){}

    // --- CREAR ---
    async create(dto: CreateCustomerDto): Promise<Customer> {
        const id = randomUUID();
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

    async fin

    
}