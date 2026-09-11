import { Module } from '@nestjs/common';
import { SuppliersController } from './http/suppliers.controller';

@Module({
  controllers: [SuppliersController],
})
export class SuppliersModule {}
