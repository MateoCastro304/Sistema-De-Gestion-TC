import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user';
import { UsersRepository } from '../../domain/ports/users.repository';
import { UserNotFound } from '../../domain/errors/user-not-found.error';

@Injectable()
export class GetUserById {
  constructor(private readonly repo: UsersRepository) {}

  async execute(id: number): Promise<User> {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new UserNotFound(id);
    }
    return user;
  }
}
