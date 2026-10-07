import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Customer } from '../domain/customer';
import { CustomerRepository } from '../domain/port/customer.repository';
import { UpdateCustomerDto } from '../http/dto/update-customer.dto';
import { CustomerAlreadyExists } from '../domain/errors/customer-already-exists.error';
import { Mail } from '../../shared/domain/mail';

@Injectable()
export class UpdateCustomer {
  constructor(private readonly customersRepository: CustomerRepository) {}

  async execute(factoryId: number, id: number, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.customersRepository.findById(factoryId, id);
    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found in factory ${factoryId}`);
    }

    if (dto.mail) {
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
      dto.firstName ?? customer.getName(),
      dto.lastName === undefined ? customer.getLastName() : dto.lastName,
      dto.phone === undefined ? customer.getPhone() : dto.phone,
      dto.mail === undefined ? customer.getMail() : dto.mail,
      customer.getFactoryId(),
    );

    await this.customersRepository.update(customer);

    return customer;
  }
}
