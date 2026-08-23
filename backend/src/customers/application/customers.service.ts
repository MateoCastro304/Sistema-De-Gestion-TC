import { Injectable } from '@nestjs/common';
import { Customer } from '../domain/customer';

@Injectable()
export class CustomersService{
    
    constructor(
        private readonly customers: Customer[] = []
    ){}


    
}