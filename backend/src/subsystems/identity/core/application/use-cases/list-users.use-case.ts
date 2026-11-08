import { Injectable } from '@nestjs/common';
import { UserRepository, UserListParams, UserListResult } from '../../domain/ports/user.repository';

export type ListUsersInput = UserListParams;

@Injectable()
export class ListUsers {
  constructor(private readonly repo: UserRepository) {}

  async execute(input: ListUsersInput): Promise<UserListResult> {
    return this.repo.list(input);
  }
}
