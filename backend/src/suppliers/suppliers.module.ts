import { Module } from '@nestjs/common';
import { SuppliersController } from './http/suppliers.controller';
import { SuppliersService } from './application/suppliers.service';
import { SuppliersRepository } from './infrastructure/suppliers.repository';

@Module({
  controllers: [SuppliersController],
  providers: [SuppliersService, SuppliersRepository],
})
export class SuppliersModule {}
