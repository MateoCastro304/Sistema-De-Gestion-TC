import { Injectable } from '@nestjs/common';
import { UsersRepository, UserListParams, UserListResult } from '../../domain/ports/users.repository';

export type ListUsersInput = UserListParams;

@Injectable()
export class ListUsers {
  constructor(private readonly repo: UsersRepository) {}

  async execute(input: ListUsersInput): Promise<UserListResult> {
    return this.repo.list(input);
  }
}
