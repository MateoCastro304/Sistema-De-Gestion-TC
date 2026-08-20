import { Injectable } from "@nestjs/common";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";
import { SuppliersRepository } from "./suppliers.repository";

@Injectable()
export class SuppliersService {
  constructor(private readonly suppliersRepository: SuppliersRepository) {}

  create(createSupplierDto: CreateSupplierDto) {
    // TODO: this.suppliersRepository.create(createSupplierDto)
    return "This action adds a new supplier";
  }

  findAll() {
    // TODO: this.suppliersRepository.findAll()
    return "This action returns all suppliers";
  }

  findOne(id: number) {
    return `This action returns a #${id} supplier`;
  }

  update(id: number, updateSupplierDto: UpdateSupplierDto) {
    return `This action updates a #${id} supplier`;
  }

  remove(id: number) {
    return `This action removes a #${id} supplier`;
  }
}
