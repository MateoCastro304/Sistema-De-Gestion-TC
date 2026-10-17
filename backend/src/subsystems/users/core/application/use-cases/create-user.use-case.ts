import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user';
import { Password } from '../../domain/value-objects/password';
import { Role } from '../../domain/value-objects/role';
import { UsersRepository } from '../../domain/ports/users.repository';
import { EmployeeQuery } from '../../domain/ports/employee-query.port';
import { PasswordHasher } from '../../domain/ports/password-hasher.port';
import { EmployeeNotFoundForUser } from '../../domain/errors/employee-not-found-for-user.error';
import { EmployeeInactive } from '../../domain/errors/employee-inactive.error';
import { EmployeeAlreadyHasUser } from '../../domain/errors/employee-already-has-user.error';
import { UsernameAlreadyExists } from '../../domain/errors/username-already-exists.error';

export type CreateUserInput = {
  employeeId: number;
  username: string;
  password: string;
  roles: Role[];
};

@Injectable()
export class CreateUser {
  constructor(
    private readonly repo: UsersRepository,
    private readonly employeeQuery: EmployeeQuery,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: CreateUserInput): Promise<User> {
    const employee = await this.employeeQuery.findEmployee(input.employeeId);
    if (!employee) {
      throw new EmployeeNotFoundForUser(input.employeeId);
    }
    if (!employee.active) {
      throw new EmployeeInactive(input.employeeId);
    }

    // CU-05 Escenario 4: como mucho un usuario por empleado.
    const existingForEmployee = await this.repo.findByEmployeeId(input.employeeId);
    if (existingForEmployee) {
      throw new EmployeeAlreadyHasUser(
        input.employeeId,
        existingForEmployee.getId() as number,
        existingForEmployee.getUsername(),
      );
    }

    // CU-05 Escenario 3: único en todo el sistema, activo o dado de baja.
    const existingByUsername = await this.repo.findByUsername(input.username);
    if (existingByUsername) {
      throw new UsernameAlreadyExists(input.username);
    }

    const password = Password.create(input.password);
    const passwordHash = await this.passwordHasher.hash(password.getValue());

    const user = User.create({
      employeeId: input.employeeId,
      username: input.username,
      passwordHash,
      roles: input.roles,
    });

    return this.repo.save(user);
  }
}
