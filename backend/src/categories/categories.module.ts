import { Module } from '@nestjs/common';
import { CategoriesController } from './http/categories.controller';
import { CategoriesService } from './application/categories.service';
import { CategoriesRepository } from './domain/categories.repository';
import { CategoriesInMemoryRepository } from './infrastructure/categories-in-memory.repository';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService,  { provide: CategoriesRepository, useClass: CategoriesInMemoryRepository },],
  exports: [CategoriesRepository, CategoriesService],
})
export class CategoriesModule {}
