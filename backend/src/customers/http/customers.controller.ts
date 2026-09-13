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
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { CustomersService } from "../application/customers.service";

@Controller('customers')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class CustomersController{
        constructor(
            private readonly customersService: CustomersService
        ){}


    @Get()
        async findAll(){
            return await this.customersService.findAll()
        }

    @Get(":id")
        async findById(@Param('id', ParseIntPipe) id: number){
            return await this.customersService.findById(id);
        }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createDto: CreateCustomerDto){
        return await this.customersService.create(createDto)
    }

    @Patch(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateCustomerDto,
    ){
        return await this.customersService.update(id, updateDto)
    }

    @Patch(':id/deactivate')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deactivate(@Param('id', ParseIntPipe) id: number) {
        await this.customersService.deactivate(id);
        }

    @Patch(':id/activate')
        @HttpCode(HttpStatus.NO_CONTENT)
        async activate(@Param('id', ParseIntPipe) id: number) {
            await this.customersService.activate(id);
        }


}
