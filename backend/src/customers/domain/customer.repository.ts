import { Customer } from "./customer";

// La definimos como abstracta ya que servirá de base para otras clases

export abstract class CustomerRepository{
    abstract findAll(): Promise<Customer[]>
    abstract findById(id: string): Promise<Customer | null>
    abstract save(customer: Customer): Promise<void>
    abstract delete(id: string): Promise<void>
    abstract update(customer: Customer): Promise<void>
}