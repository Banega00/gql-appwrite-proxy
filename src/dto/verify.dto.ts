import { UserRole } from '../utils/user-role.enum';

export class VerifyInput {
  phoneNumber: string;
  code: string;
  role: UserRole;
}
