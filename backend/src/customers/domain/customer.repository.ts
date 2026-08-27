import { Customer } from "./customer";

// La definimos como abstracta ya que servirá de base para otras clases

export abstract class CustomerRepository{
    abstract findAll(): Promise<Customer[]>
    abstract findById(id: number): Promise<Customer | null>
    abstract save(customer: Customer): Promise<Customer>
    abstract update(customer: Customer): Promise<void>
}