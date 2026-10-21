import { Module } from '@nestjs/common';

import { CategoriesController } from './http/controllers/categories.controller';
import { ManagersController } from './http/controllers/managers.controller';
import { FactoryController } from './http/controllers/factory.controller';

import { CategoriesRepository } from '../core/domain/ports/categories.repository';
import { ManagerRepository } from '../core/domain/ports/manager.repository';
import { FactoryRepository } from '../core/domain/ports/factory.repository';
import { ManagerQuery } from '../core/domain/ports/manager-query.port';
import { FactoryQuery } from '../core/domain/ports/factory-query.port';

import { CategoriesPrismaRepository } from './persistence/prisma/categories-prisma.repository';
import { ManagerPrismaRepository } from './persistence/prisma/managers-prisma.repository';
import { FactoryPrismaRepository } from './persistence/prisma/factory-prisma.repository';
import { ManagerQueryAdapter } from './adapters/manager-query.adapter';
import { FactoryQueryAdapter } from './adapters/factory-query.adapter';

import { ActivateCategory } from '../core/application/use-cases/activate-category.use-case';
import { CreateCategory } from '../core/application/use-cases/create-category.use-case';
import { GetCategoryById } from '../core/application/use-cases/get-category-by-id.use-case';
import { ListCategories } from '../core/application/use-cases/list-categories.use-case';
import { UpdateCategory } from '../core/application/use-cases/update-category.use-case';
import { DeactivateCategory } from '../core/application/use-cases/deactivate-category.use-case';

import { CreateManager } from '../core/application/use-cases/create-manager.use-case';
import { GetManagerById } from '../core/application/use-cases/get-manager-by-id.use-case';
import { ListManagers } from '../core/application/use-cases/list-managers.use-case';
import { UpdateManager } from '../core/application/use-cases/update-manager.use-case';
import { DeactivateManager } from '../core/application/use-cases/deactivate-manager.use-case';

import { CreateFactory } from '../core/application/use-cases/create-factory.use-case';
import { GetFactoryById } from '../core/application/use-cases/get-factory-by-id.use-case';
import { ListFactories } from '../core/application/use-cases/list-factories.use-case';
import { UpdateFactory } from '../core/application/use-cases/update-factory.use-case';
import { DeactivateFactory } from '../core/application/use-cases/deactivate-factory.use-case';

/**
 * Rubro (Category), Encargado (Manager) y Fábrica (Factory) son un único
 * subsystem: comparten reglas de negocio (RN: una fábrica no se desactiva con
 * encargados activos, un rubro no se desactiva con fábricas activas) y antes
 * vivían en 3 módulos de Nest separados conectados por forwardRef.
 */
@Module({
  controllers: [CategoriesController, ManagersController, FactoryController],
  providers: [
    ActivateCategory,
    CreateCategory,
    GetCategoryById,
    ListCategories,
    UpdateCategory,
    DeactivateCategory,
    CreateManager,
    GetManagerById,
    ListManagers,
    UpdateManager,
    DeactivateManager,
    CreateFactory,
    GetFactoryById,
    ListFactories,
    UpdateFactory,
    DeactivateFactory,
    { provide: CategoriesRepository, useClass: CategoriesPrismaRepository },
    { provide: ManagerRepository, useClass: ManagerPrismaRepository },
    { provide: FactoryRepository, useClass: FactoryPrismaRepository },
    { provide: ManagerQuery, useClass: ManagerQueryAdapter },
    { provide: FactoryQuery, useClass: FactoryQueryAdapter },
  ],
})
export class CustomersModule {}
