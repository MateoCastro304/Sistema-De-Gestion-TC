import { Module } from '@nestjs/common';
import { FactoriesService } from './application/factory.service';
import { FactoryController } from './http/factory.controller';
import { FactoryRepository } from './domain/factory.repository';
import { FactoryInMemoryRepository } from './infrastructure/factory.repository';

@Module({
    controllers: [FactoryController],
    providers: [
        FactoriesService,
        { provide: FactoryRepository, useClass: FactoryInMemoryRepository },
    ],
})
export class FactoryModule{}