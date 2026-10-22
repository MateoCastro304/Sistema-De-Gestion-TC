import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { CustomersModule } from './subsystems/customers/infrastructure/customers.module';
import { SuppliersModule } from './subsystems/supplier/infrastructure/suppliers.module';

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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
