import { Injectable } from '@nestjs/common';
import { Supplier } from '../domain/supplier';
import { SuppliersRepository } from '../infrastructure/suppliers.repository';
import { CreateSupplierDto } from '../http/dto/create-supplier.dto';
import { UpdateSupplierDto } from '../http/dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly suppliersRepository: SuppliersRepository) {}

  create(dto: CreateSupplierDto): Promise<Supplier> {
    const supplier = new Supplier('temp-id', dto.name);
    return this.suppliersRepository.save(supplier);
  }

  findAll(): Promise<Supplier[]> {
    return this.suppliersRepository.findAll();
  }

  findOne(id: string): Promise<Supplier | null> {
    return this.suppliersRepository.findById(id);
  }

  async update(id: string, dto: UpdateSupplierDto): Promise<Supplier | null> {
    const supplier = await this.suppliersRepository.findById(id);
    if (!supplier) return null;
    if (dto.name) supplier.rename(dto.name);
    return this.suppliersRepository.save(supplier);
  }

  remove(id: string): Promise<void> {
    return this.suppliersRepository.delete(id);
  }
}
