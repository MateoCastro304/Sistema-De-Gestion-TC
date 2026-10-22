import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Manager } from '../../domain/entities/manager';
import { ManagerRepository } from '../../domain/ports/manager.repository';
import { FactoryRepository } from '../../domain/ports/factory.repository';
import { ManagerAlreadyExists } from '../../domain/errors/manager-already-exists.error';

export type CreateManagerInput = {
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
  mail?: string | null;
};

@Injectable()
export class CreateManager {
  constructor(
    private readonly managersRepository: ManagerRepository,
    private readonly factoryRepository: FactoryRepository,
  ) {}

  async execute(factoryId: number, input: CreateManagerInput): Promise<Manager> {
    const factory = await this.factoryRepository.findById(factoryId);
    if (!factory) {
      throw new NotFoundException(`Factory with ID ${factoryId} not found`);
    }
    if (!factory.isActive()) {
      throw new ConflictException(`Factory with ID ${factoryId} is inactive`);
    }

    const manager = Manager.create(
      input.firstName,
      input.lastName ?? null,
      input.phone ?? null,
      input.mail ?? null,
      factoryId,
    );

    const mail = manager.getMail();
    if (mail) {
      const mailTaken = await this.managersRepository.existsByMail(mail, factoryId);
      if (mailTaken) {
        throw new ConflictException(new ManagerAlreadyExists(mail).message);
      }
    }

    return await this.managersRepository.save(manager);
  }
}
