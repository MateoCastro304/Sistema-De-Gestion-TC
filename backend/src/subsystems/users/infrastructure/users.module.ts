import { Module } from '@nestjs/common';
import { CreateUser } from '../core/application/use-cases/create-user.use-case';
import { GetUserById } from '../core/application/use-cases/get-user-by-id.use-case';
import { ListUsers } from '../core/application/use-cases/list-users.use-case';
import { UsersRepository } from '../core/domain/ports/users.repository';
import { PasswordHasher } from '../core/domain/ports/password-hasher.port';
import { EmployeeQuery } from '../core/domain/ports/employee-query.port';
import { UsersController } from './http/controllers/users.controller';
import { UsersPrismaRepository } from './persistence/prisma/users-prisma.repository';
import { BcryptPasswordHasher } from './bcrypt-password-hasher';
import { EmployeeQueryAdapter } from './employee-query.adapter';
import { EmployeesModule } from '../../employees/infrastructure/employees.module';

@Module({
  imports: [EmployeesModule],
  controllers: [UsersController],
  providers: [
    CreateUser,
    GetUserById,
    ListUsers,
    { provide: UsersRepository, useClass: UsersPrismaRepository },
    { provide: PasswordHasher, useClass: BcryptPasswordHasher },
    { provide: EmployeeQuery, useClass: EmployeeQueryAdapter },
  ],
})
export class UsersModule {}
