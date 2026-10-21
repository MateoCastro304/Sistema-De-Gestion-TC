import { Injectable } from '@nestjs/common';
import { ManagerQuery } from '../../core/domain/ports/manager-query.port';
import { ManagerRepository } from '../../core/domain/ports/manager.repository';

@Injectable()
export class ManagerQueryAdapter implements ManagerQuery {
  constructor(private readonly managerRepository: ManagerRepository) {}

  async hasActiveManagersForFactory(factoryId: number): Promise<boolean> {
    const { total } = await this.managerRepository.list({
      page: 1, // "No necesito que me devuelvas todos los clientes. Solo necesito saber si existe al menos uno."
      limit: 1,
      factoryId,
      active: true,
    });

    return total > 0;
  }
}
