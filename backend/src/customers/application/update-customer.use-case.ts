import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Customer } from '../domain/customer';
import { CustomerRepository } from '../domain/port/customer.repository';
import { CustomerAlreadyExists } from '../domain/errors/customer-already-exists.error';
import { Mail } from '../../shared/domain/mail';

export type UpdateCustomerInput = {
  firstName?: string;
  lastName?: string | null;
  phone?: string | null;
  mail?: string | null;
};

@Injectable()
export class UpdateCustomer {
  constructor(private readonly customersRepository: CustomerRepository) {}

  async execute(factoryId: number, id: number, input: UpdateCustomerInput): Promise<Customer> {
    if (Object.values(input).every((value) => value === undefined)) {
      throw new BadRequestException('At least one field must be provided');
    }

    const customer = await this.customersRepository.findById(factoryId, id);
    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found in factory ${factoryId}`);
    }

    if (input.mail) {
      const normalizedMail = Mail.create(input.mail).getValue();
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
      input.firstName ?? customer.getName(),
      input.lastName === undefined ? customer.getLastName() : input.lastName,
      input.phone === undefined ? customer.getPhone() : input.phone,
      input.mail === undefined ? customer.getMail() : input.mail,
      customer.getFactoryId(),
    );

    await this.customersRepository.update(customer);

    return customer;
  }
}
