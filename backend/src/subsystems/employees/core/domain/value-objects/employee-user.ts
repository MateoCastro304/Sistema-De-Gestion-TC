import { Role } from '../../../../../shared/domain/role';
import { UserStatus } from '../../../../../shared/domain/user-status';


export type EmployeeUser = {
  id: number;
  username: string;
  roles: Role[];
  status: UserStatus;
};
