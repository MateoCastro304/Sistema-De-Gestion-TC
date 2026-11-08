import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { Password } from '../../domain/value-objects/password.vo';
import { Role } from '../../domain/value-objects/role.vo';
import { UserRepository } from '../../domain/ports/user.repository';
import { EmployeeRepository } from '../../domain/ports/employee.repository';
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
    private readonly repo: UserRepository,
    private readonly employees: EmployeeRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  /** `authorUserId`: el usuario de la sesión que registra el alta (`created_by_user_id`). */
  async execute(input: CreateUserInput, authorUserId: number | null = null): Promise<User> {
    const employee = await this.employees.findById(input.employeeId);
    if (!employee) {
      throw new EmployeeNotFoundForUser(input.employeeId);
    }
    if (!employee.isActive()) {
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
      createdByUserId: authorUserId,
    });

    return this.repo.save(user);
  }
}
