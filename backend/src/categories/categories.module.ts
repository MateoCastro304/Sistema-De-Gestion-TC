import { Module } from '@nestjs/common';
import { CategoriesController } from './http/categories.controller';
import { CategoriesService } from './application/categories.service';
import { CategoriesRepository } from './infrastructure/categories.repository';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoriesRepository],
})
export class CategoriesModule {}
