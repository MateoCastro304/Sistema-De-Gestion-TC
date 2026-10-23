import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infrastructure/prisma/prisma.service';
import { ProcessType } from '../../../core/domain/entities/process-type.entity';
import { ProcessTypeNameTaken } from '../../../core/domain/errors/process-type-name-taken.error';
import { ProcessTypeRepository } from '../../../core/domain/ports/process-type.repository';
import { ProcessTypePrismaMapper } from './process-type-prisma.mapper';

@Injectable()
export class PrismaProcessTypeRepository extends ProcessTypeRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async existsByNameKey(nameKey: string): Promise<boolean> {
    return (await this.prisma.processType.count({ where: { nameKey } })) > 0;
  }

  async save(processType: ProcessType): Promise<ProcessType> {
    try {
      // createdAt y updatedAt salen del mismo instante: en el alta son iguales.
      const row = await this.prisma.processType.create({
        data: ProcessTypePrismaMapper.toCreateData(processType, new Date()),
      });
      return ProcessTypePrismaMapper.toDomain(row);
    } catch (error) {
      // Dos altas simultáneas con el mismo nombre: gana la restricción UNIQUE (name_key).
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ProcessTypeNameTaken();
      }
      throw error;
    }
  }
}
