import { Module } from '@nestjs/common';
import { CustomersController } from './http/customers.controller';
import { CustomersService } from './application/customers.service';
import { CustomersRepository } from './infrastructure/customers.repository';

@Module({
  controllers: [CustomersController],
  providers: [CustomersService, CustomersRepository],
})
export class CustomersModule {}
