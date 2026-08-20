import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import storageConfig from './config/storage.config';
import { validate } from './config/env.validation';
import { CustomersModule } from './modules/customers/customers.module';
import { SuppliersModule } from './modules/catalogs/suppliers/suppliers.module';
import { CategoriesModule } from './modules/catalogs/categories/categories.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      load: [databaseConfig, jwtConfig, storageConfig],
    }),
    CustomersModule,
    SuppliersModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}