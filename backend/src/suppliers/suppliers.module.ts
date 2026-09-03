import { Module } from '@nestjs/common';
import { SuppliersController } from './http/suppliers.controller';
import { SuppliersService } from './application/suppliers.service';

@Module({
  controllers: [SuppliersController],
  providers: [SuppliersService],
})

export class SuppliersModule {}