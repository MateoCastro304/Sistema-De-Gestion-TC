import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { CustomersModule } from './subsystems/customers/infrastructure/customers.module';
import { TechnicalCatalogModule } from './subsystems/technical-catalog/infrastructure/technical-catalog.module';
import { SuppliersModule } from './subsystems/supplier/infrastructure/suppliers.module';
import { EmployeesModule } from './subsystems/employees/infrastructure/employees.module';
import { UsersModule } from './subsystems/users/infrastructure/users.module';

import { validate } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    PrismaModule,
    HealthModule,
    CustomersModule,
    SuppliersModule,
    TechnicalCatalogModule,
    EmployeesModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
