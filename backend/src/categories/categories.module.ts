import { forwardRef, Module } from '@nestjs/common';
import { CategoriesController } from './http/categories.controller';
import { CategoriesRepository } from './domain/ports/categories.repository';
import { CategoriesPrismaRepository } from './infrastructure/categories-prisma.repository';
import { FactoryModule } from '../factory/factory.module';
import { CreateCategory } from './application/create-category.use-case';
import { GetCategoryById } from './application/get-category-by-id.use-case';
import { ListCategories } from './application/list-categories.use-case';
import { UpdateCategory } from './application/update-category.use-case';
import { DeactivateCategory } from './application/deactivate-category.use-case';
import { ActivateCategory } from './application/activate-category.use-case';

@Module({
  imports: [forwardRef(() => FactoryModule)],
  controllers: [CategoriesController],
  providers: [
    CreateCategory,
    GetCategoryById,
    ListCategories,
    UpdateCategory,
    DeactivateCategory,
    ActivateCategory,
    { provide: CategoriesRepository, useClass: CategoriesPrismaRepository },
  ],
  exports: [CategoriesRepository],
})
export class CategoriesModule {}
