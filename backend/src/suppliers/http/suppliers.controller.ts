import { Controller, Get } from '@nestjs/common';
import { SuppliersService } from '../application/suppliers.service';


@Controller()
export class SuppliersController {
    constructor(private suppliersService: SuppliersService) {}

    @Get('/')
    getAllProviders() {
        return this.suppliersService.getSuppliers();
    }

}

