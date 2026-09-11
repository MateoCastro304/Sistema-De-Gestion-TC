import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import prismaConfig from '../prisma.config';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { CustomersModule } from './customers/customers.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { CategoriesModule } from './categories/categories.module';
import { FactoryModule } from './factory/factory.module';

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
    CategoriesModule,
    FactoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
