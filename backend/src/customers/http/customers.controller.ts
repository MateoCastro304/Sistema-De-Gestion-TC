import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  ParseBoolPipe,
  UsePipes,
  ValidationPipe,
  UseFilters,
  BadRequestException,
  Query,
  DefaultValuePipe,
} from "@nestjs/common";

import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { CustomersService } from "../application/customers.service";
import { CustomerResponseDto } from "./dto/customer-response.dto";
import { CustomerExceptionFilter } from "./filters/customers-exception.filter";
import { ValidationError } from 'class-validator';

function customerValidationExceptionFactory(errors: ValidationError[]) {
  const details = errors.map((error) => ({
    field: error.property,
    message: Object.values(error.constraints ?? {})[0] ?? 'Invalid value.',
  }));
  return new BadRequestException({ message: 'Invalid request data.', details });
}

@Controller()
@UseFilters(CustomerExceptionFilter)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    exceptionFactory: customerValidationExceptionFactory,
  }),
)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

    @Get('customers')
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('factoryId', new ParseIntPipe({ optional: true })) factoryId?: number,
    @Query('nameContains') nameContains?: string,
    @Query('active', new ParseBoolPipe({ optional: true })) active?: boolean,
  ) {
    const { items, total } = await this.customersService.list({
      page,
      limit,
      factoryId,
      nameContains,
      active,
    });
    return {
      items: items.map((customer) => CustomerResponseDto.fromDomain(customer)),
      total,
      page,
      limit,
    };
  }


  @Get('fabricas/:factoryId/customers/:id')
  async findById(
    @Param('factoryId', ParseIntPipe) factoryId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const customer = await this.customersService.findById(factoryId, id);
    return CustomerResponseDto.fromDomain(customer);
  }

  @Post('fabricas/:factoryId/customers')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('factoryId', ParseIntPipe) factoryId: number,
    @Body() createDto: CreateCustomerDto,
  ) {
    const customer = await this.customersService.create(factoryId, createDto);
    return CustomerResponseDto.fromDomain(customer);
  }

  @Patch('fabricas/:factoryId/customers/:id')
  async update(
    @Param('factoryId', ParseIntPipe) factoryId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCustomerDto,
  ) {
    const customer = await this.customersService.update(factoryId, id, updateDto);
    return CustomerResponseDto.fromDomain(customer);
  }

  @Patch('fabricas/:factoryId/customers/:id/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(
    @Param('factoryId', ParseIntPipe) factoryId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.customersService.deactivate(factoryId, id);
  }

  @Patch('fabricas/:factoryId/customers/:id/activate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async activate(
    @Param('factoryId', ParseIntPipe) factoryId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.customersService.activate(factoryId, id);
  }
}

