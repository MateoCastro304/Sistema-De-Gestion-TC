import { Controller, Get, Post, Body, Param, Patch, HttpCode, HttpStatus } from "@nestjs/common";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { CustomersService } from "../application/customers.service";

@Controller('customers')
export class CustomersController{
        constructor(
            private readonly customersService: CustomersService
        ){}
    

    @Get()
        async findAll(){
            return await this.customersService.findAll()
        }

    @Get(":id")
        async findById(@Param('id') id: number){
            return await this.customersService.findById(id);
        }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createDto: CreateCustomerDto){
        return await this.customersService.create(createDto)
    } 

    @Patch(':id')
    async update(
        @Param('id') id: number,
        @Body() updateDto: UpdateCustomerDto,
    ){
        return await this.customersService.update(id, updateDto)
    }

    @Patch(':id/deactivate')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deactivate(@Param('id') id: string) {
        await this.customersService.deactivate(Number(id));
        }

    @Patch(':id/activate')
        @HttpCode(HttpStatus.NO_CONTENT)
        async activate(@Param('id') id: string) {
            await this.customersService.activate(Number(id));
        }


}