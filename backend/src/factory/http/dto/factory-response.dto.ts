import { Factory } from "../../domain/factory";

export class FactoryResponseDto{
    id!: number;
    cuit!: string;
    name!: string;
    address!: string;
    paymentDescription!: string | null;
    categoryId!: number;
    active!: boolean;

    private constructor(
        id: number,
        cuit: string,
        name: string,
        address: string,
        paymentDescription: string | null,
        categoryId: number,
        active: boolean,
    ) {
        this.id = id;
        this.cuit = cuit;
        this.name = name;
        this.address = address;
        this.paymentDescription = paymentDescription;
        this.categoryId = categoryId;
        this.active = active;
    }

    static fromDomain(factory: Factory): FactoryResponseDto {
        return new FactoryResponseDto
    }
}