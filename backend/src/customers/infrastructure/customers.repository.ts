import { Injectable } from "@nestjs/common";
import { Customer } from "../domain/customer";
import { CustomerRepository } from "../domain/customer.repository";
import { Prisma } from "@prisma/client/extension";

@Injectable()
export class PrismaCustomerRepository implements CustomerRepository {
    constructor(
        private
    )
}