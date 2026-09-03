import { Injectable } from '@nestjs/common';
@Injectable()
export class SuppliersService {

    suppliers: object[] = [ 
        {
                id: 1,
                name: 'Supplier 1',
                contact: 'John Doe',
                email: 'john.doe@example.com'
            },
            {
                id: 2,
                name: 'Supplier 2',
                contact: 'Jane Smith',
                email: 'jane.smith@example.com'
            }

    ]

    getSuppliers() {
        return this.suppliers;
    }
}