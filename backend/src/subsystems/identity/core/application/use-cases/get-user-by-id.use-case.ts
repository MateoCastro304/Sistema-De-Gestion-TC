import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/ports/user.repository';
import { UserNotFound } from '../../domain/errors/user-not-found.error';

@Injectable()
export class GetUserById {
  constructor(private readonly repo: UserRepository) {}

  async execute(id: number): Promise<User> {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new UserNotFound(id);
    }
    return user;
  }
}
