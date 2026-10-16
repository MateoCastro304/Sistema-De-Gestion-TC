import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Manager } from '../../domain/entities/manager';
import { ManagerRepository } from '../../domain/ports/manager.repository';
import { ManagerAlreadyExists } from '../../domain/errors/manager-already-exists.error';
import { Mail } from '../../../../../shared/domain/mail';

export type UpdateManagerInput = {
  firstName?: string;
  lastName?: string | null;
  phone?: string | null;
  mail?: string | null;
};

@Injectable()
export class UpdateManager {
  constructor(private readonly managersRepository: ManagerRepository) {}

  async execute(factoryId: number, id: number, input: UpdateManagerInput): Promise<Manager> {
    if (Object.values(input).every((value) => value === undefined)) {
      throw new BadRequestException('At least one field must be provided');
    }

    const manager = await this.managersRepository.findById(factoryId, id);
    if (!manager) {
      throw new NotFoundException(`Manager ${id} not found in factory ${factoryId}`);
    }

    if (input.mail) {
      const normalizedMail = Mail.create(input.mail).getValue();
      const mailTaken = await this.managersRepository.existsByMail(
        normalizedMail,
        factoryId,
        manager.getId() ?? undefined,
      );
      if (mailTaken) {
        throw new ConflictException(new ManagerAlreadyExists(normalizedMail).message);
      }
    }

    // La fábrica no se puede cambiar: forma parte de la clave primaria.
    manager.update(
      input.firstName ?? manager.getName(),
      input.lastName === undefined ? manager.getLastName() : input.lastName,
      input.phone === undefined ? manager.getPhone() : input.phone,
      input.mail === undefined ? manager.getMail() : input.mail,
      manager.getFactoryId(),
    );

    await this.managersRepository.update(manager);

    return manager;
  }
}
