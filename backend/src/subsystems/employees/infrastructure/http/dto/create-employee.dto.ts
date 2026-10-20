import { Allow } from 'class-validator';

export class CreateEmployeeDto {
  @Allow()
  firstName?: unknown;

  @Allow()
  lastName?: unknown;

  @Allow()
  dni?: unknown;

  @Allow()
  position?: unknown;

  @Allow()
  address?: unknown;

  @Allow()
  email?: unknown;

  @Allow()
  phone?: unknown;
}
