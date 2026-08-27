import { Module } from '@nestjs/common';
import { FactoryService } from '';
import { FactoryController } from '';
import { FactoryInMemoryRepository } from './infrastructure/factory.repository';

@Module({
    controllers: [FactoryController],
    providers: [FactoryService, FactoryInMemoryRepository],
})
export class CustomersModule{}