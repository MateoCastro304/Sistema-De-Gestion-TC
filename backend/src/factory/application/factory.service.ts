import { Injectable, NotFoundException } from "@nestjs/common";
import { Factory } from "../domain/factory";
import { FactoryRepository } from "../domain/factory.repository";
import { CreateFactoryDto } from "../http/dto/create-factory.dto";
import { randomUUID } from "crypto";
import { UpdateFactoryDto } from "../http/dto/update-factory.dto";

@Injectable()
export class FactoriesService{

    constructor(private readonly factoryRepository: FactoryRepository){}

// -- CREAR --
// Necesito: 1. Recibir datos 2. Crear una Factory 3. Pedir que persista
    async create(dto: CreateFactoryDto): Promise<Factory> {
        const id = randomUUID();
        const factory = Factory.create(
            id,
            dto.name,
            dto.cuit,
            dto.address,
            dto.paymentDescription ?? null,
            dto.categoryId,

        );
        await this.factoryRepository.save(factory);
        return factory; 
    }


// -- CONSULTAR ( todas o una ) --
    async findAll(): Promise<Factory[]> {
        return this.factoryRepository.findAll();
    }


    async findById(id: string): Promise<Factory | null>{
        const factory = await this.factoryRepository.findById(id);
        if (!factory){
            throw new NotFoundException(`Factory with ID ${id} not found`);
        }
        return factory
    }


// -- MODIFICAR --

    async update(id: string, dto: UpdateFactoryDto): Promise<Factory>{
        const factory = await this.findById(id);
        if (!factory){
            throw new NotFoundException(`Factory with ID ${id} not found`);
        }

        factory.update(
            dto.cuit ?? factory.getCuit(),
            dto.name ?? factory.getName(),
            dto.address ?? factory.getAddress(),
            dto.paymentDescription !== undefined ? dto.paymentDescription : factory.getPaymentDescription(),
            dto.categoryId ?? factory.getCategoryId(),
        );

        await this.factoryRepository.update(factory);
        return factory;
    }

// -- ELIMINAR --
// Necesito: 1. Buscarla 2. Comprobar que exista 3. Pedirle al dominio que se desactive 4. Persistir el cambio




}