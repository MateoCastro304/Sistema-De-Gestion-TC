import { Module } from '@nestjs/common';
import { FactoriesService } from './application/factory.service';
import { FactoryController } from './http/factory.controller';
import { FactoryInMemoryRepository } from './infrastructure/factory.repository';

@Module({
    controllers: [FactoryController],
    providers: [FactoriesService, FactoryInMemoryRepository],
})
export class FactoryModule{}