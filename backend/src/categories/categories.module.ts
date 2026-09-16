import { forwardRef, Module } from '@nestjs/common';
import { CategoriesController } from './http/categories.controller';
import { CategoriesService } from './application/categories.service';
import { CategoriesRepository } from './domain/ports/categories.repository';
import { CategoriesInMemoryRepository } from './infrastructure/categories-in-memory.repository';
import { FactoryModule } from '../factory/factory.module';

@Module({
  imports: [forwardRef(() => FactoryModule)],
  controllers: [CategoriesController],
  providers: [CategoriesService,  { provide: CategoriesRepository, useClass: CategoriesInMemoryRepository },],
  exports: [CategoriesRepository, CategoriesService],
})
export class CategoriesModule {}
