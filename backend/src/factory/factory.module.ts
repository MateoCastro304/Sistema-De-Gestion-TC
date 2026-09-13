import { Module } from '@nestjs/common';
import { FactoriesService } from './application/factory.service';
import { FactoryController } from './http/factory.controller';
import { FactoryInMemoryRepository } from './infrastructure/factory.repository';
import { FactoryRepository } from './domain/factory.repository';
import { CategoriesModule } from '../categories/categories.module';

@Module({
    imports: [CategoriesModule],
    controllers: [FactoryController],
    providers: [
    FactoriesService,
    {
      provide: FactoryRepository,
      useClass: FactoryInMemoryRepository,
    },
  ],
  exports: [FactoriesService, FactoryRepository],
})
export class FactoryModule{}