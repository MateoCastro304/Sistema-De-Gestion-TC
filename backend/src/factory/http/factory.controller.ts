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
} from '@nestjs/common';
import { FactoriesService } from '../application/factory.service';
import { CreateFactoryDto } from './dto/create-factory.dto';
import { UpdateFactoryDto } from './dto/update-factory.dto';

@Controller('fabricas')
export class FactoryController {
  constructor(private readonly factoriesService: FactoriesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateFactoryDto) {
    return await this.factoriesService.create(createDto);
  }

  @Get()
  async findAll() {
    return await this.factoriesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.factoriesService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateFactoryDto,
  ) {
    return await this.factoriesService.update(id, updateDto);
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Param('id', ParseIntPipe) id: number) {
    await this.factoriesService.deactivate(id);
  }

  @Patch(':id/activate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async activate(@Param('id', ParseIntPipe) id: number) {
    await this.factoriesService.activate(id);
  }
}