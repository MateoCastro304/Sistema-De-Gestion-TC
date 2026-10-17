import { Module } from '@nestjs/common';
import { CreateUser } from '../core/application/use-cases/create-user.use-case';
import { GetUserById } from '../core/application/use-cases/get-user-by-id.use-case';
import { ListUsers } from '../core/application/use-cases/list-users.use-case';
import { UsersRepository } from '../core/domain/ports/users.repository';
import { PasswordHasher } from '../core/domain/ports/password-hasher.port';
import { UsersController } from './http/controllers/users.controller';
import { InMemoryUsersRepository } from './persistence/in-memory/in-memory-users.repository';
import { BcryptPasswordHasher } from './bcrypt-password-hasher';

/**
 * EmployeeQuery NO se provee acá: no existe ningún adaptador real todavía
 * (employees no existe como subsystem). Hasta que algún módulo lo
 * registre y UsersModule lo importe, Nest no puede resolver CreateUser ni
 * UsersController — es el estado esperado, no un bug. Mismo camino que
 * categories/factory al principio (FactoryQuery). Por el mismo motivo,
 * este módulo todavía no está registrado en AppModule.
 */
@Module({
  controllers: [UsersController],
  providers: [
    CreateUser,
    GetUserById,
    ListUsers,
    { provide: UsersRepository, useClass: InMemoryUsersRepository },
    { provide: PasswordHasher, useClass: BcryptPasswordHasher },
  ],
})
export class UsersModule {}
