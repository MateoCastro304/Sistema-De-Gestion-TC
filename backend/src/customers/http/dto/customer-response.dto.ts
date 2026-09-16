import { Customer } from '../../domain/customer';

export class CustomerResponseDto {
    id: number;
    name: string;
    lastName: string;
    phone: string;
    mail: string;
    factoryId: number;
    active: boolean;

    private constructor(
        id: number,
        name: string,
        lastName: string,
        phone: string,
        mail: string,
        factoryId: number,
        active: boolean,
    ) {
        this.id = id;
        this.name = name;
        this.lastName = lastName;
        this.phone = phone;
        this.mail = mail;
        this.factoryId = factoryId;
        this.active = active;
    }

    static fromDomain(customer: Customer): CustomerResponseDto {
        return new CustomerResponseDto(
            customer.getId() as number,
            customer.getName(),
            customer.getLastName(),
            customer.getPhone(),
            customer.getMail(),
            customer.getFactoryId(),
            customer.isActive(),
        );
    }
}
